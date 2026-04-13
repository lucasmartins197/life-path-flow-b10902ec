import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RootRedirect } from "@/components/RootRedirect";

// Public pages
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ProfessionalRegister from "./pages/auth/ProfessionalRegister";
import NotFound from "./pages/NotFound";

import AppHome from "./pages/app/AppHome";
import JourneysHome from "./pages/app/JourneysHome";
import JourneyStep from "./pages/app/JourneyStep";
import TherapyHome from "./pages/app/TherapyHome";
import RoutineHome from "./pages/app/RoutineHome";
import NutritionHome from "./pages/app/NutritionHome";
import ExerciseHome from "./pages/app/ExerciseHome";
import CalendarHome from "./pages/app/CalendarHome";
import AnchorHome from "./pages/app/AnchorHome";
import SettingsHome from "./pages/app/SettingsHome";
import OnboardingProfile from "./pages/app/OnboardingProfile";
import HealthHome from "./pages/app/HealthHome";
import FinanceHome from "./pages/app/FinanceHome";
import ProfileHome from "./pages/app/ProfileHome";
import EvolutionHome from "./pages/app/EvolutionHome";
import ProntuarioHome from "./pages/app/ProntuarioHome";
import LegalHome from "./pages/app/LegalHome";
import FinancialSupportHome from "./pages/app/FinancialSupportHome";
import RecoveryIndexPage from "./pages/app/RecoveryIndexPage";
import CommunityHome from "./pages/app/CommunityHome";
import AulaoSemanal from "./pages/app/AulaoSemanal";
import SubscriptionHome from "./pages/app/SubscriptionHome";

// Pro pages (PROFESSIONAL role)
import ProHome from "./pages/pro/ProHome";

// Admin pages (ADMIN role)
import AdminHome from "./pages/admin/AdminHome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/professional-register" element={<ProfessionalRegister />} />
            
            {/* Protected APP routes (USER role) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <AppHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/jornada"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <JourneysHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/jornada/:stepNumber"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <JourneyStep />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/terapia"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <TherapyHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/rotina"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <RoutineHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/nutricao"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <NutritionHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/exercicios"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <ExerciseHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/agenda"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <CalendarHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ancora"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <AnchorHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/configuracoes"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <SettingsHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/onboarding"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <OnboardingProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/saude"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <HealthHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/financas"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <FinanceHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/perfil"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <ProfileHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/evolucao"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <EvolutionHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/prontuario"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <ProntuarioHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/juridico"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <LegalHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/apoio-financeiro"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <FinancialSupportHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/indice"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <RecoveryIndexPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/comunidade"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <CommunityHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/aulao"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}
                  <AulaoSemanal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/assinatura"
              element={
                <ProtectedRoute allowedRoles={["user", "admin"]}>
                  <SubscriptionHome />
                </ProtectedRoute>
              }
            />
            
            {/* Protected PRO routes (PROFESSIONAL role) */}
            <Route
              path="/pro"
              element={
                <ProtectedRoute allowedRoles={["professional", "admin"]}>
                  <ProHome />
                </ProtectedRoute>
              }
            />
            
            {/* Protected ADMIN routes (ADMIN role) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
