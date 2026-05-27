import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    const { user_id, team_id } = await req.json()

    if (!user_id || !team_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id or team_id' }), { status: 400 })
    }

    // Call DB function
    await supabase.rpc('award_card', { p_user_id: user_id, p_team_id: team_id })

    // Check for card-related achievements
    // We can call check-achievements here too or just return
    // To keep it simple, we return success and let the main flow handle checks
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
