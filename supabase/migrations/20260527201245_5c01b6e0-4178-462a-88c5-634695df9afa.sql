-- Create pools table
CREATE TABLE public.pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  cover_image_url TEXT,
  type TEXT NOT NULL DEFAULT 'simple' CHECK (type IN ('simple', 'advanced')),
  scope_type TEXT NOT NULL DEFAULT 'full_tournament' CHECK (scope_type IN (
    'single_team', 'single_group', 'multiple_groups', 'phase', 'full_tournament'
  )),
  scope_config JSONB,
  scoring_config JSONB NOT NULL DEFAULT '{"exact": 10, "diff_winner": 5, "winner": 3, "miss": 0}',
  modes_enabled TEXT[] DEFAULT ARRAY['exact'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pool_members table
CREATE TABLE public.pool_members (
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (pool_id, user_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pools TO authenticated;
GRANT ALL ON public.pools TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pool_members TO authenticated;
GRANT ALL ON public.pool_members TO service_role;

-- Enable RLS
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;

-- Policies for pools
CREATE POLICY "Users can view pools they are members of"
ON public.pools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_members.pool_id = pools.id
    AND pool_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update their pools"
ON public.pools
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create pools"
ON public.pools
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Policies for pool_members
CREATE POLICY "Members can view other members in the same pool"
ON public.pool_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pool_members AS my_membership
    WHERE my_membership.pool_id = pool_members.pool_id
    AND my_membership.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join pools"
ON public.pool_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins/Owners can manage members"
ON public.pool_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pool_members AS my_membership
    WHERE my_membership.pool_id = pool_members.pool_id
    AND my_membership.user_id = auth.uid()
    AND my_membership.role IN ('owner', 'admin')
  )
);