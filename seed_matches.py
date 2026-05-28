import json

teams_raw = """
[map[code:MEX id:d87335f9-ac8f-41c8-b338-e584c9a87158] map[code:RSA id:54c81b5a-51fc-4130-958f-355ddb75008e] map[code:KOR id:286f58a3-3f01-4a8d-bb33-080e7e96abab] map[code:CZE id:ba12bba8-0904-4851-ba55-b5f66abe9ab1] map[code:CAN id:32866c04-2a69-41fc-8481-38d5b3e56d5b] map[code:BIH id:349af462-51fd-4b6f-a3d8-99f555eb599b] map[code:QAT id:6ff1ea45-0ed1-4bc3-827a-ef15d72c387f] map[code:SUI id:997fd2e2-861f-4fe1-98b7-d07650f01208] map[code:BRA id:55076f27-6bd8-46e8-baa5-cd2f19ce6849] map[code:MAR id:656fb907-1507-41ab-ae98-2ce0370af005] map[code:HAI id:a49832a2-3982-4b77-9619-4f60a91daafd] map[code:SCO id:4084a2b1-9020-4d52-b91d-7e92d0623750] map[code:USA id:5934c052-06b5-4485-9ab2-a6b659c6d4ed] map[code:PAR id:816ba64d-5213-4147-bc3f-0c2d3741007b] map[code:AUS id:f3c203f0-fd18-41d7-903e-e13baa75a555] map[code:TUR id:9a92d918-d0cd-4247-9bdd-7723c8ab7f10] map[code:GER id:3e819486-5b09-456c-b29a-2091df2a1295] map[code:CUW id:491d5810-bac3-4cf1-97c1-2a94606b7e56] map[code:CIV id:48577b19-80d8-475e-8a32-3f3acd3b80e4] map[code:ECU id:1ff144bb-b898-4168-b3e4-cfff32a1bdd8] map[code:NED id:6c727dd9-980c-4a6e-9a22-e2b0831d6b2e] map[code:JPN id:651e66cf-bbf4-40b7-bb5d-2904c2ebfda4] map[code:SWE id:7e84bdc5-58cb-4db7-bee0-981bbb587020] map[code:TUN id:b5dacafc-1643-462b-83dd-c476268d031b] map[code:BEL id:b337f2ee-72f9-4f12-9896-cd87ee50a99c] map[code:EGY id:6b733e15-f2b1-4f7f-a349-f5e1caebd047] map[code:IRN id:20eb3d41-9117-4881-a650-a134d75eed54] map[code:NZL id:8ab5335d-6d07-4317-b280-73b3050936b4] map[code:ESP id:e783caf1-8f0e-49a2-b104-1f1b163dd56f] map[code:CPV id:41c7684f-f8aa-4fb9-9f36-734571d09fca] map[code:KSA id:eee50b89-0852-4538-8f14-99156e2180a0] map[code:URU id:4a6d94a2-6bca-4487-b577-7b01135e1ab9] map[code:FRA id:5f0c1233-9354-4ccf-ba93-5a5834a2565d] map[code:SEN id:cceee97e-7f27-4eff-a42b-e653b7597285] map[code:IRQ id:f8f478b7-99da-4179-9732-06dcb6594aa1] map[code:NOR id:919ce022-539d-460c-9ff5-219799c0dc13] map[code:ARG id:b55b87c3-eddb-4fc8-90fa-e05bc5da6e0e] map[code:ALG id:641b9edc-0a58-4d40-aa37-62b88bc4f164] map[code:AUT id:9da39b7f-3a30-4fa3-8dc3-bb9aa23e62d5] map[code:JOR id:cfa03e9f-54fb-4d68-ab97-674cffb4cde3] map[code:POR id:4672bb9b-97ab-4da7-98b0-89f5a4e31233] map[code:COD id:7128c373-6d80-4609-ab45-f2b92c84bcab] map[code:UZB id:2c77d6d7-a7de-4c20-811a-8e8f7dc71d27] map[code:COL id:63c947e5-a173-40b2-886a-fb7083f5bb95] map[code:ENG id:fd82021a-e56d-4871-ad9d-6438a721b8a5] map[code:CRO id:cc98ad74-3f04-4b56-b0ec-a8292f553693] map[code:GHA id:3ea02d00-ff74-4566-9263-b429044e000c] map[code:PAN id:2afc7da0-d868-44a8-af9a-f027379e768d]]
"""

import re
team_map = {}
matches = re.findall(r"code:(\w+) id:([\w-]+)", teams_raw)
for code, tid in matches:
    team_map[code] = tid

