import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push'

Deno.serve(async (req) => {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    
    return new Response(JSON.stringify(vapidKeys), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
