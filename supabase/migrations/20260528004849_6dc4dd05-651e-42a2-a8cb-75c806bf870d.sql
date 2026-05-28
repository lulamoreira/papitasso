-- Create SECURITY DEFINER functions to bypass RLS for membership checks
CREATE OR REPLACE FUNCTION public.is_pool_member(p_pool_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pool_members 
    WHERE pool_id = p_pool_id AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_pool_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pool_member(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.is_pool_admin(p_pool_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pool_members 
    WHERE pool_id = p_pool_id 
    AND user_id = p_user_id 
    AND role IN ('owner','admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_pool_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pool_admin(UUID, UUID) TO service_role;

-- Update pool_members policies
DROP POLICY IF EXISTS "Members can view other members in the same pool" ON pool_members;
DROP POLICY IF EXISTS "Admins/Owners can manage members" ON pool_members;
DROP POLICY IF EXISTS "Users can join pools" ON pool_members;

CREATE POLICY "Members view same pool members"
ON pool_members FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

CREATE POLICY "Users join pools as self"
ON pool_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage pool members"
ON pool_members FOR DELETE TO authenticated
USING (public.is_pool_admin(pool_id, auth.uid()));

CREATE POLICY "Admins update pool members"
ON pool_members FOR UPDATE TO authenticated
USING (public.is_pool_admin(pool_id, auth.uid()));

-- Update pools policy
DROP POLICY IF EXISTS "Users can view pools they are members of" ON pools;
CREATE POLICY "Members view their pools"
ON pools FOR SELECT TO authenticated
USING (public.is_pool_member(id, auth.uid()));

-- Update other tables using pool_members checks
-- predictions_exact
DROP POLICY IF EXISTS "Users can see others predictions after kickoff" ON predictions_exact;
CREATE POLICY "Members see others predictions after kickoff"
ON predictions_exact FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- predictions_pickem
DROP POLICY IF EXISTS "Pool members can see locked pickem" ON predictions_pickem;
CREATE POLICY "Members see locked pickem"
ON predictions_pickem FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- predictions_props
DROP POLICY IF EXISTS "Members can see others prop predictions after lock" ON predictions_props;
CREATE POLICY "Members see others prop predictions after lock"
ON predictions_props FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- prizes
DROP POLICY IF EXISTS "Members can view prizes" ON prizes;
CREATE POLICY "Members view prizes"
ON prizes FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- prize_winners
DROP POLICY IF EXISTS "Members can view winners" ON prize_winners;
CREATE POLICY "Members view winners"
ON prize_winners FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM prizes p WHERE p.id = prize_id AND public.is_pool_member(p.pool_id, auth.uid())));

-- chat_messages
DROP POLICY IF EXISTS "Members can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Members can insert chat messages" ON chat_messages;
CREATE POLICY "Members view chat messages"
ON chat_messages FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

CREATE POLICY "Members insert chat messages"
ON chat_messages FOR INSERT TO authenticated
WITH CHECK (public.is_pool_member(pool_id, auth.uid()) AND auth.uid() = user_id);

-- mural_posts
DROP POLICY IF EXISTS "Members can view mural posts" ON mural_posts;
DROP POLICY IF EXISTS "Members can insert mural posts" ON mural_posts;
DROP POLICY IF EXISTS "Pool members can view mural" ON mural_posts;
DROP POLICY IF EXISTS "Pool members can post zoeira" ON mural_posts;

CREATE POLICY "Members view mural"
ON mural_posts FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

CREATE POLICY "Members post mural"
ON mural_posts FOR INSERT TO authenticated
WITH CHECK (public.is_pool_member(pool_id, auth.uid()));

-- fantasy_lineups
DROP POLICY IF EXISTS "Pool members can view other lineups in same pool" ON fantasy_lineups;
CREATE POLICY "Members view other lineups"
ON fantasy_lineups FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- predictions_survivor
DROP POLICY IF EXISTS "Members can see others survivor choices after lock" ON predictions_survivor;
CREATE POLICY "Members see others survivor after lock"
ON predictions_survivor FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));

-- predictions_bracket
DROP POLICY IF EXISTS "Members can see others bracket predictions after kickoff" ON predictions_bracket;
CREATE POLICY "Members see others bracket after kickoff"
ON predictions_bracket FOR SELECT TO authenticated
USING (public.is_pool_member(pool_id, auth.uid()));
