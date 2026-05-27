import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // This function would be called after a gameweek ends
  const { pool_id, gameweek } = await req.json();

  const { data: lineups } = await supabase
    .from("fantasy_lineups")
    .select("user_id, total_points")
    .eq("pool_id", pool_id)
    .eq("gameweek", gameweek);

  if (!lineups) return new Response("No lineups", { status: 404 });

  for (const lineup of lineups) {
    const xpGain = Math.floor(lineup.total_points / 10);
    if (xpGain > 0) {
      await supabase.rpc('increment_xp', { 
        p_user_id: lineup.user_id, 
        p_amount: xpGain 
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
