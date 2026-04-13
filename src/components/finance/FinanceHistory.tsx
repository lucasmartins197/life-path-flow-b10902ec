import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface FinanceHistoryProps {
  monthlyData: { month: string; debts: number; available: number }[];
}

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinanceHistory({ monthlyData }: FinanceHistoryProps) {
  if (monthlyData.length === 0) {
    return (
      <div className="card-premium p-8 text-center">
        <p className="text-sm text-muted-foreground">Dados de evolução aparecerão conforme você usar o app</p>
      </div>
    );
  }

  return (
    <div className="card-premium p-5">
      <p className="text-sm font-semibold text-foreground mb-4">Evolução Mensal</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmtBRL(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="debts" name="Dívidas" stroke="hsl(4, 72%, 44%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="available" name="Disponível" stroke="hsl(153, 40%, 15%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
