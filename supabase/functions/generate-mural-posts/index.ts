import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    // 1. Fetch pools that have been active recently
    const { data: pools, error: poolsError } = await supabase
      .from('pools')
      .select('id, name')
    
    if (poolsError) throw poolsError

    const postsCreated = []

    for (const pool of pools) {
      // Logic for different zoeiras
      
      // A. Exact scores today
      const { data: exactPredictions, error: predError } = await supabase
        .from('predictions_exact')
        .select('*, user:profiles(name)')
        .eq('pool_id', pool.id)
        .not('points_awarded', 'is', null)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      if (exactPredictions && exactPredictions.length > 0) {
        // Filter for truly exact scores (max points)
        // Note: score config varies, but we assume > 0 points means something happened
        for (const pred of exactPredictions) {
          if (pred.points_awarded >= 10) { // Assuming 10+ is an exact score
             const content = await generateZoeira(`${pred.user.name} acertou um placar exato e está se sentindo o próprio Profeta! 🔮`)
             await createMuralPost(pool.id, content, 'auto_zoeira', null, pred.user_id)
             postsCreated.push({ pool: pool.name, user: pred.user.name, type: 'exact' })
          }
        }
      }

      // B. Leaderboard changes
      const { data: leaderboard, error: lbError } = await supabase
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
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!lovableApiKey) return baseText

  try {
    const response = await fetch('https://api.lovable.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemini-1.5-pro',
        messages: [{
          role: 'system',
          content: 'Você é um torcedor brasileiro brincalhão. Gere uma mensagem de zoeira amigável em português, tom de bar, máximo 100 caracteres. Use 1 emoji.'
        }, {
          role: 'user',
          content: `Reescreva de forma criativa: ${baseText}`
        }]
      })
    })
    const data = await response.json()
    return data.choices[0].message.content || baseText
  } catch {
    return baseText
  }
}
