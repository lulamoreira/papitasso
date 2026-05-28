-- Fix teams group assignments (exactly 4 per group)
UPDATE teams SET group_letter = 'A' WHERE code IN ('MX', 'ZA', 'US', 'DK');
UPDATE teams SET group_letter = 'B' WHERE code IN ('BR', 'CA', 'UA', 'EG');
UPDATE teams SET group_letter = 'C' WHERE code IN ('AR', 'UY', 'AT', 'TN');
UPDATE teams SET group_letter = 'D' WHERE code IN ('FR', 'CO', 'PL', 'DZ');
UPDATE teams SET group_letter = 'E' WHERE code IN ('ES', 'HR', 'HU', 'CI');
UPDATE teams SET group_letter = 'F' WHERE code IN ('GB', 'MA', 'SE', 'SA');
UPDATE teams SET group_letter = 'G' WHERE code IN ('BE', 'JP', 'GB-WLS', 'QA');
UPDATE teams SET group_letter = 'H' WHERE code IN ('PT', 'SN', 'RS', 'IQ');
UPDATE teams SET group_letter = 'I' WHERE code IN ('NL', 'CH', 'EC', 'UZ');
UPDATE teams SET group_letter = 'J' WHERE code IN ('IR', 'PE', 'PA', 'NG');
UPDATE teams SET group_letter = 'K' WHERE code IN ('IT', 'KR', 'CL', 'CR');
UPDATE teams SET group_letter = 'L' WHERE code IN ('DE', 'AU', 'PY', 'JM');

-- Clear old matches
DELETE FROM matches;

-- Use a temporary procedure to insert matches easily
DO $$
DECLARE
    g_letter TEXT;
    t1_id UUID;
    t2_id UUID;
    v_kickoff TIMESTAMPTZ := '2026-06-11 18:00:00+00';
    i INT;
    j INT;
    group_teams UUID[];
BEGIN
    -- Group Stage
    FOR g_letter IN SELECT unnest(ARRAY['A','B','C','D','E','F','G','H','I','J','K','L']) LOOP
        SELECT ARRAY_AGG(id) INTO group_teams FROM teams WHERE group_letter = g_letter;
        
        -- Each group has 6 matches (4 teams)
        FOR i IN 1..3 LOOP
            FOR j IN (i+1)..4 LOOP
                INSERT INTO matches (home_team_id, away_team_id, phase, kickoff_at, status)
                VALUES (group_teams[i], group_teams[j], 'group', v_kickoff, 'scheduled');
                v_kickoff := v_kickoff + interval '4 hours';
            END LOOP;
        END LOOP;
    END LOOP;

    -- Knockouts
    FOR i IN 1..16 LOOP
        INSERT INTO matches (phase, kickoff_at, status, placeholder_label)
        VALUES ('round_of_32', v_kickoff, 'scheduled', 'R32 Match ' || i);
        v_kickoff := v_kickoff + interval '4 hours';
    END LOOP;

    FOR i IN 1..8 LOOP
        INSERT INTO matches (phase, kickoff_at, status, placeholder_label)
        VALUES ('round_of_16', v_kickoff, 'scheduled', 'R16 Match ' || i);
        v_kickoff := v_kickoff + interval '4 hours';
    END LOOP;

    FOR i IN 1..4 LOOP
        INSERT INTO matches (phase, kickoff_at, status, placeholder_label)
        VALUES ('quarter', v_kickoff, 'scheduled', 'QF Match ' || i);
        v_kickoff := v_kickoff + interval '4 hours';
    END LOOP;

    FOR i IN 1..2 LOOP
        INSERT INTO matches (phase, kickoff_at, status, placeholder_label)
        VALUES ('semi', v_kickoff, 'scheduled', 'SF Match ' || i);
        v_kickoff := v_kickoff + interval '4 hours';
    END LOOP;

    INSERT INTO matches (phase, kickoff_at, status, placeholder_label)
    VALUES ('third', v_kickoff, 'scheduled', '3rd Place Match');
    v_kickoff := v_kickoff + interval '4 hours';

    INSERT INTO matches (phase, kickoff_at, status, placeholder_label)
    VALUES ('final', v_kickoff, 'scheduled', 'World Cup Final');
END $$;

-- Fix "Teste" Pool
UPDATE pools 
SET scope_config = jsonb_build_object('team_id', (SELECT id FROM teams WHERE code = 'BR'))
WHERE name = 'Teste';
