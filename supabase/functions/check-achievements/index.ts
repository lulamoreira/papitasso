import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  try {
    const { user_id, pool_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 })
    }

    // 1. Get user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    // 2. Get currently unlocked achievements for this user/pool
    const { data: unlocked } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user_id)

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
            .eq('user_id', user_id)
            .eq('points', 3)
          if (count && count >= 5) isUnlocked = true
          break
        }
        case 'super_profeta': {
          const { count } = await supabase
            .from('predictions_exact')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('points', 3)
          if (count && count >= 15) isUnlocked = true
          break
        }
        case 'bolheiro': {
          const { count } = await supabase
            .from('pools')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user_id)
          if (count && count >= 3) isUnlocked = true
          break
        }
        case 'influencer': {
          const { count } = await supabase
            .from('pool_members')
            .select('*', { count: 'exact', head: true })
            .eq('invited_by', user_id)
          if (count && count >= 5) isUnlocked = true
          break
        }
        case 'coletor': {
          const { count } = await supabase
            .from('collected_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
          if (count && count >= 10) isUnlocked = true
          break
        }
        case 'album_completo': {
          const { count } = await supabase
            .from('collected_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
          if (count && count >= 48) isUnlocked = true
          break
        }
        case 'comentarista': {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
          if (count && count >= 50) isUnlocked = true
          break
        }
        case 'lendario': {
          if (profile?.league_tier === 'lendario') isUnlocked = true
          break
        }
        case 'patriota': {
          // Logic: Check if user has exact predictions for all Brazil matches in group stage
          // This would require a join or specific query logic
          break
        }
        case 'zebra': {
          // Logic: Check for predictions where points > 0 and odds were high
          break
        }
        case 'maracana': {
          // Logic: Check leaderboard position 1 in group stage
          break
        }
        case 'final_de_copa': {
          // Logic: Check bracket prediction
          break
        }
        case 'campeao_certo': {
          // Logic: Check bracket prediction
          break
        }
        case 'consistente': {
          // Logic: Check prediction count vs total matches
          break
        }
        case 'veterano': {
          // Logic: Check account age
          break
        }
        case 'streak_7': {
          // Logic: Check streak column in stats
          break
        }
        case 'streak_15': {
          // Logic: Check streak column in stats
          break
        }
        case 'artilheiro_predict': {
          // Logic: Check props prediction
          break
        }
        case 'pe_frio': {
          // Logic: Check streak of 0 points
          break
        }
        case 'madrugador': {
          // Logic: Check prediction timestamps
          break
        }
      }

      if (isUnlocked) {
        // Unlock achievement
        await supabase.from('user_achievements').insert({
          user_id,
          achievement_id: ach.id,
          pool_id: pool_id || null
        })

        // Award XP
        if (ach.xp_reward > 0) {
          await supabase.rpc('increment_xp', { p_user_id: user_id, p_amount: ach.xp_reward })
        }

        // Notify user
        await supabase.from('notifications').insert({
          user_id,
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
