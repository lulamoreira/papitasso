-- predictions_survivor
DROP POLICY IF EXISTS "Pool members can see locked survivor" ON predictions_survivor;
CREATE POLICY "Members see locked survivor"
ON predictions_survivor FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- predictions_bracket
DROP POLICY IF EXISTS "Pool members can see locked bracket" ON predictions_bracket;
CREATE POLICY "Members see locked bracket"
ON predictions_bracket FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- fantasy_lineup_players
-- This table might not have pool_id directly, it joins with fantasy_lineups
DROP POLICY IF EXISTS "Pool members can see lineup players" ON fantasy_lineup_players;
CREATE POLICY "Members see lineup players"
ON fantasy_lineup_players FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fantasy_lineups fl
    WHERE fl.id = lineup_id
    AND public.is_pool_member(fl.pool_id, auth.uid())
  )
);
