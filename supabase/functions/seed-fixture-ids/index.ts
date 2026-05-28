import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const TEAMS: Record<string, { pt: string; code: string }> = {
  'Mexico': { pt: 'México', code: 'MEX' },
  'South Africa': { pt: 'África do Sul', code: 'RSA' },
  'South Korea': { pt: 'Coreia do Sul', code: 'KOR' },
  'Korea Republic': { pt: 'Coreia do Sul', code: 'KOR' },
  'Czech Republic': { pt: 'República Tcheca', code: 'CZE' },
  'Czechia': { pt: 'República Tcheca', code: 'CZE' },
  'Canada': { pt: 'Canadá', code: 'CAN' },
  'Bosnia and Herzegovina': { pt: 'Bósnia e Herzegovina', code: 'BIH' },
  'Qatar': { pt: 'Catar', code: 'QAT' },
  'Switzerland': { pt: 'Suíça', code: 'SUI' },
  'Brazil': { pt: 'Brasil', code: 'BRA' },
  'Morocco': { pt: 'Marrocos', code: 'MAR' },
  'Haiti': { pt: 'Haiti', code: 'HAI' },
  'Scotland': { pt: 'Escócia', code: 'SCO' },
  'United States': { pt: 'EUA', code: 'USA' },
  'USA': { pt: 'EUA', code: 'USA' },
  'Paraguay': { pt: 'Paraguai', code: 'PAR' },
  'Australia': { pt: 'Austrália', code: 'AUS' },
  'Turkey': { pt: 'Turquia', code: 'TUR' },
  'Türkiye': { pt: 'Turquia', code: 'TUR' },
  'Germany': { pt: 'Alemanha', code: 'GER' },
  'Curacao': { pt: 'Curaçao', code: 'CUW' },
  'Curaçao': { pt: 'Curaçao', code: 'CUW' },
  'Ivory Coast': { pt: 'Costa do Marfim', code: 'CIV' },
  "Côte d'Ivoire": { pt: 'Costa do Marfim', code: 'CIV' },
  'Ecuador': { pt: 'Equador', code: 'ECU' },
  'Netherlands': { pt: 'Holanda', code: 'NED' },
  'Japan': { pt: 'Japão', code: 'JPN' },
  'Sweden': { pt: 'Suécia', code: 'SWE' },
  'Tunisia': { pt: 'Tunísia', code: 'TUN' },
  'Belgium': { pt: 'Bélgica', code: 'BEL' },
  'Egypt': { pt: 'Egito', code: 'EGY' },
  'Iran': { pt: 'Irã', code: 'IRN' },
  'IR Iran': { pt: 'Irã', code: 'IRN' },
  'New Zealand': { pt: 'Nova Zelândia', code: 'NZL' },
  'Spain': { pt: 'Espanha', code: 'ESP' },
  'Cape Verde': { pt: 'Cabo Verde', code: 'CPV' },
  'Cabo Verde': { pt: 'Cabo Verde', code: 'CPV' },
  'Saudi Arabia': { pt: 'Arábia Saudita', code: 'KSA' },
  'Uruguay': { pt: 'Uruguai', code: 'URU' },
  'France': { pt: 'França', code: 'FRA' },
  'Senegal': { pt: 'Senegal', code: 'SEN' },
  'Iraq': { pt: 'Iraque', code: 'IRQ' },
  'Norway': { pt: 'Noruega', code: 'NOR' },
  'Argentina': { pt: 'Argentina', code: 'ARG' },
  'Algeria': { pt: 'Argélia', code: 'ALG' },
  'Austria': { pt: 'Áustria', code: 'AUT' },
  'Jordan': { pt: 'Jordânia', code: 'JOR' },
  'Portugal': { pt: 'Portugal', code: 'POR' },
  'DR Congo': { pt: 'República Democrática do Congo', code: 'COD' },
  'Congo DR': { pt: 'República Democrática do Congo', code: 'COD' },
  'Uzbekistan': { pt: 'Uzbequistão', code: 'UZB' },
  'Colombia': { pt: 'Colômbia', code: 'COL' },
  'England': { pt: 'Inglaterra', code: 'ENG' },
  'Croatia': { pt: 'Croácia', code: 'CRO' },
  'Ghana': { pt: 'Gana', code: 'GHA' },
  'Panama': { pt: 'Panamá', code: 'PAN' },
};

const CITY_PT: Record<string, string> = {
  'Mexico City': 'Cidade do México', 'Philadelphia': 'Filadélfia',
};

function mapPhase(round: string): string {
  if (round.includes('Round of 16')) return 'round_of_16';
  if (round.includes('Round of 32')) return 'round_of_32';
  if (round.includes('Quarter')) return 'quarter';
  if (round.includes('Semi')) return 'semi';
  if (round.includes('3rd Place') || round.includes('Third')) return 'third';
  if (round.includes('Final')) return 'final';
  return 'group';
}

Deno.serve(async (req) => {
  const apiKey = Deno.env.get('SPORTS_API_KEY')
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing SPORTS_API_KEY' }), { status: 400 })
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' }

  try {
    const tResp = await fetch('https://v3.football.api-sports.io/teams?league=1&season=2026', { headers })
    const tData = await tResp.json()
    let teamsUpserted = 0
    const unmapped: string[] = []

    for (const t of (tData.response || [])) {
      const mapped = TEAMS[t.team.name]
      if (!mapped) { unmapped.push(t.team.name); continue }
      const { error } = await supabase.from('teams').upsert({
        code: mapped.code,
        name: mapped.pt,
        flag_url: t.team.logo,
        external_api_id: String(t.team.id),
      }, { onConflict: 'code' })
      if (!error) teamsUpserted++
    }

    const fResp = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', { headers })
    const fData = await fResp.json()
    let matchesUpserted = 0

    for (const f of (fData.response || [])) {
      const { data: home } = await supabase.from('teams').select('id').eq('external_api_id', String(f.teams.home.id)).maybeSingle()
      const { data: away } = await supabase.from('teams').select('id').eq('external_api_id', String(f.teams.away.id)).maybeSingle()

      let venueId = null
      const vName = f.fixture.venue?.name
      if (vName) {
        const { data: v } = await supabase.from('venues').select('id').ilike('name', `%${vName.split('-')[0].trim()}%`).maybeSingle()
        venueId = v?.id ?? null
      }

      const { error } = await supabase.from('matches').upsert({
        external_api_id: String(f.fixture.id),
        home_team_id: home?.id ?? null,
        away_team_id: away?.id ?? null,
        kickoff_at: f.fixture.date,
        stadium: vName,
        venue_id: venueId,
        city: CITY_PT[f.fixture.venue?.city] ?? f.fixture.venue?.city,
        phase: mapPhase(f.league.round || ''),
        status: f.fixture.status?.short === 'FT' ? 'finished' : 'scheduled',
        home_score: f.goals?.home ?? null,
        away_score: f.goals?.away ?? null,
      }, { onConflict: 'external_api_id' })
      if (!error) matchesUpserted++
    }

    return new Response(JSON.stringify({ teamsUpserted, matchesUpserted, unmapped }))
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})