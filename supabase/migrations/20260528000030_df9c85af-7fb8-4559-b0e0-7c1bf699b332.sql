-- 2.1 Mural RLS Fix
ALTER TABLE public.mural_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pool members can view mural" ON public.mural_posts;
CREATE POLICY "Pool members can view mural" ON public.mural_posts
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = mural_posts.pool_id AND pm.user_id = auth.uid()));

DROP POLICY IF EXISTS "Pool members can post zoeira" ON public.mural_posts;
CREATE POLICY "Pool members can post zoeira" ON public.mural_posts
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = mural_posts.pool_id AND pm.user_id = auth.uid()));

-- 2.2 Re-Cria Leaderboard View corrigindo duplicidade de pontos
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_view;

CREATE MATERIALIZED VIEW public.leaderboard_view AS
WITH combined_points AS (
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points FROM public.predictions_exact GROUP BY pool_id, user_id
    UNION ALL
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points FROM public.predictions_pickem GROUP BY pool_id, user_id
    UNION ALL
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points FROM public.predictions_bracket GROUP BY pool_id, user_id
    UNION ALL
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points FROM public.predictions_props GROUP BY pool_id, user_id
)
SELECT 
    pool_id, 
    user_id, 
    SUM(points) as points,
    RANK() OVER (PARTITION BY pool_id ORDER BY SUM(points) DESC) as position
FROM combined_points
GROUP BY pool_id, user_id;

CREATE UNIQUE INDEX idx_leaderboard_pool_user ON public.leaderboard_view (pool_id, user_id);
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT ALL ON public.leaderboard_view TO service_role;

-- 2.3 Index de performance
CREATE INDEX IF NOT EXISTS idx_predictions_exact_match_pool ON public.predictions_exact(match_id, pool_id);

-- 2.4 RPC increment_xp
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
