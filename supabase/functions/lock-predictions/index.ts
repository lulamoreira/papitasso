import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    // 1. Get matches that just started (kickoff_at <= now) and aren't locked yet
    // In a real scenario, we might want to lock a few minutes before kickoff
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .lte('kickoff_at', new Date().toISOString())
      .is('status', 'scheduled') // Only lock scheduled matches

    if (matchesError) throw matchesError

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ message: 'No matches to lock' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Lock predictions for each match
    const lockedMatches = []
    for (const match of matches) {
      const { error: lockError } = await supabase.rpc('lock_predictions_for_match', { 
        p_match_id: match.id 
      })

      if (!lockError) {
        lockedMatches.push(match.id)
      }
    }

    return new Response(JSON.stringify({ locked: lockedMatches }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
