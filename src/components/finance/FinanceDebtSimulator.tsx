import { useState, useMemo } from "react";
import { CreditCard } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Debt {
  type: string;
  bank: string;
  total: number;
  monthly_payment: number;
  interest_rate: number;
}

interface FinanceDebtSimulatorProps {
  debts: Debt[];
}

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function simulateDebt(balance: number, rate: number, payment: number): { months: number; totalPaid: number; data: { month: number; balance: number }[] } {
  const data: { month: number; balance: number }[] = [{ month: 0, balance }];
  let remaining = balance;
  let months = 0;
  let totalPaid = 0;
  const monthlyRate = rate / 100;

  while (remaining > 0 && months < 360) {
    months++;
    remaining = remaining * (1 + monthlyRate) - payment;
    totalPaid += payment;
    if (remaining < 0) { totalPaid += remaining; remaining = 0; }
    data.push({ month: months, balance: Math.max(0, Math.round(remaining)) });
  }
  return { months, totalPaid: Math.round(totalPaid), data };
}

export function FinanceDebtSimulator({ debts }: FinanceDebtSimulatorProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [extra, setExtra] = useState(0);

  const debt = debts[selectedIdx] || debts[0];
  const minPayment = debt?.monthly_payment || 100;

  const minSim = useMemo(() => debt ? simulateDebt(debt.total, debt.interest_rate, minPayment) : { months: 0, totalPaid: 0, data: [] }, [debt, minPayment]);
  const extraSim = useMemo(() => debt ? simulateDebt(debt.total, debt.interest_rate, minPayment + extra) : { months: 0, totalPaid: 0, data: [] }, [debt, minPayment, extra]);

  if (debts.length === 0) {
    return (
      <div className="card-premium p-8 text-center">
        <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada para simular</p>
      </div>
    );
  }

  const savings = minSim.totalPaid - extraSim.totalPaid;

  return (
    <div className="space-y-4">
      {/* Debt Selector */}
      {debts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {debts.map((d, i) => (
            <button key={i} onClick={() => { setSelectedIdx(i); setExtra(0); }}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${i === selectedIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {d.type || `Dívida ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="card-premium p-5">
        <p className="text-sm font-semibold text-foreground mb-1">{debt.type || "Dívida"} {debt.bank ? `— ${debt.bank}` : ""}</p>
        <p className="text-xs text-muted-foreground mb-4">Saldo: {fmtBRL(debt.total)} · Juros: {debt.interest_rate}% a.m.</p>

        {/* Extra payment slider */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Pagamento extra mensal</span>
            <span className="font-bold text-primary">{fmtBRL(extra)}</span>
          </div>
          <Slider value={[extra]} min={0} max={Math.max(500, debt.total * 0.1)} step={50}
            onValueChange={v => setExtra(v[0])} />
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-destructive/10 rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Só mínimo</p>
            <p className="text-lg font-bold text-destructive">{minSim.months} meses</p>
            <p className="text-xs text-muted-foreground">Total: {fmtBRL(minSim.totalPaid)}</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Com extra</p>
            <p className="text-lg font-bold text-primary">{extraSim.months} meses</p>
            <p className="text-xs text-muted-foreground">Total: {fmtBRL(extraSim.totalPaid)}</p>
          </div>
        </div>

        {savings > 0 && (
          <div className="bg-primary/10 rounded-xl p-3 text-center mb-4">
            <p className="text-xs text-muted-foreground">Economia em juros</p>
            <p className="text-lg font-bold text-primary">{fmtBRL(savings)}</p>
          </div>
        )}

        {/* Chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={extraSim.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: "Meses", position: "insideBottom", offset: -2, style: { fontSize: 10 } }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} labelFormatter={l => `Mês ${l}`} />
              <Line type="monotone" dataKey="balance" stroke="hsl(153, 40%, 15%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
