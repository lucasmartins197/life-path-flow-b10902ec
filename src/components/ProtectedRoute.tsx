import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "user" | "professional" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
  
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth",
  
}: ProtectedRouteProps) {
  const { user, roles, profile, isLoading } = useAuth();
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

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      if (roles.includes("admin")) return <Navigate to="/admin" replace />;
      if (roles.includes("professional")) return <Navigate to="/pro" replace />;
      return <Navigate to="/app" replace />;
    }
  }

  // Subscription gate for user role (not admin/professional)
  if (
    requireSubscription &&
    !roles.includes("admin") &&
    !roles.includes("professional") &&
    profile?.subscription_status !== "active" &&
    location.pathname !== "/app/assinatura"
  ) {
    return <Navigate to="/app/assinatura" replace />;
  }

  return <>{children}</>;
}
