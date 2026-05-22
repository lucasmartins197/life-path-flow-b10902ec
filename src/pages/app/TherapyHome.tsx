import { useNavigate } from "react-router-dom";
import { ChevronLeft, CreditCard } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";

export default function TherapyHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* ── Header ─────────────────────────────────── */}
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.5px" }}
          >
            Terapia
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Especialistas em recuperação de ludopatia
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {/* ── Vídeo introdutório ───────────────────── */}
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#1B4332" }}>
            Acompanhamento Psicológico
          </h2>
          <div className="w-full rounded-xl overflow-hidden shadow-md bg-black">
            <iframe
              src="https://drive.google.com/file/d/1p4L5F5jkiUCltDejhgrK9x54HYU0ErFN/preview"
              width="100%"
              style={{ aspectRatio: "16 / 9", border: "none" }}
              allow="autoplay"
              allowFullScreen
              title="Acompanhamento Psicológico"
            />
          </div>
        </section>

        {/* ── Agendamento (iframe externo) ─────────── */}
        <section className="space-y-3">
          <div>
            <h2
              className="text-xl font-bold text-foreground"
              style={{ letterSpacing: "-0.4px" }}
            >
              Agende sua sessão
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha o profissional e o horário disponível
            </p>
          </div>

          <div
            className="w-full overflow-hidden shadow-md bg-card"
            style={{ borderRadius: 12 }}
          >
            <iframe
              src="https://appagendai.alualab.com/agendar?c=saindodojogo"
              width="100%"
              height="700px"
              style={{ border: "none", borderRadius: 12, display: "block" }}
              title="Agendamento"
            />
          </div>
        </section>

        {/* ── Card informativo de pagamento ────────── */}
        <section
          className="rounded-xl p-5 shadow-md"
          style={{
            background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-1">Pagamento</p>
              <p
                className="text-sm text-white/90"
                style={{ lineHeight: "1.6" }}
              >
                Após confirmar o agendamento, nossa equipe entrará em contato
                para orientar sobre as formas de pagamento.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
