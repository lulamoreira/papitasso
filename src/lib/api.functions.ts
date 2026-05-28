import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    console.log('[DEBUG]', 'getProfile', { context_keys: Object.keys(context) });
    const { supabase, userId, claims } = context;
    let { data, error } = await supabase
      .from("profiles")
      .select("*, favorite_team:teams!profiles_favorite_team_id_fkey(*)")
      .eq("id", userId)
      .maybeSingle();

    console.log('[DEBUG] getProfile initial query:', { data, error });

    if (error) throw error;

    // Se profile não existe, cria um vazio e retorna
    if (!data) {
      console.log('[DEBUG] Profile not found, creating one...');
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .upsert({ 
          id: userId, 
          name: claims?.user_metadata?.full_name || claims?.user_metadata?.name || claims?.email || 'Torcedor',
          avatar_url: claims?.user_metadata?.avatar_url || null
        }, { onConflict: 'id' })
        .select("*, favorite_team:teams!profiles_favorite_team_id_fkey(*)")
        .single();
      
      console.log('[DEBUG] Profile creation result:', { created, createError });
      if (createError) throw createError;
      data = created;
    }

    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    console.log('[DEBUG]', 'updateProfile', { context_keys: Object.keys(context) });
    const data = rawData?.data || rawData;
    const validated = z.object({
      name: z.string().min(1).optional(),
      favorite_team_id: z.string().uuid().optional(),
      avatar_url: z.string().url().optional(),
    }).parse(data);

    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...validated }, { onConflict: 'id' })
      .select()
      .single();

    console.log('[DEBUG] updateProfile result:', { data: updated, error });

    if (error) throw error;
    return updated;
  });

export const getTeams = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log('[DEBUG]', 'getTeams');
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("teams")
      .select("*")
      .order("name");
    
    console.log('[DEBUG] query result:', { data, error, count: Array.isArray(data) ? data.length : 'not-array' });
    
    if (error) throw error;
    return data || [];
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
      .maybeSingle();
    
    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    
    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  });

async function generateUniqueInviteCode(supabase: any): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = Array.from({length: 7}, () => 
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');
    const { data } = await supabase.from('pools').select('id').eq('invite_code', candidate).maybeSingle();
    if (!data) return candidate;
  }
  throw new Error('Não foi possível gerar invite code único');
}

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
      prizes: z.array(z.object({
        rank: z.number().optional(),
        category: z.enum(['ranking', 'most_exact', 'most_brazil_correct', 'phase_leader', 'wooden_spoon', 'raffle', 'custom']),
        title: z.string(),
        description: z.string().optional(),
        photo_url: z.string().optional(),
        estimated_value_cents: z.number().optional(),
        sponsor: z.string().optional(),
        delivery_method: z.string().optional(),
        position_order: z.number().optional(),
      })).optional(),
    }).parse(data);

    const { supabase, userId } = context;
    const invite_code = await generateUniqueInviteCode(supabase);
    
    const { data: pool, error: poolError } = await supabase.rpc('create_pool_with_owner', {
      p_name: validated.name,
      p_type: validated.type,
      p_scope_type: validated.scope_type,
      p_scope_config: validated.scope_config,
      p_scoring_config: validated.scoring_config,
      p_modes_enabled: validated.modes_enabled,
      p_invite_code: invite_code
    }).maybeSingle();

    console.log('[DEBUG] query result:', { data: pool, error: poolError, count: pool ? 1 : 0 });

    if (poolError) throw poolError;
    if (!pool) throw new Error('Falha ao criar bolão');

    if (validated.prizes && validated.prizes.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      
      const prizesToInsert = validated.prizes.map((p, idx) => ({
        ...p,
        pool_id: pool.id,
        position_order: p.position_order ?? idx,
      }));

      const { error: prizesError } = await supabaseAdmin
        .from('prizes')
        .insert(prizesToInsert);
      
      if (prizesError) {
        console.error('Falha ao inserir prêmios:', prizesError);
      }
    }

    return pool;
  });

