import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyUser } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    let userId: string;
    try { 
      userId = await verifyUser(req); 
    } catch (resp) { 
      if (resp instanceof Response) return resp;
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const { pool_id, gameweek } = await req.json();

    const { data: lineup } = await supabase
      .from("fantasy_lineups")
      .select("total_points")
      .eq("user_id", userId)
      .eq("pool_id", pool_id)
      .eq("gameweek", gameweek)
      .single();

    if (!lineup) return new Response("No lineup found", { status: 404 });

    const xpGain = Math.floor(lineup.total_points / 10);
    if (xpGain > 0) {
      await supabase.rpc('increment_xp', { 
        p_user_id: userId, 
        p_amount: xpGain 
      });
    }

    return new Response(JSON.stringify({ success: true, xp_gained: xpGain }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
});
