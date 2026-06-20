import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Admin/test user who bypasses every lock and shows every step completed. */
export const ADMIN_BYPASS_USER_ID = "f997e372-2a46-4e36-a75f-04b49af0aef2";

/** Medal awarded when each step's task is auto-validated. */
export const STEP_VALIDATION_MEDAL: Record<number, { id: string; name: string }> = {
  1: { id: "journey-task-1", name: "Primeiro Passo" },
  2: { id: "journey-task-2", name: "Voz da Esperança" },
  3: { id: "journey-task-3", name: "Não Estou Sozinho" },
  4: { id: "journey-task-4", name: "Me Conheço" },
  5: { id: "journey-task-5", name: "Coragem de Falar" },
  6: { id: "journey-task-6", name: "Nova Rotina" },
  7: { id: "journey-task-7", name: "Busquei Ajuda" },
  8: { id: "journey-task-8", name: "Encarei a Realidade" },
  9: { id: "journey-task-9", name: "3 Dias de Vitória" },
  10: { id: "journey-task-10", name: "Sempre Vigilante" },
  11: { id: "journey-task-11", name: "Lutando pelos Meus Direitos" },
  12: { id: "journey-task-12", name: "Jornada Completa" },
};

/** Human label for the task each step requires. */
export const STEP_TASK_LABEL: Record<number, string> = {
  1: "Preencher nome completo e cidade no perfil",
  2: "Publicar 1 história em Histórias que Conectam",
  3: "Cadastrar pelo menos 1 Contato Âncora",
  4: "Registrar pelo menos 1 gatilho no Meu Escudo",
  5: "Publicar a 2ª história em Histórias que Conectam",
  6: "Criar pelo menos 1 rotina no app",
  7: "Agendar 1 sessão de terapia",
  8: "Registrar pelo menos 1 dívida em Finanças",
  9: "Fazer check-in diário por 3 dias consecutivos",
  10: "Ativar alertas no Meu Escudo (Contato Âncora)",
  11: "Enviar 1 solicitação em Apoio Jurídico",
  12: "Publicar a 3ª história — compartilhar sua conquista",
};

export interface StepValidation {
  done: boolean;
  detail?: string;
}

