import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const N8N_URL = "https://apostandonavida.app.n8n.cloud/webhook/concluir-tarefa";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { task_id, resposta_usuario, metricas_usuario } = body ?? {};
    if (!task_id || typeof task_id !== "string") {
      return new Response(JSON.stringify({ error: "task_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: task, error: taskErr } = await service
      .from("daily_tasks")
      .select("id, user_id, categoria")
      .eq("id", task_id)
      .maybeSingle();
    if (taskErr || !task || task.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: Record<string, unknown> = { task_id };
    if (metricas_usuario && typeof metricas_usuario === "object") {
      payload.metricas_usuario = metricas_usuario;
    }
    if (typeof resposta_usuario === "string") {
      payload.resposta_usuario = resposta_usuario;
    }

    let feedback = "";
    let webhookOk = false;
    try {
      const resp = await fetch(N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await resp.text();
      try {
        const json = JSON.parse(text);
        feedback = json?.feedback ?? "";
        webhookOk = json?.success === true || resp.ok;
      } catch {
        webhookOk = resp.ok;
      }
    } catch (e) {
      console.error("Webhook error:", e);
    }

    // Persist on daily_tasks
    const updates: Record<string, unknown> = {
      concluido: true,
      concluido_em: new Date().toISOString(),
    };
    if (typeof resposta_usuario === "string") updates.resposta_usuario = resposta_usuario;
    if (metricas_usuario && typeof metricas_usuario === "object") updates.metricas_usuario = metricas_usuario;
    if (feedback) updates.feedback_ia = feedback;

    await service.from("daily_tasks").update(updates).eq("id", task_id);

    return new Response(
      JSON.stringify({ success: true, feedback, webhook_ok: webhookOk }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("concluir-tarefa error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
