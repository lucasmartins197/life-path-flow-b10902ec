import { useState, useMemo } from "react";
import {
  Plus, X, Trash2, Filter,
  ShoppingCart, Car, Gamepad2, HeartPulse, Dice1, MoreHorizontal,
  Home, GraduationCap, Briefcase, DollarSign, CreditCard, CheckCircle,
  TrendingUp, TrendingDown, Wallet, AlertTriangle, MessageCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";

/* ─── Types ─── */
export interface Transaction {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  type: string;
  is_recurring?: boolean;
  recurring_day?: number | null;
}

export interface Debt {
  type: string;
  bank: string;
  total: number;
  monthly_payment: number;
  interest_rate: number;
  due_day?: number;
}

interface FinanceMonthlyProps {
  transactions: Transaction[];
  debts: Debt[];
  onAddTransaction: (tx: {
    category: string;
    amount: number;
    description: string;
    type: string;
    transaction_date: string;
    is_recurring: boolean;
    recurring_day: number | null;
  }) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateDebts: (debts: Debt[]) => void;
  onOpenChat: () => void;
}

/* ─── Category configs ─── */
const EXPENSE_CATEGORIES = [
  { id: "alimentacao", label: "Alimentação", icon: ShoppingCart },
  { id: "moradia", label: "Moradia", icon: Home },
  { id: "transporte", label: "Transporte", icon: Car },
  { id: "saude", label: "Saúde", icon: HeartPulse },
  { id: "lazer", label: "Lazer", icon: Gamepad2 },
  { id: "educacao", label: "Educação", icon: GraduationCap },
  { id: "apostas", label: "Apostas", icon: Dice1 },
  { id: "outros", label: "Outro", icon: MoreHorizontal },
];

const INCOME_CATEGORIES = [
  { id: "salario", label: "Salário", icon: Briefcase },
  { id: "freelance", label: "Freelance", icon: DollarSign },
  { id: "renda_extra", label: "Renda extra", icon: TrendingUp },
  { id: "outro_entrada", label: "Outro", icon: MoreHorizontal },
];

const DEBT_TYPES = [
  { id: "cartao", label: "Cartão de crédito" },
  { id: "emprestimo", label: "Empréstimo" },
  { id: "financiamento", label: "Financiamento" },
  { id: "cheque_especial", label: "Cheque especial" },
  { id: "apostas", label: "Dívida de aposta" },
  { id: "outro", label: "Outro" },
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const getCat = (id: string) => ALL_CATEGORIES.find(c => c.id === id) || { id, label: id, icon: MoreHorizontal };
const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ─── Component ─── */
export function FinanceMonthly({
  transactions, debts, onAddTransaction, onDeleteTransaction, onUpdateDebts, onOpenChat,
}: FinanceMonthlyProps) {
  // Menu & modal states
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "debt" | "payment" | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");

  // Shared form state
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  // Debt form
  const [debtBank, setDebtBank] = useState("");
  const [debtType, setDebtType] = useState("cartao");
  const [debtTotal, setDebtTotal] = useState("");
  const [debtMonthly, setDebtMonthly] = useState("");
  const [debtDueDay, setDebtDueDay] = useState("");
  const [debtRate, setDebtRate] = useState("");

  // Payment form
  const [payDebtIdx, setPayDebtIdx] = useState<number>(0);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  // Gambling alert
  const [showGamblingAlert, setShowGamblingAlert] = useState(false);

  const resetForm = () => {
    setDesc(""); setAmount(""); setDate(new Date()); setCategory(""); setIsRecurring(false);
    setDebtBank(""); setDebtType("cartao"); setDebtTotal(""); setDebtMonthly(""); setDebtDueDay(""); setDebtRate("");
    setPayDebtIdx(0); setPayAmount(""); setPayNote("");
  };

  const openModal = (type: "income" | "expense" | "debt" | "payment") => {
    resetForm();
    if (type === "income") setCategory("salario");
    if (type === "expense") setCategory("alimentacao");
    setModalType(type);
    setMenuOpen(false);
  };

  /* ─── Handlers ─── */
  const handleSaveIncome = () => {
    if (!amount) return;
    onAddTransaction({
      category, amount: parseFloat(amount), description: desc || "Entrada",
      type: "income", transaction_date: format(date, "yyyy-MM-dd"),
      is_recurring: isRecurring, recurring_day: isRecurring ? date.getDate() : null,
    });
    setModalType(null);
  };

  const handleSaveExpense = () => {
    if (!amount) return;
    onAddTransaction({
      category, amount: parseFloat(amount), description: desc || "Saída",
      type: "expense", transaction_date: format(date, "yyyy-MM-dd"),
      is_recurring: isRecurring, recurring_day: isRecurring ? date.getDate() : null,
    });
    if (category === "apostas") setShowGamblingAlert(true);
    setModalType(null);
  };

  const handleSaveDebt = () => {
    if (!debtTotal) return;
    const newDebt: Debt = {
      type: debtType, bank: debtBank,
      total: parseFloat(debtTotal) || 0,
      monthly_payment: parseFloat(debtMonthly) || 0,
      interest_rate: parseFloat(debtRate) || 0,
      due_day: parseInt(debtDueDay) || undefined,
    };
    onUpdateDebts([...debts, newDebt]);
    setModalType(null);
  };

  const handlePayment = () => {
    if (!payAmount || debts.length === 0) return;
    const paid = parseFloat(payAmount);
    const updated = [...debts];
    updated[payDebtIdx] = {
      ...updated[payDebtIdx],
      total: Math.max(0, updated[payDebtIdx].total - paid),
    };
    onUpdateDebts(updated);
    onAddTransaction({
      category: "pagamento_divida", amount: paid,
      description: `Pagamento: ${updated[payDebtIdx].bank || updated[payDebtIdx].type}${payNote ? ` — ${payNote}` : ""}`,
      type: "debt_payment", transaction_date: format(date, "yyyy-MM-dd"),
      is_recurring: false, recurring_day: null,
    });
    setModalType(null);
  };

  /* ─── Computed ─── */
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxs = useMemo(() =>
    transactions.filter(t => t.transaction_date?.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const totalIncome = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalDebtPayments = monthTxs.filter(t => t.type === "debt_payment").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense - totalDebtPayments;
  const totalActiveDebts = debts.reduce((s, d) => s + (d.total || 0), 0);

  const filteredTxs = useMemo(() => {
    const sorted = [...monthTxs].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
    if (filterCat === "all") return sorted;
    return sorted.filter(t => t.category === filterCat);
  }, [monthTxs, filterCat]);

  const usedCategories = useMemo(() => {
    const cats = new Set(monthTxs.map(t => t.category));
    return Array.from(cats);
  }, [monthTxs]);

  /* ─── Date picker helper ─── */
  const DatePickerField = ({ value, onChange }: { value: Date; onChange: (d: Date) => void }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : "Selecionar data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={d => d && onChange(d)} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-4">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-premium p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Entradas</span>
          </div>
          <p className="text-sm font-bold text-primary">{fmtBRL(totalIncome)}</p>
        </div>
        <div className="card-premium p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Saídas</span>
          </div>
          <p className="text-sm font-bold text-destructive">{fmtBRL(totalExpense)}</p>
        </div>
        <div className="card-premium p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</span>
          </div>
          <p className={cn("text-sm font-bold", balance >= 0 ? "text-primary" : "text-destructive")}>{fmtBRL(balance)}</p>
        </div>
        <div className="card-premium p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-warning" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dívidas</span>
          </div>
          <p className="text-sm font-bold text-warning">{fmtBRL(totalActiveDebts)}</p>
        </div>
      </div>

      {/* ── Gambling Alert ── */}
      {showGamblingAlert && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Ana percebeu algo</p>
              <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                Percebi que você registrou um gasto com apostas. Isso é um passo corajoso — reconhecer é o primeiro passo. Que tal conversar sobre como você está se sentindo?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onOpenChat(); setShowGamblingAlert(false); }}
              className="bg-destructive text-destructive-foreground text-xs">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Falar com a Ana
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowGamblingAlert(false)} className="text-xs text-muted-foreground">
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* ── Category Filter ── */}
      {usedCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <button onClick={() => setFilterCat("all")}
            className={cn("text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors",
              filterCat === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            Todos
          </button>
          {usedCategories.map(catId => {
            const cat = getCat(catId);
            return (
              <button key={catId} onClick={() => setFilterCat(catId)}
                className={cn("text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors",
                  filterCat === catId ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Transaction List ── */}
      <div className="card-premium divide-y divide-border/40">
        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum lançamento este mês</p>
            <p className="text-xs text-muted-foreground mt-1">Toque no + para adicionar</p>
          </div>
        ) : (
          filteredTxs.map(tx => {
            const cat = getCat(tx.category);
            const Icon = cat.icon;
            const isIncome = tx.type === "income";
            const isDebtPayment = tx.type === "debt_payment";
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isIncome ? "bg-primary/10" : isDebtPayment ? "bg-accent/10" : "bg-muted")}>
                  {isDebtPayment ? <CheckCircle className="h-4 w-4 text-accent" /> : <Icon className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description || cat.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    {tx.is_recurring && " • Recorrente"}
                  </p>
                </div>
                <p className={cn("text-sm font-bold shrink-0",
                  isIncome ? "text-primary" : isDebtPayment ? "text-accent" : "text-destructive")}>
                  {isIncome ? "+" : "-"}{fmtBRL(tx.amount)}
                </p>
                <button onClick={() => onDeleteTransaction(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Floating Action Button ── */}
      <button onClick={() => setMenuOpen(!menuOpen)}
        className="fixed z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ bottom: "calc(10rem + env(safe-area-inset-bottom, 0px))", right: "1.25rem" }}>
        <Plus className={cn("h-6 w-6 transition-transform", menuOpen && "rotate-45")} />
      </button>

      {/* ── Action Menu ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="fixed bottom-[7.5rem] right-5 z-40 flex flex-col gap-2 items-end">
            {[
              { label: "💰 Nova Entrada", type: "income" as const },
              { label: "💸 Nova Saída", type: "expense" as const },
              { label: "💳 Nova Dívida", type: "debt" as const },
              { label: "✅ Registrar Pagamento", type: "payment" as const },
            ].map(item => (
              <button key={item.type} onClick={() => openModal(item.type)}
                className="bg-card border border-border shadow-lg rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══ MODAL: Nova Entrada ═══ */}
      <Dialog open={modalType === "income"} onOpenChange={open => !open && setModalType(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>💰 Nova Entrada</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Input placeholder='Ex: "Salário", "Freelance"' value={desc} onChange={e => setDesc(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor (R$)</label>
              <Input type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Data</label>
              <div className="mt-1"><DatePickerField value={date} onChange={setDate} /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveIncome} className="w-full bg-primary text-primary-foreground" disabled={!amount}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: Nova Saída ═══ */}
      <Dialog open={modalType === "expense"} onOpenChange={open => !open && setModalType(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>💸 Nova Saída</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Input placeholder='Ex: "Mercado", "Aluguel"' value={desc} onChange={e => setDesc(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor (R$)</label>
              <Input type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Data</label>
              <div className="mt-1"><DatePickerField value={date} onChange={setDate} /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Recorrente? (todo mês)</label>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            <Button onClick={handleSaveExpense} className="w-full bg-primary text-primary-foreground" disabled={!amount}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: Nova Dívida ═══ */}
      <Dialog open={modalType === "debt"} onOpenChange={open => !open && setModalType(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>💳 Nova Dívida</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Credor (banco/pessoa/empresa)</label>
              <Input placeholder="Ex: Nubank, Santander" value={debtBank} onChange={e => setDebtBank(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tipo de dívida</label>
              <Select value={debtType} onValueChange={setDebtType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEBT_TYPES.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor total da dívida (R$)</label>
              <Input type="number" placeholder="0,00" value={debtTotal} onChange={e => setDebtTotal(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Parcela mensal (R$)</label>
              <Input type="number" placeholder="0,00" value={debtMonthly} onChange={e => setDebtMonthly(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Dia de vencimento</label>
              <Input type="number" placeholder="Ex: 10" min={1} max={31} value={debtDueDay} onChange={e => setDebtDueDay(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Taxa de juros % ao mês (opcional)</label>
              <Input type="number" placeholder="Ex: 2.5" value={debtRate} onChange={e => setDebtRate(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleSaveDebt} className="w-full bg-primary text-primary-foreground" disabled={!debtTotal}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: Registrar Pagamento ═══ */}
      <Dialog open={modalType === "payment"} onOpenChange={open => !open && setModalType(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>✅ Registrar Pagamento</DialogTitle></DialogHeader>
          {debts.length === 0 ? (
            <div className="py-6 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Qual dívida pagou?</label>
                <Select value={String(payDebtIdx)} onValueChange={v => setPayDebtIdx(parseInt(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {debts.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {d.bank || d.type} — {fmtBRL(d.total)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Valor pago (R$)</label>
                <Input type="number" placeholder="0,00" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data do pagamento</label>
                <div className="mt-1"><DatePickerField value={date} onChange={setDate} /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Observação (opcional)</label>
                <Textarea placeholder="Ex: parcela 3/12" value={payNote} onChange={e => setPayNote(e.target.value)} className="mt-1" rows={2} />
              </div>
              <Button onClick={handlePayment} className="w-full bg-primary text-primary-foreground" disabled={!payAmount}>
                Confirmar pagamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
