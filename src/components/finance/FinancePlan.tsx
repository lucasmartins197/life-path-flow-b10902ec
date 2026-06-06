import { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinancePlanProps {
  plan: {
    diagnosis: string;
    urgent_actions: string[];
    budget_distribution: { essenciais_percent: number; dividas_percent: number; reserva_percent: number; pessoal_percent: number };
    debt_strategy: { method: string; explanation: string; priority_order: string[] };
    monthly_goal: { description: string; amount: number };
    health_level: string;
  } | null;
  loading: boolean;
  onRefresh: () => void;
}

const LEVEL_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  critico: { bg: "bg-destructive/15", text: "text-destructive", label: "Crítico" },
  atencao: { bg: "bg-warning/15", text: "text-warning", label: "Atenção" },
  estavel: { bg: "bg-primary/15", text: "text-primary", label: "Estável" },
  saudavel: { bg: "bg-primary/15", text: "text-primary", label: "Saudável" },
};

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinancePlan({ plan, loading, onRefresh }: FinancePlanProps) {
  if (loading) {
    return (
      <div className="card-premium p-6 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ana está analisando...</p>
            <p className="text-xs text-muted-foreground">Preparando seu plano financeiro personalizado</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const badge = LEVEL_BADGE[plan.health_level] || LEVEL_BADGE.atencao;
  const dist = plan.budget_distribution || { essenciais_percent: 0, dividas_percent: 0, reserva_percent: 0, pessoal_percent: 0 };
  const urgentActions = Array.isArray(plan.urgent_actions) ? plan.urgent_actions : [];
  const debtStrategy = plan.debt_strategy || { method: "", explanation: "", priority_order: [] };
  const priorityOrder = Array.isArray(debtStrategy.priority_order) ? debtStrategy.priority_order : [];
  const monthlyGoal = plan.monthly_goal || { description: "", amount: 0 };

  return (
    <div className="space-y-4">
      <div className="card-premium p-5 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">A</div>
            <div>
              <p className="text-sm font-bold text-foreground">Plano da Ana</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onRefresh} className="text-primary">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Diagnosis */}
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">{plan.diagnosis}</p>

        {/* Urgent Actions */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Ações Urgentes
          </p>
          <div className="space-y-2">
            {urgentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 bg-card rounded-xl p-3 border border-border/40">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Distribution */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Distribuição Sugerida</p>
          <div className="space-y-2">
            {[
              { label: "Essenciais", pct: dist.essenciais_percent, color: "bg-primary" },
              { label: "Dívidas", pct: dist.dividas_percent, color: "bg-destructive" },
              { label: "Reserva", pct: dist.reserva_percent, color: "bg-accent" },
              { label: "Pessoal", pct: dist.pessoal_percent, color: "bg-muted-foreground" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.pct}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt Strategy */}
        {plan.debt_strategy.priority_order.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Estratégia: {plan.debt_strategy.method === "avalanche" ? "Avalanche" : "Bola de Neve"}
            </p>
            <p className="text-xs text-muted-foreground mb-2">{plan.debt_strategy.explanation}</p>
            <div className="flex items-center gap-1 flex-wrap">
              {plan.debt_strategy.priority_order.map((d, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-medium">{i + 1}. {d}</span>
                  {i < plan.debt_strategy.priority_order.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Goal */}
        <div className="bg-primary/10 rounded-xl p-4 flex items-center gap-3">
          <Target className="h-6 w-6 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Meta do Mês</p>
            <p className="text-sm font-bold text-foreground">{plan.monthly_goal.description}</p>
            <p className="text-lg font-bold text-primary">{fmtBRL(plan.monthly_goal.amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
