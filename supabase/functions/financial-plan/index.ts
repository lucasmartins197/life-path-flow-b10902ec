import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { income, fixed_expenses, debts, goal, goal_deadline } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const totalIncome = income?.monthly || 0;
    const totalExpenses = Array.isArray(fixed_expenses)
      ? fixed_expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)
      : 0;
    const totalDebts = Array.isArray(debts)
      ? debts.reduce((s: number, d: any) => s + (d.total || d.balance || 0), 0)
      : 0;

    const debtsDescription = Array.isArray(debts)
      ? debts.map((d: any) => `- ${d.type || "Dívida"}: R$ ${d.total || d.balance || 0} (parcela R$ ${d.monthly_payment || 0}, juros ${d.interest_rate || 0}%)`).join("\n")
      : "Nenhuma dívida informada";

    const expensesDescription = Array.isArray(fixed_expenses)
      ? fixed_expenses.map((e: any) => `- ${e.name}: R$ ${e.amount}`).join("\n")
      : "Nenhuma despesa fixa";

    const prompt = `Você é Ana, consultora financeira do app "Apostando na Vida". O usuário está em RECUPERAÇÃO DE LUDOPATIA (dependência de apostas). Seu papel não é só listar números — é orientar com empatia, firmeza e prática, como um consultor financeiro que entende o contexto de recuperação.

PRINCÍPIOS QUE VOCÊ DEVE SEGUIR:
1. Priorize SEMPRE a quitação de dívidas de apostas — elas mantêm o gatilho ativo.
2. Em seguida, ataque dívidas de juros mais altos (cartão, cheque especial).
3. Reconstrução de uma reserva de emergência mínima (1 mês de despesas) é essencial antes de "investir".
4. Celebre marcos financeiros como parte da jornada de recuperação ("cada R$ 100 quitados é um dia de liberdade").
5. Nunca julgue. Use linguagem de cuidado, não de cobrança.
6. Seja específico: cite valores, prazos, ações concretas — nada de conselhos genéricos.

DADOS FINANCEIROS DO USUÁRIO:
- Renda mensal líquida: R$ ${totalIncome}
- Total de despesas fixas: R$ ${totalExpenses}
- Total de dívidas: R$ ${totalDebts}
- Saldo livre estimado: R$ ${totalIncome - totalExpenses}
- Objetivo declarado: ${goal || "Organizar finanças"}
- Prazo: ${goal_deadline || "6 meses"}

DESPESAS FIXAS:
${expensesDescription}

DÍVIDAS:
${debtsDescription}

Responda APENAS com JSON válido neste formato (sem markdown, sem texto fora do JSON):
{
  "health_score": número de 0 a 100 representando saúde financeira,
  "health_level": "critico" ou "atencao" ou "estavel" ou "saudavel",
  "diagnosis": "diagnóstico em 2 linhas, tom de cuidado",
  "coach_message": "1 a 2 frases curtas de orientação prática e específica para o saldo/contexto atual do usuário — ex: 'Você está gastando 80% da sua renda. Sua prioridade esta semana é cortar gastos variáveis.' Cite valores ou percentuais reais.",
  "urgent_actions": ["ação 1 específica e prática", "ação 2", "ação 3"],
  "practical_tips": ["dica prática 1 com valor ou ação concreta", "dica 2", "dica 3"],
  "recovery_milestone": "1 marco financeiro a celebrar este mês ligado à recuperação (ex: 'Quitar R$ 300 da dívida de apostas = 10 dias longe do gatilho')",
  "budget_distribution": {
    "essenciais_percent": número,
    "dividas_percent": número,
    "reserva_percent": número,
    "pessoal_percent": número
  },
  "debt_strategy": {
    "method": "avalanche" ou "bola_de_neve",
    "explanation": "explicação simples em 1 linha, justificando a escolha para o caso DESTE usuário",
    "priority_order": ["dívida prioritária 1", "dívida 2"]
  },
  "monthly_goal": {
    "description": "meta do mês, prática e mensurável",
    "amount": número em reais
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("financial-plan error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
