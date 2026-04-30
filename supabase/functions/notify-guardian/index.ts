import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, guardian, event_id } = body || {};
    if (!type || !guardian) {
      return new Response(JSON.stringify({ error: "type and guardian required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (!webhookUrl) {
      console.warn("N8N_WEBHOOK_URL not configured — skipping external notify.");
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "no_webhook_configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      flow: "guardian_notification",
      type, // "invite" | "temptation"
      guardian: {
        name: guardian.guardian_name,
        email: guardian.guardian_email,
        phone: guardian.guardian_phone,
      },
      event_id: event_id || null,
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, body: text.slice(0, 500) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("notify-guardian error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
