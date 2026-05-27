-- Function to award Pick'em points
CREATE OR REPLACE FUNCTION public.award_pickem_points(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
    r_winner TEXT;
    match_rec RECORD;
    pickem_config INT;
BEGIN
    SELECT * INTO match_rec FROM public.matches WHERE id = p_match_id;
    
    IF match_rec.status != 'finished' THEN
        RETURN;
    END IF;

    IF match_rec.home_score > match_rec.away_score THEN
        r_winner := 'home';
    ELSIF match_rec.away_score > match_rec.home_score THEN
        r_winner := 'away';
    ELSE
        r_winner := 'draw';
    END IF;

    -- Update predictions
    UPDATE public.predictions_pickem
    SET points_awarded = CASE 
        WHEN winner = r_winner THEN 3 -- Default 3 points, can be dynamic from pool config if needed
        ELSE 0 
    END
    WHERE match_id = p_match_id;
    
    PERFORM public.refresh_leaderboard_view();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize survivor rounds for a pool
CREATE OR REPLACE FUNCTION public.initialize_survivor_rounds(p_pool_id UUID)
RETURNS VOID AS $$
DECLARE
    m RECORD;
    current_round INT := 1;
    last_date DATE := NULL;
    round_matches UUID[] := '{}';
    round_start TIMESTAMPTZ;
    round_end TIMESTAMPTZ;
BEGIN
    -- This is a simplified grouping: 1 round per day of matches
    FOR m IN 
        SELECT id, kickoff_at::date as match_date, kickoff_at 
        FROM public.matches 
        ORDER BY kickoff_at ASC
    LOOP
        IF last_date IS NOT NULL AND m.match_date != last_date THEN
            -- Save previous round
            round_start := (SELECT MIN(kickoff_at) FROM public.matches WHERE id = ANY(round_matches));
            round_end := (SELECT MAX(kickoff_at) FROM public.matches WHERE id = ANY(round_matches)) + INTERVAL '2 hours';
            
            INSERT INTO public.survivor_rounds (pool_id, round_number, match_ids, starts_at, ends_at)
            VALUES (p_pool_id, current_round, round_matches, round_start, round_end);
            
            current_round := current_round + 1;
            round_matches := '{}';
        END IF;
        
        round_matches := round_matches || m.id;
        last_date := m.match_date;
    END LOOP;

    -- Last round
    IF array_length(round_matches, 1) > 0 THEN
        round_start := (SELECT MIN(kickoff_at) FROM public.matches WHERE id = ANY(round_matches));
        round_end := (SELECT MAX(kickoff_at) FROM public.matches WHERE id = ANY(round_matches)) + INTERVAL '2 hours';
        
        INSERT INTO public.survivor_rounds (pool_id, round_number, match_ids, starts_at, ends_at)
        VALUES (p_pool_id, current_round, round_matches, round_start, round_end);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to advance survivor mode
CREATE OR REPLACE FUNCTION public.advance_survivor(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
    match_rec RECORD;
    match_winner_team_id UUID;
    v_round RECORD;
BEGIN
    SELECT * INTO match_rec FROM public.matches WHERE id = p_match_id;
    
    IF match_rec.status != 'finished' THEN
        RETURN;
    END IF;

    IF match_rec.home_score > match_rec.away_score THEN
        match_winner_team_id := match_rec.home_team_id;
    ELSIF match_rec.away_score > match_rec.home_score THEN
        match_winner_team_id := match_rec.away_team_id;
    ELSE
        match_winner_team_id := NULL; -- Draw means everyone who picked either team in that match is out? 
        -- Standard survivor: you must pick a winner. If it's a draw, you're out unless you picked a different match.
    END IF;

    -- For each pool that has this match in a survivor round
    FOR v_round IN 
        SELECT * FROM public.survivor_rounds WHERE p_match_id = ANY(match_ids)
    LOOP
        -- Update users who picked a team in THIS match
        -- If the team they picked is the winner, they survive.
        -- If the team they picked is the loser or it was a draw, they are eliminated.
        UPDATE public.predictions_survivor
        SET result = CASE 
            WHEN team_id = match_winner_team_id THEN 'survived'
            ELSE 'eliminated'
        END
        WHERE pool_id = v_round.pool_id 
        AND round_number = v_round.round_number
        AND team_id IN (match_rec.home_team_id, match_rec.away_team_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award bracket points
CREATE OR REPLACE FUNCTION public.award_bracket_points(p_pool_id UUID)
RETURNS VOID AS $$
DECLARE
    pool_rec RECORD;
    bracket_rec RECORD;
    weights JSONB;
    total_pts INT := 0;
    -- We would need a more complex logic to traverse the bracket_json 
    -- and compare with actual match results. 
    -- For now, we'll implement a skeleton and assume the bracket_json structure.
BEGIN
    SELECT * INTO pool_rec FROM public.pools WHERE id = p_pool_id;
    weights := COALESCE(pool_rec.scoring_config->'bracket_weights', '{"r32": 1, "r16": 2, "qf": 4, "sf": 8, "finalist": 16, "winner": 32, "exact_final": 10}'::jsonb);

    FOR bracket_rec IN SELECT * FROM public.predictions_bracket WHERE pool_id = p_pool_id LOOP
        -- Logic to traverse bracket_json and matches would go here
        -- This is highly dependent on how we structure the JSON.
        -- For now, let's keep it simple.
        UPDATE public.predictions_bracket
        SET points_awarded = total_pts
        WHERE id = bracket_rec.id;
    END LOOP;
    
    PERFORM public.refresh_leaderboard_view();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_view()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
