import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyUser } from '../_shared/auth.ts'

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
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
    try { 
      userId = await verifyUser(req); 
    } catch (resp) { 
      if (resp instanceof Response) return resp;
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401, headers: corsHeaders });
    }
    const { pool_id } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const { data: poolMatches } = await supabase.rpc('matches_for_pool', { p_pool_id: pool_id })
    
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

    // Só prevê jogos com AMBOS os times definidos (pula mata-mata placeholder)
    const { data: matchesWithTeams } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('id', unpredictedMatches.map((m: any) => m.id))

    const validMatches = (matchesWithTeams || []).filter(
      (m: any) => m.home_team && m.away_team
    );

    if (validMatches.length === 0) {
      return new Response(JSON.stringify({ predictions: [] }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // UMA chamada só, em lote (evita rate limit e timeout)
    const matchList = validMatches.map((m: any, i: number) => 
      `${i}. ${m.home_team.name} (FIFA ${m.home_team.fifa_ranking || 'N/A'}) vs ${m.away_team.name} (FIFA ${m.away_team.fifa_ranking || 'N/A'}) [fase: ${m.phase}]`
    ).join('\n');

    const prompt = `Você é especialista em futebol. Preveja o placar mais provável de CADA jogo abaixo da Copa 2026, considerando ranking FIFA, histórico e contexto.\n\nJogos:\n${matchList}\n\nResponda APENAS um objeto JSON com a chave "predictions" sendo um array, onde cada item tem o índice do jogo e o placar: {"predictions":[{"i":0,"home":2,"away":1}, ...]}. Inclua TODOS os jogos.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq] error:', err);
      throw new Error(`Groq ${response.status}: ${err}`);
    }

    const aiResult = await response.json()
    let raw = aiResult.choices[0].message.content.trim();
    // Defensivo: remove cercas de markdown se vierem
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(raw);
    const aiPreds = parsed.predictions || [];

    const predictions = [];
    for (const ap of aiPreds) {
      const match = validMatches[ap.i];
      if (!match) continue;
      predictions.push({
        match_id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        predicted_home: ap.home,
        predicted_away: ap.away
      });
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