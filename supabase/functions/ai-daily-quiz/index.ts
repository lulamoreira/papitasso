import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyCronSecret } from '../_shared/auth.ts'

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
    verifyCronSecret(req);
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('daily_quiz')
      .select('*')
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify(existing), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const difficulties = ['easy', 'medium', 'hard'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    const prompt = `Gere 1 pergunta de quiz sobre Copa do Mundo (histórica ou da edição 2026) em português, com 4 opções de resposta. Inclua um 'fato curioso' explicando a resposta. Dificuldade: ${difficulty}. 
    Responda APENAS em JSON: { "question": string, "options": [string, string, string, string], "correct_index": 0-3, "fact": string }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 500
      }),
    })

    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq] error:', err);
      throw new Error(`Groq ${response.status}: ${err}`);
    }

    const aiResult = await response.json()
    const quizData = JSON.parse(aiResult.choices[0].message.content)

    const { data: inserted, error: insertError } = await supabase
      .from('daily_quiz')
      .insert({
        date: today,
        question: quizData.question,
        options: quizData.options,
        correct_index: quizData.correct_index,
        fact: quizData.fact,
        difficulty
      })
      .select()
      .single()

    if (insertError) throw insertError;

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})