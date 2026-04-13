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
      const cats = preferences?.activeCategories || [];
      systemPrompt = `Você é Ana, terapeuta acolhedora do app Apostando na Vida. Dê uma sugestão curta e carinhosa (2-3 frases) de atividade para o usuário fazer AGORA (período: ${period}). Baseie-se nas categorias ativas dele: ${cats.join(", ")}. Use o nome dele se disponível. Tom: amiga terapeuta, nunca robótico. Seja específica e prática.`;
      userPrompt = `Usuário: ${userName || "amigo(a)"}. Categorias ativas: ${JSON.stringify(cats)}. Período: ${period}. Preferências: ${JSON.stringify(preferences)}.`;

    } else if (type === "sport") {
      const sportType = preferences?.type || "Corrida";
      const sportPrompts: Record<string, string> = {
        "Corrida": "Crie um plano de treino de corrida com: aquecimento (5 min com exercícios específicos), corrida principal (distância e pace baseados no nível), volta à calma (5 min), dicas de respiração e postura. Nível do usuário baseado nas preferências.",
        "Futebol": "Crie um treino técnico de futebol com: aquecimento dinâmico (5 exercícios), exercícios com bola (domínio, passe, finalização), sugestão de jogo coletivo, alongamento final.",
        "Beach Tennis": "Crie uma rotina de beach tennis com: aquecimento articular, exercícios de raquete (forehand, backhand), treino de saque e rally, dicas para iniciantes, alongamento.",
        "Vôlei": "Crie um treino de vôlei com: aquecimento, fundamentos (toque, manchete, cortada), posicionamento em quadra, treino de saque e recepção, alongamento.",
        "Caminhada": "Crie um plano de caminhada com: duração baseada no nível, técnica de caminhada (postura, respiração, cadência), metas semanais progressivas, dicas de hidratação.",
        "Natação": "Crie um treino de natação com: séries de aquecimento, treino principal por estilos (crawl, costas, peito), exercícios de respiração, metas de distância.",
      };
      const specific = sportPrompts[sportType] || `Crie um plano de treino para ${sportType} com aquecimento, treino principal, volta à calma e dicas.`;
      systemPrompt = `Você é um personal trainer do app Apostando na Vida. ${specific} Responda em JSON: { "trainingName":"...", "warmup": [{"name":"...", "description":"...", "tip":"..."}], "main": [{"name":"...", "sets":"...", "reps":"...", "rest":"...", "description":"...", "tip":"..."}], "cooldown": [{"name":"...", "description":"...", "tip":"..."}] }`;
      userPrompt = `Modalidade: ${sportType}. Preferências: ${JSON.stringify(preferences)}.`;

    } else if (type === "workout") {
      const { peso, altura, objetivo, nivel, disponibilidade, foco, level, focus, equipment } = preferences || {};
      systemPrompt = `Você é um personal trainer profissional do app Apostando na Vida. Gere um treino COMPLETO e detalhado baseado nos dados do aluno.
Dados: Peso ${peso || "?"}kg, Altura ${altura || "?"}cm, Objetivo: ${objetivo || "Saúde geral"}, Nível: ${nivel || level || "Iniciante"}, Disponibilidade: ${disponibilidade || "3x semana"}, Foco do dia: ${foco || focus || "Full Body"}.
Responda em JSON: { "trainingName":"Nome do treino + objetivo", "warmup": [{"name":"...", "sets":"...", "reps":"...", "description":"...", "tip":"..."}], "main": [{"name":"...", "muscle":"músculo trabalhado", "sets":"...", "reps":"...", "suggestedLoad":"carga sugerida baseada no nível", "rest":"...", "description":"...", "tip":"..."}], "finisher": [{"name":"...", "description":"..."}], "cooldown": [{"name":"...", "description":"...", "duration":"..."}], "nutritionTip":"dica nutricional pós-treino baseada no objetivo" }
Aquecimento: 3-5 exercícios. Treino principal: 6-8 exercícios. Finalizador: 1-2 exercícios de burn. Alongamento: 5 exercícios com duração.`;
      userPrompt = `Gere o treino agora. Equipamento: ${equipment || "Academia completa"}.`;

    } else if (type === "reading") {
      systemPrompt = `Você é uma curadora literária do app Apostando na Vida. Recomende 3 livros relevantes para recuperação de ludopatia/autoconhecimento. Use preferencialmente desta lista: "O Poder do Hábito" (Charles Duhigg), "Minimalismo Digital" (Cal Newport), "A Coragem de Ser Imperfeito" (Brené Brown), "O Monge e o Executivo" (James C. Hunter), "Pai Rico Pai Pobre" (Robert Kiyosaki), "Em Busca de Sentido" (Viktor Frankl), "Os Quatro Compromissos" (Don Miguel Ruiz), "Mindset" (Carol Dweck). Pode adicionar outros relevantes.
Para cada livro inclua: título, autor, resumo de 2 linhas, por que é bom para recuperação de ludopatia, link para leitura gratuita (Google Books ou Project Gutenberg se disponível, senão null).
Também inclua uma "dica do dia" inspiradora de 3-4 linhas.
Responda em JSON: { "books": [{"title":"...", "author":"...", "summary":"...", "recoveryBenefit":"...", "freeLink":"...ou null"}], "dailyTip":"..." }`;
      userPrompt = `Tema preferido: ${preferences?.theme || "autoajuda"}. Tempo: ${preferences?.duration || 30} min.`;

    } else if (type === "spirituality") {
      const practice = preferences?.practice || "Meditação";
      let extra = "";
      if (practice === "Oração") extra = " Inclua um versículo ou reflexão espiritual do dia relacionado ao passo atual da jornada de recuperação no campo 'verse'.";
      else if (practice === "Reflexão") extra = " Gere uma pergunta profunda e DIFERENTE a cada vez para journaling no campo 'deepQuestion'.";
      systemPrompt = `Você é uma guia espiritual acolhedora do app Apostando na Vida. Gere um guia completo de ${practice} de ${preferences?.duration || 10} minutos.${extra} Para meditação: guia passo a passo com respiração (inspire 4s, segure 4s, expire 4s), foco e encerramento. Responda em JSON: { "title":"...", "steps": ["passo 1...", "passo 2..."], "closingMessage":"...", "verse":"...ou null", "deepQuestion":"...ou null" }`;
      userPrompt = `Prática: ${practice}. Passo da jornada: ${stepNumber || 1}. Nome: ${userName || "amigo(a)"}`;

    } else if (type === "social") {
      const socialWith = preferences?.with || "Família";
      const socialPrompts: Record<string, string> = {
        "Família": "Sugira uma atividade familiar específica e concreta. Exemplos: preparar um jantar juntos com 3 sugestões de receitas simples, propor um jogo de tabuleiro, assistir um filme juntos, fazer uma caminhada em família.",
        "Amigos": "Sugira uma interação com amigos. Exemplos: marcar um café, mandar uma mensagem para alguém que não vê há tempo, organizar um encontro simples, fazer uma ligação.",
        "Grupo de apoio": "Sugira participação em grupo de apoio. Verificar se tem reunião hoje, sugerir grupo online de recuperação, compartilhar experiência anonimamente.",
      };
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. ${socialPrompts[socialWith] || socialPrompts["Família"]} Inclua: descrição detalhada da atividade, por que faz bem na recuperação de ludopatia. Responda em JSON: { "suggestion":"descrição da atividade", "whyItHelps":"por que faz bem na recuperação", "emoji":"emoji relevante" }`;
      userPrompt = `Tipo: ${socialWith}. Nome: ${userName || "amigo(a)"}`;

    } else if (type === "feedback") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. O usuário acabou de completar uma atividade de rotina. Dê um feedback carinhoso em 2-3 frases validando o esforço. Use o nome dele. Tom acolhedor.`;
      userPrompt = `Nome: ${userName || "amigo(a)"}. Categoria: ${category}. Avaliação: ${preferences?.rating}/5. Relato: ${preferences?.report || "sem relato"}`;

    } else if (type === "reflection") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. O usuário escreveu uma reflexão noturna. Responda com uma carta curta (2-3 parágrafos) validando, destacando algo específico que ele escreveu, e terminando com uma frase de encorajamento para amanhã. Tom: amiga terapeuta carinhosa.`;
      userPrompt = `Nome: ${userName || "amigo(a)"}. Reflexão: ${reflectionContent}`;

    } else {
      throw new Error("Unknown type: " + type);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error: " + response.status);
    }

    const data = await response.json();
    let message = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    if (message.includes("```json")) {
      message = message.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    } else if (message.startsWith("```")) {
      message = message.replace(/```\s*/g, "").trim();
    }

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("routine-ai error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
