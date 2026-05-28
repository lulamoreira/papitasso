const teams = [
  {id: 'c51db2ec-5435-4ed9-b43b-42fabc154c43', name: 'México', code: 'MX', group: 'A'},
  {id: '93d1ae1e-e8c6-4e1c-a1b6-ebb0c00ad44c', name: 'África do Sul', code: 'ZA', group: 'A'},
  {id: '49b59bcf-cd9b-4c15-9571-015a6c7c35fb', name: 'Estados Unidos', code: 'US', group: 'A'},
  {id: '49827597-7986-4289-b898-e3b5f982bda2', name: 'Dinamarca', code: 'DK', group: 'A'},
  {id: 'f65d15ae-d9c7-49e4-a589-372128bc56c9', name: 'Brasil', code: 'BR', group: 'B'},
  {id: '08c7f7cb-1f7f-4af5-a9cd-007513191494', name: 'Canadá', code: 'CA', group: 'B'},
  {id: '8ea1a0c2-a4ad-40e0-b383-d2e080bc2825', name: 'Ucrânia', code: 'UA', group: 'B'},
  {id: '33df6205-2220-41ae-9f59-abc7447cb229', name: 'Egito', code: 'EG', group: 'B'},
  {id: 'f87217d9-b152-480e-888a-604bd88b2ed1', name: 'Argentina', code: 'AR', group: 'C'},
  {id: '0618aade-d74d-420d-a54b-f2adef704958', name: 'Uruguai', code: 'UY', group: 'C'},
  {id: '25b921c8-41fc-4025-a591-3945ec1fb9de', name: 'Áustria', code: 'AT', group: 'C'},
  {id: '4464a487-d655-461a-a5e4-803926309c97', name: 'Tunísia', code: 'TN', group: 'C'},
  {id: 'ca6b2d77-ec1f-4dde-8f97-4bd58523cecb', name: 'França', code: 'FR', group: 'D'},
  {id: 'b276bf7b-9ef8-473b-b859-1e8e8d0d256b', name: 'Colômbia', code: 'CO', group: 'D'},
  {id: '1106642b-4d0f-416b-8fcd-4d31b542e499', name: 'Polônia', code: 'PL', group: 'D'},
  {id: '91252c0d-872f-4be2-b0a5-5ab69cc889b8', name: 'Argélia', code: 'DZ', group: 'D'},
  {id: '8e5ff6d3-6f4e-49ca-8f97-2b063dda48f2', name: 'Espanha', code: 'ES', group: 'E'},
  {id: 'bd08b03a-d5b5-4f1b-a151-8fa46512cb88', name: 'Croácia', code: 'HR', group: 'E'},
  {id: '402e5903-fd86-4d3a-aff1-bb37ef5e6b2d', name: 'Hungria', code: 'HU', group: 'E'},
  {id: '57fa0252-030d-4f35-abde-317de6a24288', name: 'Costa do Marfim', code: 'CI', group: 'E'},
  {id: '2a8d1bb7-ed6a-4b95-911c-a87fed9747e9', name: 'Inglaterra', code: 'GB', group: 'F'},
  {id: '5b54682d-417a-402a-a48c-4d926cd4ac51', name: 'Marrocos', code: 'MA', group: 'F'},
  {id: '8596d8d3-57ed-468f-a34c-16029cfceaed', name: 'Suécia', code: 'SE', group: 'F'},
  {id: '44789ab6-ea08-4666-9456-142c2db5498a', name: 'Arábia Saudita', code: 'SA', group: 'F'},
  {id: 'ed91e4e8-2df4-4d4b-815f-057d870a35ea', name: 'Bélgica', code: 'BE', group: 'G'},
  {id: '6b0b2eef-c3d6-40b7-8cc1-8d3061c264ac', name: 'Japão', code: 'JP', group: 'G'},
  {id: '8e617d59-3b50-4094-87d1-c7d94e3a6607', name: 'Gales', code: 'GB-WLS', group: 'G'},
  {id: '8c286088-5589-4ab9-b5b1-452240d9e872', name: 'Catar', code: 'QA', group: 'G'},
  {id: '5167904f-1c85-416a-8536-241881b14e98', name: 'Portugal', code: 'PT', group: 'H'},
  {id: '27aa97d7-abfe-4f0e-8e4b-e0c36f377dbb', name: 'Senegal', code: 'SN', group: 'H'},
  {id: 'b5b97e5e-56c0-4ee7-a03a-0b9b64a2aff0', name: 'Sérvia', code: 'RS', group: 'H'},
  {id: 'd6d92e67-7f24-4d1a-abc1-71fe29485053', name: 'Iraque', code: 'IQ', group: 'H'},
  {id: '4856040c-1997-4051-872f-b308673eb33a', name: 'Holanda', code: 'NL', group: 'I'},
  {id: '7739c2d0-0f73-447e-8837-f696e251d2c0', name: 'Suíça', code: 'CH', group: 'I'},
  {id: '30037d60-954e-4794-aaae-afd3c7dac747', name: 'Equador', code: 'EC', group: 'I'},
  {id: '8d98e110-6bc6-42c7-a2ee-4c9c8986e25e', name: 'Uzbequistão', code: 'UZ', group: 'I'},
  {id: 'a380c333-30c9-4cfc-be7f-e65ea6fb405b', name: 'Irã', code: 'IR', group: 'J'},
  {id: '90f295de-ee10-4ea7-962c-f890bf67ab8f', name: 'Peru', code: 'PE', group: 'J'},
  {id: '8dbdd45f-c13b-4685-9bff-4deb99211496', name: 'Panamá', code: 'PA', group: 'J'},
  {id: '1e7a807c-ba47-47e0-a3de-1428959326b4', name: 'Nigéria', code: 'NG', group: 'J'},
  {id: 'bdbc2d66-27a4-4ce9-8369-c6e9b32c7857', name: 'Itália', code: 'IT', group: 'K'},
  {id: '5f5eda9e-2c75-46cc-a19b-2b6cdfe65445', name: 'Coreia do Sul', code: 'KR', group: 'K'},
  {id: '54038bdf-ee7f-4a0a-ad96-ce58333243f1', name: 'Chile', code: 'CL', group: 'K'},
  {id: '97aa2685-9f18-4947-9b9e-cc6a98ca87cd', name: 'Costa Rica', code: 'CR', group: 'K'},
  {id: '37f1ee37-415c-4bee-a6cf-4f1d499a3427', name: 'Alemanha', code: 'DE', group: 'L'},
  {id: 'c4d2e274-b4c4-460b-b1e3-2d6aba37f8e4', name: 'Austrália', code: 'AU', group: 'L'},
  {id: 'a887a24a-1181-4830-a345-49be56e66945', name: 'Paraguai', code: 'PY', group: 'L'},
  {id: 'fae8c512-4006-4550-9f62-4dcc2f0ec37c', name: 'Jamaica', code: 'JM', group: 'L'},
];

