import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const apiKey = Deno.env.get('SPORTS_API_KEY')
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing SPORTS_API_KEY' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Get live or recently started matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .neq('status', 'finished')
      .lte('kickoff_at', new Date().toISOString())

    if (matchesError) throw matchesError

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ message: 'No active matches to update' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Fetch updates from API (Example for API-Football)
    // Note: In a real app, you'd filter by league/fixture ID
    const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    })
    
    const apiData = await response.json()
    const updatedMatches = []

    for (const match of matches) {
      // Find match in API response (logic depends on how you store external IDs)
      // For this implementation, we'll simulate an update if found
      const apiMatch = apiData.response?.find((f: any) => 
        f.teams.home.name.includes(match.home_team_id) || // This is just a placeholder logic
        f.teams.away.name.includes(match.away_team_id)
      )

      if (apiMatch) {
        const home_score = apiMatch.goals.home
        const away_score = apiMatch.goals.away
        const status = apiMatch.fixture.status.short === 'FT' ? 'finished' : 'live'

        const { error: updateError } = await supabase
          .from('matches')
          .update({ home_score, away_score, status })
          .eq('id', match.id)

        if (!updateError) {
          updatedMatches.push(match.id)
          
          if (status === 'finished') {
            // Trigger point awarding
            await supabase.rpc('award_points_for_match', { p_match_id: match.id })
          }
        }
      }
    }

    return new Response(JSON.stringify({ updated: updatedMatches }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
