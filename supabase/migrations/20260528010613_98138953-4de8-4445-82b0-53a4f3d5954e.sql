-- FIX 3: create_pool_with_owner RPC
CREATE OR REPLACE FUNCTION public.create_pool_with_owner(
    p_name TEXT,
    p_type TEXT,
    p_scope_type TEXT,
    p_scope_config JSONB,
    p_scoring_config JSONB,
    p_modes_enabled TEXT[],
    p_invite_code TEXT
)
RETURNS TABLE (id UUID, name TEXT, invite_code TEXT, owner_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_pool_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    INSERT INTO pools (name, type, scope_type, scope_config, scoring_config, modes_enabled, invite_code, owner_id)
    VALUES (p_name, p_type, p_scope_type, p_scope_config, p_scoring_config, p_modes_enabled, p_invite_code, v_user_id)
    RETURNING pools.id INTO v_pool_id;
    
    INSERT INTO pool_members (pool_id, user_id, role)
    VALUES (v_pool_id, v_user_id, 'owner');
    
    RETURN QUERY SELECT v_pool_id, p_name, p_invite_code, v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pool_with_owner TO authenticated;

-- FIX 4: Storage policy with path per user
DROP POLICY IF EXISTS "Authenticated users can upload prize photos" ON storage.objects;

CREATE POLICY "Users upload to their own prize folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'prize-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update their own prize photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'prize-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete their own prize photos"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'prize-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
