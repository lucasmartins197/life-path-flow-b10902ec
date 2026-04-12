import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ExerciseActivity {
  id: string;
  name: string;
  category: string;
  calories_per_minute: number;
  icon: string | null;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  activity_id: string | null;
  custom_activity_name: string | null;
  duration_minutes: number;
  intensity: string;
  calories_burned: number;
  notes: string | null;
  photo_url: string | null;
  logged_at: string;
  created_at: string;
  activity?: ExerciseActivity;
}

export interface BodyEvolution {
  id: string;
  user_id: string;
  photo_url: string;
  photo_type: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  muscle_mass_percent: number | null;
  ai_analysis: unknown;
  notes: string | null;
  taken_at: string;
  created_at: string;
}

export function useExercise(date?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ExerciseActivity[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [evolution, setEvolution] = useState<BodyEvolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedDate = date || new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchEvolution();
    }
  }, [user, selectedDate]);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("exercise_activities")
      .select("*")
      .order("name");

    if (!error) {
      setActivities(data || []);
    }
  };

  const fetchLogs = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("exercise_logs")
      .select(`
        *,
        activity:exercise_activities(*)
      `)
      .eq("user_id", user.id)
      .eq("logged_at", selectedDate)
      .order("created_at", { ascending: false });

    if (!error) {
      setLogs(data || []);
    }
    setIsLoading(false);
  };

  const fetchEvolution = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("body_evolution")
      .select("*")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(12);

    if (!error) {
      setEvolution(data || []);
    }
  };

  const addLog = async (
    activity: ExerciseActivity | null,
    customName: string | null,
    durationMinutes: number,
    intensity: string,
    notes?: string,
    photoUrl?: string
  ) => {
    if (!user) return false;

    const caloriesMultiplier =
      intensity === "light" ? 0.7 : intensity === "intense" ? 1.4 : 1;
    const caloriesBurned =
      (activity?.calories_per_minute || 5) * durationMinutes * caloriesMultiplier;

    const { error } = await supabase.from("exercise_logs").insert({
      user_id: user.id,
      activity_id: activity?.id || null,
      custom_activity_name: customName,
      duration_minutes: durationMinutes,
      intensity,
      calories_burned: Math.round(caloriesBurned),
      notes,
      photo_url: photoUrl || null,
      logged_at: selectedDate,
    });

    if (error) {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Exercício registrado!",
      description: `${activity?.name || customName} - ${durationMinutes} minutos`,
    });
    fetchLogs();
    return true;
  };

  const deleteLog = async (logId: string) => {
    const { error } = await supabase
      .from("exercise_logs")
      .delete()
      .eq("id", logId);

    if (error) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    fetchLogs();
    return true;
  };

  const addBodyPhoto = async (
    photoUrl: string,
    photoType: string,
    weightKg?: number,
    notes?: string
  ) => {
    if (!user) return false;

    const { error } = await supabase.from("body_evolution").insert({
      user_id: user.id,
      photo_url: photoUrl,
      photo_type: photoType,
      weight_kg: weightKg || null,
      notes,
      taken_at: selectedDate,
    });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Foto registrada!",
      description: "Sua evolução corporal foi salva.",
    });
    fetchEvolution();
    return true;
  };

  const uploadExercisePhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("exercise-photos")
      .upload(filePath, file);

    if (error) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const { data } = await supabase.storage
      .from("exercise-photos")
      .createSignedUrl(filePath, 3600);

    return data?.signedUrl || null;
  };

  const uploadBodyPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("body-photos")
      .upload(filePath, file);

    if (error) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const { data } = await supabase.storage
      .from("body-photos")
      .createSignedUrl(filePath, 3600);

    return data?.signedUrl || null;
  };

  const dailyStats = logs.reduce(
    (acc, log) => ({
      totalMinutes: acc.totalMinutes + log.duration_minutes,
      totalCalories: acc.totalCalories + Number(log.calories_burned),
      workouts: acc.workouts + 1,
    }),
    { totalMinutes: 0, totalCalories: 0, workouts: 0 }
  );

  return {
    activities,
    logs,
    evolution,
    isLoading,
    addLog,
    deleteLog,
    addBodyPhoto,
    uploadExercisePhoto,
    uploadBodyPhoto,
    dailyStats,
    refetch: fetchLogs,
  };
}
