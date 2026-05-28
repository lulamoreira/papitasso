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
    const { pool_id } = await req.json()

    // 1. Get user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // 2. Get currently unlocked achievements for this user/pool
    const { data: unlocked } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    const unlockedIds = new Set(unlocked?.map(a => a.achievement_id))

    // 3. Get all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')

    const newUnlocks = []

    for (const ach of achievements || []) {
      if (unlockedIds.has(ach.id)) continue

      let isUnlocked = false

      switch (ach.code) {
        case 'profeta': {
          const { count } = await supabase
            .from('predictions_exact')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('points', 3)
          if (count && count >= 5) isUnlocked = true
          break
        }
        case 'super_profeta': {
          const { count } = await supabase
            .from('predictions_exact')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('points', 3)
          if (count && count >= 15) isUnlocked = true
          break
        }
        case 'bolheiro': {
          const { count } = await supabase
            .from('pools')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId)
          if (count && count >= 3) isUnlocked = true
          break
        }
        case 'influencer': {
          const { count } = await supabase
            .from('pool_members')
            .select('*', { count: 'exact', head: true })
            .eq('invited_by', userId)
          if (count && count >= 5) isUnlocked = true
          break
        }
        case 'coletor': {
          const { count } = await supabase
            .from('collected_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          if (count && count >= 10) isUnlocked = true
          break
        }
        case 'album_completo': {
          const { count } = await supabase
            .from('collected_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          if (count && count >= 48) isUnlocked = true
          break
        }
        case 'comentarista': {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          if (count && count >= 50) isUnlocked = true
          break
        }
        case 'lendario': {
          if (profile?.league_tier === 'lendario') isUnlocked = true
          break
        }
      }

      if (isUnlocked) {
        await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: ach.id,
          pool_id: pool_id || null
        })

        if (ach.xp_reward > 0) {
          await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: ach.xp_reward })
        }

        await supabase.from('notifications').insert({
          user_id: userId,
          title: '🏆 Conquista desbloqueada!',
          body: `Você desbloqueou: ${ach.name}`,
          type: 'achievement'
        })

        newUnlocks.push(ach)
      }
    }

    return new Response(JSON.stringify({ newUnlocks }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
