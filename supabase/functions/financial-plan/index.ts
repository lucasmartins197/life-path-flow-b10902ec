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

    const prompt = `Você é Ana, consultora financeira do app Apostando na Vida. O usuário está em recuperação de ludopatia.

DADOS FINANCEIROS DO USUÁRIO:
- Renda mensal líquida: R$ ${totalIncome}
- Total de despesas fixas: R$ ${totalExpenses}
- Total de dívidas: R$ ${totalDebts}
- Saldo livre estimado: R$ ${totalIncome - totalExpenses}
- Objetivo: ${goal || "Organizar finanças"}
- Prazo: ${goal_deadline || "6 meses"}

DESPESAS FIXAS:
${expensesDescription}

DÍVIDAS:
${debtsDescription}

Responda APENAS com JSON válido neste formato (sem markdown):
{
  "health_score": número de 0 a 100 representando saúde financeira,
  "health_level": "critico" ou "atencao" ou "estavel" ou "saudavel",
  "diagnosis": "diagnóstico em 2 linhas máximo",
  "urgent_actions": ["ação 1", "ação 2", "ação 3"],
  "budget_distribution": {
    "essenciais_percent": número,
    "dividas_percent": número,
    "reserva_percent": número,
    "pessoal_percent": número
  },
  "debt_strategy": {
    "method": "avalanche" ou "bola_de_neve",
    "explanation": "explicação simples em 1 linha",
    "priority_order": ["dívida prioritária 1", "dívida 2"]
  },
  "monthly_goal": {
    "description": "meta do mês",
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
