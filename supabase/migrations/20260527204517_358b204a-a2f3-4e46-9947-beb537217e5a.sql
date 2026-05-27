-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    text TEXT NOT NULL,
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mural_posts table
CREATE TABLE public.mural_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('auto_zoeira', 'user_post', 'match_recap')),
    user_id UUID REFERENCES public.profiles(id),
    target_user_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_posts ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

GRANT SELECT, INSERT, DELETE ON public.mural_posts TO authenticated;
GRANT ALL ON public.mural_posts TO service_role;

-- RLS Policies
CREATE POLICY "Members can view chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = chat_messages.pool_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Members can insert chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = chat_messages.pool_id AND pm.user_id = auth.uid())
    AND auth.uid() = user_id
);

CREATE POLICY "Members can view mural posts" ON public.mural_posts FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = mural_posts.pool_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Members can insert mural posts" ON public.mural_posts FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.pool_members pm WHERE pm.pool_id = mural_posts.pool_id AND pm.user_id = auth.uid())
    AND (user_id IS NULL OR auth.uid() = user_id)
);
CREATE POLICY "Authors or owners can delete mural posts" ON public.mural_posts FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.pools p WHERE p.id = mural_posts.pool_id AND p.owner_id = auth.uid())
);

-- Reaction toggle function
CREATE OR REPLACE FUNCTION public.toggle_chat_reaction(p_message_id UUID, p_emoji TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reactions JSONB;
    v_user_list TEXT[];
BEGIN
    SELECT reactions INTO v_reactions FROM chat_messages WHERE id = p_message_id;
    
    v_user_list := ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_reactions->p_emoji, '[]'::jsonb)));
    
    IF v_user_id::text = ANY(v_user_list) THEN
        -- Remove reaction
        v_user_list := array_remove(v_user_list, v_user_id::text);
    ELSE
        -- Add reaction
        v_user_list := v_user_list || v_user_id::text;
    END IF;
    
    UPDATE chat_messages 
    SET reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), ARRAY[p_emoji], to_jsonb(v_user_list))
    WHERE id = p_message_id;
END;
$$;
