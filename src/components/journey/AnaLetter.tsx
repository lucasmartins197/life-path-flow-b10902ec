import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

interface AnaLetterProps {
  letters: { role: "assistant" | "user"; content: string }[];
  isLoading: boolean;
  onSendReply: (text: string) => void;
  maxExchanges?: number;
}

/* Typewriter hook — reveals text char by char */
function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    if (!text) return;
    const id = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, done };
}

/* Ana SVG avatar */
function AnaAvatar() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#1B4332" />
      <circle cx="24" cy="20" r="9" fill="#E8D590" />
      <ellipse cx="24" cy="38" rx="14" ry="10" fill="#E8D590" />
      {/* Eyes */}
      <circle cx="21" cy="19" r="1.2" fill="#1B4332" />
      <circle cx="27" cy="19" r="1.2" fill="#1B4332" />
      {/* Smile */}
      <path d="M21 23 Q24 26 27 23" stroke="#1B4332" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Hair */}
      <path d="M15 18 Q15 10 24 10 Q33 10 33 18" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M14 20 Q13 14 18 11" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M34 20 Q35 14 30 11" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function AnaLetter({ letters, isLoading, onSendReply, maxExchanges = 2 }: AnaLetterProps) {
  const [replyText, setReplyText] = useState("");

  // Count exchanges (each assistant message after the first = 1 exchange reply)
  const assistantCount = letters.filter((l) => l.role === "assistant").length;
  const reachedMax = assistantCount >= maxExchanges + 1; // initial + maxExchanges replies
  const showInput = !reachedMax && !isLoading;

  // Latest assistant letter for typewriter
  const lastAssistantIdx = [...letters].reverse().findIndex((l) => l.role === "assistant");
  const lastAssistantPos = lastAssistantIdx >= 0 ? letters.length - 1 - lastAssistantIdx : -1;

  return (
    <div className="space-y-5 animate-fade-in">
      {letters.map((letter, i) => {
        if (letter.role === "assistant") {
          return (
            <LetterCard
              key={i}
              content={letter.content}
              animate={i === lastAssistantPos}
            />
          );
        }
        // User reply shown as a subtle card
        return (
          <div key={i} className="ml-8 p-4 rounded-xl bg-muted/50 border text-sm leading-relaxed italic">
            <p className="text-muted-foreground text-xs mb-1 font-medium">Sua resposta:</p>
            {letter.content}
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-3 ml-4 py-6">
          <AnaAvatar />
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ana está escrevendo...
          </div>
        </div>
      )}

      {reachedMax && (
        <div className="text-center py-6 px-4">
          <p className="text-base" style={{ color: "#2D6A4F", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Ana ficará com você durante toda a sua jornada.<br />
            Nos vemos no próximo passo. 🌱
          </p>
        </div>
      )}

      {showInput && assistantCount > 0 && (
        <div className="space-y-3 pt-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Responda à Ana..."
            rows={3}
            className="resize-none"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          />
          <Button
            className="w-full"
            disabled={!replyText.trim()}
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            onClick={() => {
              if (replyText.trim()) {
                onSendReply(replyText.trim());
                setReplyText("");
              }
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar resposta
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Individual Letter Card ── */
function LetterCard({ content, animate }: { content: string; animate: boolean }) {
  const { displayed, done } = useTypewriter(animate ? content : "", 30);
  const text = animate ? displayed : content;
  const showCursor = animate && !done;

  return (
    <div
      className="relative rounded-xl p-6 shadow-md animate-fade-in"
      style={{
        background: "#FAF8F3",
        borderLeft: "4px solid #1B4332",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <AnaAvatar />
        <div>
          <p className="font-semibold text-sm" style={{ color: "#1B4332" }}>
            Ana · Companheira de Jornada
          </p>
          <p className="text-xs text-muted-foreground">Agora mesmo</p>
        </div>
      </div>

      {/* Decorative quote */}
      <div
        className="absolute top-14 left-6 text-6xl leading-none select-none pointer-events-none"
        style={{ color: "#1B433220", fontFamily: "Georgia, serif" }}
      >
        "
      </div>

      {/* Letter body */}
      <div
        className="relative pl-6"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "16px",
          lineHeight: "1.8",
          color: "#2C2C2C",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
        {showCursor && <span className="animate-pulse">|</span>}
      </div>

      {/* Signature */}
      {(done || !animate) && (
        <p
          className="mt-6 text-right animate-fade-in"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            color: "#1B4332",
            fontSize: "15px",
          }}
        >
          Com carinho, Ana 🌱
        </p>
      )}
    </div>
  );
}
