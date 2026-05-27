-- Create Pick'em table
CREATE TABLE IF NOT EXISTS public.predictions_pickem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES public.matches(id),
    winner TEXT NOT NULL CHECK (winner IN ('home', 'draw', 'away')),
    points_awarded INT,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, pool_id, match_id)
);

-- Create Survivor tables
CREATE TABLE IF NOT EXISTS public.survivor_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    match_ids UUID[] NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.predictions_survivor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    team_id UUID NOT NULL REFERENCES public.teams(id),
    result TEXT CHECK (result IN ('survived', 'eliminated')),
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, pool_id, round_number),
    UNIQUE(user_id, pool_id, team_id)
);

-- Create Bracket table
CREATE TABLE IF NOT EXISTS public.predictions_bracket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    bracket_json JSONB NOT NULL,
    points_awarded INT DEFAULT 0,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, pool_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions_pickem TO authenticated;
GRANT SELECT ON public.predictions_pickem TO anon;
GRANT ALL ON public.predictions_pickem TO service_role;

GRANT SELECT ON public.survivor_rounds TO authenticated;
GRANT SELECT ON public.survivor_rounds TO anon;
GRANT ALL ON public.survivor_rounds TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions_survivor TO authenticated;
GRANT SELECT ON public.predictions_survivor TO anon;
GRANT ALL ON public.predictions_survivor TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions_bracket TO authenticated;
GRANT SELECT ON public.predictions_bracket TO anon;
GRANT ALL ON public.predictions_bracket TO service_role;

-- RLS
ALTER TABLE public.predictions_pickem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survivor_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions_survivor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions_bracket ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own pickem predictions') THEN
        CREATE POLICY "Users can manage their own pickem predictions" ON public.predictions_pickem FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view others pickem predictions after lock') THEN
        CREATE POLICY "Users can view others pickem predictions after lock" ON public.predictions_pickem FOR SELECT USING (locked_at IS NOT NULL AND now() > locked_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Survivor rounds are viewable by everyone') THEN
        CREATE POLICY "Survivor rounds are viewable by everyone" ON public.survivor_rounds FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own survivor predictions') THEN
        CREATE POLICY "Users can manage their own survivor predictions" ON public.predictions_survivor FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view others survivor predictions after lock') THEN
        CREATE POLICY "Users can view others survivor predictions after lock" ON public.predictions_survivor FOR SELECT USING (locked_at IS NOT NULL AND now() > locked_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own bracket predictions') THEN
        CREATE POLICY "Users can manage their own bracket predictions" ON public.predictions_bracket FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view others bracket predictions after lock') THEN
        CREATE POLICY "Users can view others bracket predictions after lock" ON public.predictions_bracket FOR SELECT USING (locked_at IS NOT NULL AND now() > locked_at);
    END IF;
END $$;

-- Redefine leaderboard_view as a Materialized View
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_view;

CREATE MATERIALIZED VIEW public.leaderboard_view AS
WITH exact_points AS (
    SELECT user_id, pool_id, SUM(COALESCE(points_awarded, 0)) as total_points
    FROM public.predictions_exact
    GROUP BY user_id, pool_id
),
pickem_points AS (
    SELECT user_id, pool_id, SUM(COALESCE(points_awarded, 0)) as total_points
    FROM public.predictions_pickem
    GROUP BY user_id, pool_id
),
bracket_points AS (
    SELECT user_id, pool_id, SUM(COALESCE(points_awarded, 0)) as total_points
    FROM public.predictions_bracket
    GROUP BY user_id, pool_id
),
combined_points AS (
    SELECT 
        pm.user_id,
        pm.pool_id,
        COALESCE(e.total_points, 0) + COALESCE(p.total_points, 0) + COALESCE(b.total_points, 0) as total_score
    FROM public.pool_members pm
    LEFT JOIN exact_points e ON pm.user_id = e.user_id AND pm.pool_id = e.pool_id
    LEFT JOIN pickem_points p ON pm.user_id = p.user_id AND pm.pool_id = p.pool_id
    LEFT JOIN bracket_points b ON pm.user_id = b.user_id AND pm.pool_id = b.pool_id
)
SELECT 
    cp.user_id,
    cp.pool_id,
    cp.total_score,
    pr.name as display_name,
    pr.avatar_url,
    RANK() OVER (PARTITION BY cp.pool_id ORDER BY cp.total_score DESC) as rank
FROM combined_points cp
JOIN public.profiles pr ON cp.user_id = pr.id;

CREATE UNIQUE INDEX idx_leaderboard_user_pool ON public.leaderboard_view (user_id, pool_id);

GRANT SELECT ON public.leaderboard_view TO authenticated, anon;
