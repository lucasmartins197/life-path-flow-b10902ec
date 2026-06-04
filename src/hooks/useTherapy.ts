import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Professional {
  id: string;
  user_id: string;
  specialty: string;
  bio: string | null;
  rating: number | null;
  total_sessions: number | null;
  hourly_rate: number | null;
  is_online: boolean | null;
  gambling_specialist: boolean;
  approach: string[];
  specialties: string[];
  meeting_link: string | null;
  council_number: string | null;
  council_state: string | null;
  profile_name: string | null;
  avatar_url: string | null;
}

export interface Appointment {
  id: string;
  professional_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link: string | null;
  rating: number | null;
  review_comment: string | null;
  created_at: string;
  professional?: Professional;
}

export function useTherapy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfessionals = useCallback(async () => {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("id, user_id, specialty, bio, rating, total_sessions, hourly_rate, is_online, gambling_specialist, approach, specialties, council_number, council_state, is_approved, professional_type")
      .eq("is_approved", true)
      .eq("professional_type", "psicologo")
      .order("rating", { ascending: false });

    if (error) {
      console.error("Error fetching professionals:", error);
      return;
    }

    // Fetch profile names
    const userIds = (data || []).map((p: any) => p.user_id);
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      });
    }

    const mapped: Professional[] = (data || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      specialty: p.specialty,
      bio: p.bio,
      rating: p.rating,
      total_sessions: p.total_sessions,
      hourly_rate: p.hourly_rate,
      is_online: p.is_online,
      gambling_specialist: p.gambling_specialist || false,
      approach: Array.isArray(p.approach) ? p.approach : [],
      specialties: Array.isArray(p.specialties) ? p.specialties : [],
      meeting_link: null,
      council_number: p.council_number,
      council_state: p.council_state,
      profile_name: profileMap[p.user_id]?.full_name || p.specialty,
      avatar_url: profileMap[p.user_id]?.avatar_url || null,
    }));

    setProfessionals(mapped);
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      return;
    }
    setAppointments(data || []);
  }, [user]);

  const fetchCredits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("session_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .maybeSingle();

    setCredits(data?.credits_remaining || 0);
  }, [user]);

  const bookAppointment = async (professionalId: string, scheduledAt: Date, meetingLink: string | null) => {
    if (!user) return false;

    let hasCredit = credits > 0;

    // Create appointment (meeting_link is set server-side / via RPC after booking)
    const { data: created, error } = await supabase.from("appointments").insert({
      user_id: user.id,
      professional_id: professionalId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 45,
      status: "scheduled",
      meeting_link: null,
    }).select("id").maybeSingle();

    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
      return false;
    }

    // Fetch the meeting link via secure RPC and attach it to the appointment
    try {
      const { data: link } = await supabase.rpc("get_professional_meeting_link", {
        _professional_id: professionalId,
      });
      if (created?.id && link) {
        await supabase.from("appointments").update({ meeting_link: link as string }).eq("id", created.id);
      }
    } catch (e) {
      console.warn("Could not attach meeting link", e);
    }

    // Credit deduction is handled server-side by the payment webhook

    toast({ title: "Sessão agendada", description: "Sua consulta foi confirmada com sucesso." });
    await Promise.all([fetchAppointments(), fetchCredits()]);
    return true;
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
      return;
    }

    // Credit refunds are handled server-side
    toast({ title: "Sessão cancelada", description: "Sua consulta foi cancelada." });
    await Promise.all([fetchAppointments(), fetchCredits()]);
  };

  const rateAppointment = async (appointmentId: string, rating: number, comment?: string) => {
    if (!user) return;
    await supabase
      .from("appointments")
      .update({ rating, review_comment: comment || null, status: "completed" })
      .eq("id", appointmentId)
      .eq("user_id", user.id);

    toast({ title: "Avaliação registrada", description: "Obrigado pelo seu feedback." });
    await fetchAppointments();
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProfessionals(), fetchAppointments(), fetchCredits()]);
      setLoading(false);
    };
    load();
  }, [fetchProfessionals, fetchAppointments, fetchCredits]);

  return {
    professionals,
    appointments,
    credits,
    loading,
    bookAppointment,
    cancelAppointment,
    rateAppointment,
    refetch: () => Promise.all([fetchProfessionals(), fetchAppointments(), fetchCredits()]),
  };
}
