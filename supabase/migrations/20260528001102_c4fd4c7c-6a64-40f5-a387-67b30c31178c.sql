-- 1. Correct initialize_survivor_rounds
CREATE OR REPLACE FUNCTION public.initialize_survivor_rounds(p_pool_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    m RECORD;
    current_round INT := 1;
    last_date DATE := NULL;
    round_matches UUID[] := '{}';
BEGIN
    FOR m IN 
        SELECT id, kickoff_at::date as match_date, kickoff_at 
        FROM matches_for_pool(p_pool_id)
        ORDER BY kickoff_at ASC
    LOOP
        IF last_date IS NOT NULL AND m.match_date != last_date THEN
            INSERT INTO survivor_rounds (pool_id, round_number, match_ids, starts_at, ends_at)
            VALUES (
                p_pool_id, current_round, round_matches,
                (SELECT MIN(kickoff_at) FROM matches WHERE id = ANY(round_matches)),
                (SELECT MAX(kickoff_at) FROM matches WHERE id = ANY(round_matches)) + INTERVAL '3 hours'
            );
            current_round := current_round + 1;
            round_matches := '{}';
        END IF;
        round_matches := round_matches || m.id;
        last_date := m.match_date;
    END LOOP;

    IF array_length(round_matches, 1) > 0 THEN
        INSERT INTO survivor_rounds (pool_id, round_number, match_ids, starts_at, ends_at)
        VALUES (
            p_pool_id, current_round, round_matches,
            (SELECT MIN(kickoff_at) FROM matches WHERE id = ANY(round_matches)),
            (SELECT MAX(kickoff_at) FROM matches WHERE id = ANY(round_matches)) + INTERVAL '3 hours'
        );
    END IF;
END;
$$;

-- 2. Correct RLS Policies
-- Pickem
DROP POLICY IF EXISTS "Users can view others pickem predictions after lock" ON predictions_pickem;
DROP POLICY IF EXISTS "Pool members can see locked pickem" ON predictions_pickem;
CREATE POLICY "Pool members can see locked pickem" 
ON predictions_pickem FOR SELECT TO authenticated
USING (
  locked_at IS NOT NULL AND now() > locked_at
  AND EXISTS (SELECT 1 FROM pool_members WHERE pool_id = predictions_pickem.pool_id AND user_id = auth.uid())
);

-- Survivor
DROP POLICY IF EXISTS "Users can view others survivor predictions after lock" ON predictions_survivor;
DROP POLICY IF EXISTS "Pool members can see locked survivor" ON predictions_survivor;
CREATE POLICY "Pool members can see locked survivor"
ON predictions_survivor FOR SELECT TO authenticated
USING (
  locked_at IS NOT NULL AND now() > locked_at
  AND EXISTS (SELECT 1 FROM pool_members WHERE pool_id = predictions_survivor.pool_id AND user_id = auth.uid())
);

-- Bracket
DROP POLICY IF EXISTS "Users can view others bracket predictions after lock" ON predictions_bracket;
DROP POLICY IF EXISTS "Pool members can see locked bracket" ON predictions_bracket;
CREATE POLICY "Pool members can see locked bracket"
ON predictions_bracket FOR SELECT TO authenticated
USING (
  locked_at IS NOT NULL AND now() > locked_at
  AND EXISTS (SELECT 1 FROM pool_members WHERE pool_id = predictions_bracket.pool_id AND user_id = auth.uid())
);

-- Fantasy
DROP POLICY IF EXISTS "Lineup players public view" ON fantasy_lineup_players;
DROP POLICY IF EXISTS "Pool members can see lineup players" ON fantasy_lineup_players;
CREATE POLICY "Pool members can see lineup players"
ON fantasy_lineup_players FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fantasy_lineups fl
    JOIN pool_members pm ON pm.pool_id = fl.pool_id
    WHERE fl.id = fantasy_lineup_players.lineup_id AND pm.user_id = auth.uid()
  )
);

-- 3. External API ID and Indexes
ALTER TABLE matches ADD COLUMN IF NOT EXISTS external_api_id TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS external_api_id TEXT;
CREATE INDEX IF NOT EXISTS idx_matches_external ON matches(external_api_id);
CREATE INDEX IF NOT EXISTS idx_teams_external ON teams(external_api_id);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);

-- 4. increment_xp (already created but ensured here for completeness if needed)
CREATE OR REPLACE FUNCTION public.increment_xp(p_user_id UUID, p_amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles SET xp = COALESCE(xp, 0) + p_amount WHERE id = p_user_id;
END;
$$;
