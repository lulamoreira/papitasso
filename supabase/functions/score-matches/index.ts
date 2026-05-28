import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyCronSecret } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  
  try {
    verifyCronSecret(req);
  } catch (resp) {
    return resp as Response;
  }

  const apiKey = Deno.env.get('SPORTS_API_KEY')
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing SPORTS_API_KEY' }), { status: 400 })

  try {
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000).toISOString()
    const threeHoursFromNow = new Date(now.getTime() + 3 * 3600 * 1000).toISOString()
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, external_api_id, status')
      .neq('status', 'finished')
      .not('external_api_id', 'is', null)
      .gte('kickoff_at', threeHoursAgo)
      .lte('kickoff_at', threeHoursFromNow)

    if (error) throw error
    if (!matches?.length) return new Response(JSON.stringify({ message: 'No active matches' }))

    const fixtureIds = matches.map(m => m.external_api_id).join('-')
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?ids=${fixtureIds}`,
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    )
    const apiData = await response.json()
    const updated = []

    for (const match of matches) {
      const apiMatch = apiData.response?.find((f: any) => String(f.fixture.id) === match.external_api_id)
      if (!apiMatch) continue

      const home_score = apiMatch.goals.home
      const away_score = apiMatch.goals.away
      const status = apiMatch.fixture.status.short === 'FT' ? 'finished' : 'live'

      const { error: updateError } = await supabase
        .from('matches')
        .update({ home_score, away_score, status })
        .eq('id', match.id)

      if (!updateError) {
        updated.push(match.id)
        if (status === 'finished') {
          await supabase.rpc('award_points_for_match', { p_match_id: match.id })
        }
      }
    }

    return new Response(JSON.stringify({ updated }))
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
