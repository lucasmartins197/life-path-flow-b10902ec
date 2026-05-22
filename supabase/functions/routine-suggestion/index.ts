import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const YT_ESP = [
  "https://www.youtube.com/watch?v=inpok4MKVLM",
  "https://www.youtube.com/watch?v=86m4RC_ADEY",
  "https://www.youtube.com/watch?v=ZToicYcHIOU",
  "https://www.youtube.com/watch?v=1vx8iUvfyCY",
];

const GYM_SPLIT = ["Peito e tríceps", "Costas e bíceps", "Pernas", "Ombros e abdômen", "Peito e ombro", "Costas e pernas", "Descanso ativo"];

function dayIndex() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = (d.getTime() - start.getTime()) / 86400000;
  return Math.floor(diff);
}

const PROMPTS: Record<string, (p: any, ctx?: any) => string> = {
  leitura: (p, ctx) => {
    if (ctx?.livroAtual?.livro_titulo) {
      const proxPag = (ctx.livroAtual.pagina_atual || 0) + (ctx.livroAtual.paginas_por_dia || 15);
      return `Você é assistente de recuperação de ludopatia. O usuário está lendo "${ctx.livroAtual.livro_titulo}" e está na página ${ctx.livroAtual.pagina_atual}. Escreva exatamente: "Continue lendo ${ctx.livroAtual.livro_titulo} — você está na página ${ctx.livroAtual.pagina_atual}, leia até a página ${proxPag} hoje". Máximo 2 linhas.`;
    }
    return `Você é assistente de recuperação de ludopatia. Sugira UM livro específico hoje (título e autor) tema: ${p.leitura_tipo || "autoconhecimento"}. Diga quantas páginas ler (10-20). Máximo 2 linhas.`;
  },
  esporte: (p) => {
    const tipo = p.esporte_tipo || "corrida";
    const nivel = p.esporte_nivel || "iniciante";
    const tempo = p.esporte_tempo || 30;
    if (tipo === "academia") {
      const grupo = GYM_SPLIT[dayIndex() % GYM_SPLIT.length];
      return `Você é personal trainer. Monte treino de academia HOJE focado em: ${grupo}. Nível ${nivel}, ${tempo} minutos. Liste 4 a 5 exercícios com séries e repetições no formato "Nome Xx12" separados por vírgula. Comece a resposta com "Hoje: ${grupo}." e depois a lista. Máximo 3 linhas, sem markdown.`;
    }
    const dist = nivel === "iniciante" ? "3 km" : nivel === "intermediário" ? "5 km" : "8 km";
    const pace = nivel === "iniciante" ? "7:30/km" : nivel === "intermediário" ? "6:00/km" : "5:00/km";
    return `Você é treinador de corrida. Monte plano de corrida HOJE: ${dist} em pace ${pace}, nível ${nivel}, total ${tempo}min. Estrutura: aquecimento (caminhada 5min) + parte principal (corrida na distância/pace) + desaquecimento (caminhada 5min + alongamento). Liste cada bloco com tempo exato. Máximo 4 linhas, sem markdown.`;
  },
  lazer: () =>
    `Você é assistente de recuperação de ludopatia. Sugira UMA atividade de lazer saudável específica para hoje, diferente de apostar. Máximo 2 linhas.`,
  espiritualidade: () =>
    `Você é assistente de recuperação de ludopatia. Sugira prática espiritual específica hoje (1 frase prática). Máximo 1 linha, sem markdown.`,
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { categoria, prefs, context } = await req.json();
    const builder = PROMPTS[categoria];
    if (!builder) {
      return new Response(JSON.stringify({ error: "categoria inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = builder(prefs || {}, context || {});

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Responda em português, direto, sem markdown, no máximo 4 linhas curtas." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      if (r.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido, tente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (r.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    let sugestao = data.choices?.[0]?.message?.content?.trim() || "";

    if (categoria === "espiritualidade") {
      const url = YT_ESP[dayIndex() % YT_ESP.length];
      sugestao = `${sugestao}\n${url}`;
    }

    return new Response(JSON.stringify({ sugestao }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
