import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BlockedSite {
  id: string;
  user_id: string;
  url: string;
  active: boolean;
  is_default: boolean;
}

export interface DigitalGuardian {
  id: string;
  user_id: string;
  guardian_name: string;
  guardian_email: string | null;
  guardian_phone: string | null;
  invite_sent_at: string | null;
  notify_on_temptation: boolean;
}

export interface GamblingStreakDay {
  id: string;
  confirmation_date: string;
  stayed_clean: boolean;
}

export const DEFAULT_SITES = [
  "bet365.com",
  "betano.com",
  "sportingbet.com",
  "pixbet.com",
  "blaze.com",
  "brazino777.com",
  "estrela.bet",
  "betfair.com",
  "bodog.com",
];

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function calcStreak(rows: GamblingStreakDay[]): number {
  if (!rows.length) return 0;
  const sorted = [...rows].sort((a, b) =>
    b.confirmation_date.localeCompare(a.confirmation_date)
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].stayed_clean) break;
    const d = new Date(sorted[i].confirmation_date);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (d.getTime() === expected.getTime()) streak++;
    else break;
  }
  return streak;
}

export function useShield() {
  const { user } = useAuth();
  const [sites, setSites] = useState<BlockedSite[]>([]);
  const [guardian, setGuardian] = useState<DigitalGuardian | null>(null);
  const [streakDays, setStreakDays] = useState<GamblingStreakDay[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    const [sitesRes, guardianRes, streakRes] = await Promise.all([
      supabase.from("blocked_sites").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("digital_guardian").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("gambling_streak")
        .select("id, confirmation_date, stayed_clean")
        .eq("user_id", user.id)
        .order("confirmation_date", { ascending: false })
        .limit(60),
    ]);

    let list = (sitesRes.data || []) as BlockedSite[];

    // Seed defaults the first time
    if (list.length === 0) {
      const seed = DEFAULT_SITES.map((u) => ({
        user_id: user.id,
        url: u,
        active: true,
        is_default: true,
      }));
      const { data: inserted } = await supabase.from("blocked_sites").insert(seed).select();
      list = (inserted || []) as BlockedSite[];
    }

    setSites(list);
    setGuardian((guardianRes.data as DigitalGuardian) || null);
    setStreakDays((streakRes.data as GamblingStreakDay[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addSite = async (url: string) => {
    if (!user) return;
    const cleaned = url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (cleaned.length < 3 || !cleaned.includes(".")) throw new Error("URL inválida");
    if (sites.some((s) => s.url === cleaned)) throw new Error("Site já está na lista");
    const { data, error } = await supabase
      .from("blocked_sites")
      .insert({ user_id: user.id, url: cleaned, active: true, is_default: false })
      .select()
      .single();
    if (error) throw error;
    setSites((prev) => [...prev, data as BlockedSite]);
  };

  const toggleSite = async (id: string, active: boolean) => {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
    await supabase.from("blocked_sites").update({ active }).eq("id", id);
  };

  const removeSite = async (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("blocked_sites").delete().eq("id", id);
  };

  const saveGuardian = async (input: {
    guardian_name: string;
    guardian_email?: string;
    guardian_phone?: string;
    notify_on_temptation: boolean;
  }) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      guardian_name: input.guardian_name,
      guardian_email: input.guardian_email || null,
      guardian_phone: input.guardian_phone || null,
      notify_on_temptation: input.notify_on_temptation,
    };
    const { data, error } = await supabase
      .from("digital_guardian")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    setGuardian(data as DigitalGuardian);

    // Fire-and-forget invite via N8N
    if (input.guardian_email || input.guardian_phone) {
      try {
        await supabase.functions.invoke("notify-guardian", {
          body: { type: "invite", guardian: data },
        });
        await supabase
          .from("digital_guardian")
          .update({ invite_sent_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch (e) {
        console.warn("Guardian notify failed", e);
      }
    }
    return data as DigitalGuardian;
  };

  const registerTemptation = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("temptation_events")
      .insert({ user_id: user.id, guardian_notified: false })
      .select()
      .single();

    // Notify guardian if opted in
    if (guardian?.notify_on_temptation && (guardian.guardian_email || guardian.guardian_phone)) {
      try {
        await supabase.functions.invoke("notify-guardian", {
          body: { type: "temptation", guardian, event_id: data?.id },
        });
        if (data?.id) {
          await supabase
            .from("temptation_events")
            .update({ guardian_notified: true })
            .eq("id", data.id);
        }
      } catch (e) {
        console.warn("Temptation notify failed", e);
      }
    }
    return data;
  };

  const confirmDay = async (stayedClean: boolean) => {
    if (!user) return;
    const date = todayISO();
    const { data, error } = await supabase
      .from("gambling_streak")
      .upsert(
        { user_id: user.id, confirmation_date: date, stayed_clean: stayedClean },
        { onConflict: "user_id,confirmation_date" }
      )
      .select()
      .single();
    if (error) throw error;
    setStreakDays((prev) => {
      const filtered = prev.filter((d) => d.confirmation_date !== date);
      return [data as GamblingStreakDay, ...filtered];
    });
  };

  const todayConfirmation = streakDays.find((d) => d.confirmation_date === todayISO()) || null;
  const streak = calcStreak(streakDays);
  const configured =
    sites.some((s) => s.active) && !!guardian;

  return {
    loading,
    sites,
    guardian,
    streakDays,
    streak,
    todayConfirmation,
    configured,
    addSite,
    toggleSite,
    removeSite,
    saveGuardian,
    registerTemptation,
    confirmDay,
    refetch,
  };
}
