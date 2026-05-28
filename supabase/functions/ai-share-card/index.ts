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
      if (resp instanceof Response) return resp;
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 401, headers: corsHeaders });
    }
    const { title, description, team_colors } = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const prompt = `Gere uma descrição visual e um slogan para um card de compartilhamento de esporte.
    Título: ${title}. Descrição: ${description}. Cores: ${team_colors}.
    Responda em JSON: { "slogan": string, "bg_gradient": string, "icon": string }`;

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
    const design = JSON.parse(aiResult.choices[0].message.content)

    const cardId = crypto.randomUUID();
    const fileName = `${userId}/${cardId}.json`;
    
    await supabase.storage.from('share-cards').upload(fileName, JSON.stringify({
      ...design,
      title,
      description,
      team_colors,
      user_id: userId,
      created_at: new Date().toISOString()
    }))

    const { data: { publicUrl } } = supabase.storage.from('share-cards').getPublicUrl(fileName)

    return new Response(JSON.stringify({ 
      url: publicUrl,
      design: { ...design, title, description, team_colors }
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
