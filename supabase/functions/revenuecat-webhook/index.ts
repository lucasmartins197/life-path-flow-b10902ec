import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// revenuecat-webhook
// Recebe os eventos do RevenueCat (compras/renovacoes/cancelamentos da Apple)
// e mantem o subscription_status do perfil sincronizado no banco.
//
// Sem isto, a ativacao so acontecia no aparelho na hora da compra — e as
// RENOVACOES mensais nao atualizavam o servidor, entao assinantes iOS eram
// barrados no paywall a partir do 2o mes. Este webhook resolve isso.
//
// Config no RevenueCat: Project → Integrations → Webhooks → apontar para a URL
// desta funcao, com o header Authorization = valor do secret REVENUECAT_WEBHOOK_AUTH.
// ─────────────────────────────────────────────────────────────────────────────

const ENTITLEMENT_ID = "Saindo do Jogo Pro";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Autenticacao: o RevenueCat envia o header Authorization com o valor
    //    que configuramos. Barramos qualquer chamada sem o segredo correto.
    const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
    const authHeader = req.headers.get("Authorization");
    if (!expected || authHeader !== expected) {
      console.error("revenuecat-webhook: auth invalida");
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const event = body?.event;
    if (!event) return json({ error: "Sem evento" }, 400);

    const type: string = event.type || "";
    // app_user_id = o user_id do Supabase (setado no Purchases.logIn do app)
    const appUserId: string | undefined =
      event.app_user_id || event.original_app_user_id;
    // Quando a assinatura expira (ms desde epoch). Pode vir nulo em alguns eventos.
    const expirationMs: number | null = event.expiration_at_ms ?? null;

    console.log("revenuecat-webhook:", type, "user:", appUserId, "exp:", expirationMs);

    if (!appUserId) {
      // Alguns eventos de teste nao trazem user — respondemos 200 para o
      // RevenueCat nao reenviar em loop, mas nao fazemos nada.
      return json({ ok: true, ignored: "sem app_user_id" });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2. Traduzir o tipo de evento do RevenueCat para o nosso subscription_status.
    //    Eventos que DAO acesso: compra inicial, renovacao, reativacao, mudanca
    //    de produto, e o "uncancellation". Eventos que TIRAM acesso: expiracao.
    //    O cancelamento (CANCELLATION) apenas agenda o fim — o acesso continua
    //    ate expirar, entao marcamos "canceling", nao "inactive".
    let novoStatus: string | null = null;

    switch (type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "PRODUCT_CHANGE":
      case "UNCANCELLATION":
      case "SUBSCRIPTION_EXTENDED":
        novoStatus = "active";
        break;
      case "CANCELLATION":
        // Cancelou a renovacao, mas ainda tem acesso ate expirar.
        novoStatus = "canceling";
        break;
      case "EXPIRATION":
        // Acabou de fato — perde o acesso.
        novoStatus = "inactive";
        break;
      case "BILLING_ISSUE":
        novoStatus = "past_due";
        break;
      default:
        // TRANSFER, TEST, etc. — nao mexem no acesso.
        console.log("revenuecat-webhook: evento sem acao:", type);
        return json({ ok: true, ignored: type });
    }

    // 3. Atualizar o perfil. O app_user_id e o user_id do Supabase, que pode
    //    estar na coluna id ou user_id — tentamos as duas para garantir.
    const updates: Record<string, unknown> = { subscription_status: novoStatus };
    if (expirationMs) {
      updates.subscription_end = new Date(expirationMs).toISOString();
    }

    let { data: upd, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", appUserId)
      .select("id");

    if (!error && (!upd || upd.length === 0)) {
      const fb = await admin
        .from("profiles")
        .update(updates)
        .eq("user_id", appUserId)
        .select("id");
      upd = fb.data;
      error = fb.error;
    }

    if (error) {
      console.error("revenuecat-webhook: falha ao atualizar perfil:", error.message);
      return json({ error: error.message }, 500);
    }
    if (!upd || upd.length === 0) {
      console.error("revenuecat-webhook: perfil nao encontrado para", appUserId);
      // 200 mesmo assim: o usuario pode nao existir mais; nao adianta reenviar.
      return json({ ok: true, warning: "perfil nao encontrado" });
    }

    console.log(`revenuecat-webhook: ${appUserId} -> ${novoStatus}`);
    return json({ ok: true, status: novoStatus });
  } catch (err: any) {
    console.error("revenuecat-webhook error:", err);
    return json({ error: err.message }, 500);
  }
});
