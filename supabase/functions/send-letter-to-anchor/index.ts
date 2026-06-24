import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const letterContent = (body?.letter_content ?? "").toString().trim();
    const userName = (body?.user_name ?? "Usuário(a)").toString().trim();

    if (letterContent.length < 50) {
      return new Response(JSON.stringify({ error: "letter_content too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: anchor } = await admin
      .from("anchor_contacts")
      .select("name, phone, email")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!anchor) {
      return new Response(JSON.stringify({ error: "Nenhum âncora cadastrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist a record of the send by marking the letter
    await admin
      .from("journey_letters")
      .update({ sent_to_anchor: true })
      .eq("user_id", userId)
      .eq("step_number", 3);

    // Notify (best effort) — actual e-mail/WhatsApp delivery handled by external integrations
    await admin.from("notifications").insert({
      user_id: userId,
      type: "letter_to_anchor",
      title: "Carta enviada ao âncora",
      message: `Carta para ${anchor.name} foi registrada.`,
    }).then(() => {}, () => {});

    return new Response(
      JSON.stringify({
        success: true,
        anchor: { name: anchor.name },
        user_name: userName,
        preview: letterContent.slice(0, 120),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
