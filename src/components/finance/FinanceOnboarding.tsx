import { useState } from "react";
import { ChevronRight, ChevronLeft, Plus, X, Target, Wallet, CreditCard, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FinanceOnboardingProps {
  onComplete: (data: { income: any; fixed_expenses: any[]; debts: any[]; goal: string; goal_deadline: string }) => void;
}

const STEPS = [
  { icon: Wallet, title: "Renda", subtitle: "Quanto você ganha por mês?" },
  { icon: ListChecks, title: "Despesas Fixas", subtitle: "Gastos que se repetem todo mês" },
  { icon: CreditCard, title: "Dívidas", subtitle: "Suas dívidas ativas" },
  { icon: Target, title: "Objetivo", subtitle: "O que quer alcançar?" },
];

export function FinanceOnboarding({ onComplete }: FinanceOnboardingProps) {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState({ monthly: "", frequency: "mensal", variable: false, variable_avg: "" });
  const [expenses, setExpenses] = useState([
    { name: "Aluguel/Financiamento", amount: "" },
    { name: "Água/Luz/Internet", amount: "" },
    { name: "Plano de Saúde", amount: "" },
  ]);
  const [debts, setDebts] = useState<any[]>([]);
  const [goal, setGoal] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("6");

  const addExpense = () => setExpenses([...expenses, { name: "", amount: "" }]);
  const removeExpense = (i: number) => setExpenses(expenses.filter((_, idx) => idx !== i));
  const updateExpense = (i: number, field: string, val: string) => {
    const updated = [...expenses];
    updated[i] = { ...updated[i], [field]: val };
    setExpenses(updated);
  };

  const addDebt = () => setDebts([...debts, { type: "", bank: "", total: "", monthly_payment: "", interest_rate: "" }]);
  const removeDebt = (i: number) => setDebts(debts.filter((_, idx) => idx !== i));
  const updateDebt = (i: number, field: string, val: string) => {
    const updated = [...debts];
    updated[i] = { ...updated[i], [field]: val };
    setDebts(updated);
  };

  const handleFinish = () => {
    onComplete({
      income: {
        monthly: parseFloat(income.monthly) || 0,
        frequency: income.frequency,
        variable: income.variable,
        variable_avg: parseFloat(income.variable_avg) || 0,
      },
      fixed_expenses: expenses
        .filter((e) => e.amount)
        .map((e) => ({ name: e.name, amount: parseFloat(e.amount) || 0 })),
      debts: debts
        .filter((d) => d.total)
        .map((d) => ({
          type: d.type,
          bank: d.bank,
          total: parseFloat(d.total) || 0,
          monthly_payment: parseFloat(d.monthly_payment) || 0,
          interest_rate: parseFloat(d.interest_rate) || 0,
        })),
      goal,
      goal_deadline: goalDeadline
        ? (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + parseInt(goalDeadline));
            return d.toISOString().split("T")[0];
          })()
        : null,
    });
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-lg border border-border/60">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
              <p className="text-xs text-muted-foreground">{STEPS[step].subtitle}</p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* STEP 0: Income */}
          {step === 0 && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Renda mensal líquida</label>
                <Input
                  type="number"
                  placeholder="Ex: 3500"
                  value={income.monthly}
                  onChange={(e) => setIncome({ ...income, monthly: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Frequência</label>
                <Select value={income.frequency} onValueChange={(v) => setIncome({ ...income, frequency: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={income.variable} onCheckedChange={(c) => setIncome({ ...income, variable: !!c })} />
                <label className="text-sm text-foreground">Tenho renda variável</label>
              </div>
              {income.variable && (
                <div>
                  <label className="text-sm font-medium text-foreground">Média estimada da renda variável</label>
                  <Input
                    type="number"
                    placeholder="Ex: 800"
                    value={income.variable_avg}
                    onChange={(e) => setIncome({ ...income, variable_avg: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}

          {/* STEP 1: Fixed Expenses */}
          {step === 1 && (
            <>
              {expenses.map((exp, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Nome"
                      value={exp.name}
                      onChange={(e) => updateExpense(i, "name", e.target.value)}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="R$"
                      value={exp.amount}
                      onChange={(e) => updateExpense(i, "amount", e.target.value)}
                    />
                  </div>
                  <button onClick={() => removeExpense(i)} className="p-2 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button onClick={addExpense} className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <Plus className="h-4 w-4" /> Adicionar despesa
              </button>
            </>
          )}

          {/* STEP 2: Debts */}
          {step === 2 && (
            <>
              {debts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma dívida cadastrada. Adicione se tiver.
                </p>
              )}
              {debts.map((debt, i) => (
                <div key={i} className="card-premium p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Dívida {i + 1}</span>
                    <button onClick={() => removeDebt(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Select value={debt.type} onValueChange={(v) => updateDebt(i, "type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de dívida" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      <SelectItem value="emprestimo">Empréstimo Pessoal</SelectItem>
                      <SelectItem value="financiamento">Financiamento</SelectItem>
                      <SelectItem value="cheque_especial">Cheque Especial</SelectItem>
                      <SelectItem value="apostas">Dívidas de Apostas</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Banco/Instituição"
                    value={debt.bank}
                    onChange={(e) => updateDebt(i, "bank", e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder="Total R$"
                      value={debt.total}
                      onChange={(e) => updateDebt(i, "total", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Parcela R$"
                      value={debt.monthly_payment}
                      onChange={(e) => updateDebt(i, "monthly_payment", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Juros %"
                      value={debt.interest_rate}
                      onChange={(e) => updateDebt(i, "interest_rate", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <button onClick={addDebt} className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <Plus className="h-4 w-4" /> Adicionar dívida
              </button>
            </>
          )}

          {/* STEP 3: Goal */}
          {step === 3 && (
            <>
              <p className="text-sm font-medium text-foreground mb-2">Principal objetivo financeiro:</p>
              {[
                { id: "quitar_dividas", label: "Quitar dívidas" },
                { id: "parar_cartao", label: "Parar de usar cartão de crédito" },
                { id: "reserva_emergencia", label: "Criar reserva de emergência" },
                { id: "investir", label: "Investir" },
                { id: "organizar", label: "Organizar as finanças" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setGoal(opt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${goal === opt.id ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border text-foreground hover:bg-accent/10"}`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="pt-2">
                <label className="text-sm font-medium text-foreground">Prazo desejado</label>
                <Select value={goalDeadline} onValueChange={setGoalDeadline}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card px-6 py-4 border-t border-border/40 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1 bg-primary text-primary-foreground">
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1 bg-primary text-primary-foreground">
              Concluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
