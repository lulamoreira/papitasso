import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyCronSecret } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    verifyCronSecret(req);
    const { match_id } = await req.json();

    const { data: stats } = await supabase
      .from("player_match_stats")
      .select("*, player:players(*)")
      .eq("match_id", match_id);

    if (!stats) return new Response("No stats found", { status: 404 });

    const config = {
      min_60: 1, plus_60: 2, goal_gk_def: 6, goal_mid: 5, goal_fwd: 4, assist: 3,
      clean_sheet_gk_def: 4, clean_sheet_mid: 1, saves_3: 1, penalty_saved: 5,
      penalty_missed: -2, yellow_card: -1, red_card: -3, own_goal: -2, outside_box_bonus: 1
    };

    for (const s of stats) {
      let points = 0;
      if (s.minutes_played >= 60) points += config.plus_60;
      else if (s.minutes_played > 0) points += config.min_60;

      const pos = s.player.position;
      if (pos === 'GK' || pos === 'DEF') {
        points += s.goals * config.goal_gk_def;
        if (s.clean_sheet && s.minutes_played >= 60) points += config.clean_sheet_gk_def;
      } else if (pos === 'MID') {
        points += s.goals * config.goal_mid;
        if (s.clean_sheet && s.minutes_played >= 60) points += config.clean_sheet_mid;
      } else {
        points += s.goals * config.goal_fwd;
      }

      points += s.assists * config.assist;
      points += s.yellow_cards * config.yellow_card;
      points += s.red_cards * config.red_card;
      points += s.own_goals * config.own_goal;
      points += s.penalties_saved * config.penalty_saved;
      points += s.penalties_missed * config.penalty_missed;
      points += Math.floor(s.saves / 3) * config.saves_3;
      points += s.bonus_points;

      await supabase
        .from("player_match_stats")
        .update({ total_points: points })
        .eq("id", s.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
});
