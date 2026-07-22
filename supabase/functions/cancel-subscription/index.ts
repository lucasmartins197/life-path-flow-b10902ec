import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Perfis podem ser identificados por user_id ou por id — tentamos os dois.
    let { data: profile } = await admin
      .from("profiles")
      .select("id, user_id, stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      const fb = await admin
        .from("profiles")
        .select("id, user_id, stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();
      profile = fb.data;
    }

    if (!profile) {
      console.error("cancel-subscription: perfil nao encontrado para", userId);
      // status 200 de proposito: o frontend usa functions.invoke e mostra
      // data.error como mensagem; um 4xx viraria erro generico na tela.
      return json({ error: "Perfil não encontrado. Fale com o suporte." });
    }

    // Sem customer_id nao ha o que cancelar no Stripe. Antes retornavamos
    // success: true aqui — o usuario via "cancelado" e continuava sendo
    // cobrado. Agora contamos a verdade.
    if (!profile.stripe_customer_id) {
      console.error("cancel-subscription: sem stripe_customer_id para", userId);
      return json({
        error:
          "Não localizamos sua assinatura no sistema de pagamento. " +
          "Fale com o suporte: contato@apostandonavida.com.br",
      });
    }

    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 10,
    });

    let canceladas = 0;
    for (const sub of subs.data) {
      // Cancela no fim do periodo pago, nao imediatamente
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      canceladas++;
    }
    console.log(
      `cancel-subscription: ${canceladas} assinatura(s) marcada(s) para cancelar`,
      "customer:", profile.stripe_customer_id
    );

    // Mantem acesso ativo ate o fim do periodo — so marca que vai cancelar.
    // O webhook (customer.subscription.updated) tambem gravara "canceling".
    const { error: updErr } = await admin
      .from("profiles")
      .update({ subscription_status: "canceling" })
      .eq("id", profile.id);
    if (updErr) {
      console.error("cancel-subscription: falha ao marcar canceling:", updErr.message);
    }

    return json({ success: true, canceladas });
  } catch (err: any) {
    console.error("cancel-subscription error:", err);
    return json({ error: err.message }, 500);
  }
});
