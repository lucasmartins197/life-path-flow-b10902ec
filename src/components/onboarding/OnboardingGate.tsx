import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingFlow } from "./OnboardingFlow";
import { Loader2 } from "lucide-react";

/**
 * Renders OnboardingFlow once for users who haven't completed it.
 * After completion, allows children to render normally.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Não bloquear rotas de pagamento/confirmação
  const currentPath = window.location.pathname;
  const exempt = ["/app/terapia", "/app/juridico", "/app/assinatura", "/auth"];
  const isExempt = exempt.some(p => currentPath.startsWith(p));

  useEffect(() => {
    let active = true;
    async function check() {
      if (!user || isExempt) {
        setChecked(true);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setNeedsOnboarding(!data?.onboarding_completed);
      setChecked(true);
    }
    check();
    return () => { active = false; };
  }, [user?.id, profile?.id, isExempt]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingFlow onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <>{children}</>;
}
