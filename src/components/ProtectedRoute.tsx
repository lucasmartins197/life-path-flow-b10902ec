import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "user" | "professional" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

const ADMIN_BYPASS_ID = "60c8281c-eee0-48f2-9d31-d3002ce4eb14";
const PAYWALL_EXEMPT = ["/app/assinatura", "/app/onboarding", "/auth"];

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { user, roles, isLoading, profile } = useAuth();
  const location = useLocation();

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

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      if (roles.includes("admin")) return <Navigate to="/admin" replace />;
      if (roles.includes("professional")) return <Navigate to="/pro" replace />;
      return <Navigate to="/app" replace />;
    }
  }

  const isAdminUser = user.id === ADMIN_BYPASS_ID || roles.includes("admin");
  const isExempt = PAYWALL_EXEMPT.some(p => location.pathname.startsWith(p));
  const hasSubscription = (profile as any)?.subscription_status === "active";

  if (!isAdminUser && !isExempt && !hasSubscription) {
    return <Navigate to="/app/assinatura" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
