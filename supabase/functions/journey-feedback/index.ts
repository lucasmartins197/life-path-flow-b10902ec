import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { step_number, depoimento, user_name } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const nameToUse = (user_name || "você").toString().trim() || "você";

    const systemPrompt = `Você é Ana, terapeuta acolhedora do app "Apostando na Vida". O usuário acabou de concluir o Passo ${step_number} da jornada e compartilhou uma reflexão pessoal. Escreva uma mensagem curta (máximo 3 frases) celebrando essa conquista de forma calorosa e humana. Mencione algo específico do que ${nameToUse} escreveu. Tom: como uma amiga terapeuta, nunca robótico. NÃO inclua assinatura. NÃO use emojis em excesso (no máximo 1).`;

    const userContent = `Nome: ${nameToUse}\nReflexão do Passo ${step_number}:\n"${depoimento || "(sem texto)"}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ feedback: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content?.trim() || null;

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journey-feedback error:", e);
    return new Response(JSON.stringify({ feedback: null, error: e instanceof Error ? e.message : "erro" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
