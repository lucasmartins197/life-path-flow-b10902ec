import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, category, preferences, userName, stepNumber, reflectionContent } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "suggestion") {
      const hour = new Date().getHours();
      const period = hour < 12 ? "manhã" : hour < 18 ? "tarde" : "noite";
      systemPrompt = `Você é Ana, terapeuta acolhedora do app Apostando na Vida. Dê uma sugestão curta e carinhosa (2-3 frases) de atividade para o usuário fazer AGORA (período: ${period}). Baseie-se nas categorias ativas dele. Use o nome dele se disponível. Tom: amiga terapeuta, nunca robótico.`;
      userPrompt = `Usuário: ${userName || "amigo(a)"}. Categorias ativas: ${JSON.stringify(preferences)}. Passo atual da jornada: ${stepNumber || 1}.`;
    } else if (type === "workout") {
      systemPrompt = `Você é um personal trainer profissional e empático do app Apostando na Vida. Gere um treino completo e detalhado em formato estruturado. Inclua: aquecimento (3-5 exercícios), treino principal (6-8 exercícios com séries, repetições e descanso), alongamento (3-5 exercícios). Para cada exercício: nome, descrição breve da execução, dica de forma. Responda em JSON com formato: { "warmup": [{"name":"...", "description":"...", "tip":"..."}], "main": [{"name":"...", "sets":"...", "reps":"...", "rest":"...", "description":"...", "tip":"..."}], "cooldown": [{"name":"...", "description":"...", "tip":"..."}] }`;
      userPrompt = `Categoria: ${category}. Preferências: ${JSON.stringify(preferences)}.`;
    } else if (type === "reading") {
      systemPrompt = `Você é uma curadora literária acolhedora do app Apostando na Vida. Recomende 1 livro relevante para recuperação de ludopatia/autoconhecimento. Inclua: título, autor, por que ler, e um trecho inspirador de 3-4 linhas. Também inclua uma "dica do dia" - um pensamento profundo relacionado ao passo ${stepNumber || 1} da jornada. Responda em JSON: { "book": {"title":"...", "author":"...", "reason":"...", "excerpt":"..."}, "dailyTip":"..." }`;
      userPrompt = `Tema preferido: ${preferences?.theme || "autoajuda"}. Tempo: ${preferences?.duration || 30} min.`;
    } else if (type === "spirituality") {
      const practice = preferences?.practice || "meditação";
      systemPrompt = `Você é uma guia espiritual acolhedora do app Apostando na Vida. Gere um guia completo de ${practice} de ${preferences?.duration || 10} minutos. Para meditação: guia passo a passo com respiração, foco e encerramento. Para oração: reflexão do dia + espaço para intenções. Para reflexão: pergunta profunda. Responda em JSON: { "title":"...", "steps": ["passo 1...", "passo 2..."], "closingMessage":"..." }`;
      userPrompt = `Prática: ${practice}. Passo da jornada: ${stepNumber || 1}. Nome: ${userName || "amigo(a)"}`;
    } else if (type === "social") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. Sugira UMA ação social específica e gentil para o usuário fazer hoje. Seja concreta ("Ligue para sua mãe e conte algo bom"). Após o relato do usuário, valide emocionalmente em 2-3 frases. Responda em JSON: { "suggestion":"...", "emoji":"..." }`;
      userPrompt = `Preferências: ${JSON.stringify(preferences)}. Nome: ${userName || "amigo(a)"}`;
    } else if (type === "feedback") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. O usuário acabou de completar uma atividade de rotina. Dê um feedback carinhoso em 2-3 frases validando o esforço. Use o nome dele. Tom acolhedor.`;
      userPrompt = `Nome: ${userName || "amigo(a)"}. Categoria: ${category}. Avaliação: ${preferences?.rating}/5. Relato: ${preferences?.report || "sem relato"}`;
    } else if (type === "reflection") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. O usuário escreveu uma reflexão noturna. Responda com uma carta curta (2-3 parágrafos) validando, destacando algo específico que ele escreveu, e terminando com uma frase de encorajamento para amanhã. Tom: amiga terapeuta carinhosa.`;
      userPrompt = `Nome: ${userName || "amigo(a)"}. Reflexão: ${reflectionContent}`;
    } else {
      throw new Error("Unknown type");
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
