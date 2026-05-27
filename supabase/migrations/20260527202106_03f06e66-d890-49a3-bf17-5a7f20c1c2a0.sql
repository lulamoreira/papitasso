-- Fix search_path for refresh_leaderboard
ALTER FUNCTION public.refresh_leaderboard() SET search_path = public;

-- Revoke public execute for security definer functions
REVOKE EXECUTE ON FUNCTION public.matches_for_pool(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_points_for_match(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard() FROM PUBLIC;

-- Grant execute to authenticated users (as they need to call these via API)
GRANT EXECUTE ON FUNCTION public.matches_for_pool(UUID) TO authenticated;
-- award_points_for_match should only be called by service_role (edge functions)
GRANT EXECUTE ON FUNCTION public.award_points_for_match(UUID) TO service_role;
-- refresh_leaderboard is a trigger function, doesn't need API access
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard() TO service_role;
