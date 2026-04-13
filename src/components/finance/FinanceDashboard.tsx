import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface FinanceDashboardProps {
  income: number;
  totalExpenses: number;
  totalDebts: number;
  healthScore: number;
  healthLevel: string;
}

const HEALTH_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  critico: { color: "text-destructive", bg: "bg-destructive", label: "Crítica" },
  atencao: { color: "text-warning", bg: "bg-warning", label: "Atenção" },
  estavel: { color: "text-primary", bg: "bg-primary", label: "Estável" },
  saudavel: { color: "text-primary", bg: "bg-primary", label: "Saudável" },
};

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinanceDashboard({ income, totalExpenses, totalDebts, healthScore, healthLevel }: FinanceDashboardProps) {
  const available = Math.max(0, income - totalExpenses);
  const total = totalExpenses + totalDebts + available || 1;

  const pieData = [
    { name: "Despesas Fixas", value: totalExpenses, color: "hsl(38, 88%, 48%)" },
    { name: "Dívidas", value: totalDebts, color: "hsl(4, 72%, 44%)" },
    { name: "Disponível", value: available, color: "hsl(153, 40%, 15%)" },
  ].filter(d => d.value > 0);

  const health = HEALTH_COLORS[healthLevel] || HEALTH_COLORS.atencao;
  const thermPct = Math.min(100, Math.max(0, healthScore));

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
        <div className="flex justify-center gap-4 mt-2">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} ({Math.round((d.value / total) * 100)}%)
            </div>
          ))}
        </div>
      </div>

      {/* Health Thermometer */}
      <div className="card-premium p-5">
        <p className="text-sm font-semibold text-foreground mb-3">Saúde Financeira</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${thermPct}%`,
                  background: thermPct < 40
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
