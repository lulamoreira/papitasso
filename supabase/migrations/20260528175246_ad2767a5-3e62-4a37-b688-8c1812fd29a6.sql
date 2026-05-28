-- Apagar bolão (só o dono)
CREATE OR REPLACE FUNCTION public.delete_pool(p_pool_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pools WHERE id = p_pool_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Apenas o dono pode apagar o bolão';
  END IF;
  DELETE FROM pools WHERE id = p_pool_id;  -- cascade apaga membros, palpites, prêmios
END; $$;

-- Transferir propriedade (dono → outro membro)
CREATE OR REPLACE FUNCTION public.transfer_pool_ownership(p_pool_id UUID, p_new_owner UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pools WHERE id = p_pool_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Apenas o dono pode transferir a propriedade';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pool_members WHERE pool_id = p_pool_id AND user_id = p_new_owner) THEN
    RAISE EXCEPTION 'O novo dono precisa ser membro do bolão';
  END IF;
  UPDATE pools SET owner_id = p_new_owner WHERE id = p_pool_id;
  UPDATE pool_members SET role = 'member' WHERE pool_id = p_pool_id AND user_id = auth.uid();
  UPDATE pool_members SET role = 'owner'  WHERE pool_id = p_pool_id AND user_id = p_new_owner;
END; $$;

-- Sair do bolão (dono precisa transferir antes)
CREATE OR REPLACE FUNCTION public.leave_pool(p_pool_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pools WHERE id = p_pool_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Você é o dono. Transfira a propriedade antes de sair.';
  END IF;
  DELETE FROM pool_members WHERE pool_id = p_pool_id AND user_id = auth.uid();
END; $$;

GRANT EXECUTE ON FUNCTION public.delete_pool(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_pool_ownership(UUID,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_pool(UUID) TO authenticated;