import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Calendar,
  Lightbulb,
  Activity,
  Wallet,
  Compass,
  Heart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { useRecoveryIndex, PillarScore } from "@/hooks/useRecoveryIndex";

// ── Pillar detail card ───────────────────────────
const PILLAR_ICONS = [Calendar, Heart, Wallet, Compass];

function PillarCard({ pillar, icon: Icon }: { pillar: PillarScore; icon: React.ElementType }) {
  const pct = Math.round((pillar.score / pillar.max) * 100);
  const TrendIcon =
    pillar.trend === "up" ? TrendingUp : pillar.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    pillar.trend === "up"
      ? "text-primary"
      : pillar.trend === "down"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="card-premium p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-foreground truncate">{pillar.name}</p>
            <div className={`flex items-center gap-1 shrink-0 ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">
                {pillar.score}/{pillar.max}
              </span>
            </div>
          </div>
          <div className="progress-bar mt-2">
            <div
              className="progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-12">{pillar.tip}</p>
    </div>
  );
}

// ── Custom tooltip for chart ─────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value} pts</p>
    </div>
  );
}

// ── Score level label ─────────────────────────────
function scoreLabel(v: number) {
  if (v >= 80) return { label: "Excelente", color: "text-primary" };
  if (v >= 60) return { label: "Bom progresso", color: "text-primary" };
  if (v >= 40) return { label: "Em desenvolvimento", color: "text-warning" };
  return { label: "Iniciando", color: "text-destructive" };
}

// ── Page ─────────────────────────────────────────
export default function RecoveryIndexPage() {
  const navigate = useNavigate();
  const { data: idx, isLoading } = useRecoveryIndex();

  const pillars = idx
    ? [idx.pillarRotina, idx.pillarEmocional, idx.pillarFinanceiro, idx.pillarJornada]
    : [];

  // Build chart data
  const chartData = idx
    ? idx.weeklyLabels.map((label, i) => ({
        label,
        score: idx.weeklyTotals[i] ?? 0,
      }))
    : [];

  // Fill to 7 if not enough
  while (chartData.length < 2) {
    chartData.unshift({ label: "—", score: 0 });
  }

  const sl = idx ? scoreLabel(idx.total) : { label: "—", color: "text-muted-foreground" };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">

      {/* ── Header ──────────────────────────────── */}
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-5 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <h1 className="text-2xl font-bold text-foreground">Índice de Recuperação</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Seu progresso nos 4 pilares</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">

        {/* ── Loading skeleton ─────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        )}

        {idx && (
          <>
            {/* ── Score hero ───────────────────── */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Score atual
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground">{idx.total}</span>
                    <span className="text-lg text-muted-foreground font-normal">/100</span>
                  </div>
                  <p className={`text-sm font-semibold mt-1 ${sl.color}`}>{sl.label}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center justify-end gap-1.5 ${
                    idx.trend === "up" ? "text-primary" : idx.trend === "down" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {idx.trend === "up" && <TrendingUp className="h-5 w-5" />}
                    {idx.trend === "down" && <TrendingDown className="h-5 w-5" />}
                    {idx.trend === "stable" && <Minus className="h-5 w-5" />}
                    <span className="text-base font-bold">
                      {idx.trend === "up" ? "+" : ""}{idx.trendDelta} pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">vs 7 dias atrás</p>
                </div>
              </div>

              <div className="progress-bar mt-4">
                <div className="progress-fill" style={{ width: `${idx.total}%` }} />
              </div>

              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {idx.trendExplanation}
              </p>
            </div>

            {/* ── Alerts ───────────────────────── */}
            {idx.riskFlag && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Risco elevado de recaída detectado</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Seu desejo de apostar está elevado. Fale com a IA agora ou agende uma sessão com um terapeuta.
                  </p>
                  <button
                    onClick={() => navigate("/app/terapia")}
                    className="mt-3 text-xs font-semibold text-destructive underline underline-offset-2"
                  >
                    Agendar sessão →
                  </button>
                </div>
              </div>
            )}

            {idx.fallAlert && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning">Queda significativa detectada</p>
                  <p className="text-xs text-warning/80 mt-1">
                    Seu índice caiu {Math.abs(idx.trendDelta)} pontos nos últimos 7 dias. Retome a rotina e fale com a IA.
                  </p>
                </div>
              </div>
            )}

            {/* ── Weekly chart ─────────────────── */}
            <section>
              <p className="section-title flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Evolução semanal
              </p>
              <div className="card-premium p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(154 50% 28%)" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="hsl(154 50% 28%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(154 50% 28%)"
                      strokeWidth={2}
                      fill="url(#scoreGrad)"
                      dot={{ r: 4, fill: "hsl(154 50% 28%)", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* ── Pillar breakdown ─────────────── */}
            <section>
              <p className="section-title">Detalhamento dos pilares</p>
              <div className="space-y-3">
                {pillars.map((p, i) => (
                  <PillarCard key={p.name} pillar={p} icon={PILLAR_ICONS[i]} />
                ))}
              </div>
            </section>

            {/* ── Top recommendation ───────────── */}
            <div className="card-premium p-4 flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Lightbulb className="h-4.5 w-4.5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Recomendação prioritária
                </p>
                <p className="text-sm text-foreground leading-relaxed">{idx.topRecommendation}</p>
              </div>
            </div>
          </>
        )}

      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
