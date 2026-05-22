import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CreditCard, Calendar, Loader2 } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function TherapyHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          user_id: user.id,
          email: user.email,
          price_id: "price_1Ta1mr0oEfdN4xGLFJVZsmDT",
          mode: "payment",
          success_path: "/app/terapia",
          cancel_path: "/app/terapia",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || "Erro ao iniciar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.5px" }}>
            Terapia
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Especialistas em recuperação de ludopatia
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
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

        {/* Card de agendamento com pagamento */}
        <section className="card-premium p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground">Agendar Consulta Terapêutica</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Sessão online com psicólogo especializado em ludopatia — R$ 229,20
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-cta w-full py-3 text-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Agendar e Pagar — R$ 229,20"
            )}
          </button>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground" style={{ letterSpacing: "-0.4px" }}>
              Agende sua sessão
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha o profissional e o horário disponível
            </p>
          </div>

          <div className="w-full overflow-hidden shadow-md bg-card" style={{ borderRadius: 12 }}>
            <iframe
              src="https://appagendai.alualab.com/agendar?c=saindodojogo"
              width="100%"
              height="700px"
              style={{ border: "none", borderRadius: 12, display: "block" }}
              title="Agendamento"
            />
          </div>
        </section>

        <section
          className="rounded-xl p-5 shadow-md"
          style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)" }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-1">Pagamento</p>
              <p className="text-sm text-white/90" style={{ lineHeight: "1.6" }}>
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
