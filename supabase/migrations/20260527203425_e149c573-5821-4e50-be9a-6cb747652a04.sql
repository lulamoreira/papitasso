-- Create prizes table
CREATE TABLE public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  rank INT, -- 1, 2, 3... null if special category
  category TEXT NOT NULL CHECK (category IN (
    'ranking','most_exact','most_brazil_correct','phase_leader',
    'wooden_spoon','raffle','custom'
  )),
  custom_rule_jsonb JSONB,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  estimated_value_cents INT,
  sponsor TEXT,
  delivery_method TEXT,
  position_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prize_winners table
CREATE TABLE public.prize_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id UUID NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reserved','delivered')),
  delivered_at TIMESTAMPTZ,
  delivery_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prize_id, user_id)
);

-- Grants
GRANT SELECT ON public.prizes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prizes TO authenticated;
GRANT ALL ON public.prizes TO service_role;

GRANT SELECT ON public.prize_winners TO authenticated;
GRANT UPDATE ON public.prize_winners TO authenticated;
GRANT ALL ON public.prize_winners TO service_role;

-- Enable RLS
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prizes
CREATE POLICY "Members can view prizes"
ON public.prizes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_id = prizes.pool_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Owners can manage prizes"
ON public.prizes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pools
    WHERE id = prizes.pool_id AND owner_id = auth.uid()
  )
);

-- RLS Policies for prize_winners
CREATE POLICY "Members can view winners"
ON public.prize_winners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prizes p
    JOIN public.pool_members pm ON pm.pool_id = p.pool_id
    WHERE p.id = prize_winners.prize_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update winners"
ON public.prize_winners
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.prizes p
    JOIN public.pools po ON po.id = p.pool_id
    WHERE p.id = prize_winners.prize_id AND po.owner_id = auth.uid()
  )
);

-- Create storage bucket for prize photos
INSERT INTO storage.buckets (id, name, public) VALUES ('prize-photos', 'prize-photos', true);

CREATE POLICY "Public can view prize photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'prize-photos');

CREATE POLICY "Authenticated users can upload prize photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prize-photos' AND auth.role() = 'authenticated');
