import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// checkout — pagamento Stripe no app com retorno via DEEP LINK (profissional)
//
// Fluxo no app:
// 1. abrirCheckoutStripe abre o Stripe num navegador interno (@capacitor/browser)
// 2. Ao terminar, o Stripe redireciona para saindodojogo://pagamento?status=...
// 3. O Android reconhece o deep link, e o @capacitor/app dispara "appUrlOpen"
// 4. Nosso listener FECHA o navegador e chama o callback (que checa o banco)
//
// Na web, tudo continua com redirect normal (sem deep link).
// ─────────────────────────────────────────────────────────────────────────────

function isNativeApp(): boolean {
  try {
    const cap = (window as any)?.Capacitor;
    if (cap && typeof cap.getPlatform === "function") {
      const plat = cap.getPlatform();
      return plat === "ios" || plat === "android";
    }
    return false;
  } catch {
    return false;
  }
}

async function loadBrowser(): Promise<any | null> {
  try {
    const mod = await import(/* @vite-ignore */ "@capacitor/browser");
    return mod;
  } catch {
    return null;
  }
}

async function loadApp(): Promise<any | null> {
  try {
    const mod = await import(/* @vite-ignore */ "@capacitor/app");
    return mod;
  } catch {
    return null;
  }
}

// Guarda o callback do checkout em andamento, para o deep link chamar ao voltar.
let retornoPendente: ((status: string, tipo: string) => void | Promise<void>) | null = null;

/**
 * Inicializa o listener de deep link UMA vez (chamar no arranque do app).
 * Quando o Stripe redireciona para saindodojogo://pagamento?status=...&tipo=...,
 * fecha o navegador interno e dispara o callback pendente.
 */
export async function initDeepLinkPagamento(): Promise<void> {
  if (!isNativeApp()) return;
  const appMod = await loadApp();
  if (!appMod?.App) return;

  appMod.App.addListener("appUrlOpen", async (event: { url: string }) => {
    const url = event?.url || "";
    if (!url.startsWith("saindodojogo://pagamento")) return;

    // Fecha o navegador interno do Stripe
    const browserMod = await loadBrowser();
    try { await browserMod?.Browser?.close(); } catch { /* ignore */ }

    // Extrai status e tipo do deep link
    const params = new URLSearchParams(url.split("?")[1] || "");
    const status = params.get("status") || "";
    const tipo = params.get("tipo") || "";

    if (retornoPendente) {
      const cb = retornoPendente;
      retornoPendente = null;
      // da um tempo para o webhook do Stripe gravar antes de checar
      await new Promise((r) => setTimeout(r, 1500));
      await cb(status, tipo);
    }
  });
}

/**
 * Abre o checkout do Stripe.
 * @param checkoutUrl URL do create-checkout-session (ja vem com deep link no app)
 * @param onReturn    Chamado quando o deep link volta (status: "sucesso"|"cancelado")
 */
export async function abrirCheckoutStripe(
  checkoutUrl: string,
  onReturn?: (status: string, tipo: string) => void | Promise<void>
): Promise<void> {
  if (!isNativeApp()) {
    window.location.href = checkoutUrl;
    return;
  }

  const mod = await loadBrowser();
  if (!mod?.Browser) {
    window.location.href = checkoutUrl;
    return;
  }

  // Registra o callback para o deep link chamar quando o Stripe voltar
  if (onReturn) retornoPendente = onReturn;

  await mod.Browser.open({ url: checkoutUrl, presentationStyle: "fullscreen" });
}

/** Diz ao checkout se estamos no app (para ele mandar deep link). */
export function ehAppNativo(): boolean {
  return isNativeApp();
}

export async function checarAssinaturaAtiva(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  const status = (data as any)?.subscription_status;
  return status === "active" || status === "canceling";
}

export async function checarPagamentoRecente(
  userId: string,
  paymentType: string
): Promise<boolean> {
  const desde = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("payment_type", paymentType)
    .gte("created_at", desde)
    .limit(1);
  return !!data && data.length > 0;
}
