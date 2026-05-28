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
    try { 
      userId = await verifyUser(req); 
    } catch (resp) { 
      console.error('[AI] Auth error:', resp);
      if (resp instanceof Response) return resp;
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { match_id, mode, style } = body;

    if (!match_id) {
      return new Response(JSON.stringify({ error: 'match_id is required' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const cacheKey = `commentary:${match_id}:${mode}:${style}`
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { data: recentCommentary } = await supabase
      .from('ai_usage_log')
      .select('*')
      .eq('function_name', cacheKey)
      .gt('created_at', oneHourAgo)
      .limit(1)
      .maybeSingle()

    if (recentCommentary) {
       // Cache logic could be implemented here
    }

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      throw new Error('Match not found');
    }

    const persona = style === 'galvao' ? 'Galvão Bueno, narrador clássico apaixonado' :
                   style === 'casimiro' ? 'Casimiro, comentarista descontraído com gírias' :
                   'narrador neutro profissional';
    
    const context = mode === 'pre' ? 'pré-jogo, criando expectativa' : 'pós-jogo analisando o resultado';
    const score = match.status === 'finished' ? `${match.home_score} x ${match.away_score}` : 'ainda não jogado';

    const prompt = `Você é ${persona}. 
    Gere um comentário ${context} sobre ${match.home_team.name} x ${match.away_team.name}. 
    Resultado: ${score}. 
    Use entre 80 e 150 palavras. Em português brasileiro.`

    console.log('[AI] Generating commentary with prompt:', prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "Você é um narrador esportivo brasileiro especializado na Copa do Mundo." },
          { role: "user", content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[AI] Gateway error:', errorData);
      throw new Error(`AI Gateway responded with ${response.status}`);
    }

    const aiResult = await response.json()
    const text = aiResult.choices[0].message.content

    await supabase.from('ai_usage_log').insert({
      user_id: userId,
      function_name: cacheKey,
      tokens_estimated: aiResult.usage?.total_tokens || 0
    })

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[AI] Error in function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
