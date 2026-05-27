-- 1. Enums
CREATE TYPE public.match_phase AS ENUM ('group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'third', 'final');
CREATE TYPE public.match_status AS ENUM ('scheduled', 'live', 'finished');

-- 2. Tables
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    flag_url TEXT NOT NULL,
    group_letter TEXT,
    fifa_ranking INT
);

CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    photo_url TEXT,
    market_value INT
);

CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team_id UUID REFERENCES public.teams(id),
    away_team_id UUID REFERENCES public.teams(id),
    kickoff_at TIMESTAMPTZ,
    stadium TEXT,
    city TEXT,
    country TEXT,
    phase public.match_phase,
    status public.match_status DEFAULT 'scheduled',
    home_score INT,
    away_score INT,
    placeholder_label TEXT
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    favorite_team_id UUID REFERENCES public.teams(id),
    xp INT DEFAULT 0,
    league_tier TEXT DEFAULT 'bronze',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT ON public.teams TO anon;
GRANT ALL ON public.teams TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT SELECT ON public.players TO anon;
GRANT ALL ON public.players TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT SELECT ON public.matches TO anon;
GRANT ALL ON public.matches TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 4. RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public teams are readable by everyone" ON public.teams FOR SELECT USING (true);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public players are readable by everyone" ON public.players FOR SELECT USING (true);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public matches are readable by everyone" ON public.matches FOR SELECT USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Trigger auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
