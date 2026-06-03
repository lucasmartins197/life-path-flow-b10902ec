import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export default function TherapyHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentSuccess = searchParams.get("success") === "true";
  const [loading, setLoading] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    percent_off: number | null;
    amount_off: number | null;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const BASE_PRICE = 229.2;
  const finalPrice = appliedCoupon
    ? appliedCoupon.percent_off
      ? BASE_PRICE * (1 - appliedCoupon.percent_off / 100)
      : appliedCoupon.amount_off
        ? Math.max(0, BASE_PRICE - appliedCoupon.amount_off / 100)
        : BASE_PRICE
    : BASE_PRICE;
  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { coupon_id: coupon.trim() },
      });
      if (error || !data?.valid) {
        setCouponError(data?.error || "Cupom inválido");
      } else {
        setAppliedCoupon(data.coupon);
      }
    } catch (e: any) {
      setCouponError("Cupom inválido");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          user_id: user.id,
          email: user.email,
          price_id: "price_1Tdtbp1kqWoIkJvRWg3m50qR",
          mode: "payment",
          success_path: "/app/terapia?success=true",
          cancel_path: "/app/terapia",
          ...(appliedCoupon ? { coupon_id: appliedCoupon.id } : {}),
        },
      });
      if (error) {
        toast.error("Erro: " + error.message);
        return;
      }
      if (data?.error) {
        toast.error("Erro: " + data.error);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erro ao gerar link de pagamento");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao iniciar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const paymentSuccess = params.get("success") === "true";

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Home
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Terapia Online</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Especialistas em recuperação de ludopatia</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {/* Sucesso após pagamento */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento confirmado! ✅</h2>
              <p className="text-gray-600 mb-2">Sua sessão terapêutica foi agendada com sucesso.</p>
              <p className="text-sm text-gray-500 mb-6">
                Você receberá um email de confirmação com a data, horário e link da consulta em instantes.
              </p>
              <button
                onClick={() => navigate("/app/terapia")}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ backgroundColor: "#1B4332" }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Vídeo */}
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#1B4332" }}>
            Acompanhamento Psicológico
          </h2>
          <div className="w-full rounded-xl overflow-hidden shadow-md bg-black">
            <iframe
              src="https://drive.google.com/file/d/1p4L5F5jkiUCltDejhgrK9x54HYU0ErFN/preview"
              width="100%"
              style={{ aspectRatio: "16/9", border: "none" }}
              allow="autoplay"
              allowFullScreen
              title="Acompanhamento Psicológico"
            />
          </div>
        </section>

        {/* Valor */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <div>
            <p className="font-bold text-green-800">Consulta Terapêutica</p>
            <p className="text-sm text-green-700">Sessão online — psicólogo especializado</p>
          </div>
          <p className="text-2xl font-bold text-green-800">R$ 229,20</p>
        </div>

        {/* Agendamento */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: "#1B4332" }}>
              1. Selecione uma data
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Escolha o profissional e horário disponível</p>
          </div>

          <div className="w-full overflow-hidden shadow-md bg-card rounded-xl">
            <iframe
              src="https://appagendai.alualab.com/agendar?c=saindodojogo"
              width="100%"
              height="600px"
              style={{ border: "none", display: "block" }}
              title="Agendamento"
            />
          </div>

          {/* Confirmação de data selecionada */}
          <button
            onClick={() => setDataSelecionada(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{
              borderColor: dataSelecionada ? "#1B4332" : "#E5E7EB",
              background: dataSelecionada ? "#F0FDF4" : "#fff",
              color: dataSelecionada ? "#1B4332" : "#6B7280",
            }}
          >
            {dataSelecionada ? "✓ Data selecionada — prosseguir para pagamento" : "Já selecionei minha data →"}
          </button>
        </section>

        {/* Pagamento — só aparece após selecionar data */}
        {dataSelecionada && (
          <section
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "#1B4332" }}
              >
                2
              </div>
              <p className="font-bold" style={{ color: "#1B4332" }}>
                Confirme o pagamento
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Após o pagamento você receberá confirmação por email e nossa equipe validará o agendamento.
            </p>

            {/* Cupom de desconto */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: "#1B4332" }}>
                Tem um cupom de desconto?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setCouponError("");
                  }}
                  disabled={!!appliedCoupon}
                  placeholder="Digite seu cupom"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#E5E7EB" }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !coupon.trim() || !!appliedCoupon}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#1B4332" }}
                >
                  {couponLoading ? "..." : "Aplicar"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-sm font-semibold text-green-700">
                  ✓ Cupom aplicado!{appliedCoupon.percent_off ? ` ${appliedCoupon.percent_off}% de desconto` : ""}
                </p>
              )}
              {couponError && <p className="text-sm font-semibold text-red-600">{couponError}</p>}
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground line-through">R$ {formatBRL(BASE_PRICE)}</span>
                <span className="font-bold text-green-700">Novo total: R$ {formatBRL(finalPrice)}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-98 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </span>
              ) : (
                `Pagar R$ ${formatBRL(finalPrice)} →`
              )}
            </button>
          </section>
        )}
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
