import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    const { data, error } = await supabase
      .from('predictions_exact')
      .update({ locked_at: new Date().toISOString() })
      .is('locked_at', null)
      .in('match_id', (
        await supabase
          .from('matches')
          .select('id')
          .lte('kickoff_at', new Date().toISOString())
      ).data?.map(m => m.id) || [])
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ locked: data?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
