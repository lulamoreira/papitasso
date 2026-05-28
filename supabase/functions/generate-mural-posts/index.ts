import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyCronSecret } from '../_shared/auth.ts'

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    verifyCronSecret(req);

    const { data: pools, error: poolsError } = await supabase
      .from('pools')
      .select('id, name')
    
    if (poolsError) throw poolsError

    const postsCreated = []

    for (const pool of pools) {
      const { data: exactPredictions } = await supabase
        .from('predictions_exact')
        .select('*, user:profiles(name)')
        .eq('pool_id', pool.id)
        .not('points_awarded', 'is', null)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      if (exactPredictions && exactPredictions.length > 0) {
        for (const pred of exactPredictions) {
          if (pred.points_awarded >= 10) {
             const content = await generateZoeira(`${pred.user.name} acertou um placar exato e está se sentindo o próprio Profeta! 🔮`)
             await createMuralPost(pool.id, content, 'auto_zoeira', null, pred.user_id)
             postsCreated.push({ pool: pool.name, user: pred.user.name, type: 'exact' })
          }
        }
      }

      const { data: leaderboard } = await supabase
        .from('leaderboard_view')
        .select('*, user:profiles(name)')
        .eq('pool_id', pool.id)
        .eq('position', 1)
        .limit(1)
        .single()
      
      if (leaderboard) {
        const content = await generateZoeira(`${leaderboard.user.name} assumiu a liderança! Alguém para esse mito? 👑`)
        await createMuralPost(pool.id, content, 'auto_zoeira', null, leaderboard.user_id)
      }
    }

    return new Response(JSON.stringify({ message: 'Mural posts generated', created: postsCreated }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function createMuralPost(poolId: string, content: string, type: string, userId: string | null, targetUserId: string | null) {
  await supabase.from('mural_posts').insert({
    pool_id: poolId,
    content,
    type,
    user_id: userId,
    target_user_id: targetUserId
  })
}

async function generateZoeira(baseText: string) {
  if (!GROQ_API_KEY) return baseText

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: 'Você é um torcedor brasileiro brincalhão. Gere uma mensagem de zoeira amigável em português, tom de bar, máximo 100 caracteres. Use 1 emoji.'
        }, {
          role: 'user',
          content: `Reescreva de forma criativa: ${baseText}`
        }],
        temperature: 0.8,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq] error:', err);
      return baseText;
    }

    const data = await response.json()
    return data.choices[0].message.content || baseText
  } catch {
    return baseText
  }
}