export const getMyPools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pool_members")
      .select("pool_id, pools!pool_members_pool_id_fkey(*)")
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
      .select("*, owner:profiles!pools_owner_id_fkey(*)")
      .eq("id", id)
      .maybeSingle();
    
    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
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
      .select("*, owner:profiles!pools_owner_id_fkey(*)")
      .eq("invite_code", code.toUpperCase())
      .maybeSingle();
    
    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    return data;
  });

export const joinPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { code, invitedBy } = rawData?.data || rawData;
    const { supabase, userId } = context;
    
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .maybeSingle();
    
    if (poolError) throw poolError;
    if (!pool) throw new Error("Bolão não encontrado");

    const { error: memberError } = await supabase
      .from("pool_members")
      .insert({
        pool_id: pool.id,
        user_id: userId,
        role: 'member',
        invited_by: invitedBy
      });
    
    if (memberError) {
      if (memberError.code === '23505') return { pool_id: pool.id };
      throw memberError;
    }

    if (invitedBy && invitedBy !== userId) {
      await supabase.rpc('increment_xp', { p_user_id: invitedBy, p_amount: 50 });
    }
    
    return { pool_id: pool.id };
  });

export const getMatchesForPool = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc('matches_for_pool', { p_pool_id: poolId });
    if (error) throw error;

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), venue:venues(name, city, state, country, image_url)")
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

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("kickoff_at")
      .eq("id", matchId)
      .maybeSingle();
    
    if (matchError) throw matchError;
    if (!match) throw new Error("Partida não encontrada");
    if (new Date(match.kickoff_at) <= new Date()) {
      throw new Error("Match already started. Predictions are locked.");
    }

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
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });

    if (error) throw error;
    if (!data) throw new Error('Não foi possível salvar palpite');

    await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: 5 });

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
    
    const { data: lb, error } = await supabase
      .from("leaderboard_view")
      .select("*")
      .eq("pool_id", poolId)
      .order("position", { ascending: true });

    if (error) throw error;
    if (!lb || lb.length === 0) return [];

    const userIds = lb.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, xp, league_tier")
      .in("id", userIds);

    return lb.map((row: any) => ({
      ...row,
      profile: profiles?.find((p: any) => p.id === row.user_id) ?? null,
    }));
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
      .maybeSingle();
    
    console.log('[DEBUG] query result:', { data: result, error, count: result ? 1 : 0 });
    if (error) throw error;
    if (!result) throw new Error('Não foi possível salvar prêmio');
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
      .select("*, prize:prizes!prize_winners_prize_id_fkey(*), profile:profiles!prize_winners_user_id_fkey(*)")
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
      .maybeSingle();
    
    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível atualizar status do ganhador');
    return data;
  });

export const upsertPickemPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, matchId, winner } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("kickoff_at")
      .eq("id", matchId)
      .maybeSingle();
    
    if (matchError) throw matchError;
    if (!match) throw new Error("Partida não encontrada");
    if (new Date(match.kickoff_at) <= new Date()) {
      throw new Error("Match already started. Predictions are locked.");
    }

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
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível salvar palpite Pickem');
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

    const { data: round, error: roundError } = await supabase
      .from("survivor_rounds")
      .select("is_locked")
      .eq("pool_id", poolId)
      .eq("round_number", roundNumber)
      .maybeSingle();
    
    if (roundError) throw roundError;
    if (!round) throw new Error("Rodada não encontrada");
    if (round.is_locked) {
      throw new Error("Round is locked.");
    }

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
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível salvar palpite Survivor');
    return data;
  });

export const getSurvivorPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("predictions_survivor")
      .select("*, team:teams!predictions_survivor_team_id_fkey(*)")
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
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível salvar palpite Bracket');
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

export const getProps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("props")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return data;
  });

export const getPredictionsProps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("predictions_props")
      .select("*")
      .eq("pool_id", poolId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const getAchievementById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: id, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("achievements")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const getDailyQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase.functions.invoke('ai-daily-quiz');
    if (error) throw error;
    return data;
  });

export const submitQuizAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { quizId, answerIndex, isCorrect } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("user_quiz_answers")
      .insert({
        user_id: userId,
        quiz_id: quizId,
        answer_index: answerIndex,
        is_correct: isCorrect
      })
      .select()
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível salvar resposta do quiz');

    await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: isCorrect ? 10 : 5 });

    return data;
  });

