import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ChevronLeft, Mail, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Letter {
  id: string;
  step_number: number;
  letter_type: string;
  title: string;
  content: string;
  ai_feedback: string | null;
  sent_to_anchor: boolean;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function LettersHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("journey_letters")
        .select("*")
        .eq("user_id", user.id)
        .order("step_number", { ascending: true });
      if (!error && data) setLetters(data as Letter[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F5F0E8" }}>
      {/* Header */}
      <header
        className="px-5 pt-12 pb-8 safe-top"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/85 text-sm font-medium mb-4 active:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(201, 168, 76, 0.2)", border: "1px solid rgba(201,168,76,0.4)" }}
          >
            <Mail className="h-6 w-6" style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Minhas Cartas</h1>
            <p className="text-white/75 text-xs mt-0.5">
              Seu diário pessoal de reflexões
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 -mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#1B4332" }} />
          </div>
        ) : letters.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center mt-4"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(27,67,50,0.1)",
              boxShadow: "0 4px 16px rgba(27,67,50,0.06)",
            }}
          >
            <div
              className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.15)" }}
            >
              <Mail className="h-8 w-8" style={{ color: "#C9A84C" }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "#1B4332" }}>
              Ainda sem cartas
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#1B4332", opacity: 0.7 }}>
              Suas cartas aparecerão aqui conforme você avança na jornada. Cada
              passo importante pede uma reflexão escrita.
            </p>
            <button
              onClick={() => navigate("/app/jornada")}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
              style={{ background: "#1B4332" }}
            >
              Ir para a Jornada
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {letters.map((letter) => {
              const isOpen = !!expanded[letter.id];
              const preview = letter.content
                .split("\n")
                .filter(Boolean)
                .slice(0, 2)
                .join(" ");
              return (
                <article
                  key={letter.id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: "#FFFCF7",
                    border: "1px solid rgba(27,67,50,0.1)",
                    boxShadow: "0 2px 12px rgba(27,67,50,0.05)",
                  }}
                >
                  <button
                    onClick={() =>
                      setExpanded((p) => ({ ...p, [letter.id]: !isOpen }))
                    }
                    className="w-full text-left p-5 active:opacity-80"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: "#1B4332",
                          color: "#F5F0E8",
                        }}
                      >
                        PASSO {letter.step_number}
                      </span>
                      <span className="text-[11px]" style={{ color: "#1B4332", opacity: 0.55 }}>
                        {formatDate(letter.created_at)}
                      </span>
                      {letter.sent_to_anchor && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                          style={{ background: "rgba(201,168,76,0.2)", color: "#8B6F1F" }}
                        >
                          enviada ao âncora
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-bold text-base leading-tight mb-2"
                      style={{ color: "#1B4332", fontFamily: "Georgia, serif" }}
                    >
                      {letter.title}
                    </h3>
                    {!isOpen && (
                      <p
                        className="text-sm leading-relaxed line-clamp-2"
                        style={{ color: "#1B4332", opacity: 0.75 }}
                      >
                        {preview}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-1 text-[11px] font-semibold mt-3"
                      style={{ color: "#1B4332", opacity: 0.6 }}
                    >
                      {isOpen ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Ler carta completa
                        </>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div
                        className="rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed"
                        style={{
                          background: "#FFFFFF",
                          color: "#1B4332",
                          fontFamily: "Georgia, serif",
                          border: "1px solid rgba(27,67,50,0.08)",
                        }}
                      >
                        {letter.content}
                      </div>

                      {letter.ai_feedback && (
                        <div
                          className="mt-3 rounded-xl p-4"
                          style={{
                            background: "rgba(201,168,76,0.1)",
                            border: "1px solid rgba(201,168,76,0.3)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4" style={{ color: "#8B6F1F" }} />
                            <span
                              className="text-[11px] font-bold tracking-wider uppercase"
                              style={{ color: "#8B6F1F" }}
                            >
                              Feedback da Ana
                            </span>
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "#1B4332" }}
                          >
                            {letter.ai_feedback}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/app/jornada/${letter.step_number}`)}
                        className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                        style={{
                          background: "transparent",
                          border: "1px solid #1B4332",
                          color: "#1B4332",
                        }}
                      >
                        Reabrir o Passo {letter.step_number}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
