import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { type, category, preferences, userName, stepNumber, reflectionContent } = payload;

    // ===== FEEDBACK TYPES (Anthropic direct) =====
    if (type === "feedback_leitura" || type === "feedback_esporte" || type === "feedback_lazer" || type === "feedback_espiritualidade") {
      const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
      if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

      let prompt = "";
      if (type === "feedback_leitura") {
        const { resumo = "", livro = "Livro" } = payload;
        prompt = `Você é Ana, terapeuta exigente de recuperação de ludopatia. O paciente leu "${livro}" e escreveu este resumo: "${resumo}". Se o resumo for vago, superficial ou genérico (palavras como "foi bom", "ok", "legal", "gostei"), seja DIRETA e exija mais profundidade — diga exatamente o que faltou e peça que ele releia e escreva de novo com calma. Se for bom, reconheça com especificidade, citando trechos do que ele escreveu. Máximo 3 frases. Nunca seja condescendente. Sem emojis.`;
      } else if (type === "feedback_esporte") {
        const { distancia_km = 0, tempo_min = 0, meta_km = null } = payload;
        const calorias = Math.round(distancia_km * 65);
        const ritmo = distancia_km > 0 ? (tempo_min / distancia_km).toFixed(1) : "0";
        prompt = `Você é Ana, terapeuta de recuperação de ludopatia. O paciente fez ${distancia_km}km em ${tempo_min}min (ritmo ${ritmo} min/km, ~${calorias} kcal queimadas)${meta_km ? `. Meta era ${meta_km}km` : ""}. Dê feedback real em 2-3 frases: cite os números, compare com a meta se houver, e conecte com a recuperação (foco, dopamina natural, disciplina). Tom firme e direto, sem elogios vazios. Sem emojis.`;
      } else if (type === "feedback_lazer") {
        const { resposta = "" } = payload;
        prompt = `Você é Ana, terapeuta acolhedora. O paciente registrou um momento de lazer e disse: "${resposta || "não relatou"}". Responda em 2 frases curtas, calorosas mas breves, valorizando o tempo dedicado a si mesmo. Sem emojis.`;
      } else {
        const { resposta = "" } = payload;
        prompt = `Você é Ana, terapeuta acolhedora. O paciente fez uma prática espiritual e relatou: "${resposta || "não relatou"}". Responda em 2 frases curtas e calorosas, conectando a prática com paz interior e recuperação. Sem emojis.`;
      }

      const ar = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!ar.ok) {
        const t = await ar.text();
        console.error("Anthropic error:", ar.status, t);
        return new Response(JSON.stringify({ error: `Anthropic ${ar.status}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ad = await ar.json();
      const feedback = ad?.content?.[0]?.text || "";
      return new Response(JSON.stringify({ feedback, message: feedback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    } else if (type === "weekly_plan") {
      // Generate full weekly workout plan based on fitness profile
      const { nivel, objetivo, dias_semana, tempo_disponivel, equipamento, peso_kg, altura_cm, restricoes, modalidade, week_number } = preferences || {};
      const dias = dias_semana || [];
      const numDias = dias.length;

      let splitDesc = "";
      if (modalidade === "academia" || !modalidade) {
        if (numDias <= 3) {
          splitDesc = `Dia A: Peito + Tríceps + Ombro\nDia B: Costas + Bíceps + Abdômen\nDia C: Pernas + Glúteos`;
        } else if (numDias === 4) {
          splitDesc = `Dia A: Peito + Tríceps\nDia B: Costas + Bíceps\nDia C: Pernas\nDia D: Ombro + Abdômen`;
        } else {
          splitDesc = `Dia A: Peito\nDia B: Costas\nDia C: Pernas\nDia D: Ombro + Abdômen\nDia E: Braços`;
        }

        const dayLetters = ["A", "B", "C", "D", "E"].slice(0, Math.min(numDias, 5));

        let exerciseCount = "";
        const dur = tempo_disponivel || 45;
        if (dur <= 15) exerciseCount = "APENAS 3-4 exercícios principais. SEM aquecimento separado. Direto ao ponto.";
        else if (dur <= 30) exerciseCount = "Aquecimento 5min + 5-6 exercícios + alongamento 3min.";
        else if (dur <= 45) exerciseCount = "Aquecimento 7min + 7-8 exercícios + alongamento 5min.";
        else exerciseCount = "Aquecimento 10min + 8-9 exercícios + 1 finalizador + alongamento 8min.";

        systemPrompt = `Você é um personal trainer profissional. Gere um plano semanal completo de treinos de academia.

Perfil do usuário:
- Nível: ${nivel || "Iniciante"}
- Objetivo: ${objetivo || "Saúde geral"}
- Tempo por treino: ${dur} minutos
- Equipamento: ${equipamento || "Academia completa"}
- Peso: ${peso_kg || "?"}kg, Altura: ${altura_cm || "?"}cm
- Restrições/lesões: ${restricoes || "nenhuma"}
- Semana número: ${week_number || 1} (VARIE os exercícios a cada semana para o mesmo grupo muscular - evite acomodação)

Divisão muscular:
${splitDesc}

${exerciseCount}

FORMATO: Cada exercício em UMA linha: "Nome — Xséries x Xreps — Xseg descanso". Sem descrições longas.

Responda em JSON EXATO:
{
  "days": [
    ${dayLetters.map(letter => `{
      "day_letter": "${letter}",
      "muscle_groups": ["grupo1", "grupo2"],
      "trainingName": "nome do treino",
      "exercises": [
        {"name": "exercício", "sets": 4, "reps": "10", "rest": "60seg", "notes": "opcional"}
      ]
    }`).join(",\n    ")}
  ]
}`;
        userPrompt = `Gere o plano da semana ${week_number || 1} agora.`;

      } else {
        // Caminhada / Corrida
        const mod = modalidade === "corrida" ? "corrida" : "caminhada";
        systemPrompt = `Você é um personal trainer. Gere um plano semanal progressivo de ${mod} para ${numDias} dias.

Perfil: Nível ${nivel || "Iniciante"}, Objetivo: ${objetivo || "Condicionamento"}, Tempo: ${tempo_disponivel || 30}min por sessão.
Semana ${week_number || 1}: ajuste a intensidade progressivamente (semana 1 mais leve, semana 4 mais intensa).

Formato SUCINTO. Máximo 5 linhas por dia.

Responda em JSON:
{
  "days": [
    ${dias.slice(0, numDias).map((_: string, i: number) => `{
      "day_letter": "${String.fromCharCode(65 + i)}",
      "muscle_groups": ["${mod}"],
      "trainingName": "${mod} dia ${i + 1}",
      "exercises": [{"name": "descrição sucinta do treino", "sets": 1, "reps": "1", "rest": "", "notes": ""}]
    }`).join(",\n    ")}
  ]
}`;
        userPrompt = `Gere o plano da semana ${week_number || 1}.`;
      }

    } else if (type === "sport") {
      const sportType = preferences?.type || "Corrida";
      const duration = preferences?.duration || 30;
      const level = preferences?.level || "Iniciante";

      if (sportType === "Caminhada") {
        systemPrompt = `Você é um personal trainer do app Apostando na Vida. Crie um plano de caminhada SUCINTO para ${duration} minutos, nível ${level}. Formato OBRIGATÓRIO: máximo 5 linhas, direto ao ponto. Responda em JSON: { "trainingName":"Caminhada ${duration}min", "text":"o plano em formato sucinto com setas →" }`;
      } else if (sportType === "Corrida") {
        systemPrompt = `Você é um personal trainer do app Apostando na Vida. Crie um plano de corrida SUCINTO para ${duration} minutos, nível ${level}. Formato OBRIGATÓRIO: máximo 6 linhas objetivo. Responda em JSON: { "trainingName":"Corrida ${duration}min - ${level}", "text":"o plano sucinto" }`;
      } else if (sportType === "Natação") {
        systemPrompt = `Você é um personal trainer do app Apostando na Vida. Crie um treino de natação SUCINTO para ${duration} minutos, nível ${level}. Formato OBRIGATÓRIO: máximo 6 linhas. Responda em JSON: { "trainingName":"Natação ${duration}min", "text":"o plano sucinto com séries" }`;
      } else {
        systemPrompt = `Você é um personal trainer. Crie um plano sucinto de ${sportType} para ${duration} minutos. Máximo 6 linhas. Responda em JSON: { "trainingName":"${sportType} ${duration}min", "text":"plano sucinto" }`;
      }
      userPrompt = `Modalidade: ${sportType}. Tempo: ${duration}min. Nível: ${level}.`;

    } else if (type === "workout") {
      const { peso, altura, objetivo, nivel, foco, level, focus, equipment, duration } = preferences || {};
      const dur = duration || 45;
      const actualLevel = nivel || level || "Iniciante";
      const actualFocus = foco || focus || "Full Body";
      const actualGoal = objetivo || "Saúde geral";

      let exerciseCount = "";
      if (dur <= 15) exerciseCount = "APENAS 3-4 exercícios principais. SEM aquecimento separado. Direto ao ponto.";
      else if (dur <= 30) exerciseCount = "Aquecimento 5min + 5-6 exercícios + alongamento 3min.";
      else if (dur <= 45) exerciseCount = "Aquecimento 7min + 7-8 exercícios + alongamento 5min.";
      else exerciseCount = "Aquecimento 10min + 8-9 exercícios + 1 finalizador + alongamento 8min.";

      systemPrompt = `Você é um personal trainer profissional do app Apostando na Vida. O usuário tem EXATAMENTE ${dur} minutos. ${exerciseCount}

Dados: Peso ${peso || "?"}kg, Altura ${altura || "?"}cm, Objetivo: ${actualGoal}, Nível: ${actualLevel}, Foco: ${actualFocus}.

FORMATO OBRIGATÓRIO — SUCINTO E OBJETIVO. Cada exercício em UMA linha: "Nome — Xséries x Xreps — Xseg descanso". Sem descrições longas.

Responda em JSON: { "trainingName":"${actualFocus} - ${actualGoal} (${dur}min)", "text":"o treino completo formatado linha por linha" }`;
      userPrompt = `Gere o treino agora. Equipamento: ${equipment || "Academia completa"}. Tempo: ${dur}min.`;

    } else if (type === "reading") {
      systemPrompt = `Você é uma curadora literária do app Apostando na Vida. Recomende 3 livros relevantes para recuperação de ludopatia/autoconhecimento. Use preferencialmente desta lista:
- "Em Busca de Sentido" - Viktor Frankl (Google Books gratuito disponível)
- "O Poder do Hábito" - Charles Duhigg
- "Os Quatro Compromissos" - Don Miguel Ruiz
- "Mindset" - Carol Dweck
- "A Coragem de Ser Imperfeito" - Brené Brown

Para cada livro inclua links Google Books e Amazon Brasil.
Responda em JSON: { "books": [{"title":"...", "author":"...", "summary":"...", "recoveryBenefit":"...", "googleBooksLink":"...", "amazonLink":"...", "isFree": true/false}], "dailyTip":"..." }`;
      userPrompt = `Tema preferido: ${preferences?.theme || "autoajuda"}. Tempo: ${preferences?.duration || 30} min.`;

    } else if (type === "spirituality") {
      const practice = preferences?.practice || "Meditação";
      const duration = preferences?.duration || 10;

      if (practice === "Meditação") {
        let meditationStructure = "";
        if (duration <= 5) {
          meditationStructure = `Apenas respiração guiada 4-7-8 (4min) + Afirmação final (1min). 2 seções.`;
        } else if (duration <= 10) {
          meditationStructure = `Respiração (3min) + Visualização positiva curta (5min) + Afirmação (2min). 3 seções.`;
        } else if (duration <= 15) {
          meditationStructure = `Respiração (3min) + Body scan (5min) + Visualização (5min) + Afirmação (2min). 4 seções.`;
        } else if (duration <= 20) {
          meditationStructure = `Respiração (4min) + Body scan (6min) + Visualização completa (7min) + Reflexão (3min). 4 seções.`;
        } else {
          meditationStructure = `Respiração (4min) + Body scan (6min) + Visualização (7min) + Reflexão (3min) + Journaling guiado (${duration - 20}min). 5 seções.`;
        }

        systemPrompt = `Você é uma guia espiritual acolhedora. O usuário tem ${duration} minutos. Crie um roteiro de meditação EXATAMENTE para este tempo. ${meditationStructure}
Responda em JSON: { "title":"Meditação de ${duration} minutos", "sections": [{"name":"nome", "duration":"Xmin", "instructions":"instruções detalhadas"}], "closingMessage":"mensagem acolhedora" }`;
      } else {
        systemPrompt = `Você é uma guia espiritual acolhedora. Gere um guia de ${practice} de ${duration} minutos. Responda em JSON: { "title":"...", "steps": ["passo 1...", "passo 2..."], "closingMessage":"...", "verse":"...ou null", "deepQuestion":"...ou null" }`;
      }
      userPrompt = `Prática: ${practice}. Duração: ${duration}min. Nome: ${userName || "amigo(a)"}`;

    } else if (type === "social") {
      const socialWith = preferences?.with || "Família";
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. Sugira uma atividade de interação social concreta com ${socialWith}. Responda em JSON: { "suggestion":"descrição da atividade", "whyItHelps":"por que faz bem na recuperação" }`;
      userPrompt = `Tipo: ${socialWith}. Nome: ${userName || "amigo(a)"}`;

    } else if (type === "feedback") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. O usuário acabou de completar uma atividade. Dê um feedback carinhoso em 2-3 frases. Tom acolhedor.`;
      userPrompt = `Nome: ${userName || "amigo(a)"}. Categoria: ${category}. Avaliação: ${preferences?.rating}/5. Relato: ${preferences?.report || "sem relato"}`;

    } else if (type === "reflection") {
      systemPrompt = `Você é Ana, terapeuta do app Apostando na Vida. Responda a reflexão noturna com uma carta curta (2-3 parágrafos) validando e encorajando. Tom: amiga terapeuta.`;
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
        max_tokens: 3000,
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
