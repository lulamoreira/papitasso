DO $$
DECLARE
    v_bra UUID; v_mar UUID; v_hai UUID; v_sco UUID;
    v_metlife UUID; v_linc UUID; v_hardrock UUID;
BEGIN
    SELECT id INTO v_bra FROM teams WHERE code='BRA' LIMIT 1;
    SELECT id INTO v_mar FROM teams WHERE code='MAR' LIMIT 1;
    SELECT id INTO v_hai FROM teams WHERE code='HAI' LIMIT 1;
    SELECT id INTO v_sco FROM teams WHERE code='SCO' LIMIT 1;
    SELECT id INTO v_metlife FROM venues WHERE name='MetLife Stadium' LIMIT 1;
    SELECT id INTO v_linc FROM venues WHERE name='Lincoln Financial Field' LIMIT 1;
    SELECT id INTO v_hardrock FROM venues WHERE name='Hard Rock Stadium' LIMIT 1;

    -- Brasil x Marrocos: 13/jun, 18h ET (22:00 UTC), MetLife/Nova Jersey
    UPDATE matches SET
        kickoff_at = '2026-06-13 22:00:00+00',
        venue_id = v_metlife,
        stadium = 'MetLife Stadium',
        city = 'East Rutherford'
    WHERE (home_team_id = v_bra AND away_team_id = v_mar) OR (home_team_id = v_mar AND away_team_id = v_bra);

    -- Brasil x Haiti: 19/jun, 21h ET (01:00 UTC do dia 20), Lincoln/Filadélfia
    UPDATE matches SET
        kickoff_at = '2026-06-20 01:00:00+00',
        venue_id = v_linc,
        stadium = 'Lincoln Financial Field',
        city = 'Filadélfia'
    WHERE (home_team_id = v_bra AND away_team_id = v_hai) OR (home_team_id = v_hai AND away_team_id = v_bra);

    -- Escócia x Brasil: 24/jun, 18h ET (22:00 UTC), Hard Rock/Miami
    UPDATE matches SET
        kickoff_at = '2026-06-24 22:00:00+00',
        venue_id = v_hardrock,
        stadium = 'Hard Rock Stadium',
        city = 'Miami Gardens'
    WHERE (home_team_id = v_bra AND away_team_id = v_sco) OR (home_team_id = v_sco AND away_team_id = v_bra);
END $$;