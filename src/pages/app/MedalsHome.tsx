import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMedals, MEDAL_DEFINITIONS } from "@/hooks/useMedals";
import { ChevronLeft, Lock, Award, Gift } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";

export default function MedalsHome() {
  const navigate = useNavigate();
  const { earned, totalEarned, totalPossible, nextDiscountIn, discountsEarned, isLoading } = useMedals();

  const isEarned = (medalId: string) => {
    const def = MEDAL_DEFINITIONS.find((m) => m.id === medalId);
    if (!def) return null;
    return earned.find((e) => e.badge_name === def.name && e.badge_type === def.badge_type);
  };

  const pct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const nextDiscountPct = ((10 - nextDiscountIn) / 10) * 100;

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* Header */}
      <header
        className="px-5 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-sm mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Minhas Medalhas</h1>
              <p className="text-white/70 text-sm mt-1">
                {totalEarned} / {totalPossible} medalhas conquistadas
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}
            >
              <Award className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-4 h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #C9A84C, #E8D590)",
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* Reward card */}
        <section
          className="p-4 flex items-center gap-4"
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #C9A84C20, #E8D59020)",
            border: "1px solid #C9A84C40",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}
          >
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            {nextDiscountIn <= 10 && (
              <>
                <p className="text-sm font-bold text-foreground">
                  {nextDiscountIn === 10 && totalEarned === 0
                    ? "Conquiste 10 medalhas para ganhar desconto!"
                    : `Faltam ${nextDiscountIn} medalhas para 50% de desconto na terapia!`}
                </p>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${nextDiscountPct}%`,
                      background: "linear-gradient(90deg, #C9A84C, #E8D590)",
                    }}
                  />
                </div>
              </>
            )}
            {discountsEarned > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                🎉 Você já ganhou {discountsEarned} desconto{discountsEarned > 1 ? "s" : ""} de 50%!
              </p>
            )}
          </div>
        </section>

        {/* Journey medals */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Jornada dos 12 Passos
          </p>
          <div className="grid grid-cols-4 gap-3">
            {MEDAL_DEFINITIONS.filter((m) => m.badge_type === "journey").map((medal) => {
              const earnedData = isEarned(medal.id);
              return (
                <div
                  key={medal.id}
                  className="flex flex-col items-center gap-1.5 p-3 text-center"
                  style={{
                    borderRadius: 16,
                    background: earnedData
                      ? "linear-gradient(135deg, #1B4332, #2D6A4F)"
                      : "#F3F4F6",
                    boxShadow: earnedData ? "0 4px 12px rgba(27,67,50,0.2)" : "none",
                  }}
                >
                  <div className="text-2xl">
                    {earnedData ? medal.icon : "🔒"}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-tight"
                    style={{ color: earnedData ? "#fff" : "#9CA3AF" }}
                  >
                    {medal.name}
                  </span>
                  {earnedData && (
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {new Date(earnedData.earned_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Therapy medals */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Terapia
          </p>
          <div className="grid grid-cols-4 gap-3">
            {MEDAL_DEFINITIONS.filter((m) => m.badge_type === "therapy").map((medal) => {
              const earnedData = isEarned(medal.id);
              return (
                <div
                  key={medal.id}
                  className="flex flex-col items-center gap-1.5 p-3 text-center"
                  style={{
                    borderRadius: 16,
                    background: earnedData
                      ? "linear-gradient(135deg, #1A3A5C, #2E6DA4)"
                      : "#F3F4F6",
                    boxShadow: earnedData ? "0 4px 12px rgba(26,58,92,0.2)" : "none",
                  }}
                >
                  <div className="text-2xl">
                    {earnedData ? medal.icon : "🔒"}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-tight"
                    style={{ color: earnedData ? "#fff" : "#9CA3AF" }}
                  >
                    {medal.name}
                  </span>
                  {earnedData && (
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {new Date(earnedData.earned_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
    </div>
  );
}
