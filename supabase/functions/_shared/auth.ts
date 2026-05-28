import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function verifyUser(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, headers: { 'Content-Type': 'application/json' } 
    })
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 401, headers: { 'Content-Type': 'application/json' } 
    })
  }
  return user.id
}

export function verifyCronSecret(req: Request): void {
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret) return // se não configurado, skip (modo desenvolvimento)
  const provided = req.headers.get('x-cron-secret')
  if (provided !== secret) {
    throw new Response('Forbidden', { status: 403 })
  }
}
