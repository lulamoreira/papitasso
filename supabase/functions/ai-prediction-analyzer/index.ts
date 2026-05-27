import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { pool_id, match_id, predicted_home, predicted_away } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch pool predictions for this match
    const { data: allPredictions } = await supabase
      .from('predictions_exact')
      .select('home_score, away_score')
      .eq('pool_id', pool_id)
      .eq('match_id', match_id)

    const total = allPredictions?.length || 0;
    const same = allPredictions?.filter(p => p.home_score === predicted_home && p.away_score === predicted_away).length || 0;
    const popularity_pct = total > 0 ? (same / total) * 100 : 100;

    // Determine consensus
    const scoreCounts: Record<string, number> = {};
    allPredictions?.forEach(p => {
      const key = `${p.home_score}-${p.away_score}`;
      scoreCounts[key] = (scoreCounts[key] || 0) + 1;
    });
    
    let group_consensus = "Nenhum ainda";
    let maxCount = 0;
    for (const [score, count] of Object.entries(scoreCounts)) {
      if (count > maxCount) {
        maxCount = count;
        group_consensus = score.replace('-', ' x ');
      }
    }

    const prompt = `Analise este palpite de futebol: ${predicted_home} x ${predicted_away}.
    O consenso do grupo é ${group_consensus}. Popularidade do palpite: ${popularity_pct.toFixed(1)}%.
    Responda em JSON: { risk_level: 'safe'|'medium'|'bold', comment: string (máximo 15 palavras) }`;

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
    const analysis = JSON.parse(aiResult.choices[0].message.content)

    return new Response(JSON.stringify({ 
      popularity_pct, 
      group_consensus, 
      risk_level: analysis.risk_level,
      comment: analysis.comment
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