/** ── Pure validators (one per step) ─────────────────────────────── */
async function validateStep(stepNumber: number, userId: string): Promise<StepValidation> {
  switch (stepNumber) {
    case 1: {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, bio, full_name, city")
        .eq("id", userId)
        .maybeSingle();
      const done = !!(data?.full_name && data.full_name.trim() !== "") && !!(data?.city && data.city.trim() !== "");
      return { done };
    }
    case 2: {
      const { count } = await supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return { done: (count ?? 0) >= 1, detail: `${count ?? 0} publicação(ões)` };
    }
    case 3: {
      const { count } = await supabase
        .from("anchor_contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return { done: (count ?? 0) >= 1 };
    }
    case 4: {
      const [{ count: sitesCount }, { data: guardian }] = await Promise.all([
        supabase
          .from("blocked_sites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("digital_guardian")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      const hasSite = (sitesCount ?? 0) >= 1;
      const hasGuardian = !!guardian;
      return {
        done: hasSite && hasGuardian,
        detail: `${sitesCount ?? 0} plataforma(s)${hasGuardian ? " · guardião ativo" : " · sem guardião"}`,
      };
    }
    case 5: {
      const { count } = await supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return { done: (count ?? 0) >= 2, detail: `${count ?? 0} de 2` };
    }
    case 6: {
      const { count } = await supabase
        .from("routine_preferences")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("configurado", true);
      return { done: (count ?? 0) >= 1 };
    }
    case 7: {
      // Only counts if there's a confirmed payment for therapy
      const { count } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("payment_type", "therapy")
        .eq("status", "completed");
      return { done: (count ?? 0) >= 1 };
    }
    case 8: {
      // Two valid sources: finance_events with event_type='debt' OR debts array in financial_profile
      const [{ count: dbtCount }, { data: profile }] = await Promise.all([
        supabase
          .from("finance_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("event_type", "debt"),
        supabase.from("financial_profile").select("debts").eq("user_id", userId).maybeSingle(),
      ]);
      const debtsArr = Array.isArray(profile?.debts) ? profile!.debts : [];
      return { done: (dbtCount ?? 0) >= 1 || debtsArr.length >= 1 };
    }
    case 9: {
      // 3 consecutive days including today with stayed_clean=true
      const { data } = await supabase
        .from("gambling_streak")
        .select("confirmation_date, stayed_clean")
        .eq("user_id", userId)
        .eq("stayed_clean", true)
        .order("confirmation_date", { ascending: false })
        .limit(10);
      const dates = new Set((data || []).map((r: any) => r.confirmation_date));
      const today = new Date();
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const d0 = iso(today);
      const d1 = iso(new Date(today.getTime() - 86400000));
      const d2 = iso(new Date(today.getTime() - 2 * 86400000));
      const done = dates.has(d0) && dates.has(d1) && dates.has(d2);
      return { done, detail: `${dates.size} check-in(s) recentes` };
    }
    case 10: {
      // "alerts active" = at least one anchor_contact with receive_alerts=true
      const { count } = await supabase
        .from("anchor_contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("receive_alerts", true);
      return { done: (count ?? 0) >= 1 };
    }
    case 11: {
      // Only counts if there's a confirmed payment for legal
      const { count } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("payment_type", "legal")
        .eq("status", "completed");
      return { done: (count ?? 0) >= 1 };
    }
    case 12: {
      const { count } = await supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return { done: (count ?? 0) >= 3, detail: `${count ?? 0} de 3` };
    }
    default:
      return { done: false };
  }
}

/** Runs validation for every step (1..12) and returns a map. */
export function useJourneyValidation() {
  const { user } = useAuth();
  const isAdmin = user?.id === ADMIN_BYPASS_USER_ID;

  const query = useQuery({
    queryKey: ["journey-validation", user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<Record<number, StepValidation>> => {
      if (isAdmin) {
        const result: Record<number, StepValidation> = {};
        for (let i = 1; i <= 12; i++) result[i] = { done: true, detail: "admin bypass" };
        return result;
      }
      const entries = await Promise.all(
        Array.from({ length: 12 }, (_, i) => validateStep(i + 1, user!.id).then((v) => [i + 1, v] as const)),
      );
      return Object.fromEntries(entries);
    },
  });

  const progressQuery = useQuery({
    queryKey: ["journey-progress-map", user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<Record<number, { is_completed: boolean }>> => {
      const { data } = await supabase
        .from("journey_progress")
        .select("step_number, is_completed")
        .eq("user_id", user!.id);
      const map: Record<number, { is_completed: boolean }> = {};
      (data ?? []).forEach((row: any) => {
        map[row.step_number] = { is_completed: !!row.is_completed };
      });
      return map;
    },
  });

  /** True if step N is unlocked: step 1 always, step N>1 iff step N-1 task is validated. */
  function isUnlocked(stepNumber: number): boolean {
    if (isAdmin) return true;
    if (stepNumber === 1) return true;
    const prev = query.data?.[stepNumber - 1];
    return !!prev?.done;
  }

  /** True if the user finished the practical task of the step. */
  function isTaskDone(stepNumber: number): boolean {
    if (isAdmin) return true;
    return !!query.data?.[stepNumber]?.done;
  }

  /** True only if the user went through the full flow and clicked "Concluir Passo". */
  function isStepCompleted(stepNumber: number): boolean {
    if (isAdmin) return false;
    const prog = progressQuery.data?.[stepNumber];
    return !!prog?.is_completed;
  }

  const refetch = async () => {
    const [a] = await Promise.all([query.refetch(), progressQuery.refetch()]);
    return a;
  };

  return {
    validations: query.data ?? ({} as Record<number, StepValidation>),
    isLoading: query.isLoading || progressQuery.isLoading,
    isAdmin,
    isUnlocked,
    isTaskDone,
    isStepCompleted,
    /** @deprecated use isTaskDone */
    isDone: isTaskDone,
    refetch,
  };
}
