import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Flame, Award } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { PremiumNavCards } from "@/components/home/PremiumNavCards";
import { useMedals } from "@/hooks/useMedals";
import { BlockingBanner } from "@/components/recovery/BlockingBanner";
import { EveningCheckIn } from "@/components/recovery/EveningCheckIn";
import { toast } from "@/hooks/use-toast";

/* ── Motivational quotes ── */
const quotes = [
  "Cada dia sóbrio é uma vitória silenciosa e poderosa.",
  "Você não está sozinho nessa jornada. Estamos juntos.",
  "A mudança começa com um passo — e você já deu o seu.",
  "Recuperação não é linear, mas cada esforço conta.",
  "O futuro que você quer está sendo construído agora.",
  "Coragem não é a ausência de medo, é seguir apesar dele.",
  "Sua história pode inspirar alguém que precisa de esperança.",
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i]);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (d.getTime() === expected.getTime()) streak++;
    else break;
  }
  return streak;
}

export default function AppHome() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { totalEarned } = useMedals();
  const greeting = getGreeting();
  const quote = getDailyQuote();

  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Handle Stripe checkout success redirect: ?payment=success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success" || !user?.id) return;

    let cancelled = false;
    setConfirmingPayment(true);

    (async () => {
      await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", user.id);

      await refreshProfile();

      const { data: ob } = await supabase
        .from("onboarding_clinico")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      toast({
        title: "Pagamento confirmado!",
        description: "Sua assinatura está ativa.",
      });
      window.history.replaceState({}, "", "/app");
      setConfirmingPayment(false);
      if (!ob) navigate("/app", { replace: true });
    })().catch((e) => {
      console.error("payment=success handling failed", e);
      if (!cancelled) setConfirmingPayment(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, navigate, refreshProfile]);




  const firstName = profile?.full_name?.split(" ")[0];
  const greetingText = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Streak
  const { data: streakDays = 0 } = useQuery({
    queryKey: ["home-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("routine_days")
        .select("date")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(60);
      return calcStreak(data?.map((d) => d.date) || []);
    },
  });

  if (confirmingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Confirmando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top pb-36">

      {/* ── Header ── */}
      <header className="px-5 pt-7 pb-1">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
          >
            <span className="text-white text-sm font-bold">
              {firstName ? firstName.charAt(0).toUpperCase() : "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{greetingText}</h1>
            <p className="text-[11px] text-muted-foreground capitalize">{today}</p>
          </div>
          <button
            onClick={() => navigate("/app/medalhas")}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-card touch-target"
          >
            <Award className="h-5 w-5" style={{ color: "#C9A84C" }} />
            {totalEarned > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}
              >
                {totalEarned}
              </span>
            )}
          </button>
          <PortoSeguroButton />
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-card touch-target">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-3 space-y-3">
        <BlockingBanner />
        {/* ── Motivational Quote ── */}
        <section
          className="relative overflow-hidden p-4"
          style={{
            background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
            borderRadius: 16,
          }}
        >
          {/* Decorative quote mark */}
          <span
            className="absolute top-1 left-3 text-white/10 font-serif leading-none select-none"
            style={{ fontSize: 64 }}
          >
            "
          </span>
          <p className="relative text-white/90 text-sm font-medium leading-relaxed italic pl-4">
            {quote}
          </p>
        </section>


        {/* ── Premium Navigation Cards ── */}
        <PremiumNavCards />
      </main>

      {/* ── Crisis Button ── */}
      <button
        onClick={() => { window.location.href = "tel:188"; }}
        className="fixed bottom-[72px] left-4 right-4 z-30 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{ backgroundColor: "rgba(220, 38, 38, 0.9)" }}
        aria-label="Ligar para o CVV 188"
      >
        <Heart className="h-5 w-5 fill-white" />
        <span className="text-sm font-semibold">
          Em crise? Ligue 188 — CVV (gratuito, 24h)
        </span>
      </button>

      <BottomNavigation />
      <EveningCheckIn />
    </div>
  );
}
