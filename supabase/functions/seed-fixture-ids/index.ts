import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async () => {
  const apiKey = Deno.env.get('SPORTS_API_KEY')
  if (!apiKey) return new Response('Missing SPORTS_API_KEY', { status: 400 })

  try {
    const teamsResp = await fetch(
      'https://v3.football.api-sports.io/teams?league=1&season=2026',
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    )
    const teamsData = await teamsResp.json()
    let teamsLinked = 0
    for (const t of (teamsData.response || [])) {
      const { error } = await supabase.from('teams')
        .update({ external_api_id: String(t.team.id) })
        .ilike('name', t.team.name)
      if (!error) teamsLinked++
    }

    const fixturesResp = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    )
    const fixturesData = await fixturesResp.json()
    let matchesLinked = 0
    for (const f of (fixturesData.response || [])) {
      const { data: home } = await supabase.from('teams').select('id').eq('external_api_id', String(f.teams.home.id)).single()
      const { data: away } = await supabase.from('teams').select('id').eq('external_api_id', String(f.teams.away.id)).single()
      if (!home || !away) continue
      const { error } = await supabase.from('matches')
        .update({ external_api_id: String(f.fixture.id) })
        .eq('home_team_id', home.id).eq('away_team_id', away.id)
      if (!error) matchesLinked++
    }

    return new Response(JSON.stringify({ teamsLinked, matchesLinked }))
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
