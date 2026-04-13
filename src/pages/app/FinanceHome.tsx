import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, BarChart3, Wallet, Calculator, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { FinanceOnboarding } from "@/components/finance/FinanceOnboarding";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { FinancePlan } from "@/components/finance/FinancePlan";
import { FinanceMonthly } from "@/components/finance/FinanceMonthly";
import { FinanceDebtSimulator } from "@/components/finance/FinanceDebtSimulator";
import { FinanceHistory } from "@/components/finance/FinanceHistory";

export default function FinanceHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("financial_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        setShowOnboarding(true);
      }

      const { data: txs } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(50);
      setTransactions(txs || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const generatePlan = useCallback(async () => {
    if (!profile) return;
    setPlanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("financial-plan", {
        body: {
          income: profile.income,
          fixed_expenses: profile.fixed_expenses,
          debts: profile.debts,
          goal: profile.goal,
          goal_deadline: profile.goal_deadline,
        },
      });
      if (error) throw error;
      setPlan(data);
    } catch (e: any) {
      toast({ title: "Erro ao gerar plano", description: e.message, variant: "destructive" });
    } finally {
      setPlanLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    if (profile && !plan) generatePlan();
  }, [profile, plan, generatePlan]);

  const handleOnboardingComplete = async (data: any) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("financial_profile").upsert({
        user_id: user.id,
        income: data.income,
        fixed_expenses: data.fixed_expenses,
        debts: data.debts,
        goal: data.goal,
        goal_deadline: data.goal_deadline,
      });
      if (error) throw error;
      setProfile({ ...data, user_id: user.id });
      setShowOnboarding(false);
      toast({ title: "Perfil financeiro salvo!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleAddTransaction = async (tx: {
    category: string; amount: number; description: string;
    type: string; transaction_date: string;
    is_recurring: boolean; recurring_day: number | null;
  }) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("financial_transactions").insert({
        user_id: user.id,
        category: tx.category,
        amount: tx.amount,
        description: tx.description || null,
        type: tx.type,
        transaction_date: tx.transaction_date,
        is_recurring: tx.is_recurring,
        recurring_day: tx.recurring_day,
      }).select().single();
      if (error) throw error;
      setTransactions([data, ...transactions]);
      toast({ title: tx.type === "income" ? "Entrada registrada!" : tx.type === "debt_payment" ? "Pagamento registrado!" : "Gasto registrado!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
      toast({ title: "Lançamento removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdateDebts = async (newDebts: any[]) => {
    if (!user || !profile) return;
    try {
      const { error } = await supabase.from("financial_profile")
        .update({ debts: newDebts })
        .eq("user_id", user.id);
      if (error) throw error;
      setProfile({ ...profile, debts: newDebts });
      toast({ title: "Dívidas atualizadas!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const totalIncome = profile?.income?.monthly || 0;
  const totalExpenses = Array.isArray(profile?.fixed_expenses)
    ? profile.fixed_expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)
    : 0;
  const totalDebts = Array.isArray(profile?.debts)
    ? profile.debts.reduce((s: number, d: any) => s + (d.total || 0), 0)
    : 0;
  const debtsArray = Array.isArray(profile?.debts) ? profile.debts : [];

  const buildMonthlyHistory = () => {
    if (transactions.length === 0 && !profile) return [];
    const now = new Date();
    const months: { month: string; debts: number; available: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const monthTxs = transactions.filter(t => t.transaction_date?.startsWith(monthKey));
      const spent = monthTxs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + (t.amount || 0), 0);
      months.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        debts: totalDebts,
        available: Math.max(0, totalIncome - totalExpenses - spent),
      });
    }
    return months;
  };

  const monthlyHistory = profile ? buildMonthlyHistory() : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {showOnboarding && <FinanceOnboarding onComplete={handleOnboardingComplete} />}

      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate("/app")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ChevronLeft className="h-4 w-4" /> Home
            </button>
            {profile && (
              <button onClick={() => setShowOnboarding(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Finanças</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inteligência financeira para sua recuperação</p>
        </div>
      </header>

      {!profile ? (
        <div className="max-w-lg mx-auto px-5 pt-10 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-foreground font-semibold mb-2">Configure seu perfil financeiro</p>
          <p className="text-sm text-muted-foreground mb-4">Clique abaixo para começar</p>
          <button onClick={() => setShowOnboarding(true)} className="btn-cta px-6 py-3">Começar</button>
        </div>
      ) : (
        <main className="max-w-lg mx-auto px-5 pt-4">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-4 bg-muted/50 rounded-xl p-1 h-auto">
              <TabsTrigger value="dashboard" className="text-xs py-2 flex flex-col items-center gap-0.5 data-[state=active]:bg-card">
                <BarChart3 className="h-3.5 w-3.5" /> Painel
              </TabsTrigger>
              <TabsTrigger value="plan" className="text-xs py-2 flex flex-col items-center gap-0.5 data-[state=active]:bg-card">
                <Wallet className="h-3.5 w-3.5" /> Plano
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs py-2 flex flex-col items-center gap-0.5 data-[state=active]:bg-card">
                <Settings className="h-3.5 w-3.5" /> Mês
              </TabsTrigger>
              <TabsTrigger value="simulator" className="text-xs py-2 flex flex-col items-center gap-0.5 data-[state=active]:bg-card">
                <Calculator className="h-3.5 w-3.5" /> Simular
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs py-2 flex flex-col items-center gap-0.5 data-[state=active]:bg-card">
                <TrendingUp className="h-3.5 w-3.5" /> Evolução
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <FinanceDashboard
                income={totalIncome}
                totalExpenses={totalExpenses}
                totalDebts={totalDebts}
                healthScore={plan?.health_score || 0}
                healthLevel={plan?.health_level || "atencao"}
              />
            </TabsContent>

            <TabsContent value="plan">
              <FinancePlan plan={plan} loading={planLoading} onRefresh={generatePlan} />
            </TabsContent>

            <TabsContent value="monthly">
              <FinanceMonthly
                transactions={transactions}
                debts={debtsArray}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateDebts={handleUpdateDebts}
                onOpenChat={() => setChatOpen(true)}
              />
            </TabsContent>

            <TabsContent value="simulator">
              <FinanceDebtSimulator debts={debtsArray} />
            </TabsContent>

            <TabsContent value="history">
              <FinanceHistory monthlyData={monthlyHistory} />
            </TabsContent>
          </Tabs>
        </main>
      )}

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
    </div>
  );
}
