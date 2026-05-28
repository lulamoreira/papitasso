-- 1A: Tabela venues + 16 estádios
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    capacity INT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='matches' AND COLUMN_NAME='venue_id') THEN
        ALTER TABLE public.matches ADD COLUMN venue_id UUID REFERENCES public.venues(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_venue ON public.matches(venue_id);

GRANT SELECT ON public.venues TO authenticated, anon;
GRANT ALL ON public.venues TO service_role;

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Venues are public" ON public.venues;
CREATE POLICY "Venues are public" ON public.venues FOR SELECT USING (true);

INSERT INTO public.venues (name, city, state, country, capacity, image_url) VALUES
('MetLife Stadium','East Rutherford','Nova Jersey','EUA',82500,'https://commons.wikimedia.org/wiki/Special:FilePath/Metlife_Stadium_Field.jpg?width=800'),
('SoFi Stadium','Inglewood','Califórnia','EUA',70240,'https://commons.wikimedia.org/wiki/Special:FilePath/SoFi_Stadium_2.jpg?width=800'),
('AT&T Stadium','Arlington','Texas','EUA',80000,'https://commons.wikimedia.org/wiki/Special:FilePath/AT%26T_Stadium.jpg?width=800'),
('NRG Stadium','Houston','Texas','EUA',72220,'https://commons.wikimedia.org/wiki/Special:FilePath/Reliant_Stadium_3.jpg?width=800'),
('Mercedes-Benz Stadium','Atlanta','Geórgia','EUA',71000,'https://commons.wikimedia.org/wiki/Special:FilePath/Mercedes-Benz_Stadium_outside.jpg?width=800'),
('Hard Rock Stadium','Miami Gardens','Flórida','EUA',65326,'https://commons.wikimedia.org/wiki/Special:FilePath/Hard_Rock_Stadium_-_April_2021.jpg?width=800'),
('Lincoln Financial Field','Filadélfia','Pensilvânia','EUA',69596,'https://commons.wikimedia.org/wiki/Special:FilePath/Lincoln_Financial_Field_Sunny.jpg?width=800'),
('Gillette Stadium','Foxborough','Massachusetts','EUA',65878,'https://commons.wikimedia.org/wiki/Special:FilePath/Gillette_Stadium_July_2024.jpg?width=800'),
('Arrowhead Stadium','Kansas City','Missouri','EUA',76416,'https://commons.wikimedia.org/wiki/Special:FilePath/Arrowhead_Stadium_2017.jpg?width=800'),
('Levi''s Stadium','Santa Clara','Califórnia','EUA',68500,'https://commons.wikimedia.org/wiki/Special:FilePath/Levi%27s_Stadium_Aerial.jpg?width=800'),
('Lumen Field','Seattle','Washington','EUA',68740,'https://commons.wikimedia.org/wiki/Special:FilePath/Lumen_Field_pano.jpg?width=800'),
('Estadio Azteca','Cidade do México','CDMX','México',87000,'https://commons.wikimedia.org/wiki/Special:FilePath/Mexico_City_-_Aztec_Stadium.jpg?width=800'),
('Estadio Akron','Zapopan','Jalisco','México',49850,'https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_Akron.jpg?width=800'),
('Estadio BBVA','Guadalupe','Nuevo León','México',53500,'https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_BBVA_Bancomer.jpg?width=800'),
('BMO Field','Toronto','Ontário','Canadá',45736,'https://commons.wikimedia.org/wiki/Special:FilePath/BMO_Field_-_June_2016.jpg?width=800'),
('BC Place','Vancouver','Colúmbia Britânica','Canadá',54500,'https://commons.wikimedia.org/wiki/Special:FilePath/BC_Place_Aerial.jpg?width=800')
ON CONFLICT (name) DO NOTHING;

-- 1B: UNIQUE em matches.external_api_id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_external_api_id_key') THEN
        ALTER TABLE public.matches ADD CONSTRAINT matches_external_api_id_key UNIQUE (external_api_id);
    END IF;
END $$;

-- 1C: matches_for_pool resolve por team_code
CREATE OR REPLACE FUNCTION public.matches_for_pool(p_pool_id UUID)
RETURNS SETOF public.matches
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_scope_type TEXT;
    v_scope_config JSONB;
    v_team_id UUID;
BEGIN
    SELECT scope_type, scope_config INTO v_scope_type, v_scope_config
    FROM public.pools WHERE id = p_pool_id;

    IF v_scope_type = 'single_team' THEN
        IF v_scope_config ? 'team_code' THEN
            SELECT id INTO v_team_id FROM public.teams WHERE code = v_scope_config->>'team_code' LIMIT 1;
        ELSE
            v_team_id := (v_scope_config->>'team_id')::UUID;
        END IF;
        RETURN QUERY SELECT * FROM public.matches 
        WHERE home_team_id = v_team_id OR away_team_id = v_team_id;

    ELSIF v_scope_type = 'single_group' THEN
        RETURN QUERY SELECT m.* FROM public.matches m
        JOIN public.teams t1 ON m.home_team_id = t1.id
        JOIN public.teams t2 ON m.away_team_id = t2.id
        WHERE m.phase = 'group' 
        AND (t1.group_letter = v_scope_config->>'group_letter' OR t2.group_letter = v_scope_config->>'group_letter');

    ELSIF v_scope_type = 'multiple_groups' THEN
        RETURN QUERY SELECT m.* FROM public.matches m
        JOIN public.teams t1 ON m.home_team_id = t1.id
        JOIN public.teams t2 ON m.away_team_id = t2.id
        WHERE m.phase = 'group' 
        AND (t1.group_letter = ANY(ARRAY(SELECT jsonb_array_elements_text(v_scope_config->'group_letters')))
             OR t2.group_letter = ANY(ARRAY(SELECT jsonb_array_elements_text(v_scope_config->'group_letters'))));

    ELSIF v_scope_type = 'phase' THEN
        RETURN QUERY SELECT * FROM public.matches 
        WHERE phase = ANY(ARRAY(SELECT jsonb_array_elements_text(v_scope_config->'phases')));

    ELSE
        RETURN QUERY SELECT * FROM public.matches;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.matches_for_pool(UUID) TO authenticated, service_role;

-- 1D: Migra pools existentes
UPDATE public.pools p
SET scope_config = jsonb_build_object('team_code', t.code)
FROM public.teams t
WHERE p.scope_type = 'single_team'
  AND p.scope_config ? 'team_id'
  AND t.id::text = p.scope_config->>'team_id';

UPDATE public.pools
SET scope_config = jsonb_build_object('team_code', 'BRA')
WHERE scope_type = 'single_team' AND NOT (scope_config ? 'team_code');
