import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, CreditCard, Crown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SubscriptionHome() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isActive = profile?.subscription_status === "active";
  const subscriptionEnd = profile?.subscription_end;
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (success) {
      toast({
        title: "Parabéns! 🎉",
        description: "Sua assinatura foi ativada com sucesso. Aproveite todos os recursos!",
      });
    }
    if (canceled) {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
  }, [success, canceled]);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("create-checkout-session", {
        body: { user_id: user.id, email: user.email },
      });

      if (res.error) throw new Error(res.error.message);
      const { url } = res.data;
      if (url) window.location.href = url;
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
          /* Active Subscription */
          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-lg">Plano Premium</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
              </div>
              {subscriptionEnd && (
                <p className="text-sm text-muted-foreground">
                  Próxima renovação: {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
                </p>
              )}
              <div className="border-t border-border pt-4 space-y-2">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
