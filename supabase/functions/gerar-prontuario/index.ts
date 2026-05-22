import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const user_id = body.user_id || claims.claims.sub;

    // Garante que só pode gerar para si mesmo (a menos que admin)
    if (user_id !== claims.claims.sub) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: claims.claims.sub, _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Coleta dados do paciente
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const [onboardingRes, tasksRes, journeyRes] = await Promise.all([
      supabase.from("onboarding_clinico").select("*").eq("user_id", user_id).maybeSingle(),
      supabase.from("daily_tasks").select("categoria, concluido, data, progresso")
        .eq("user_id", user_id).gte("data", thirtyDaysAgo).order("data", { ascending: false }),
      supabase.from("journey_progress").select("step_number, is_completed, completed_at").eq("user_id", user_id),
    ]);

    const tasks = tasksRes.data || [];
    const journey = journeyRes.data || [];
    const dataset = {
      onboarding_clinico: onboardingRes.data,
      total_tarefas: tasks.length,
      tarefas_concluidas: tasks.filter((t: any) => t.concluido).length,
      tarefas_por_categoria: tasks.reduce((acc: any, t: any) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + (t.concluido ? 1 : 0);
        return acc;
      }, {}),
      passos_concluidos: journey.filter((j: any) => j.is_completed).length,
      passos_iniciados: journey.length,
      data_geracao: new Date().toISOString(),
    };

    const systemPrompt = `Você é um sistema clínico especializado em ludopatia (vício em jogos de azar).
Gere um prontuário clínico em JSON estritamente neste formato:
{
  "resumo_clinico": "string com 2-4 parágrafos descrevendo estado clínico, evolução e contexto",
  "nivel_risco": "baixo" | "medio" | "alto" | "critico",
  "recomendacoes": ["string", "string", ...] (3-6 recomendações práticas),
  "pontos_atencao": ["string", "string", ...] (2-5 pontos de atenção clínica)
}
Use tom profissional, clínico, em português brasileiro. NÃO invente dados — se faltar info, indique "dados insuficientes".`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados do paciente:\n${JSON.stringify(dataset, null, 2)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content;
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("IA retornou resposta inválida");
    }

    const validRisk = ["baixo", "medio", "alto", "critico"];
    const nivel_risco = validRisk.includes(parsed.nivel_risco) ? parsed.nivel_risco : "baixo";

    const prontuario = {
      user_id,
      resumo_clinico: String(parsed.resumo_clinico || ""),
      nivel_risco,
      recomendacoes: Array.isArray(parsed.recomendacoes) ? parsed.recomendacoes : [],
      pontos_atencao: Array.isArray(parsed.pontos_atencao) ? parsed.pontos_atencao : [],
      gerado_em: new Date().toISOString(),
    };

    const { data: saved, error: saveErr } = await supabase
      .from("prontuarios")
      .upsert(prontuario, { onConflict: "user_id" })
      .select()
      .single();

    if (saveErr) {
      console.error("Save error", saveErr);
      throw saveErr;
    }

    return new Response(JSON.stringify({ success: true, prontuario: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gerar-prontuario error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
