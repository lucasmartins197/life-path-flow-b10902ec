import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useCallback } from "react";

/* ── All possible medals ── */
export interface MedalDef {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  icon: string; // emoji
}

export const MEDAL_DEFINITIONS: MedalDef[] = [
  // Journey steps (12)
  { id: "journey-1",  name: "Reconhecimento",   description: "Concluiu o Passo 1",  badge_type: "journey", icon: "🌱" },
  { id: "journey-2",  name: "Esperança",        description: "Concluiu o Passo 2",  badge_type: "journey", icon: "🌟" },
  { id: "journey-3",  name: "Entrega",          description: "Concluiu o Passo 3",  badge_type: "journey", icon: "🙏" },
  { id: "journey-4",  name: "Inventário",       description: "Concluiu o Passo 4",  badge_type: "journey", icon: "📋" },
  { id: "journey-5",  name: "Verdade",          description: "Concluiu o Passo 5",  badge_type: "journey", icon: "💎" },
  { id: "journey-6",  name: "Disponibilidade",  description: "Concluiu o Passo 6",  badge_type: "journey", icon: "🔓" },
  { id: "journey-7",  name: "Humildade",        description: "Concluiu o Passo 7",  badge_type: "journey", icon: "🕊️" },
  { id: "journey-8",  name: "Responsabilidade", description: "Concluiu o Passo 8",  badge_type: "journey", icon: "📝" },
  { id: "journey-9",  name: "Reparação",        description: "Concluiu o Passo 9",  badge_type: "journey", icon: "🤝" },
  { id: "journey-10", name: "Vigilância",       description: "Concluiu o Passo 10", badge_type: "journey", icon: "👁️" },
  { id: "journey-11", name: "Conexão Real",     description: "Concluiu o Passo 11", badge_type: "journey", icon: "🧘" },
  { id: "journey-12", name: "Propósito",        description: "Concluiu o Passo 12", badge_type: "journey", icon: "🏆" },
  // Therapy sessions (up to 8 medals for 4 sessions)
  { id: "therapy-1",  name: "Primeiro Passo Terapêutico", description: "Agendou sua 1ª sessão",  badge_type: "therapy", icon: "💬" },
  { id: "therapy-2",  name: "Conexão Profissional",       description: "Concluiu sua 1ª sessão",  badge_type: "therapy", icon: "🩺" },
  { id: "therapy-3",  name: "Compromisso Contínuo",       description: "Agendou sua 2ª sessão",   badge_type: "therapy", icon: "📅" },
  { id: "therapy-4",  name: "Evolução Terapêutica",       description: "Concluiu sua 2ª sessão",  badge_type: "therapy", icon: "🌿" },
  { id: "therapy-5",  name: "Dedicação ao Processo",      description: "Agendou sua 3ª sessão",   badge_type: "therapy", icon: "💪" },
  { id: "therapy-6",  name: "Transformação em Curso",     description: "Concluiu sua 3ª sessão",  badge_type: "therapy", icon: "🦋" },
  { id: "therapy-7",  name: "Veterano Terapêutico",       description: "Agendou sua 4ª sessão",   badge_type: "therapy", icon: "⭐" },
  { id: "therapy-8",  name: "Mestre do Autocuidado",      description: "Concluiu sua 4ª sessão",  badge_type: "therapy", icon: "👑" },
];

export interface EarnedBadge {
  badge_name: string;
  badge_type: string;
  earned_at: string;
}

export function useMedals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: earned = [], isLoading } = useQuery({
    queryKey: ["user-badges", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("badge_name, badge_type, earned_at")
        .eq("user_id", user!.id)
        .order("earned_at", { ascending: true });
      return (data || []) as EarnedBadge[];
    },
  });

  const totalEarned = earned.length;
  const totalPossible = MEDAL_DEFINITIONS.length;
  const discountsEarned = Math.floor(totalEarned / 10);
  const nextDiscountIn = 10 - (totalEarned % 10);

  const awardMedal = useCallback(
    async (medalId: string) => {
      if (!user) return false;
      const def = MEDAL_DEFINITIONS.find((m) => m.id === medalId);
      if (!def) return false;

      // Check if already earned
      const alreadyEarned = earned.some(
        (e) => e.badge_name === def.name && e.badge_type === def.badge_type
      );
      if (alreadyEarned) return false;

      const { error } = await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_name: def.name,
        badge_type: def.badge_type,
        metadata: { medal_id: medalId, icon: def.icon },
      });

      if (!error) {
        toast.success(`🏅 Medalha conquistada: ${def.name}!`, {
          description: def.description,
          duration: 4000,
        });
        queryClient.invalidateQueries({ queryKey: ["user-badges", user.id] });
        return true;
      }
      return false;
    },
    [user, earned, queryClient]
  );

  return {
    earned,
    totalEarned,
    totalPossible,
    discountsEarned,
    nextDiscountIn,
    isLoading,
    awardMedal,
    definitions: MEDAL_DEFINITIONS,
  };
}
