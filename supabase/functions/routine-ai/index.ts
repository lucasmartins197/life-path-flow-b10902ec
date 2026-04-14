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
      const duration = preferences?.duration || 30;
      const level = preferences?.level || "Iniciante";

      // Only AI-supported sports: Caminhada, Corrida, Natação
      if (sportType === "Caminhada") {
        systemPrompt = `Você é um personal trainer do app Apostando na Vida. Crie um plano de caminhada SUCINTO para ${duration} minutos, nível ${level}. Formato OBRIGATÓRIO: máximo 5 linhas, direto ao ponto. Exemplo: "Aquecimento 5min → Caminhada moderada 20min → Desaquecimento 5min". Inclua dicas de postura e respiração em 1 linha. Responda em JSON: { "trainingName":"Caminhada ${duration}min", "text":"o plano em formato sucinto com setas →" }`;
      } else if (sportType === "Corrida") {
        systemPrompt = `Você é um personal trainer do app Apostando na Vida. Crie um plano de corrida SUCINTO para ${duration} minutos, nível ${level}. Formato OBRIGATÓRIO: máximo 6 linhas objetivo. Aquecimento → Treino principal (tiros ou ritmo contínuo baseado no nível) → Desaquecimento. Sem descrições longas. Responda em JSON: { "trainingName":"Corrida ${duration}min - ${level}", "text":"o plano sucinto" }`;
      } else if (sportType === "Natação") {
        systemPrompt = `Você é um personal trainer do app Apostando na Vida. Crie um treino de natação SUCINTO para ${duration} minutos, nível ${level}. Formato OBRIGATÓRIO: máximo 6 linhas com séries objetivas. Ex: "4x50m crawl / 2x100m costas". Responda em JSON: { "trainingName":"Natação ${duration}min", "text":"o plano sucinto com séries" }`;
      } else {
        systemPrompt = `Você é um personal trainer. Crie um plano sucinto de ${sportType} para ${duration} minutos. Máximo 6 linhas. Responda em JSON: { "trainingName":"${sportType} ${duration}min", "text":"plano sucinto" }`;
      }
      userPrompt = `Modalidade: ${sportType}. Tempo: ${duration}min. Nível: ${level}.`;

    } else if (type === "workout") {
      const { peso, altura, objetivo, nivel, disponibilidade, foco, level, focus, equipment, duration } = preferences || {};
      const dur = duration || 45;
      const actualLevel = nivel || level || "Iniciante";
      const actualFocus = foco || focus || "Full Body";
      const actualGoal = objetivo || "Saúde geral";

      let exerciseCount = "";
      if (dur <= 15) {
        exerciseCount = "APENAS 3-4 exercícios principais. SEM aquecimento separado. SEM alongamento. Direto ao ponto.";
      } else if (dur <= 30) {
        exerciseCount = "Aquecimento 5min + 5-6 exercícios com séries e repetições + alongamento 3min.";
      } else if (dur <= 45) {
        exerciseCount = "Aquecimento 7min + 7-8 exercícios + alongamento 5min.";
      } else {
        exerciseCount = "Aquecimento 10min + 8-9 exercícios + 1 finalizador + alongamento 8min.";
      }

      systemPrompt = `Você é um personal trainer profissional do app Apostando na Vida. O usuário tem EXATAMENTE ${dur} minutos. ${exerciseCount}

Dados: Peso ${peso || "?"}kg, Altura ${altura || "?"}cm, Objetivo: ${actualGoal}, Nível: ${actualLevel}, Foco: ${actualFocus}.

FORMATO OBRIGATÓRIO — SUCINTO E OBJETIVO. Cada exercício em UMA linha: "Nome — Xséries x Xreps — Xseg descanso". Sem descrições longas. O usuário já sabe executar os exercícios.

Responda em JSON: { "trainingName":"${actualFocus} - ${actualGoal} (${dur}min)", "text":"o treino completo formatado linha por linha" }`;
      userPrompt = `Gere o treino agora. Equipamento: ${equipment || "Academia completa"}. Tempo: ${dur}min.`;

    } else if (type === "reading") {
      systemPrompt = `Você é uma curadora literária do app Apostando na Vida. Recomende 3 livros relevantes para recuperação de ludopatia/autoconhecimento. Use preferencialmente desta lista:
- "Em Busca de Sentido" - Viktor Frankl (Google Books gratuito disponível)
- "O Poder do Hábito" - Charles Duhigg
- "Os Quatro Compromissos" - Don Miguel Ruiz
- "Mindset" - Carol Dweck
- "A Coragem de Ser Imperfeito" - Brené Brown
- "Minimalismo Digital" - Cal Newport
- "O Monge e o Executivo" - James C. Hunter
- "Pai Rico Pai Pobre" - Robert Kiyosaki

Para cada livro inclua: título, autor, resumo de 2 linhas, por que é bom para recuperação de ludopatia. 
Para os links, use EXATAMENTE este formato:
- googleBooksLink: "https://books.google.com/books?q=" + titulo e autor codificados (ex: https://books.google.com/books?q=O+Poder+do+Habito+Charles+Duhigg)
- amazonLink: "https://www.amazon.com.br/s?k=" + titulo e autor codificados (ex: https://www.amazon.com.br/s?k=O+Poder+do+Habito+Charles+Duhigg)
- isFree: true apenas para "Em Busca de Sentido" de Viktor Frankl (domínio público). false para os demais.

Também inclua uma "dica do dia" inspiradora de 2-3 linhas.
Responda em JSON: { "books": [{"title":"...", "author":"...", "summary":"...", "recoveryBenefit":"...", "googleBooksLink":"...", "amazonLink":"...", "isFree": true/false}], "dailyTip":"..." }`;
      userPrompt = `Tema preferido: ${preferences?.theme || "autoajuda"}. Tempo: ${preferences?.duration || 30} min.`;

    } else if (type === "spirituality") {
      const practice = preferences?.practice || "Meditação";
      const duration = preferences?.duration || 10;

      if (practice === "Meditação") {
        let meditationStructure = "";
        if (duration <= 5) {
          meditationStructure = `O roteiro deve ter EXATAMENTE 5 minutos:
- Respiração guiada 4-7-8 (4min): inspire 4s, segure 7s, expire 8s. Repita ciclos.
- Afirmação final (1min): uma frase poderosa de encerramento.
Apenas 2 seções. Nada mais.`;
        } else if (duration <= 10) {
          meditationStructure = `O roteiro deve ter EXATAMENTE 10 minutos:
- Respiração guiada (3min): ciclos 4-7-8
- Visualização positiva curta (5min): guie uma cena de paz e segurança
- Afirmação de encerramento (2min): 2-3 frases poderosas
Apenas 3 seções.`;
        } else if (duration <= 15) {
          meditationStructure = `O roteiro deve ter EXATAMENTE 15 minutos:
- Respiração guiada (3min): ciclos 4-7-8
- Body scan (5min): percorra o corpo da cabeça aos pés relaxando cada parte
- Visualização positiva (5min): cena detalhada de paz
- Afirmação de encerramento (2min)
4 seções.`;
        } else if (duration <= 20) {
          meditationStructure = `O roteiro deve ter EXATAMENTE 20 minutos:
- Respiração guiada (4min): ciclos 4-7-8
- Body scan (6min): percorra todo o corpo com atenção
- Visualização completa (7min): cena rica e detalhada
- Reflexão final (3min): pergunta para reflexão + afirmação
4 seções.`;
        } else {
          meditationStructure = `O roteiro deve ter EXATAMENTE ${duration} minutos:
- Respiração guiada (4min): ciclos 4-7-8
- Body scan (6min): percorra todo o corpo
- Visualização completa (7min): cena rica
- Reflexão (3min): pergunta profunda
- Journaling guiado (${duration - 20}min): 3 perguntas para o usuário escrever
5 seções.`;
        }

        systemPrompt = `Você é uma guia espiritual acolhedora do app Apostando na Vida. O usuário tem ${duration} minutos. Crie um roteiro de meditação EXATAMENTE para este tempo, nem mais nem menos. Divida em seções com o tempo de cada uma.

${meditationStructure}

Para cada seção, dê instruções claras e detalhadas do que fazer. 
Responda em JSON: { "title":"Meditação de ${duration} minutos", "sections": [{"name":"nome da seção", "duration":"Xmin", "instructions":"instruções detalhadas"}], "closingMessage":"mensagem de encerramento acolhedora" }`;
      } else {
        let extra = "";
        if (practice === "Oração") extra = " Inclua um versículo ou reflexão espiritual do dia no campo 'verse'.";
        else if (practice === "Reflexão") extra = " Gere uma pergunta profunda e DIFERENTE a cada vez para journaling no campo 'deepQuestion'.";
        systemPrompt = `Você é uma guia espiritual acolhedora do app Apostando na Vida. Gere um guia completo de ${practice} de ${duration} minutos.${extra} Responda em JSON: { "title":"...", "steps": ["passo 1...", "passo 2..."], "closingMessage":"...", "verse":"...ou null", "deepQuestion":"...ou null" }`;
      }
      userPrompt = `Prática: ${practice}. Duração: ${duration}min. Passo da jornada: ${stepNumber || 1}. Nome: ${userName || "amigo(a)"}`;

    } else if (type === "social") {
      const socialWith = preferences?.with || "Família";
      const socialPrompts: Record<string, string> = {
        "Família": "Sugira uma atividade familiar específica e concreta.",
        "Amigos": "Sugira uma interação com amigos.",
        "Grupo de apoio": "Sugira participação em grupo de apoio.",
      };
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. ${socialPrompts[socialWith] || socialPrompts["Família"]} Inclua: descrição detalhada da atividade, por que faz bem na recuperação. Responda em JSON: { "suggestion":"descrição da atividade", "whyItHelps":"por que faz bem na recuperação", "emoji":"emoji relevante" }`;
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
