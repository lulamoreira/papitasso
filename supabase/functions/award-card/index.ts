import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyUser } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    let userId: string;
    try { 
      userId = await verifyUser(req); 
    } catch (resp) { 
      if (resp instanceof Response) return resp;
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const { team_id } = await req.json()

    if (!team_id) {
      return new Response(JSON.stringify({ error: 'Missing team_id' }), { status: 400 })
    }

    // Call DB function
    await supabase.rpc('award_card', { p_user_id: userId, p_team_id: team_id })
    
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
