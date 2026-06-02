import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "user" | "professional" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

const ADMIN_BYPASS_ID = "60c8281c-eee0-48f2-9d31-d3002ce4eb14";
const PAYWALL_EXEMPT = ["/app/assinatura", "/app/onboarding", "/auth"];
const ONBOARDING_EXEMPT = ["/app/onboarding", "/app/assinatura", "/auth"];

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { user, roles, isLoading, profile } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute state:', {
    user: !!user,
    isLoading,
    profile: profile?.subscription_status,
    path: location.pathname,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const isPaymentReturn =
    location.pathname === "/app" && new URLSearchParams(location.search).get("payment") === "success";
  if (isPaymentReturn) {
    return <PaymentConfirmation userId={user.id} />;
  }

  const isAdminBypass = user.id === ADMIN_BYPASS_ID;

  if (allowedRoles && allowedRoles.length > 0 && !isAdminBypass) {
    const hasRequiredRole = allowedRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      if (roles.includes("admin")) return <Navigate to="/admin" replace />;
      if (roles.includes("professional")) return <Navigate to="/pro" replace />;
      return <Navigate to="/app" replace />;
    }
  }

  const isAdminUser = user.id === ADMIN_BYPASS_ID || roles.includes("admin");
  const isExempt = PAYWALL_EXEMPT.some(p => location.pathname.startsWith(p));

  // If profile is null, treat as inactive (redirect to subscription)
  // This handles new users whose profile hasn't been created yet

  const hasSubscription = profile !== null && (profile as any)?.subscription_status === "active";

  console.log("[ProtectedRoute]", {
    userId: user.id,
    subscriptionStatus: (profile as any)?.subscription_status,
    isAdminUser,
    isExempt,
    hasSubscription,
    path: location.pathname,
  });

  if (!isAdminUser && !isExempt && !hasSubscription) {
    return <Navigate to="/app/assinatura" state={{ from: location }} replace />;
  }

  return (
    <OnboardingCheck isAdminUser={isAdminUser} userId={user.id} pathname={location.pathname}>
      {children}
    </OnboardingCheck>
  );
}

function PaymentConfirmation({ userId }: { userId: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function confirmPayment() {
      try {
        // Atualiza diretamente o status para 'active' (não esperar o webhook)
        await supabase
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("id", userId);

        if (!active) return;
        window.location.replace("/app");
      } catch (e) {
        console.error("payment confirmation failed", e);
        if (active) navigate("/app/assinatura", { replace: true });
      }
    }

    confirmPayment();
    return () => {
      active = false;
    };
  }, [navigate, userId]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Confirmando pagamento...</p>
      </div>
    </div>
  );
}

function OnboardingCheck({
  children,
}: {
  isAdminUser: boolean;
  userId: string;
  pathname: string;
  children: React.ReactNode;
}) {
  // Onboarding is handled by <OnboardingGate>. This wrapper is now a no-op.
  return <>{children}</>;
}

