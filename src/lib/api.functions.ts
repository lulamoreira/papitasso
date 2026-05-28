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
    const { code, invitedBy } = rawData?.data || rawData;
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
        role: 'member',
        invited_by: invitedBy
      });
    
    if (memberError) {
      if (memberError.code === '23505') return { pool_id: pool.id }; // Already a member
      throw memberError;
    }

    // Gamification: Award XP to inviter
    if (invitedBy && invitedBy !== userId) {
      await supabase.rpc('increment_xp', { p_user_id: invitedBy, p_amount: 50 });
      // Logic for 'influencer' achievement will be in check-achievements
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

    // Security check: Verify match is not locked
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("kickoff_at")
      .eq("id", matchId)
      .single();
    
    if (matchError) throw matchError;
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
      .single();

    if (error) throw error;

    // Gamification: +5 XP for participation
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

    // Security check: Verify match is not locked
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("kickoff_at")
      .eq("id", matchId)
      .single();
    
    if (matchError) throw matchError;
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
      .single();
    if (error) throw error;
    return data;
  });

export const getDailyQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase } = context;
    // Trigger the edge function to ensure a quiz exists for today
    const { data, error } = await supabase.functions.invoke('ai-daily-quiz');
    if (error) throw error;
    return data;
  });

export const submitQuizAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { quizId, answerIndex } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data: quiz } = await supabase
      .from("daily_quiz")
      .select("*")
      .eq("id", quizId)
      .single();

    const isCorrect = quiz.correct_index === answerIndex;

    const { data: answer, error } = await supabase
      .from("quiz_answers")
      .insert({
        user_id: userId,
        quiz_id: quizId,
        answer_index: answerIndex,
        is_correct: isCorrect
      })
      .select()
      .single();

    if (error) throw error;

    // Award XP
    const xpAmount = isCorrect ? 10 : 5;
    await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: xpAmount });

    // Update streak (simplified logic)
    if (isCorrect) {
       await supabase.rpc('update_quiz_streak', { p_user_id: userId });
    }

    return { ...answer, fact: quiz.fact, correct_index: quiz.correct_index };
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
    const { matchId, mode, style } = rawData?.data || rawData;
    const { supabase } = context;
    const { data, error } = await supabase.functions.invoke('ai-commentator', {
      body: { match_id: matchId, mode, style }
    });
    if (error) throw error;
    return data;
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
    if (error) throw error;
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
      .single();

    if (error) throw error;
    return data;
  });

export const getAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    
    // Get all achievements
    const { data: allAchievements, error: allErr } = await supabase
      .from("achievements")
      .select("*")
      .order("rarity", { ascending: false });
    
    if (allErr) throw allErr;

    // Get user's unlocked achievements
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
      .select("*, team:teams(*)")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const getUserStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const { supabase, userId } = context;
    
    // Fetch count of exact predictions (points > 0 usually means correct)
    const { data: predictions, error: predErr } = await supabase
      .from("predictions_exact")
      .select("points")
      .eq("user_id", userId);
    
    if (predErr) throw predErr;

    const total = predictions.length;
    const exactScores = predictions.filter((p: any) => p.points === 3).length; // 3 points for exact score
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
      .single();
    
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
      .select("*, team:teams(*)")
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
      .select("*, user:profiles(*)")
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
    const { poolId, matchId, text } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        pool_id: poolId,
        match_id: matchId,
        user_id: userId,
        text
      })
      .select()
      .single();

    if (error) throw error;
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
      .select("*, user:profiles(*), target_user:profiles(*)")
      .eq("pool_id", poolId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const createMuralPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, content, type = 'user_post' } = rawData?.data || rawData;
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("mural_posts")
      .insert({
        pool_id: poolId,
        user_id: userId,
        content,
        type
      })
      .select()
      .single();

    if (error) throw error;
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
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, gameweek } = rawData?.data || rawData;
    const { supabase, userId } = context;
    const { data: lineup, error: lineupError } = await supabase
      .from("fantasy_lineups")
      .select("*, players:fantasy_lineup_players(*, player:players(*))")
      .eq("pool_id", poolId)
      .eq("user_id", userId)
      .eq("gameweek", gameweek)
      .maybeSingle();

    if (lineupError) throw lineupError;
    return lineup;
  });

export const upsertFantasyLineup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }: any) => {
    const { poolId, gameweek, formation, players, captainId, viceCaptainId, budgetUsed } = rawData?.data || rawData;
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
      .single();

    if (lineupError) throw lineupError;

    await supabase.from("fantasy_lineup_players").delete().eq("lineup_id", lineup.id);

    const playersToInsert = players.map((p: any) => ({
      lineup_id: lineup.id,
      player_id: p.player_id,
      slot: p.slot,
      is_bench: p.is_bench
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
      .select("*, team:teams(*)")
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
      .select("user_id, total_points, profile:profiles(*)")
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
      .select("*, player:players(*)")
      .eq("match_id", matchId);
    
    if (error) throw error;
    return data;
  });

