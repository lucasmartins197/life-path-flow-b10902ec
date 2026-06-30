// src/lib/revenuecat.ts
// Integração com RevenueCat para In-App Purchase no iOS.
// Projetado para NÃO quebrar o build web/Android: o pacote RevenueCat é
// carregado dinamicamente só quando o app roda como app nativo iOS.
// No Android/web, todas as funções retornam cedo e o app continua com Stripe.

const REVENUECAT_APPLE_API_KEY = "appl_XZdQKDutyJKeAZcKTIIIQAkWurv";
const ENTITLEMENT_ID = "Saindo do Jogo Pro";

let isConfigured = false;

export function isIOSNative(): boolean {
  try {
    // @ts-ignore - Capacitor é injetado no app nativo
    const cap = (window as any)?.Capacitor;
    if (cap && typeof cap.getPlatform === "function") {
      return cap.getPlatform() === "ios";
    }
    return false;
  } catch {
    return false;
  }
}

async function loadPurchases(): Promise<any | null> {
  try {
    const mod = await import(
      /* @vite-ignore */ "@revenuecat/purchases-capacitor"
    );
    return mod;
  } catch {
    return null;
  }
}

export async function initRevenueCat(supabaseUserId: string): Promise<void> {
  if (!isIOSNative() || !supabaseUserId) return;
  const mod = await loadPurchases();
  if (!mod) return;
  try {
    const { Purchases, LOG_LEVEL } = mod;
    if (!isConfigured) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({
        apiKey: REVENUECAT_APPLE_API_KEY,
        appUserID: supabaseUserId,
      });
      isConfigured = true;
    } else {
      await Purchases.logIn({ appUserID: supabaseUserId });
    }
  } catch (e) {
    console.error("Erro ao inicializar RevenueCat:", e);
  }
}

export async function hasActiveAppleSubscription(): Promise<boolean> {
  if (!isIOSNative()) return false;
  const mod = await loadPurchases();
  if (!mod) return false;
  try {
    const { Purchases } = mod;
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  } catch (e) {
    console.error("Erro ao verificar assinatura Apple:", e);
    return false;
  }
}

export async function purchaseAppleSubscription(): Promise<{
  success: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  if (!isIOSNative()) return { success: false, error: "Não é iOS" };
  const mod = await loadPurchases();
  if (!mod) return { success: false, error: "RevenueCat indisponível" };
  try {
    const { Purchases } = mod;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current || current.availablePackages.length === 0) {
      return { success: false, error: "Nenhum pacote disponível" };
    }
    const monthlyPackage = current.monthly ?? current.availablePackages[0];
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: monthlyPackage,
    });
    const isActive =
      typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    return { success: isActive };
  } catch (e: any) {
    if (
      e?.code === "1" ||
      e?.userCancelled ||
      e?.message?.toLowerCase?.().includes("cancel")
    ) {
      return { success: false, cancelled: true };
    }
    console.error("Erro na compra Apple:", e);
    return { success: false, error: e?.message || "Erro na compra" };
  }
}

export async function restoreApplePurchases(): Promise<boolean> {
  if (!isIOSNative()) return false;
  const mod = await loadPurchases();
  if (!mod) return false;
  try {
    const { Purchases } = mod;
    const { customerInfo } = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  } catch (e) {
    console.error("Erro ao restaurar compras:", e);
    return false;
  }
}
