import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, CreditCard, Crown, Loader2, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SubscriptionHome() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isActive = profile?.subscription_status === "active";
  const subscriptionEnd = profile?.subscription_end;
  const startDate =
    (profile as any)?.stripe_subscription_created_at ||
    (profile as any)?.created_at ||
    null;

  const renewalDate = (() => {
    if (subscriptionEnd) return new Date(subscriptionEnd);
    if (startDate) {
      const d = new Date(startDate);
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      // Adjust forward to the next future renewal
      const now = new Date();
      while (next < now) next.setMonth(next.getMonth() + 1);
      return next;
    }
    return null;
  })();

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const cancelDone = searchParams.get("cancelDone") === "true";

  useEffect(() => {
    if (success && user?.id) {
      (async () => {
        try {
          await supabase
            .from("profiles")
            .update({ subscription_status: "active" })
            .eq("id", user.id);
          await refreshProfile();
        } catch (e) {
          console.error("Failed to activate subscription locally:", e);
        }
        toast({
          title: "Parabéns!",
          description: "Sua assinatura foi ativada com sucesso. Aproveite todos os recursos!",
        });
        navigate("/app/onboarding", { replace: true });
      })();
    }
    if (canceled) {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
    if (cancelDone) {
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });
    }
  }, [success, canceled, cancelDone]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const sessionResp = await supabase.auth.getSession();
      const token = sessionResp.data.session?.access_token;
      const authUser = sessionResp.data.session?.user;
      if (!token || !authUser) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para assinar.",
          variant: "destructive",
        });
        return;
      }

      console.log("Iniciando checkout...");
      const response = await fetch("https://dmrlkxwpbwmzpdecsgnw.supabase.co/functions/v1/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": "sb_publishable_GrVvRKNeoFyX-QlBoBr8xw_Dura2nUZ",
        },
        body: JSON.stringify({
          user_id: authUser.id,
          email: authUser.email,
          success_path: "/app?payment=success",
          cancel_path: "/app/assinatura?canceled=true",
        }),
      });
      const data = await response.json();
      console.log("Checkout response:", data);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Erro",
          description: data?.error || "Tente novamente",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível iniciar o checkout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setConfirmOpen(false);
      setSearchParams({ cancelDone: "true" });
      // Reload to refresh profile state
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast({
        title: "Erro ao cancelar",
        description: err.message || "Não foi possível cancelar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
    }
  };

  const benefits = [
    "Acesso completo à Jornada de 12 passos",
    "Consultas com profissionais de saúde",
    "Índice de Recuperação personalizado",
    "Relatórios diários com IA",
    "Comunidade Histórias que Conectam",
    "Aulão semanal gratuito",
    "Simulador jurídico e financeiro",
    "Suporte prioritário",
  ];

  const fmtDate = (d: Date | string | null) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Minha Assinatura</h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Success Banner */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Assinatura ativada!</p>
                <p className="text-sm text-green-600">Você agora tem acesso completo.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Canceled Banner */}
        {canceled && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Pagamento cancelado</p>
                <p className="text-sm text-red-600">Tente novamente quando estiver pronto.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isActive ? (
          <>
            {/* Active Subscription Card */}
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-green-700" />
                    <span className="font-bold text-lg text-green-900">Assinatura Ativa</span>
                  </div>
                  <Badge className="bg-green-600 text-white border-0">Ativo</Badge>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-900/70">Plano</span>
                    <span className="font-semibold text-green-900">Premium</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-900/70">Valor</span>
                    <span className="font-semibold text-green-900">R$ 79,90/mês</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-900/70">Início</span>
                    <span className="font-semibold text-green-900">{fmtDate(startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-900/70">Próxima renovação</span>
                    <span className="font-semibold text-green-900">{fmtDate(renewalDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Seus benefícios</span>
                </div>
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cancel Button */}
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={() => setConfirmOpen(true)}
              disabled={canceling}
            >
              {canceling ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Cancelar assinatura
            </Button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você perderá acesso ao app imediatamente após o cancelamento.
                    Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={canceling}>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancel();
                    }}
                    disabled={canceling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {canceling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cancelando...
                      </>
                    ) : (
                      "Sim, cancelar"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          /* Inactive — Show Plans */
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <Crown className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-xl font-bold">Plano Premium</h2>
                <p className="text-muted-foreground text-sm">
                  Desbloqueie todos os recursos para sua recuperação
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-1">
                <p className="text-3xl font-bold">
                  R$ 79,90<span className="text-base font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                Assinar por R$ 79,90/mês
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
