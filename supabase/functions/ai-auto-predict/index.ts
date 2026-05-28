import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyUser } from '../_shared/auth.ts'

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let userId: string;
    try { userId = await verifyUser(req); } catch (resp) { return resp as Response; }
    const { pool_id } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch matches for pool
    const { data: poolMatches } = await supabase.rpc('matches_for_pool', { p_pool_id: pool_id })
    
    // Filter out matches already predicted by user
    const { data: userPredictions } = await supabase
      .from('predictions_exact')
      .select('match_id')
      .eq('pool_id', pool_id)
      .eq('user_id', userId)

    const predictedIds = new Set(userPredictions?.map(p => p.match_id) || []);
    const unpredictedMatches = poolMatches.filter((m: any) => !predictedIds.has(m.id));

    if (unpredictedMatches.length === 0) {
      return new Response(JSON.stringify({ predictions: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Rate limit check
    const { data: recentUsage } = await supabase
      .from('ai_usage_log')
      .select('*')
      .eq('user_id', userId)
      .eq('function_name', 'ai-auto-predict')
      .gt('created_at', new Date(Date.now() - 86400000).toISOString())
      .limit(1)

    if (recentUsage && recentUsage.length > 0) {
      throw new Error("Limite do Modo Preguiça atingido (1x por dia).");
    }

    // Fetch team details
    const { data: matchesWithTeams } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('id', unpredictedMatches.map((m: any) => m.id))

    const predictions = [];
    for (const match of matchesWithTeams!) {
      const prompt = `Você é especialista em futebol. Preveja o placar mais provável entre ${match.home_team.name} (ranking FIFA ${match.home_team.fifa_ranking || 'N/A'}) e ${match.away_team.name} (ranking FIFA ${match.away_team.fifa_ranking || 'N/A'}) considerando histórico, fase ${match.phase} e contexto da Copa 2026. Responda APENAS em formato JSON: { "home": int, "away": int }`;

      const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-1.5-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
      })

      const aiResult = await response.json()
      const pred = JSON.parse(aiResult.choices[0].message.content)
      predictions.push({
        match_id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        predicted_home: pred.home,
        predicted_away: pred.away
      })
    }

    await supabase.from('ai_usage_log').insert({
      user_id: userId,
      function_name: 'ai-auto-predict',
      tokens_estimated: predictions.length * 100
    })

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
