import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const today = new Date().toISOString().split('T')[0]

    // 1. Já existe quiz de hoje? Retorna ele (sem IA, sem insert)
    const { data: existing } = await supabase
      .from('daily_quiz').select('*').eq('date', today).maybeSingle()
    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Não existe → gera via Groq
    const prompt = `Gere 1 pergunta de quiz sobre futebol e Copa do Mundo (história ou edição 2026), em português brasileiro, com 4 opções de resposta. Inclua um "fato curioso" curto explicando a resposta. Responda APENAS um objeto JSON: {"question":"...","options":["a","b","c","d"],"correct_index":0,"fact":"...","difficulty":"easy|medium|hard"}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 600,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq quiz] error:', err);
      throw new Error(`Groq ${response.status}: ${err}`);
    }

    const aiResult = await response.json()
    let raw = aiResult.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const q = JSON.parse(raw);

    // 3. Insere (upsert por date evita corrida/duplicata)
    const { data: inserted, error: insertError } = await supabase
      .from('daily_quiz')
      .upsert({
        date: today,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        fact: q.fact,
        difficulty: q.difficulty || 'medium'
      }, { onConflict: 'date' })
      .select()
      .single()

    if (insertError) throw insertError;

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[ai-daily-quiz] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
