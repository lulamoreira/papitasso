-- 1. Limpa duplicatas de teams
WITH duplicates AS (
    SELECT id, code, 
           ROW_NUMBER() OVER (PARTITION BY code ORDER BY id) AS rn
    FROM teams
)
DELETE FROM teams WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 2. Re-vincula TODOS os pools que apontam pra team_id inválido
DO $$
DECLARE
    p RECORD;
    brazil_id UUID;
BEGIN
    SELECT id INTO brazil_id FROM teams WHERE code = 'BRA' LIMIT 1;
    
    IF brazil_id IS NULL THEN
        RAISE NOTICE 'Brasil não encontrado na tabela teams';
        RETURN;
    END IF;
    
    -- Para cada pool single_team, verifica se o team_id ainda existe
    FOR p IN SELECT id, name, scope_config FROM pools 
             WHERE scope_type = 'single_team' AND scope_config ? 'team_id'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM teams 
            WHERE id::text = p.scope_config->>'team_id'
        ) THEN
            -- UUID antigo, re-vincula pro Brasil (assumindo que era o time)
            UPDATE pools 
            SET scope_config = jsonb_build_object('team_id', brazil_id)
            WHERE id = p.id;
            RAISE NOTICE 'Pool % re-vinculado ao Brasil (%)', p.name, brazil_id;
        END IF;
    END LOOP;
END $$;