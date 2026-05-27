-- Create props table
CREATE TABLE public.props (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    question TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('player', 'team', 'number', 'boolean', 'choice', 'exact_score')),
    options_jsonb JSONB,
    points INT DEFAULT 20,
    resolved_value TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create predictions_props table
CREATE TABLE public.predictions_props (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    prop_id UUID NOT NULL REFERENCES public.props(id),
    answer TEXT NOT NULL,
    points_awarded INT,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, pool_id, prop_id)
);

-- Grant access
GRANT SELECT ON public.props TO authenticated;
GRANT SELECT ON public.props TO anon;
GRANT ALL ON public.props TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions_props TO authenticated;
GRANT SELECT ON public.predictions_props TO anon;
GRANT ALL ON public.predictions_props TO service_role;

-- Enable RLS
ALTER TABLE public.props ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions_props ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Props are viewable by everyone" ON public.props FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own prop predictions" ON public.predictions_props FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own unlocked prop predictions" ON public.predictions_props FOR UPDATE TO authenticated USING (auth.uid() = user_id AND (locked_at IS NULL OR locked_at > now())) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own prop predictions" ON public.predictions_props FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members can see others prop predictions after lock" ON public.predictions_props FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = predictions_props.pool_id AND pm.user_id = auth.uid())
    AND (locked_at IS NOT NULL AND locked_at <= now())
);

-- Seed default props
INSERT INTO public.props (code, question, type, points, options_jsonb) VALUES
('top_scorer', 'Artilheiro da Copa', 'player', 30, NULL),
('best_young_player', 'Melhor jovem', 'player', 25, NULL),
('surprise_team', 'Seleção surpresa — quem chega às semis sendo underdog?', 'team', 25, NULL),
('favorite_mascot', 'Mascote favorito do torcedor — qual mascote vai ser mais comentado nas redes?', 'choice', 15, '["Maple", "Zayu", "Clutch"]'::jsonb),
('most_yellow_cards', 'País que mais leva cartão amarelo', 'team', 20, NULL),
('most_red_cards', 'País com mais expulsões na Copa', 'team', 20, NULL),
('final_goals', 'Quantos gols na final', 'number', 20, '{"min": 0, "max": 10}'::jsonb),
('final_penalties', 'A final será decidida nos pênaltis?', 'boolean', 15, NULL),
('biggest_win', 'Maior goleada da Copa', 'exact_score', 25, NULL),
('hat_trick', 'Vai ter hat-trick?', 'boolean', 15, NULL),
('african_teams_round16', 'Quantas seleções africanas chegam às oitavas', 'number', 15, '{"min": 0, "max": 9}'::jsonb),
('giant_killer', 'Vai ter zebra nas oitavas? Seleção fora do top 20 FIFA elimina top 10?', 'boolean', 20, NULL);

-- Function to award points for a prop
CREATE OR REPLACE FUNCTION public.award_points_for_prop(p_prop_id UUID, p_resolved_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the prop
    UPDATE public.props
    SET resolved_value = p_resolved_value,
        resolved_at = now()
    WHERE id = p_prop_id;

    -- Award points to users who got it right
    UPDATE public.predictions_props
    SET points_awarded = CASE 
        WHEN answer = p_resolved_value THEN (SELECT points FROM public.props WHERE id = p_prop_id)
        ELSE 0
    END
    WHERE prop_id = p_prop_id;

    -- Refresh leaderboard
    PERFORM public.refresh_leaderboard_view();
END;
$$;

-- Update leaderboard_view to include all modes
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_view;

CREATE MATERIALIZED VIEW public.leaderboard_view AS
WITH combined_points AS (
    -- Points from Exact Score
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points
    FROM public.predictions_exact
    GROUP BY pool_id, user_id
    
    UNION ALL
    
    -- Points from Pick'em
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points
    FROM public.predictions_pickem
    GROUP BY pool_id, user_id
    
    UNION ALL
    
    -- Points from Bracket
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points
    FROM public.predictions_bracket
    GROUP BY pool_id, user_id
    
    UNION ALL
    
    -- Points from Props
    SELECT pool_id, user_id, COALESCE(SUM(points_awarded), 0) as points
    FROM public.predictions_props
    GROUP BY pool_id, user_id
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

-- Update award_points_for_match to include leaderboard refresh if not there
-- (Ensuring it exists as a fallback)
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_view()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
