import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardMetrics {
  totalUsers: number;
  totalRevenue: number;
  totalConsultations: number;
  activeProfessionals: number;
  revenueByType: {
    subscription: number;
    therapy: number;
    legal: number;
  };
}


interface RecentUser {
  id: string;
  full_name: string | null;
  created_at: string;
  avatar_url: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  created_at: string;
}

export function useAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalRevenue: 0,
    totalConsultations: 0,
    activeProfessionals: 0,
    revenueByType: {
      subscription: 0,
      therapy: 0,
      legal: 0,
    },
  });

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    try {
      // Fetch total users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch active professionals count
      const { count: professionalsCount } = await supabase
        .from("professional_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", true);

      // Fetch total consultations
      const { count: sessionsCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true });

      // Fetch total revenue from payments grouped by type
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount, payment_type")
        .eq("status", "completed");

      const revenueByType = {
        subscription: 0,
        therapy: 0,
        legal: 0,
      };

      (allPayments || []).forEach((p) => {
        const val = Number(p.amount);
        if (p.payment_type === "subscription") revenueByType.subscription += val;
        else if (p.payment_type === "therapy") revenueByType.therapy += val;
        else if (p.payment_type === "legal") revenueByType.legal += val;
      });

      const totalRevenue =
        revenueByType.subscription +
        revenueByType.therapy +
        revenueByType.legal;


      // Fetch recent users (last 10 signups)
      const { data: recentUsersData } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, avatar_url")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent payments
      const { data: recentPaymentsData } = await supabase
        .from("payments")
        .select("id, amount, payment_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      setMetrics({
        totalUsers: usersCount || 0,
        totalRevenue,
        totalConsultations: sessionsCount || 0,
        activeProfessionals: professionalsCount || 0,
        revenueByType,
      });


      setRecentUsers(recentUsersData || []);
      setRecentPayments(recentPaymentsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPatientRecords = async () => {
    try {
      // Fetch all patient profiles with their progress data
      const { data: patients } = await supabase
        .from("patient_profiles")
        .select(`
          id,
          user_id,
          current_step,
          streak_days,
          journey_started_at,
          goals,
          health_notes,
          created_at
        `);

      if (!patients) return null;

      // Fetch profiles to get names
      const userIds = patients.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Fetch trail progress for each patient
      const { data: progressData } = await supabase
        .from("trail_progress")
        .select("user_id, step_id, is_completed, completed_at")
        .in("user_id", userIds);

      // Merge data
      const consolidatedRecords = patients.map((patient) => {
        const profile = profiles?.find((p) => p.user_id === patient.user_id);
        const progress = progressData?.filter((p) => p.user_id === patient.user_id) || [];
        const completedSteps = progress.filter((p) => p.is_completed).length;

        return {
          nome: profile?.full_name || "Não informado",
          passo_atual: patient.current_step,
          passos_concluidos: completedSteps,
          dias_streak: patient.streak_days,
          inicio_jornada: patient.journey_started_at
            ? new Date(patient.journey_started_at).toLocaleDateString("pt-BR")
            : "Não iniciada",
          metas: patient.goals?.join(", ") || "Nenhuma",
          observacoes_saude: patient.health_notes || "Nenhuma",
          cadastro: new Date(patient.created_at).toLocaleDateString("pt-BR"),
        };
      });

      return consolidatedRecords;
    } catch (error) {
      console.error("Error exporting records:", error);
      return null;
    }
  };

  const downloadCSV = async () => {
    const records = await exportPatientRecords();
    if (!records || records.length === 0) return;

    const headers = [
      "Nome",
      "Passo Atual",
      "Passos Concluídos",
      "Dias de Streak",
      "Início da Jornada",
      "Metas",
      "Observações de Saúde",
      "Data de Cadastro",
    ];

    const csvContent = [
      headers.join(";"),
      ...records.map((r) =>
        [
          r.nome,
          r.passo_atual,
          r.passos_concluidos,
          r.dias_streak,
          r.inicio_jornada,
          `"${r.metas}"`,
          `"${r.observacoes_saude}"`,
          r.cadastro,
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prontuario_consolidado_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    metrics,
    recentUsers,
    recentPayments,
    isLoading,
    refetch: fetchDashboardData,
    downloadCSV,
  };
}
