-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER NOT NULL DEFAULT 0
);

-- Use GRANT to set permissions for achievements
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE, -- null if global
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id, pool_id)
);

-- Use GRANT for user_achievements
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

-- Create collected_cards table
CREATE TABLE public.collected_cards (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, team_id)
);

-- Use GRANT for collected_cards
GRANT SELECT ON public.collected_cards TO authenticated;
GRANT ALL ON public.collected_cards TO service_role;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collected_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own cards" ON public.collected_cards FOR SELECT USING (auth.uid() = user_id);

-- Seed achievements
INSERT INTO public.achievements (code, name, description, rarity, xp_reward) VALUES
('profeta', 'Profeta', '5 placares exatos', 'rare', 50),
('super_profeta', 'Super Profeta', '15 placares exatos', 'epic', 200),
('patriota', 'Patriota', 'Acertou todos jogos do Brasil na fase de grupos', 'epic', 150),
('zebra', 'Zebra', 'Acertou 3 upsets com odds desfavoráveis', 'rare', 80),
('maracana', 'Maracanã', 'Top 1 do pool na fase de grupos', 'epic', 250),
('final_de_copa', 'Final de Copa', 'Acertou os 2 finalistas', 'legendary', 500),
('campeao_certo', 'Campeão Certo', 'Acertou o campeão antes da Copa começar via bracket', 'legendary', 1000),
('consistente', 'Consistente', 'Palpitou em 100% dos jogos do pool', 'rare', 100),
('bolheiro', 'Bolheiro', 'Criou 3 pools', 'common', 30),
('influencer', 'Influencer', 'Trouxe 5 amigos via convite', 'rare', 100),
('veterano', 'Veterano', 'Participa de bolão há mais de 30 dias', 'common', 20),
('streak_7', 'Streak 7', '7 palpites corretos seguidos', 'rare', 75),
('streak_15', 'Streak 15', '15 palpites corretos seguidos', 'epic', 200),
('artilheiro_predict', 'Artilheiro Predict', 'Acertou o artilheiro nos props', 'epic', 300),
('pe_frio', 'Pé Frio', 'Errou 10 palpites seguidos', 'common', 10),
('madrugador', 'Madrugador', 'Palpitou em todos os jogos com mais de 24h de antecedência por 7 dias', 'rare', 100),
('comentarista', 'Comentarista', 'Postou 50 msgs no chat', 'common', 25),
('coletor', 'Coletor', 'Juntou 10 cards de seleções', 'rare', 100),
('album_completo', 'Álbum Completo', 'Juntou cards de todas 48 seleções', 'legendary', 1500),
('lendario', 'Lendário', 'Chegou ao tier Lendário', 'legendary', 0);

-- Function to update league tier
CREATE OR REPLACE FUNCTION public.recalculate_league_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.league_tier = CASE
    WHEN NEW.xp < 500 THEN 'bronze'
    WHEN NEW.xp < 2000 THEN 'prata'
    WHEN NEW.xp < 5000 THEN 'ouro'
    WHEN NEW.xp < 10000 THEN 'platina'
    WHEN NEW.xp < 20000 THEN 'diamante'
    ELSE 'lendario'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for tier update
CREATE TRIGGER update_league_tier
BEFORE UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_league_tier();

-- Function to award card
CREATE OR REPLACE FUNCTION public.award_card(p_user_id UUID, p_team_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.collected_cards (user_id, team_id, level)
  VALUES (p_user_id, p_team_id, 1)
  ON CONFLICT (user_id, team_id) DO UPDATE
  SET level = LEAST(public.collected_cards.level + 1, 5),
      acquired_at = now();
      
  -- Check for coletor and album_completo achievements
  -- (This will be called from the Edge Function for more complex logic, but we can do simple card count here)
END;
$$ LANGUAGE plpgsql SET search_path = public;