matches_data = [
    # 11/jun
    ('MEX', 'RSA', '2026-06-11 17:00:00', 'Estadio Azteca', 'Mexico City'),
    ('KOR', 'CZE', '2026-06-11 20:00:00', 'Estadio Akron', 'Guadalajara'),
    # 12/jun
    ('CAN', 'BIH', '2026-06-12 17:00:00', 'BMO Field', 'Toronto'),
    ('QAT', 'SUI', '2026-06-12 20:00:00', 'Levi\'s Stadium', 'San Francisco'),
    ('USA', 'PAR', '2026-06-12 17:00:00', 'SoFi Stadium', 'Los Angeles'),
    ('AUS', 'TUR', '2026-06-12 22:00:00', 'BC Place', 'Vancouver'),
    # 13/jun
    ('BRA', 'MAR', '2026-06-13 19:00:00', 'Gillette Stadium', 'Boston'),
    ('HAI', 'SCO', '2026-06-13 22:00:00', 'MetLife Stadium', 'New Jersey'),
    # 14/jun
    ('GER', 'CUW', '2026-06-14 13:00:00', 'Lincoln Financial Field', 'Philadelphia'),
    ('CIV', 'ECU', '2026-06-14 16:00:00', 'NRG Stadium', 'Houston'),
    ('NED', 'JPN', '2026-06-14 19:00:00', 'AT&T Stadium', 'Dallas'),
    ('SWE', 'TUN', '2026-06-14 22:00:00', 'Estadio BBVA', 'Monterrey'),
    # 15/jun
    ('BEL', 'EGY', '2026-06-15 13:00:00', 'SoFi Stadium', 'Los Angeles'),
    ('IRN', 'NZL', '2026-06-15 16:00:00', 'Lumen Field', 'Seattle'),
    ('ESP', 'CPV', '2026-06-15 19:00:00', 'Hard Rock Stadium', 'Miami'),
    ('KSA', 'URU', '2026-06-15 22:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
    # 16/jun
    ('FRA', 'SEN', '2026-06-16 13:00:00', 'MetLife Stadium', 'New Jersey'),
    ('IRQ', 'NOR', '2026-06-16 16:00:00', 'Gillette Stadium', 'Boston'),
    ('ARG', 'ALG', '2026-06-16 19:00:00', 'Arrowhead Stadium', 'Kansas City'),
    ('AUT', 'JOR', '2026-06-16 22:00:00', 'Levi\'s Stadium', 'San Francisco'),
    # 17/jun
    ('POR', 'COD', '2026-06-17 13:00:00', 'NRG Stadium', 'Houston'),
    ('UZB', 'COL', '2026-06-17 16:00:00', 'Estadio Azteca', 'Mexico City'),
    ('ENG', 'CRO', '2026-06-17 19:00:00', 'BMO Field', 'Toronto'),
    ('GHA', 'PAN', '2026-06-17 22:00:00', 'AT&T Stadium', 'Dallas'),
    # 18/jun
    ('CZE', 'RSA', '2026-06-18 13:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
    ('MEX', 'KOR', '2026-06-18 19:00:00', 'Estadio Akron', 'Guadalajara'),
    ('SUI', 'BIH', '2026-06-18 16:00:00', 'SoFi Stadium', 'Los Angeles'),
    ('CAN', 'QAT', '2026-06-18 22:00:00', 'BC Place', 'Vancouver'),
    # 19/jun
    ('BRA', 'HAI', '2026-06-19 21:30:00', 'Lincoln Financial Field', 'Philadelphia'),
    ('SCO', 'MAR', '2026-06-19 16:00:00', 'Gillette Stadium', 'Boston'),
    ('TUR', 'PAR', '2026-06-19 13:00:00', 'Levi\'s Stadium', 'San Francisco'),
    ('USA', 'AUS', '2026-06-19 19:00:00', 'Lumen Field', 'Seattle'),
    # 20/jun
    ('GER', 'CIV', '2026-06-20 13:00:00', 'BMO Field', 'Toronto'),
    ('ECU', 'CUW', '2026-06-20 16:00:00', 'Arrowhead Stadium', 'Kansas City'),
    ('NED', 'SWE', '2026-06-20 19:00:00', 'NRG Stadium', 'Houston'),
    ('TUN', 'JPN', '2026-06-20 22:00:00', 'Estadio BBVA', 'Monterrey'),
    # 21/jun
    ('BEL', 'IRN', '2026-06-21 13:00:00', 'SoFi Stadium', 'Los Angeles'),
    ('NZL', 'EGY', '2026-06-21 16:00:00', 'BC Place', 'Vancouver'),
    ('ESP', 'KSA', '2026-06-21 19:00:00', 'Hard Rock Stadium', 'Miami'),
    ('URU', 'CPV', '2026-06-21 22:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
    # 22/jun
    ('FRA', 'IRQ', '2026-06-22 13:00:00', 'MetLife Stadium', 'New Jersey'),
    ('NOR', 'SEN', '2026-06-22 16:00:00', 'Lincoln Financial Field', 'Philadelphia'),
    ('ARG', 'AUT', '2026-06-22 19:00:00', 'AT&T Stadium', 'Dallas'),
    ('JOR', 'ALG', '2026-06-22 22:00:00', 'Levi\'s Stadium', 'San Francisco'),
    # 23/jun
    ('POR', 'UZB', '2026-06-23 13:00:00', 'NRG Stadium', 'Houston'),
    ('COL', 'COD', '2026-06-23 16:00:00', 'Estadio Akron', 'Guadalajara'),
    ('ENG', 'GHA', '2026-06-23 19:00:00', 'Gillette Stadium', 'Boston'),
    ('PAN', 'CRO', '2026-06-23 22:00:00', 'BMO Field', 'Toronto'),
    # 24/jun
    ('CZE', 'MEX', '2026-06-24 19:00:00', 'Estadio Azteca', 'Mexico City'),
    ('RSA', 'KOR', '2026-06-24 16:00:00', 'Estadio BBVA', 'Monterrey'),
    ('SUI', 'CAN', '2026-06-24 22:00:00', 'BC Place', 'Vancouver'),
    ('BIH', 'QAT', '2026-06-24 13:00:00', 'Lumen Field', 'Seattle'),
    # 25/jun
    ('TUR', 'USA', '2026-06-25 19:00:00', 'SoFi Stadium', 'Los Angeles'),
    ('PAR', 'AUS', '2026-06-25 22:00:00', 'Levi\'s Stadium', 'San Francisco'),
    ('ECU', 'GER', '2026-06-25 13:00:00', 'Lincoln Financial Field', 'Philadelphia'),
    ('CUW', 'CIV', '2026-06-25 16:00:00', 'MetLife Stadium', 'New Jersey'),
    # 26/jun
    ('SCO', 'BRA', '2026-06-26 19:00:00', 'Hard Rock Stadium', 'Miami'),
    ('MAR', 'HAI', '2026-06-26 22:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
    ('TUN', 'NED', '2026-06-26 16:00:00', 'AT&T Stadium', 'Dallas'),
    ('JPN', 'SWE', '2026-06-26 13:00:00', 'Arrowhead Stadium', 'Kansas City'),
    ('NZL', 'BEL', '2026-06-26 13:00:00', 'Lumen Field', 'Seattle'),
    ('EGY', 'IRN', '2026-06-26 16:00:00', 'BC Place', 'Vancouver'),
    ('URU', 'ESP', '2026-06-26 19:00:00', 'NRG Stadium', 'Houston'),
    ('CPV', 'KSA', '2026-06-26 22:00:00', 'Estadio Akron', 'Guadalajara'),
    # 27/jun
    ('NOR', 'FRA', '2026-06-27 13:00:00', 'Gillette Stadium', 'Boston'),
    ('SEN', 'IRQ', '2026-06-27 16:00:00', 'BMO Field', 'Toronto'),
    ('JOR', 'ARG', '2026-06-27 19:00:00', 'Arrowhead Stadium', 'Kansas City'),
    ('ALG', 'AUT', '2026-06-27 22:00:00', 'AT&T Stadium', 'Dallas'),
    ('COL', 'POR', '2026-06-27 19:00:00', 'Hard Rock Stadium', 'Miami'),
    ('COD', 'UZB', '2026-06-27 22:00:00', 'Mercedes-Benz Stadium', 'Atlanta'),
    ('PAN', 'ENG', '2026-06-27 13:00:00', 'MetLife Stadium', 'New Jersey'),
    ('CRO', 'GHA', '2026-06-27 16:00:00', 'Lincoln Financial Field', 'Philadelphia'),
]

sql_values = []
for h, a, t, stadium, city in matches_data:
    sql_values.append(f"('{team_map[h]}', '{team_map[a]}', TIMESTAMP '{t}' - INTERVAL '3 hours', 'scheduled', 'group', '{stadium}', '{city}')")

print("INSERT INTO matches (home_team_id, away_team_id, kickoff_at, status, phase, stadium, city) VALUES")
print(",\n".join(sql_values) + ";")

# Knockout placeholders
ko_data = [
    ('R32', '2026-06-28 17:00:00', '1º A vs 3º C/D/E', 'SoFi Stadium', 'Los Angeles'),
    ('R32', '2026-06-28 20:00:00', '2º A vs 2º B', 'Estadio Azteca', 'Mexico City'),
    ('R32', '2026-06-29 17:00:00', '1º B vs 3º A/C/D', 'BC Place', 'Vancouver'),
    ('R32', '2026-06-29 20:00:00', '1º C vs 3º A/B/F', 'Gillette Stadium', 'Boston'),
    ('R32', '2026-06-30 17:00:00', '1º D vs 3º B/E/F', 'MetLife Stadium', 'New Jersey'),
    ('R32', '2026-06-30 20:00:00', '2º C vs 2º D', 'NRG Stadium', 'Houston'),
    ('R32', '2026-07-01 17:00:00', '1º E vs 3º A/D/G', 'AT&T Stadium', 'Dallas'),
    ('R32', '2026-07-01 20:00:00', '1º F vs 2º E', 'BMO Field', 'Toronto'),
    ('R32', '2026-07-02 17:00:00', '1º G vs 3º C/F/I', 'Mercedes-Benz Stadium', 'Atlanta'),
    ('R32', '2026-07-02 20:00:00', '2º F vs 2º G', 'Arrowhead Stadium', 'Kansas City'),
    ('R32', '2026-07-03 17:00:00', '1º H vs 2º I', 'Hard Rock Stadium', 'Miami'),
    ('R32', '2026-07-03 20:00:00', '1º I vs 3º G/H/J', 'Levi\'s Stadium', 'San Francisco'),
    ('R32', '2026-07-04 17:00:00', '1º J vs 2º K', 'Estadio BBVA', 'Monterrey'),
    ('R32', '2026-07-04 20:00:00', '1º K vs 3º I/L', 'Lumen Field', 'Seattle'),
    ('R32', '2026-07-05 17:00:00', '1º L vs 2º J', 'Estadio Akron', 'Guadalajara'),
    ('R32', '2026-07-05 20:00:00', '2º L vs 2º H', 'Lincoln Financial Field', 'Philadelphia'),
    
    ('R16', '2026-07-06 17:00:00', 'Venc R32-1 vs Venc R32-2', 'AT&T Stadium', 'Dallas'),
    ('R16', '2026-07-06 20:00:00', 'Venc R32-3 vs Venc R32-4', 'Estadio Azteca', 'Mexico City'),
    ('R16', '2026-07-07 17:00:00', 'Venc R32-5 vs Venc R32-6', 'SoFi Stadium', 'Los Angeles'),
    ('R16', '2026-07-07 20:00:00', 'Venc R32-7 vs Venc R32-8', 'BC Place', 'Vancouver'),
    ('R16', '2026-07-08 17:00:00', 'Venc R32-9 vs Venc R32-10', 'Hard Rock Stadium', 'Miami'),
    ('R16', '2026-07-08 20:00:00', 'Venc R32-11 vs Venc R32-12', 'Gillette Stadium', 'Boston'),
    ('R16', '2026-07-09 17:00:00', 'Venc R32-13 vs Venc R32-14', 'Mercedes-Benz Stadium', 'Atlanta'),
    ('R16', '2026-07-09 20:00:00', 'Venc R32-15 vs Venc R32-16', 'MetLife Stadium', 'New Jersey'),

    ('QF', '2026-07-11 17:00:00', 'Venc R16-1 vs Venc R16-2', 'Arrowhead Stadium', 'Kansas City'),
    ('QF', '2026-07-11 20:00:00', 'Venc R16-3 vs Venc R16-4', 'Levi\'s Stadium', 'San Francisco'),
    ('QF', '2026-07-12 17:00:00', 'Venc R16-5 vs Venc R16-6', 'SoFi Stadium', 'Los Angeles'),
    ('QF', '2026-07-12 20:00:00', 'Venc R16-7 vs Venc R16-8', 'BMO Field', 'Toronto'),

    ('SF', '2026-07-14 21:00:00', 'Venc QF-1 vs Venc QF-2', 'AT&T Stadium', 'Dallas'),
    ('SF', '2026-07-15 21:00:00', 'Venc QF-3 vs Venc QF-4', 'Mercedes-Benz Stadium', 'Atlanta'),

    ('3rd_place', '2026-07-18 17:00:00', 'Perdedor SF-1 vs Perdedor SF-2', 'Hard Rock Stadium', 'Miami'),
    ('final', '2026-07-19 17:00:00', 'Vencedor SF-1 vs Vencedor SF-2', 'MetLife Stadium', 'New Jersey'),
]

ko_values = []
for phase, t, label, stadium, city in ko_data:
    ko_values.append(f"(NULL, NULL, TIMESTAMP '{t}' - INTERVAL '3 hours', 'scheduled', '{phase}', '{stadium}', '{city}', '{label}')")

print("INSERT INTO matches (home_team_id, away_team_id, kickoff_at, status, phase, stadium, city, placeholder_label) VALUES")
print(",\n".join(ko_values) + ";")
