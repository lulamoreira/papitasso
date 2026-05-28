import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyCronSecret } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    verifyCronSecret(req);
    
    const wcStartDate = new Date('2026-06-11T00:00:00Z');
    
    if (new Date() < wcStartDate) {
      return new Response(JSON.stringify({ message: 'World Cup has not started yet. No props to lock.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error } = await supabase
      .from('predictions_props')
      .update({ locked_at: new Date().toISOString() })
      .is('locked_at', null);

    if (error) throw error;

    return new Response(JSON.stringify({ message: 'All props locked successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
