import { useEffect, useState } from "react";
import { Moon, Heart, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Answer = "nao_senti" | "resisti" | "acessei";

const ANSWERS: { value: Answer; label: string; tone: "good" | "warn" | "alert" }[] = [
  { value: "nao_senti", label: "Não senti vontade", tone: "good" },
  { value: "resisti",   label: "Senti, mas resisti", tone: "warn" },
  { value: "acessei",   label: "Acabei acessando", tone: "alert" },
];

const STORAGE_KEY = "evening-checkin-dismissed";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function EveningCheckIn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState<Answer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const hour = new Date().getHours();
    if (hour < 20) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === todayKey()) return;

    // Skip if user already did the gambling check-in today
    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("daily_reflections")
        .select("id, content")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .ilike("content", "[checkin-apostas]%")
        .limit(1);
      if (!data || data.length === 0) setShow(true);
    })();
  }, [user]);

  const handleAnswer = async (answer: Answer) => {
    if (!user) return;
    setSubmitting(true);
    const labelMap: Record<Answer, string> = {
      nao_senti: "Não senti vontade de acessar plataformas de apostas hoje.",
      resisti: "Senti vontade de acessar apostas mas resisti.",
      acessei: "Acabei acessando plataformas de apostas hoje.",
    };
    const aiResponseMap: Record<Answer, string> = {
      nao_senti:
        "Que ótimo. Cada dia assim fortalece sua recuperação. Continue cuidando de você.",
      resisti:
        "Resistir é uma vitória real. Reconheça sua coragem — você está mais forte do que pensa.",
      acessei:
        "Obrigada por ter coragem de me contar. Recaída faz parte do processo, não anula seu progresso. Que tal reforçar o bloqueio agora? Estou aqui com você.",
    };
    try {
      await supabase.from("daily_reflections").insert({
        user_id: user.id,
        content: `[checkin-apostas] ${labelMap[answer]}`,
        ai_response: aiResponseMap[answer],
      });
      setSubmitted(answer);
      localStorage.setItem(STORAGE_KEY, todayKey());
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, todayKey());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div
        className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl animate-slide-up safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              <Moon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ana — check-in da noite</p>
              <p className="text-sm font-bold text-foreground">Como foi seu dia?</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {submitted === null ? (
          <>
            <p className="text-sm text-foreground/80 leading-relaxed mb-5">
              Hoje você sentiu vontade de acessar plataformas de apostas?
            </p>
            <div className="space-y-2">
              {ANSWERS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={submitting}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full text-left px-4 py-3.5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98] text-sm font-medium text-foreground disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-primary/5">
              <Heart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/90 leading-relaxed">
                {submitted === "nao_senti" &&
                  "Que ótimo. Cada dia assim fortalece sua recuperação. Continue cuidando de você."}
                {submitted === "resisti" &&
                  "Resistir é uma vitória real. Reconheça sua coragem — você está mais forte do que pensa."}
                {submitted === "acessei" &&
                  "Obrigada por ter coragem de me contar. Recaída faz parte do processo, não anula seu progresso. Que tal reforçar o bloqueio agora? Estou aqui com você."}
              </p>
            </div>

            {submitted === "acessei" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { dismiss(); navigate("/app/bloqueio"); }}
                  className="py-3 rounded-2xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
                >
                  Reforçar bloqueio
                </button>
                <button
                  onClick={dismiss}
                  className="py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <button
                onClick={dismiss}
                className="w-full py-3 rounded-2xl text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
              >
                Fechar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
