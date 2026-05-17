import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  Lock,
  Play,
  Award,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";

/* ── Hardcoded 12-step names ── */
const STEP_META: Record<number, { name: string; subtitle: string; medal: string }> = {
  1:  { name: "Reconhecimento",    subtitle: "Admito que perdi o controle", medal: "Coragem de Olhar" },
  2:  { name: "Esperança",         subtitle: "Posso recuperar minha lucidez", medal: "Primeiro Raio de Luz" },
  3:  { name: "Entrega",           subtitle: "Um propósito maior que meus impulsos", medal: "Âncora Plantada" },
  4:  { name: "Inventário",        subtitle: "Honestidade sobre o impacto", medal: "Espelho Honesto" },
  5:  { name: "Verdade",           subtitle: "Reconheço a dimensão real", medal: "Voz que Liberta" },
  6:  { name: "Disponibilidade",   subtitle: "Pronto para abandonar padrões", medal: "Porta Aberta" },
  7:  { name: "Humildade",         subtitle: "Peço força para transformar", medal: "Força que Dobra" },
  8:  { name: "Responsabilidade",  subtitle: "Listo quem prejudiquei", medal: "Peso nos Ombros" },
  9:  { name: "Reparação",         subtitle: "Faço reparações possíveis", medal: "Ponte Reconstruída" },
  10: { name: "Vigilância",        subtitle: "Inventário diário", medal: "Guarda Fiel" },
  11: { name: "Conexão Real",      subtitle: "Silêncio e direção", medal: "Raízes Profundas" },
  12: { name: "Propósito",         subtitle: "Vivo e compartilho", medal: "Farol Aceso" },
};

interface JourneyProgressRow {
  step_number: number;
  is_completed: boolean;
}

export default function JourneysHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<JourneyProgressRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("journey_intro_seen") !== "1"
  );

  const dismissIntro = () => {
    sessionStorage.setItem("journey_intro_seen", "1");
    setShowIntro(false);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("journey_progress")
        .select("step_number, is_completed")
        .eq("user_id", user.id);
      if (p) setProgress(p as JourneyProgressRow[]);
      setIsLoading(false);
    })();
  }, [user]);

  const allSteps = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const meta = STEP_META[num];
    return { step_number: num, name: meta.name, subtitle: meta.subtitle, medal: meta.medal };
  });

  const getStatus = (stepNum: number): "completed" | "available" | "locked" => {
    if (progress.find((p) => p.step_number === stepNum && p.is_completed)) return "completed";
    if (stepNum === 1) return "available";
    if (progress.find((p) => p.step_number === stepNum - 1 && p.is_completed)) return "available";
    return "locked";
  };

  const completedCount = progress.filter((p) => p.is_completed).length;
  const pct = Math.round((completedCount / 12) * 100);

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* ── Premium Header Banner ── */}
      <header
        className="px-5 pt-8 pb-5"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors mb-4 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <h1 className="text-2xl font-bold text-white">A Jornada</h1>
          <p className="text-sm text-white/70 mt-1">
            Sua transformação, um passo de cada vez
          </p>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #C9A84C, #E8D590)",
                }}
              />
            </div>
            <span className="text-white font-bold text-sm shrink-0">{pct}%</span>
          </div>
          <p className="text-white/60 text-xs mt-1.5">
            {completedCount} de 12 passos concluídos
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          allSteps.map((step) => {
            const status = getStatus(step.step_number);
            const isDone = status === "completed";
            const isLocked = status === "locked";
            const isAvailable = status === "available";

            return (
              <button
                key={step.step_number}
                disabled={isLocked}
                onClick={() =>
                  !isLocked && navigate(`/app/jornada/${step.step_number}`)
                }
                className="w-full text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  ...(isDone
                    ? {
                        background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
                        boxShadow: "0 4px 16px rgba(27,67,50,0.3)",
                      }
                    : isAvailable
                    ? {
                        background: "#fff",
                        border: "2px solid #2D6A4F",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      }
                    : {
                        background: "#F3F4F6",
                        opacity: 0.7,
                      }),
                }}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Step indicator */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: isDone
                        ? "linear-gradient(135deg, #C9A84C, #E8D590)"
                        : isAvailable
                        ? "#E8F5E9"
                        : "#E5E7EB",
                    }}
                  >
                    {isDone ? (
                      <Award className="h-6 w-6 text-white" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: "#1B4332" }}>
                        {step.step_number}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: isDone ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}
                      >
                        Passo {step.step_number}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Concluído
                        </span>
                      )}
                      {isAvailable && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ background: "#D1FAE5", color: "#065F46" }}
                        >
                          Disponível
                        </span>
                      )}
                    </div>
                    <p
                      className="font-bold text-sm truncate"
                      style={{ color: isDone ? "#fff" : isLocked ? "#9CA3AF" : "#1F2937" }}
                    >
                      {step.name}
                    </p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{
                        color: isDone ? "rgba(255,255,255,0.7)" : isLocked ? "#D1D5DB" : "#6B7280",
                      }}
                    >
                      "{step.subtitle}"
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock
                        className="h-3 w-3"
                        style={{
                          color: isDone ? "rgba(255,255,255,0.5)" : "#9CA3AF",
                        }}
                      />
                      <span
                        className="text-[11px]"
                        style={{
                          color: isDone ? "rgba(255,255,255,0.5)" : "#9CA3AF",
                        }}
                      >
                        Mínimo 12h de comprometimento
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {isAvailable && (
                    <div
                      className="shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                      style={{ background: "#1B4332" }}
                    >
                      <span className="text-white text-xs font-semibold">Iniciar</span>
                      <Play className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {isDone && (
                    <div
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {isLocked && (
                    <span className="text-[10px] text-gray-400 shrink-0 max-w-[70px] text-right leading-tight">
                      Conclua o passo anterior
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />

      {showIntro && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 safe-top safe-bottom overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl my-auto">
            <div
              className="px-5 py-4"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              <h2 className="text-white font-bold text-lg">
                Antes de começar, assista este vídeo
              </h2>
              <p className="text-white/70 text-xs mt-1">
                Uma breve introdução à Jornada dos 12 Passos
              </p>
            </div>
            <iframe
              src="https://www.youtube.com/embed/1sOmc_iDXn4?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1"
              width="100%"
              style={{ aspectRatio: "16 / 9", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Introdução à Jornada dos 12 Passos"
            />
            <div className="p-5">
              <button
                onClick={dismissIntro}
                className="w-full h-12 rounded-xl font-semibold text-white transition-transform active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
              >
                Continuar para a Jornada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
