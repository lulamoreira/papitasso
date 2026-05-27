-- Create predictions_exact table
CREATE TABLE public.predictions_exact (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES public.matches(id),
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    points_awarded INT,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, pool_id, match_id)
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions_exact TO authenticated;
GRANT ALL ON public.predictions_exact TO service_role;

-- Enable RLS
ALTER TABLE public.predictions_exact ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own predictions"
ON public.predictions_exact FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked predictions"
ON public.predictions_exact FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND locked_at IS NULL)
WITH CHECK (auth.uid() = user_id AND locked_at IS NULL);

CREATE POLICY "Users can see their own predictions"
ON public.predictions_exact FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can see others predictions after kickoff"
ON public.predictions_exact FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pool_members pm
        WHERE pm.pool_id = predictions_exact.pool_id
        AND pm.user_id = auth.uid()
    )
    AND (
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = predictions_exact.match_id
            AND m.kickoff_at < now()
        )
    )
);

-- Function to get matches for a pool based on scope
CREATE OR REPLACE FUNCTION public.matches_for_pool(p_pool_id UUID)
RETURNS SETOF public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_scope_type TEXT;
    v_scope_config JSONB;
BEGIN
    SELECT scope_type, scope_config INTO v_scope_type, v_scope_config
    FROM pools WHERE id = p_pool_id;

    IF v_scope_type = 'single_team' THEN
        RETURN QUERY SELECT * FROM matches 
        WHERE home_team_id = (v_scope_config->>'team_id')::UUID 
           OR away_team_id = (v_scope_config->>'team_id')::UUID;
    
    ELSIF v_scope_type = 'single_group' THEN
        RETURN QUERY SELECT m.* FROM matches m
        JOIN teams t1 ON m.home_team_id = t1.id
        JOIN teams t2 ON m.away_team_id = t2.id
        WHERE m.phase = 'group' 
        AND (t1.group_letter = v_scope_config->>'group_letter' OR t2.group_letter = v_scope_config->>'group_letter');

    ELSIF v_scope_type = 'multiple_groups' THEN
        RETURN QUERY SELECT m.* FROM matches m
        JOIN teams t1 ON m.home_team_id = t1.id
        JOIN teams t2 ON m.away_team_id = t2.id
        WHERE m.phase = 'group' 
        AND (t1.group_letter = ANY(ARRAY(SELECT jsonb_array_elements_text(v_scope_config->'group_letters')))
             OR t2.group_letter = ANY(ARRAY(SELECT jsonb_array_elements_text(v_scope_config->'group_letters'))));

    ELSIF v_scope_type = 'phase' THEN
        RETURN QUERY SELECT * FROM matches 
        WHERE phase = ANY(ARRAY(SELECT jsonb_array_elements_text(v_scope_config->'phases')));

    ELSE -- full_tournament or fallback
        RETURN QUERY SELECT * FROM matches;
    END IF;
END;
$$;

-- Leaderboard Materialized View
CREATE MATERIALIZED VIEW public.leaderboard_view AS
SELECT 
    pool_id, 
    user_id, 
    COALESCE(SUM(points_awarded), 0) as points,
    RANK() OVER (PARTITION BY pool_id ORDER BY COALESCE(SUM(points_awarded), 0) DESC) as position
FROM public.predictions_exact
GROUP BY pool_id, user_id;

CREATE UNIQUE INDEX idx_leaderboard_pool_user ON public.leaderboard_view (pool_id, user_id);

GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT ALL ON public.leaderboard_view TO service_role;

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh leaderboard after point awarding
CREATE TRIGGER refresh_leaderboard_trigger
AFTER UPDATE OF points_awarded ON public.predictions_exact
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_leaderboard();

-- Function to award points (to be used by edge function)
CREATE OR REPLACE FUNCTION public.award_points_for_match(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_home_score INT;
    v_match_away_score INT;
    v_prediction RECORD;
    v_pool_config JSONB;
    v_points INT;
    v_real_diff INT;
    v_pred_diff INT;
    v_real_winner INT; -- 1: home, 2: away, 0: draw
    v_pred_winner INT;
BEGIN
    SELECT home_score, away_score INTO v_match_home_score, v_match_away_score
    FROM matches WHERE id = p_match_id;

    IF v_match_home_score IS NULL OR v_match_away_score IS NULL THEN
        RETURN;
    END IF;

    v_real_diff := v_match_home_score - v_match_away_score;
    IF v_real_diff > 0 THEN v_real_winner := 1; ELSIF v_real_diff < 0 THEN v_real_winner := 2; ELSE v_real_winner := 0; END IF;

    FOR v_prediction IN 
        SELECT p.*, po.scoring_config 
        FROM predictions_exact p
        JOIN pools po ON p.pool_id = po.id
        WHERE p.match_id = p_match_id AND p.points_awarded IS NULL
    LOOP
        v_points := 0;
        v_pred_diff := v_prediction.home_score - v_prediction.away_score;
        IF v_pred_diff > 0 THEN v_pred_winner := 1; ELSIF v_pred_diff < 0 THEN v_pred_winner := 2; ELSE v_pred_winner := 0; END IF;

        IF v_prediction.home_score = v_match_home_score AND v_prediction.away_score = v_match_away_score THEN
            v_points := (v_prediction.scoring_config->>'exact')::INT;
        ELSIF v_real_diff = v_pred_diff AND v_real_winner = v_pred_winner THEN
            v_points := (v_prediction.scoring_config->>'diff_winner')::INT;
        ELSIF v_real_winner = v_pred_winner THEN
            v_points := (v_prediction.scoring_config->>'winner')::INT;
        ELSE
            v_points := COALESCE((v_prediction.scoring_config->>'miss')::INT, 0);
        END IF;

        UPDATE predictions_exact 
        SET points_awarded = v_points 
        WHERE id = v_prediction.id;

        -- Update profile XP
        UPDATE profiles 
        SET xp = COALESCE(xp, 0) + v_points 
        WHERE id = v_prediction.user_id;
    END LOOP;
END;
$$;