export const getQuizUserStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: quizId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("user_id", userId)
      .eq("quiz_id", quizId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  });

export const getAiCommentary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    try {
      const { matchId, mode, style } = rawData?.data || rawData;
      const { supabase } = context;
      const { data, error } = await supabase.functions.invoke('ai-commentator', {
        body: { match_id: matchId, mode, style }
      });
      
      if (error) {
        console.error('[AI] getAiCommentary function error:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('[AI] getAiCommentary catch error:', err);
      return null;
    }
  });

export const getAiPredictionAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, matchId, homeScore, awayScore } = rawData?.data || rawData;
    const { supabase } = context;
    const { data, error } = await supabase.functions.invoke('ai-prediction-analyzer', {
      body: { pool_id: poolId, match_id: matchId, predicted_home: homeScore, predicted_away: awayScore }
    });
    if (error) throw error;
    return data;
  });

export const getAiAutoPredictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.functions.invoke('ai-auto-predict', {
      body: { pool_id: poolId, user_id: userId }
    });
    
    if (error) {
      console.error('[DEBUG] ai-auto-predict invocation error:', error);
      throw error;
    }
    
    if (data && data.error === 'AI gateway' && data.detail) {
      console.error('[DEBUG] ai-auto-predict gateway error:', data.detail);
      throw new Error(`Erro na IA: ${data.detail}`);
    }
    
    return data;

  });

export const generateShareCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { title, description, colors } = rawData?.data || rawData;
    const { supabase } = context;
    const { data, error } = await supabase.functions.invoke('ai-share-card', {
      body: { title, description, team_colors: colors }
    });
    if (error) throw error;
    return data;
  });

export const upsertPredictionProp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, propId, answer } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data: prop, error: propError } = await supabase
      .from("props")
      .select("is_locked")
      .eq("id", propId)
      .maybeSingle();
    
    if (propError) throw propError;
    if (!prop) throw new Error("Prop não encontrada");
    if (prop.is_locked) {
      throw new Error("Predictions for this prop are locked.");
    }

    const { data, error } = await supabase
      .from("predictions_props")
      .upsert({
        user_id: userId,
        pool_id: poolId,
        prop_id: propId,
        answer,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pool_id,prop_id' })
      .select()
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível salvar palpite Prop');
    return data;
  });

export const getAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    
    const { data: allAchievements, error: allErr } = await supabase
      .from("achievements")
      .select("*")
      .order("rarity", { ascending: false });
    
    if (allErr) throw allErr;

    const { data: unlocked, error: unlErr } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);
    
    if (unlErr) throw unlErr;

    return allAchievements.map((ach: any) => ({
      ...ach,
      unlocked_at: unlocked.find((u: any) => u.achievement_id === ach.id)?.unlocked_at
    }));
  });

export const getCollectedCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("collected_cards")
      .select("*, player:players(*, team:teams!players_team_id_fkey(*))")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const getUserStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    
    const { data: predictions, error: predErr } = await supabase
      .from("predictions_exact")
      .select("points")
      .eq("user_id", userId);
    
    if (predErr) throw predErr;

    const total = predictions.length;
    const exactScores = predictions.filter((p: any) => p.points === 3).length;
    const hits = predictions.filter((p: any) => p.points && p.points > 0).length;
    
    return {
      total_predictions: total,
      exact_scores: exactScores,
      accuracy_rate: total > 0 ? Math.round((hits / total) * 100) : 0,
      current_streak: 0, 
      best_streak: 0 
    };
  });

export const createCustomProp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const data = rawData?.data || rawData;
    const { supabase } = context;
    const { data: prop, error } = await supabase
      .from("props")
      .insert(data)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return prop;
  });

export const resolveProp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { propId, resolvedValue } = rawData?.data || rawData;
    const { supabase } = context;
    const { error } = await supabase.rpc('award_points_for_prop', { 
      p_prop_id: propId, 
      p_resolved_value: resolvedValue 
    });
    
    if (error) throw error;
    return { success: true };
  });

export const getPlayers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("players")
      .select("*, team:teams!players_team_id_fkey(*)")
      .order("name");
    
    if (error) throw error;
    return data;
  });

