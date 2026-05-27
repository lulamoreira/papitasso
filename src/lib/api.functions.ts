import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*, favorite_team:teams(*)")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const data = rawData?.data || rawData;
    const validated = z.object({
      name: z.string().min(1).optional(),
      favorite_team_id: z.string().uuid().optional(),
      avatar_url: z.string().url().optional(),
    }).parse(data);

    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(validated)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const getTeams = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("teams")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  });

export const getNextMatch = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .gte("kickoff_at", new Date().toISOString())
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  });

export const createPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const data = rawData?.data || rawData;
    const validated = z.object({
      name: z.string().min(3),
      type: z.enum(['simple', 'advanced']),
      scope_type: z.string(),
      scope_config: z.any().optional(),
      scoring_config: z.any(),
      modes_enabled: z.array(z.string()).optional(),
    }).parse(data);

    const { supabase, userId } = context;
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .insert({
        name: validated.name,
        type: validated.type,
        scope_type: validated.scope_type,
        scope_config: validated.scope_config,
        scoring_config: validated.scoring_config,
        modes_enabled: validated.modes_enabled,
        invite_code,
        owner_id: userId
      })
      .select()
      .single();

    if (poolError) throw poolError;

    const { error: memberError } = await supabase
      .from("pool_members")
      .insert({
        pool_id: pool.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) throw memberError;

    return pool;
  });

export const getMyPools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pool_members")
      .select("pool_id, pools(*)")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data.map((item: any) => item.pools);
  });

export const getPoolById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const id = rawData?.data || rawData;
    const { supabase } = context;
    const { data, error } = await supabase
      .from("pools")
      .select("*, owner:profiles(*)")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  });

export const getPoolByInviteCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const code = rawData?.data || rawData;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pools")
      .select("*, owner:profiles(*)")
      .eq("invite_code", code.toUpperCase())
      .single();
    
    if (error) throw error;
    return data;
  });

export const joinPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const code = rawData?.data || rawData;
    const { supabase, userId } = context;
    
    // First find pool
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .single();
    
    if (poolError) throw poolError;

    const { error: memberError } = await supabase
      .from("pool_members")
      .insert({
        pool_id: pool.id,
        user_id: userId,
        role: 'member'
      });
    
    if (memberError) {
      if (memberError.code === '23505') return { pool_id: pool.id }; // Already a member
      throw memberError;
    }
    
    return { pool_id: pool.id };
  });

export const getMatchesForPool = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc('matches_for_pool', { p_pool_id: poolId });
    if (error) throw error;

    // Fetch team flags/names too
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .in("id", data.map((m: any) => m.id))
      .order("kickoff_at", { ascending: true });
    
    if (matchesError) throw matchesError;
    return matches;
  });

export const upsertPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, matchId, homeScore, awayScore } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("predictions_exact")
      .upsert({
        user_id: userId,
        pool_id: poolId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pool_id,match_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const getPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("predictions_exact")
      .select("*")
      .eq("pool_id", poolId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("leaderboard_view")
      .select("*, profile:profiles(*)")
      .eq("pool_id", poolId)
      .order("position", { ascending: true });
    
    if (error) throw error;
    return data;
  });

export const getPrizes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("prizes")
      .select("*")
      .eq("pool_id", poolId)
      .order("position_order", { ascending: true });
    
    if (error) throw error;
    return data;
  });

export const upsertPrize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const data = rawData?.data || rawData;
    const { supabase } = context;
    const { data: result, error } = await supabase
      .from("prizes")
      .upsert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  });

export const deletePrize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: prizeId, context }: any) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("prizes")
      .delete()
      .eq("id", prizeId);
    
    if (error) throw error;
    return { success: true };
  });

export const getPrizeWinners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("prize_winners")
      .select("*, prize:prizes(*), profile:profiles(*)")
      .filter("prize.pool_id", "eq", poolId);
    
    if (error) throw error;
    return data;
  });

export const updateWinnerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { winnerId, status, delivery_proof_url, notes } = rawData?.data || rawData;
    const { supabase } = context;
    const { data, error } = await supabase
      .from("prize_winners")
      .update({
        status,
        delivery_proof_url,
        notes,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null
      })
      .eq("id", winnerId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });

export const upsertPickemPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, matchId, winner } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("predictions_pickem")
      .upsert({
        user_id: userId,
        pool_id: poolId,
        match_id: matchId,
        winner,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pool_id,match_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const getPickemPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("predictions_pickem")
      .select("*")
      .eq("pool_id", poolId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const getSurvivorRounds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("survivor_rounds")
      .select("*")
      .eq("pool_id", poolId)
      .order("round_number", { ascending: true });
    
    if (error) throw error;
    return data;
  });

export const upsertSurvivorPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, roundNumber, teamId } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("predictions_survivor")
      .upsert({
        user_id: userId,
        pool_id: poolId,
        round_number: roundNumber,
        team_id: teamId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pool_id,round_number' })
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const getSurvivorPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("predictions_survivor")
      .select("*, team:teams(*)")
      .eq("pool_id", poolId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const upsertBracketPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, bracketJson } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("predictions_bracket")
      .upsert({
        user_id: userId,
        pool_id: poolId,
        bracket_json: bracketJson,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pool_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const getBracketPrediction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("predictions_bracket")
      .select("*")
      .eq("pool_id", poolId)
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  });
