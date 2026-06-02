import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingFlow } from "./OnboardingFlow";
import { Loader2 } from "lucide-react";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!user) {
        setChecked(true);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      console.log("OnboardingGate:", { data, error, userId: user.id });
      if (!active) return;
      setNeedsOnboarding(!data?.onboarding_completed);
      setChecked(true);
    }
    check();
    return () => {
      active = false;
    };
  }, [user?.id, profile?.id]);

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
