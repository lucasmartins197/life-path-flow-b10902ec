import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOPICS: Record<string, string> = {
  dividas: `Explique de forma clara e didática, em português do Brasil, sobre dívidas por apostas e superendividamento.
Cubra:
- Lei do Superendividamento (Lei 14.181/2021)
- Direitos do devedor
- Como negociar dívidas (audiência conciliatória, plano de pagamento até 5 anos)
- O que o credor pode e NÃO pode fazer (cobrança vexatória, ligações abusivas)
- Mínimo existencial
Formate em markdown com seções e bullets. Tom acolhedor, sem juridiquês excessivo.`,
  patrimonio: `Explique de forma clara e didática, em português do Brasil, sobre proteção do patrimônio familiar para quem tem problemas com apostas.
Cubra:
- Bem de família (Lei 8.009/1990) — impenhorabilidade do imóvel residencial
- Regimes de bens no casamento (comunhão parcial, total, separação)
- Como proteger o imóvel da família
- Limites e exceções
Formate em markdown. Tom educativo e acolhedor.`,
  trabalho: `Explique de forma clara e didática sobre direitos trabalhistas e ludopatia.
Cubra:
- Ludopatia como doença reconhecida pela OMS (CID F63.0 / CID-11 6C50)
- Direito ao afastamento pelo INSS (auxílio-doença)
- Como solicitar afastamento médico
- Estabilidade após retorno
- Sigilo médico no trabalho
Formate em markdown. Tom acolhedor.`,
  negativado: `Explique de forma clara e didática sobre nome negativado e como limpar.
Cubra:
- SPC e Serasa — como funcionam
- Prazo de prescrição de 5 anos (CDC art. 43, §1º)
- Como negociar dívidas (Serasa Limpa Nome, Desenrola Brasil)
- Direitos do consumidor negativado
- Como acompanhar o score
Formate em markdown. Tom prático.`,
  autoexclusao: `Explique de forma clara e didática sobre medidas de autoexclusão de apostas.
Cubra:
- Lei das Apostas Esportivas (Lei 14.790/2023)
- Como solicitar autoexclusão em plataformas regulamentadas
- Registro no SPA/Ministério da Fazenda
- Como registrar reclamações no PROCON, CONAR e Senacon
- Direito ao bloqueio de publicidade
Formate em markdown. Tom protetivo.`,
  familia: `Explique de forma clara e didática sobre o impacto da ludopatia em divórcio, guarda e pensão.
Cubra:
- Divórcio e partilha de bens com dívidas de apostas
- Guarda de filhos — como o vício pode ser considerado
- Pensão alimentícia
- Importância do laudo médico (CID F63.0) em processos
- Mediação familiar
Formate em markdown. Tom acolhedor e sem julgamento.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    const prompt = TOPICS[topic];
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Tópico inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente jurídico educativo brasileiro. Suas respostas são informativas, NÃO substituem consulta a advogado. Use linguagem clara, acolhedora e sem julgamento. Sempre lembre ao final que é importante consultar um profissional para o caso específico.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns instantes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Não foi possível gerar a explicação.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("legal-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
