import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// abrirCheckoutStripe — abre o checkout do Stripe do jeito certo em cada ambiente
//
// Problema que isto resolve: no app Android empacotado, fazer
// window.location.href = url_do_stripe joga o usuario para o navegador do
// SISTEMA (fora do app). Depois de pagar, o Stripe redireciona para o site web
// e o APP nunca fica sabendo — a tela nao atualiza.
//
// Solucao: no app (Capacitor), abrimos o Stripe num navegador INTERNO
// (@capacitor/browser). Quando o usuario termina e fecha esse navegador,
// verificamos no banco se o pagamento foi confirmado (o webhook do Stripe grava
// de forma confiavel) e atualizamos a tela. Sem depender de deep link fragil.
//
// Na web, o comportamento continua o de sempre (redirect normal).
// ─────────────────────────────────────────────────────────────────────────────

function isNativeApp(): boolean {
  const cap = (window as any)?.Capacitor;
  return !!cap?.isNativePlatform?.();
}

async function loadBrowser(): Promise<any | null> {
  try {
    const mod = await import(/* @vite-ignore */ "@capacitor/browser");
    return mod;
  } catch {
    return null;
  }
}

/**
 * Abre o checkout do Stripe.
 * @param checkoutUrl  URL retornada pelo create-checkout-session
 * @param onReturn     Chamado quando o usuario volta do navegador interno (só no app).
 *                     Use para recarregar o perfil / checar se o pagamento entrou.
 */
export async function abrirCheckoutStripe(
  checkoutUrl: string,
  onReturn?: () => void | Promise<void>
): Promise<void> {
  // Web (ou se o plugin nao carregar): redirecionamento normal, como sempre.
  if (!isNativeApp()) {
    window.location.href = checkoutUrl;
    return;
  }

  const mod = await loadBrowser();
  if (!mod?.Browser) {
    // Sem o plugin, cai no comportamento antigo para nao travar o usuario.
    window.location.href = checkoutUrl;
    return;
  }

  const { Browser } = mod;

  // Quando o usuario fecha o navegador interno (apos pagar ou desistir),
  // disparamos o onReturn uma unica vez.
  const listener = await Browser.addListener("browserFinished", async () => {
    try {
      await listener.remove();
    } catch {
      /* ignore */
    }
    if (onReturn) await onReturn();
  });

  // Abre o Stripe dentro do app.
  await Browser.open({ url: checkoutUrl, presentationStyle: "fullscreen" });
}

/**
 * Verifica no banco se a assinatura do usuario ficou ativa.
 * Usado apos o retorno do checkout no app. O webhook do Stripe ja gravou
 * subscription_status = "active" quando o pagamento foi confirmado.
 */
export async function checarAssinaturaAtiva(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  const status = (data as any)?.subscription_status;
  return status === "active" || status === "canceling";
}

/**
 * Verifica no banco se ha um pagamento recente de um tipo (terapia/juridico).
 * Usado apos o retorno do checkout desses servicos no app.
 */
export async function checarPagamentoRecente(
  userId: string,
  paymentType: string
): Promise<boolean> {
  const desde = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // ultimos 30 min
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("payment_type", paymentType)
    .gte("created_at", desde)
    .limit(1);
  return !!data && data.length > 0;
}
