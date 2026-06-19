import { TrendingUp, TrendingDown, Wallet, Sparkles, AlertCircle, CreditCard, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DebtItem {
  type?: string;
  bank?: string;
  total?: number;
  monthly_payment?: number;
  interest_rate?: number;
}

interface FinanceDashboardProps {
  income: number;
  totalExpenses: number;
  totalDebts: number;
  healthScore: number;
  healthLevel: string;
  debts?: DebtItem[];
  coachMessage?: string;
  monthTransactions?: Array<{ type: string; amount: number; transaction_date?: string }>;
}

const HEALTH_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  critico: { color: "text-destructive", bg: "bg-destructive", label: "Crítica" },
  atencao: { color: "text-warning", bg: "bg-warning", label: "Atenção" },
  estavel: { color: "text-primary", bg: "bg-primary", label: "Estável" },
  saudavel: { color: "text-primary", bg: "bg-primary", label: "Saudável" },
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DEBT_TYPE_LABEL: Record<string, string> = {
  cartao: "Cartão de crédito",
  emprestimo: "Empréstimo",
  financiamento: "Financiamento",
  cheque_especial: "Cheque especial",
  apostas: "Dívida de apostas",
  outro: "Outro",
};

const debtNextStep = (d: DebtItem): string => {
  const rate = d.interest_rate || 0;
  if (d.type === "apostas") {
    return "Priorize quitar esta dívida — ela mantém o gatilho vivo. Pague o máximo possível este mês.";
  }
  if (rate >= 8) {
    return "Juros muito altos. Tente renegociar com a instituição antes de pagar a próxima parcela.";
  }
  if (rate >= 3) {
    return "Aumente a parcela mensal mesmo que em R$ 50 — cada reforço reduz juros futuros.";
  }
  return "Mantenha o pagamento em dia e considere antecipar parcelas quando sobrar caixa.";
};

const buildLocalGuidance = (income: number, totalExpenses: number, totalDebts: number): string => {
  if (income <= 0) {
    return "Cadastre sua renda para receber orientações personalizadas da Ana.";
  }
  const expenseRatio = (totalExpenses / income) * 100;
  const debtRatio = (totalDebts / income) * 100;

  if (expenseRatio >= 90) {
    return `Você está comprometendo ${Math.round(expenseRatio)}% da sua renda com despesas fixas. Sua prioridade esta semana é cortar pelo menos um gasto variável.`;
  }
  if (debtRatio >= 300) {
    return "Suas dívidas equivalem a vários meses de renda. Foque em parar o sangramento: nada de novas compras parceladas até o próximo plano da Ana.";
  }
  if (expenseRatio >= 70) {
    return `Você gasta cerca de ${Math.round(expenseRatio)}% da renda com fixos. Use a aba Plano para a Ana sugerir onde aliviar.`;
  }
  if (totalDebts > 0) {
    return "Você tem espaço no orçamento. Direcione o saldo livre para acelerar a quitação da dívida mais cara.";
  }
  return "Sem dívidas e gastos sob controle. Comece a construir sua reserva de emergência — meta inicial: 1 mês de despesas.";
};

export function FinanceDashboard({
  income,
  totalExpenses,
  totalDebts,
  healthScore,
  healthLevel,
  debts = [],
  coachMessage,
  monthTransactions = [],
}: FinanceDashboardProps) {
  const available = Math.max(0, income - totalExpenses);
  const total = totalExpenses + totalDebts + available || 1;

  const pieData = [
    { name: "Despesas Fixas", value: totalExpenses, color: "hsl(38, 88%, 48%)" },
    { name: "Dívidas", value: totalDebts, color: "hsl(4, 72%, 44%)" },
    { name: "Disponível", value: available, color: "hsl(153, 40%, 15%)" },
  ].filter((d) => d.value > 0);

  const health = HEALTH_COLORS[healthLevel] || HEALTH_COLORS.atencao;
  const thermPct = Math.min(100, Math.max(0, healthScore));

  // Largest active debt
  const largestDebt = debts
    .filter((d) => (d.total || 0) > 0)
    .sort((a, b) => (b.total || 0) - (a.total || 0))[0];

  // Spending ratio for this month (income txs vs expense txs)
  const monthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (t.amount || 0), 0);
  const ratio = income > 0 ? (monthExpense + totalExpenses) / income : 0;

  const ratioPct = Math.min(100, Math.round(ratio * 100));
  const ratioColor =
    ratioPct < 60 ? "hsl(153, 40%, 25%)" : ratioPct < 85 ? "hsl(38, 88%, 48%)" : "hsl(4, 72%, 44%)";
  const ratioLabel = ratioPct < 60 ? "Saudável" : ratioPct < 85 ? "Atenção" : "Crítico";

  const guidance = coachMessage?.trim() || buildLocalGuidance(income, totalExpenses, totalDebts);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-premium p-3.5 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Renda</p>
          <p className="text-sm font-bold text-primary mt-0.5">{fmtBRL(income)}</p>
        </div>
        <div className="card-premium p-3.5 text-center">
          <TrendingDown className="h-5 w-5 text-destructive mx-auto mb-1.5" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dívidas</p>
          <p className="text-sm font-bold text-destructive mt-0.5">{fmtBRL(totalDebts)}</p>
        </div>
        <div className="card-premium p-3.5 text-center">
          <Wallet className="h-5 w-5 text-accent mx-auto mb-1.5" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Livre</p>
          <p className="text-sm font-bold text-accent mt-0.5">{fmtBRL(available)}</p>
        </div>
      </div>

      {/* Health Indicator (income vs spending) */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Saúde Financeira do Mês</p>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${ratioColor}22`, color: ratioColor }}
          >
            {ratioLabel}
          </span>
        </div>
        <div className="h-3 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${ratioPct}%`, background: ratioColor }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>0% da renda</span>
          <span>{ratioPct}% gasto</span>
          <span>100%</span>
        </div>
      </div>

      {/* AI Guidance */}
      <div className="card-premium p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary mb-1">Orientação da Ana</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{guidance}</p>
          </div>
        </div>
      </div>

      {/* Largest debt highlight */}
      {largestDebt && (
        <div className="card-premium p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold">
                Dívida prioritária
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {largestDebt.bank || DEBT_TYPE_LABEL[largestDebt.type || ""] || "Dívida"}
              </p>
              <p className="text-xs text-muted-foreground">
                {DEBT_TYPE_LABEL[largestDebt.type || ""] || largestDebt.type}
                {largestDebt.interest_rate ? ` • ${largestDebt.interest_rate}% a.m.` : ""}
              </p>
              <p className="text-lg font-bold text-destructive mt-1">{fmtBRL(largestDebt.total || 0)}</p>
            </div>
            <CreditCard className="h-5 w-5 text-destructive/40 shrink-0" />
          </div>
          <div className="flex items-start gap-2 bg-card rounded-xl p-3 border border-border/40">
            <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/85 leading-relaxed">{debtNextStep(largestDebt)}</p>
          </div>
        </div>
      )}

      {/* Pie Chart */}
      <div className="card-premium p-5">
        <p className="text-sm font-semibold text-foreground mb-3">Distribuição do Orçamento</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 flex-wrap">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} ({Math.round((d.value / total) * 100)}%)
            </div>
          ))}
        </div>
      </div>

      {/* Health Thermometer (AI score) */}
      <div className="card-premium p-5">
        <p className="text-sm font-semibold text-foreground mb-3">Índice de Saúde (Ana)</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${thermPct}%`,
                  background:
                    thermPct < 40
                      ? "hsl(4, 72%, 44%)"
                      : thermPct < 70
                        ? "hsl(38, 88%, 48%)"
                        : "hsl(153, 40%, 15%)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>0</span><span>40</span><span>70</span><span>100</span>
            </div>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${health.color}`}>{healthScore}</p>
            <p className={`text-xs font-medium ${health.color}`}>{health.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