export const getChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, matchId } = rawData?.data || rawData;
    const { supabase } = context;
    let query = supabase
      .from("chat_messages")
      .select("*, user:profiles!chat_messages_user_id_fkey(*)")
      .eq("pool_id", poolId)
      .order("created_at", { ascending: true });
    
    if (matchId) {
      query = query.eq("match_id", matchId);
    } else {
      query = query.is("match_id", null);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, text } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        pool_id: poolId,
        user_id: userId,
        text
      })
      .select()
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível enviar mensagem');
    return data;
  });

export const toggleReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { messageId, emoji } = rawData?.data || rawData;
    const { supabase } = context;
    const { error } = await supabase.rpc('toggle_chat_reaction', { 
      p_message_id: messageId, 
      p_emoji: emoji 
    });
    if (error) throw error;
    return { success: true };
  });

export const getMuralPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("mural_posts")
      .select("*, user:profiles!mural_posts_user_id_fkey(*), target_user:profiles!mural_posts_target_user_id_fkey(*)")
      .eq("pool_id", poolId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const createMuralPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { content, type } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("mural_posts")
      .insert({
        user_id: userId,
        content,
        type
      })
      .select()
      .maybeSingle();

    console.log('[DEBUG] query result:', { data, error, count: data ? 1 : 0 });
    if (error) throw error;
    if (!data) throw new Error('Não foi possível criar post no mural');
    return data;
  });

export const deleteMuralPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: postId, context }: any) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("mural_posts")
      .delete()
      .eq("id", postId);
    if (error) throw error;
    return { success: true };
  });

export const getFantasyLineup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: { poolId, gameweek }, context }: any) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("fantasy_lineups")
      .select("*, players:fantasy_lineup_players(*, player:players(*))")
      .eq("pool_id", poolId)
      .eq("user_id", userId)
      .eq("gameweek", gameweek)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  });

export const getMatch = createServerFn({ method: "GET" })
  .handler(async ({ data: id }: any) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  });

export const upsertFantasyLineup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, gameweek, formation, playerIds, captainId, viceCaptainId, budgetUsed } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data: lineup, error: lineupError } = await supabase
      .from("fantasy_lineups")
      .upsert({
        user_id: userId,
        pool_id: poolId,
        gameweek,
        formation,
        captain_id: captainId,
        vice_captain_id: viceCaptainId,
        budget_used: budgetUsed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,pool_id,gameweek' })
      .select()
      .maybeSingle();

    console.log('[DEBUG] query result:', { data: lineup, error: lineupError, count: lineup ? 1 : 0 });
    if (lineupError) throw lineupError;
    if (!lineup) throw new Error('Não foi possível salvar escalação');

    await supabase.from("fantasy_lineup_players").delete().eq("lineup_id", lineup.id);

    const playersToInsert = playerIds.map((playerId: string) => ({
      lineup_id: lineup.id,
      player_id: playerId
    }));

    const { error: playersError } = await supabase
      .from("fantasy_lineup_players")
      .insert(playersToInsert);

    if (playersError) throw playersError;
    return lineup;
  });

export const getFantasyPlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("players")
      .select("*, team:teams!players_team_id_fkey(*)")
      .order("market_value", { ascending: false });

    if (error) throw error;
    return data;
  });

export const getFantasyRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: poolId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("fantasy_lineups")
      .select("user_id, total_points, profile:profiles!fantasy_lineups_user_id_fkey(*)")
      .eq("pool_id", poolId)
      .order("total_points", { ascending: false });

    if (error) throw error;
    
    const rankingMap = new Map();
    data.forEach((row: any) => {
      if (!rankingMap.has(row.user_id)) {
        rankingMap.set(row.user_id, {
          profile: row.profile,
          total_points: 0
        });
      }
      rankingMap.get(row.user_id).total_points += row.total_points;
    });

    return Array.from(rankingMap.values()).sort((a, b) => b.total_points - a.total_points);
  });

export const getPlayerMatchStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: matchId, context }: any) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("player_match_stats")
      .select("*, player:players!player_match_stats_player_id_fkey(*)")
      .eq("match_id", matchId);
    
    if (error) throw error;
    return data;
  });
