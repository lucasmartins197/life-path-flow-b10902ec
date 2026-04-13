import { useState } from "react";
import { Plus, X, ShoppingCart, Car, Gamepad2, HeartPulse, Dice1, MoreHorizontal, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Transaction {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
}

interface FinanceMonthlyProps {
  transactions: Transaction[];
  onAddTransaction: (tx: { category: string; amount: number; description: string }) => void;
  monthlyGoalTarget: number;
  monthlyGoalCurrent: number;
}

const CATEGORIES = [
  { id: "alimentacao", label: "Alimentação", icon: ShoppingCart, color: "text-primary" },
  { id: "transporte", label: "Transporte", icon: Car, color: "text-accent" },
  { id: "lazer", label: "Lazer", icon: Gamepad2, color: "text-info" },
  { id: "saude", label: "Saúde", icon: HeartPulse, color: "text-primary" },
  { id: "apostas", label: "Apostas (recaída)", icon: Dice1, color: "text-destructive" },
  { id: "outros", label: "Outros", icon: MoreHorizontal, color: "text-muted-foreground" },
];

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinanceMonthly({ transactions, onAddTransaction, monthlyGoalTarget, monthlyGoalCurrent }: FinanceMonthlyProps) {
  const [open, setOpen] = useState(false);
  const [newTx, setNewTx] = useState({ category: "alimentacao", amount: "", description: "" });

  const handleAdd = () => {
    if (!newTx.amount) return;
    onAddTransaction({
      category: newTx.category,
      amount: parseFloat(newTx.amount),
      description: newTx.description,
    });
    setNewTx({ category: "alimentacao", amount: "", description: "" });
    setOpen(false);
  };

  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
  const goalProgress = monthlyGoalTarget > 0 ? Math.min(100, (monthlyGoalCurrent / monthlyGoalTarget) * 100) : 0;

  // Group by category
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: transactions.filter(t => t.category === cat.id).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="space-y-4">
      {/* Monthly Goal Progress */}
      {monthlyGoalTarget > 0 && (
        <div className="card-premium p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-foreground">Meta do Mês</p>
            <p className="text-xs text-muted-foreground">{fmtBRL(monthlyGoalCurrent)} de {fmtBRL(monthlyGoalTarget)}</p>
          </div>
          <Progress value={goalProgress} className="h-2.5" />
        </div>
      )}

      {/* Category Summary */}
      {byCategory.length > 0 && (
        <div className="card-premium p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Gastos por Categoria</p>
          <div className="space-y-2">
            {byCategory.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${cat.color} shrink-0`} />
                  <span className="text-sm text-foreground flex-1">{cat.label}</span>
                  <span className="text-sm font-bold text-foreground">{fmtBRL(cat.total)}</span>
                </div>
              );
            })}
            <div className="border-t border-border/40 pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-sm font-bold text-destructive">{fmtBRL(totalSpent)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="card-premium divide-y divide-border/40">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum gasto registrado este mês</p>
          </div>
        ) : (
          transactions.slice(0, 10).map(tx => {
            const cat = CATEGORIES.find(c => c.id === tx.category) || CATEGORIES[5];
            const Icon = cat.icon;
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description || cat.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString("pt-BR")}</p>
                </div>
                <p className="text-sm font-bold text-destructive shrink-0">-{fmtBRL(tx.amount)}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Transaction Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
            <Plus className="h-6 w-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={newTx.category} onValueChange={v => setNewTx({ ...newTx, category: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Valor (R$)" value={newTx.amount}
              onChange={e => setNewTx({ ...newTx, amount: e.target.value })} />
            <Input placeholder="Descrição (opcional)" value={newTx.description}
              onChange={e => setNewTx({ ...newTx, description: e.target.value })} />
            <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground">Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
