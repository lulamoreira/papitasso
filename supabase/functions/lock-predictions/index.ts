import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyCronSecret } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    verifyCronSecret(req);
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .lte('kickoff_at', new Date().toISOString())
      .is('status', 'scheduled')

    if (matchesError) throw matchesError

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ message: 'No matches to lock' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
