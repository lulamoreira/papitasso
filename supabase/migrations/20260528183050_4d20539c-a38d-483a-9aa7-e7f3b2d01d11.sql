-- 1. RPC for quiz leaderboard (fixed reserved word "position")
CREATE OR REPLACE FUNCTION public.quiz_leaderboard(p_pool_id UUID DEFAULT NULL)
RETURNS TABLE(user_id UUID, name TEXT, avatar_url TEXT, total_correct BIGINT, total_answered BIGINT, streak INT, leaderboard_position BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    qa.user_id,
    p.name,
    p.avatar_url,
    COUNT(*) FILTER (WHERE qa.is_correct) AS total_correct,
    COUNT(*) AS total_answered,
    COALESCE(p.quiz_streak, 0) AS streak,
    RANK() OVER (ORDER BY COUNT(*) FILTER (WHERE qa.is_correct) DESC, COALESCE(p.quiz_streak,0) DESC) AS leaderboard_position
  FROM quiz_answers qa
  JOIN profiles p ON p.id = qa.user_id
  WHERE p_pool_id IS NULL 
     OR qa.user_id IN (SELECT user_id FROM pool_members WHERE pool_id = p_pool_id)
  GROUP BY qa.user_id, p.name, p.avatar_url, p.quiz_streak
  ORDER BY total_correct DESC, streak DESC;
$$;
GRANT EXECUTE ON FUNCTION public.quiz_leaderboard(UUID) TO authenticated;

-- 2. New prize category "quiz_champion"
ALTER TABLE public.prizes DROP CONSTRAINT IF EXISTS prizes_category_check;
ALTER TABLE public.prizes ADD CONSTRAINT prizes_category_check 
  CHECK (category IN ('ranking','most_exact','most_brazil_correct','phase_leader',
                      'wooden_spoon','raffle','custom','quiz_champion'));
