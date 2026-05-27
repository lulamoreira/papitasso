-- Ensure players table has the right structure (though it seems it does)
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS market_value INTEGER DEFAULT 5000000;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS position TEXT CHECK (position IN ('GK', 'DEF', 'MID', 'FWD'));

-- Fantasy Lineups
CREATE TABLE public.fantasy_lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,
    formation TEXT DEFAULT '4-4-2',
    captain_id UUID REFERENCES public.players(id),
    vice_captain_id UUID REFERENCES public.players(id),
    budget_used INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, pool_id, gameweek)
);

-- Fantasy Lineup Players
CREATE TABLE public.fantasy_lineup_players (
    lineup_id UUID NOT NULL REFERENCES public.fantasy_lineups(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id),
    slot TEXT NOT NULL, -- 'gk','def1','def2','def3','def4','mid1','mid2','mid3','mid4','fwd1','fwd2','bench1','bench2','bench3','bench4'
    is_bench BOOLEAN DEFAULT false,
    PRIMARY KEY (lineup_id, slot)
);

-- Fantasy Transfers
CREATE TABLE public.fantasy_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    gameweek INTEGER NOT NULL,
    out_player_id UUID NOT NULL REFERENCES public.players(id),
    in_player_id UUID NOT NULL REFERENCES public.players(id),
    used_free_transfer BOOLEAN DEFAULT true,
    cost_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Player Match Stats
CREATE TABLE public.player_match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheet BOOLEAN DEFAULT false,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    penalties_saved INTEGER DEFAULT 0,
    penalties_missed INTEGER DEFAULT 0,
    own_goals INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(player_id, match_id)
);

-- Add scoring_config if not exists in pools (assuming pools table exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pools' AND column_name = 'fantasy_scoring_config') THEN
        ALTER TABLE public.pools ADD COLUMN fantasy_scoring_config JSONB DEFAULT '{
            "min_60": 1,
            "plus_60": 2,
            "goal_gk_def": 6,
            "goal_mid": 5,
            "goal_fwd": 4,
            "assist": 3,
            "clean_sheet_gk_def": 4,
            "clean_sheet_mid": 1,
            "saves_3": 1,
            "penalty_saved": 5,
            "penalty_missed": -2,
            "yellow_card": -1,
            "red_card": -3,
            "own_goal": -2,
            "outside_box_bonus": 1
        }'::jsonb;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.fantasy_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_lineup_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Lineups: User can see their own, and others' only if locked? 
-- For simplicity, let's say users can see all in the same pool if they are members.
CREATE POLICY "Lineup owners can do everything" ON public.fantasy_lineups
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Pool members can view other lineups in same pool" ON public.fantasy_lineups
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.pool_members WHERE pool_id = fantasy_lineups.pool_id AND user_id = auth.uid()));

CREATE POLICY "Lineup players owner can do everything" ON public.fantasy_lineup_players
    FOR ALL USING (EXISTS (SELECT 1 FROM public.fantasy_lineups WHERE id = fantasy_lineup_players.lineup_id AND user_id = auth.uid()));

CREATE POLICY "Lineup players public view" ON public.fantasy_lineup_players
    FOR SELECT USING (true);

CREATE POLICY "Transfers owner" ON public.fantasy_transfers
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Player stats public" ON public.player_match_stats
    FOR SELECT USING (true);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fantasy_lineups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fantasy_lineup_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fantasy_transfers TO authenticated;
GRANT SELECT ON public.player_match_stats TO authenticated;

GRANT ALL ON public.fantasy_lineups TO service_role;
GRANT ALL ON public.fantasy_lineup_players TO service_role;
GRANT ALL ON public.fantasy_transfers TO service_role;
GRANT ALL ON public.player_match_stats TO service_role;

-- Seed player market values and positions if they are missing or generic
UPDATE public.players SET 
    market_value = CASE 
        WHEN position = 'GK' THEN 5000000 
        WHEN position = 'DEF' THEN 6000000
        WHEN position = 'MID' THEN 8000000
        WHEN position = 'FWD' THEN 12000000
        ELSE 5000000
    END,
    position = COALESCE(position, 'MID')
WHERE market_value IS NULL OR position IS NULL;
