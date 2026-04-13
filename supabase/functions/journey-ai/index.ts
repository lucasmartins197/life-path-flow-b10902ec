import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, conversation, stepNumber } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é uma IA terapeuta acolhedora do app "Apostando na Vida", especializada em recuperação de ludopatia.

O usuário acabou de completar o Passo ${stepNumber} (Reconhecimento). Leia as respostas dele e responda de forma humana, empática e direta.

Regras:
- Valide o esforço e a coragem do usuário
- Faça UMA pergunta de aprofundamento
- Encoraje a continuar na jornada
- Máximo 3 parágrafos
- Tom: acolhedor, sem julgamento, esperançoso
- Nunca minimize o problema
- Nunca dê conselhos médicos específicos
- Use linguagem simples e direta`;

    const userContext = `Respostas do usuário no Passo ${stepNumber}:
- Como se sente ao admitir o problema: "${answers?.feeling || 'não respondeu'}"
- Momento mais difícil causado pelas apostas: "${answers?.hardest_moment || 'não respondeu'}"
- O que está disposto a fazer diferente: "${answers?.commitment || 'não respondeu'}"`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContext },
    ];

    // Add conversation history if exists
    if (Array.isArray(conversation) && conversation.length > 0) {
      for (const msg of conversation) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua resposta. Tente novamente.";

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journey-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
