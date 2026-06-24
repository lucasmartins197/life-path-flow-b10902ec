import { useState } from "react";
import { Calculator, Loader2, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SimulationResult {
  estimated_monthly_payment: number;
  estimated_months: number;
  total_paid: number;
  savings_percentage: number;
  recommendation: string;
  negotiated_debt?: number;
  discount_rate?: number;
  savings_amount?: number;
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function DebtSimulator() {
  const [debtAmount, setDebtAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();

    const debt = parseFloat(debtAmount);
    const interest = parseFloat(interestRate);
    const income = parseFloat(monthlyIncome);

    if (!debt || !interest || !income) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    setResult(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("simulate-debt", {
        body: { debt_amount: debt, interest_rate: interest, monthly_income: income },
      });

      if (error) throw error;

      setResult(data);

      // Save simulation
      if (user) {
        await supabase.from("debt_simulations").insert({
          user_id: user.id,
          debt_amount: debt,
          interest_rate: interest,
          monthly_income: income,
          ai_result: data,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro ao simular", description: "Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Simulador de Renegociação com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSimulate} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="debt" className="text-sm">Valor da dívida (R$)</Label>
            <Input
              id="debt"
              type="number"
              placeholder="Ex: 15000"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              className="input-premium"
              min="0"
              step="100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interest" className="text-sm">Taxa de juros mensal (%)</Label>
            <Input
              id="interest"
              type="number"
              placeholder="Ex: 12"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="input-premium"
              min="0"
              step="0.1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="income" className="text-sm">Renda mensal (R$)</Label>
            <Input
              id="income"
              type="number"
              placeholder="Ex: 3000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="input-premium"
              min="0"
              step="100"
            />
          </div>
          <Button type="submit" className="w-full btn-premium-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculando com IA...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Simular Renegociação
              </>
            )}
          </Button>
        </form>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 border-t border-border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Calculando renegociação com IA...</p>
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="font-semibold text-sm">Resultado da Simulação</h4>

            {typeof result.negotiated_debt === "number" && typeof result.discount_rate === "number" && (
              <div className="rounded-xl bg-success/10 p-3 space-y-1">
                <p className="text-sm text-foreground">
                  Dívida após desconto de {result.discount_rate.toFixed(0)}%:{" "}
                  <span className="font-semibold">{formatBRL(result.negotiated_debt)}</span>
                </p>
                {typeof result.savings_amount === "number" && (
                  <p className="text-sm text-success font-medium">
                    Economia total: {formatBRL(result.savings_amount)}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="metric-card text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="metric-value text-lg">
                  {result.estimated_months}x {formatBRL(result.estimated_monthly_payment)}
                </p>
                <p className="metric-label text-xs">Parcelas</p>
              </div>
              <div className="metric-card text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="metric-value text-lg">{formatBRL(result.total_paid)}</p>
                <p className="metric-label text-xs">Total a pagar</p>
              </div>
              <div className="metric-card text-center">
                <TrendingDown className="h-5 w-5 mx-auto mb-1 text-success" />
                <p className="metric-value text-lg text-success">
                  {result.savings_percentage.toFixed(0)}%
                </p>
                <p className="metric-label text-xs">Economia estimada</p>
              </div>
              <div className="metric-card text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="metric-value text-lg">{formatBRL(result.estimated_monthly_payment)}</p>
                <p className="metric-label text-xs">Parcela mensal</p>
              </div>
            </div>
            <div className="rounded-xl bg-accent/50 p-3">
              <p className="text-sm text-foreground">{result.recommendation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