let sql = '';

// Update teams group_letter
teams.forEach(t => {
  sql += `UPDATE teams SET group_letter = '${t.group}' WHERE id = '${t.id}';\n`;
});

// Delete old matches
sql += `DELETE FROM matches;\n`;

// Group matches
const startDate = new Date('2026-06-11T18:00:00Z');
let matchCount = 0;

const groups = 'ABCDEFGHIJKL'.split('');
groups.forEach((g, gIdx) => {
  const groupTeams = teams.filter(t => t.group === g);
  // Round robin for 4 teams: (1-2, 3-4), (1-3, 2-4), (1-4, 2-3)
  const pairings = [[0,1], [2,3], [0,2], [1,3], [0,3], [1,2]];
  pairings.forEach((p, pIdx) => {
    const kickoff = new Date(startDate);
    kickoff.setHours(startDate.getHours() + (matchCount * 4)); // Spread matches every 4 hours
    sql += `INSERT INTO matches (id, home_team_id, away_team_id, phase, kickoff_at, status) VALUES (gen_random_uuid(), '${groupTeams[p[0]].id}', '${groupTeams[p[1]].id}', 'group', '${kickoff.toISOString()}', 'scheduled');\n`;
    matchCount++;
  });
});

// Knockout matches (placeholders)
const koPhases = [
  {name: 'round_of_32', count: 16, labelPrefix: 'R32'},
  {name: 'round_of_16', count: 8, labelPrefix: 'R16'},
  {name: 'quarter', count: 4, labelPrefix: 'QF'},
  {name: 'semi', count: 2, labelPrefix: 'SF'},
  {name: 'third', count: 1, labelPrefix: '3RD'},
  {name: 'final', count: 1, labelPrefix: 'FINAL'},
];

koPhases.forEach(phase => {
  for(let i=1; i<=phase.count; i++) {
    const kickoff = new Date(startDate);
    kickoff.setHours(startDate.getHours() + (matchCount * 4));
    sql += `INSERT INTO matches (id, phase, kickoff_at, status, placeholder_label) VALUES (gen_random_uuid(), '${phase.name}', '${kickoff.toISOString()}', 'scheduled', '${phase.labelPrefix} Match ${i}');\n`;
    matchCount++;
  }
});

// Fix pool "Teste"
const brasilId = 'f65d15ae-d9c7-49e4-a589-372128bc56c9';
sql += `UPDATE pools SET scope_config = '{"team_id": "${brasilId}"}'::jsonb WHERE name = 'Teste';\n`;

console.log(sql);
