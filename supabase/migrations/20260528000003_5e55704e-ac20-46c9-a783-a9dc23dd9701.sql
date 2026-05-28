-- 1.1 Restaura award_points_for_match com lógica de placar exato
CREATE OR REPLACE FUNCTION public.award_points_for_match(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match RECORD;
    v_prediction RECORD;
    v_points INT;
    v_real_diff INT;
    v_pred_diff INT;
    v_real_winner INT;
    v_pred_winner INT;
    v_pool_id UUID;
BEGIN
    SELECT home_score, away_score, status INTO v_match 
    FROM matches WHERE id = p_match_id;
    
    IF v_match.status != 'finished' OR v_match.home_score IS NULL THEN
        RETURN;
    END IF;
    
    v_real_diff := v_match.home_score - v_match.away_score;
    v_real_winner := CASE 
        WHEN v_real_diff > 0 THEN 1 
        WHEN v_real_diff < 0 THEN 2 
        ELSE 0 
    END;
    
    -- PLACAR EXATO
    FOR v_prediction IN 
        SELECT p.*, po.scoring_config 
        FROM predictions_exact p
        JOIN pools po ON p.pool_id = po.id
        WHERE p.match_id = p_match_id AND p.points_awarded IS NULL
    LOOP
        v_pred_diff := v_prediction.home_score - v_prediction.away_score;
        v_pred_winner := CASE 
            WHEN v_pred_diff > 0 THEN 1 
            WHEN v_pred_diff < 0 THEN 2 
            ELSE 0 
        END;
        
        IF v_prediction.home_score = v_match.home_score 
           AND v_prediction.away_score = v_match.away_score THEN
            v_points := (v_prediction.scoring_config->>'exact')::INT;
        ELSIF v_real_diff = v_pred_diff AND v_real_winner = v_pred_winner THEN
            v_points := (v_prediction.scoring_config->>'diff_winner')::INT;
        ELSIF v_real_winner = v_pred_winner THEN
            v_points := (v_prediction.scoring_config->>'winner')::INT;
        ELSE
            v_points := COALESCE((v_prediction.scoring_config->>'miss')::INT, 0);
        END IF;
        
        UPDATE predictions_exact SET points_awarded = v_points 
        WHERE id = v_prediction.id;
        UPDATE profiles SET xp = COALESCE(xp,0) + v_points 
        WHERE id = v_prediction.user_id;
    END LOOP;
    
    -- Outros modos (mantém chamadas existentes)
    PERFORM award_pickem_points(p_match_id);
    PERFORM advance_survivor(p_match_id);
    
    FOR v_pool_id IN SELECT id FROM pools WHERE 'bracket' = ANY(modes_enabled) LOOP
        PERFORM award_bracket_points(v_pool_id);
    END LOOP;
    
    PERFORM refresh_leaderboard_view();
END;
$$;

-- 1.2 Cria RPC lock_predictions_for_match (estava faltando)
CREATE OR REPLACE FUNCTION public.lock_predictions_for_match(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kickoff TIMESTAMPTZ;
BEGIN
    SELECT kickoff_at INTO v_kickoff FROM matches WHERE id = p_match_id;
    IF v_kickoff IS NULL OR v_kickoff > now() THEN RETURN; END IF;
    
    UPDATE predictions_exact SET locked_at = v_kickoff 
    WHERE match_id = p_match_id AND locked_at IS NULL;
    
    UPDATE predictions_pickem SET locked_at = v_kickoff 
    WHERE match_id = p_match_id AND locked_at IS NULL;
    
    UPDATE predictions_survivor ps SET locked_at = v_kickoff
    WHERE EXISTS (
        SELECT 1 FROM survivor_rounds sr 
        WHERE p_match_id = ANY(sr.match_ids) 
        AND sr.pool_id = ps.pool_id 
        AND sr.round_number = ps.round_number
    ) AND ps.locked_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lock_predictions_for_match(UUID) TO service_role;

-- 1.3 Reescreve award_bracket_points (estava vazia, sempre retornava 0)
CREATE OR REPLACE FUNCTION public.award_bracket_points(p_pool_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    pool_rec RECORD;
    bracket_rec RECORD;
    weights JSONB;
    total_pts INT;
    pick JSONB;
    actual_winner_id UUID;
    phase_key TEXT;
    weight_key TEXT;
    v_final_match_id UUID;
    v_final_match RECORD;
BEGIN
    SELECT * INTO pool_rec FROM pools WHERE id = p_pool_id;
    weights := COALESCE(
      pool_rec.scoring_config->'bracket_weights',
      '{"r32":1,"r16":2,"qf":4,"sf":8,"finalist":16,"winner":32,"exact_final":10}'::jsonb
    );

    FOR bracket_rec IN SELECT * FROM predictions_bracket WHERE pool_id = p_pool_id LOOP
        total_pts := 0;
        
        -- Itera todas fases do bracket_json
        FOR phase_key, weight_key IN
            SELECT * FROM (VALUES
                ('r32','r32'),('r16','r16'),('qf','qf'),
                ('sf','sf'),('finalist','finalist'),('winner','winner')
            ) AS t(p, w)
        LOOP
            IF bracket_rec.bracket_json->phase_key IS NOT NULL THEN
                FOR pick IN SELECT * FROM jsonb_array_elements(bracket_rec.bracket_json->phase_key) LOOP
                    SELECT CASE 
                        WHEN home_score > away_score THEN home_team_id 
                        WHEN away_score > home_score THEN away_team_id 
                        ELSE NULL 
                    END
                    INTO actual_winner_id
                    FROM matches 
                    WHERE id = (pick->>'match_id')::UUID 
                    AND status = 'finished';
                    
                    IF actual_winner_id IS NOT NULL 
                       AND (pick->>'winner_team_id')::UUID = actual_winner_id THEN
                        total_pts := total_pts + (weights->>weight_key)::INT;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
        
        -- Bônus placar exato da final
        IF bracket_rec.bracket_json->'final' IS NOT NULL THEN
            v_final_match_id := (bracket_rec.bracket_json->'final'->>'match_id')::UUID;
            SELECT home_score, away_score, status INTO v_final_match FROM matches WHERE id = v_final_match_id;
            
            IF v_final_match.status = 'finished' THEN
                IF (bracket_rec.bracket_json->'final'->>'home_score')::INT = v_final_match.home_score
                   AND (bracket_rec.bracket_json->'final'->>'away_score')::INT = v_final_match.away_score THEN
                    total_pts := total_pts + (weights->>'exact_final')::INT;
                END IF;
            END IF;
        END IF;
        
        UPDATE predictions_bracket SET points_awarded = total_pts WHERE id = bracket_rec.id;
    END LOOP;
END;
$$;