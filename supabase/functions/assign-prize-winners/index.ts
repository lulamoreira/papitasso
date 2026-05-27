import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Fetch pools that have prizes but no winners yet
    const { data: pools, error: poolsError } = await supabase
      .from("pools")
      .select("*, prizes(*)")
      .not("prizes", "is", null);

    if (poolsError) throw poolsError;

    const results = [];

    for (const pool of pools) {
      // Check if all matches for this pool are finished
      const { data: poolMatches, error: matchesError } = await supabase.rpc('matches_for_pool', { p_pool_id: pool.id });
      if (matchesError) continue;

      const unfinished = poolMatches.filter((m: any) => m.status !== 'finished');
      if (unfinished.length > 0) continue; // Not finished yet

      // Check if winners already assigned
      const { data: existingWinners, error: winnersCheckError } = await supabase
        .from("prize_winners")
        .select("id")
        .eq("prize_id", pool.prizes[0].id)
        .limit(1);
      
      if (winnersCheckError || (existingWinners && existingWinners.length > 0)) continue;

      // 2. Calculate winners for each prize
      const { data: leaderboard, error: lbError } = await supabase
        .from("leaderboard_view")
        .select("*")
        .eq("pool_id", pool.id)
        .order("position", { ascending: true });

      if (lbError) continue;

      for (const prize of pool.prizes) {
        let winnerId = null;

        if (prize.category === 'ranking') {
          winnerId = leaderboard.find((entry: any) => entry.position === prize.rank)?.user_id;
        } else if (prize.category === 'wooden_spoon') {
          winnerId = leaderboard[leaderboard.length - 1]?.user_id;
        } else if (prize.category === 'raffle') {
          // Random among those who predicted in all games
          const { data: participants } = await supabase
            .from("predictions_exact")
            .select("user_id, count(id)")
            .eq("pool_id", pool.id)
            .group("user_id")
            .having(`count(id) = ${poolMatches.length}`);
          
          if (participants && participants.length > 0) {
            winnerId = participants[Math.floor(Math.random() * participants.length)].user_id;
          }
        } else if (prize.category === 'most_exact') {
           // Fetch prediction stats
           const { data: topExacts } = await supabase
            .from("predictions_exact")
            .select("user_id, count(id)")
            .eq("pool_id", pool.id)
            .eq("points_awarded", pool.scoring_config.exact)
            .group("user_id")
            .order("count", { ascending: false })
            .limit(1);
          
          winnerId = topExacts?.[0]?.user_id;
        } else if (prize.category === 'most_brazil_correct') {
          // Find Brazil team ID
          const { data: brazil } = await supabase.from("teams").select("id").eq("name", "Brasil").single();
          if (brazil) {
            const { data: topBrazil } = await supabase
              .from("predictions_exact")
              .select("user_id, count(id)")
              .eq("pool_id", pool.id)
              .gt("points_awarded", 0)
              .or(`match_id.in.(select id from matches where home_team_id = '${brazil.id}' or away_team_id = '${brazil.id}')`)
              .group("user_id")
              .order("count", { ascending: false })
              .limit(1);
            winnerId = topBrazil?.[0]?.user_id;
          }
        } else if (prize.category === 'phase_leader') {
          const phase = prize.custom_rule_jsonb?.phase;
          if (phase) {
            const { data: phaseLeader } = await supabase
              .from("predictions_exact")
              .select("user_id, sum(points_awarded)")
              .eq("pool_id", pool.id)
              .filter("match.phase", "eq", phase) // This requires a join or subquery, easier to use a custom view or complex query
              .group("user_id")
              .order("sum", { ascending: false })
              .limit(1);
            winnerId = phaseLeader?.[0]?.user_id;
          }
        }

        if (winnerId) {
          await supabase.from("prize_winners").insert({
            prize_id: prize.id,
            user_id: winnerId,
            status: 'pending'
          });

          // 3. Notify (Push logic would go here)
          console.log(`Assigned winner ${winnerId} for prize ${prize.title} in pool ${pool.name}`);
          
          // Add to notifications table
          await supabase.from("notifications").insert({
            user_id: winnerId,
            title: "🎉 Você ganhou um prêmio!",
            body: `Parabéns! Você ganhou: ${prize.title}. Veja como resgatar no Bolão.`,
            type: 'prize_won',
            data: { pool_id: pool.id, prize_id: prize.id }
          });
        }
      }
      
      // Notify owner
      await supabase.from("notifications").insert({
        user_id: pool.owner_id,
        title: "🏆 Ganhadores definidos",
        body: `A lista de ganhadores do bolão ${pool.name} está pronta.`,
        type: 'winners_ready',
        data: { pool_id: pool.id }
      });

      results.push({ pool_id: pool.id, status: 'calculated' });
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
