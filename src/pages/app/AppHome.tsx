import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Compass,
  Heart,
  Calendar,
  Users,
  PlayCircle,
  Wallet,
  Scale,
  Anchor,
  ChevronRight,
  Flame,
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";

/* ── Motivational quotes (rotate daily) ── */
const quotes = [
  "Cada dia sóbrio é uma vitória silenciosa e poderosa.",
  "Você não está sozinho nessa jornada. Estamos juntos.",
  "A mudança começa com um passo — e você já deu o seu.",
  "Recuperação não é linear, mas cada esforço conta.",
  "O futuro que você quer está sendo construído agora.",
  "Coragem não é a ausência de medo, é seguir apesar dele.",
  "Sua história pode inspirar alguém que precisa de esperança.",
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/* ── Module grid data ── */
const primaryModules = [
  { label: "A Jornada",   sub: "12 Passos",      icon: Compass,  path: "/app/jornada" },
  { label: "Terapia",     sub: "Profissionais",   icon: Heart,    path: "/app/terapia" },
  { label: "Rotina",      sub: "Painel do dia",   icon: Calendar, path: "/app/rotina" },
  { label: "Histórias",   sub: "Comunidade",      icon: Users,    path: "/app/comunidade" },
];

const secondaryModules = [
  { label: "Aulão",    icon: PlayCircle, path: "/app/aulao" },
  { label: "Finanças", icon: Wallet,     path: "/app/financas" },
  { label: "Jurídico", icon: Scale,      path: "/app/juridico" },
  { label: "Âncora",   icon: Anchor,     path: "/app/ancora" },
];

export default function AppHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const firstName = profile?.full_name?.split(" ")[0] || "bem-vindo";
  const greeting = getGreeting();
  const quote = getDailyQuote();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // TODO: replace with real data from hooks
  const currentStep = 2;
  const totalSteps = 12;
  const streakDays = 5;
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Avatar / Logo */}
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-md shrink-0">
            <span className="text-primary-foreground text-sm font-extrabold tracking-tight">
              AV
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {greeting}, {firstName}!
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{today}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-4 space-y-5">
        {/* ── Motivational Quote ── */}
        <section className="quote-card animate-fade-in">
          <p className="text-primary-foreground/90 text-sm font-medium leading-relaxed italic">
            "{quote}"
          </p>
        </section>

        {/* ── Journey Progress Card ── */}
        <section
          className="card-warm p-5 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate("/app/jornada")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Compass className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Sua Jornada</p>
                <p className="text-xs text-muted-foreground">
                  Passo {currentStep} de {totalSteps}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">{progressPct}% completo</span>
            <span className="text-xs font-semibold text-primary">Continuar →</span>
          </div>
        </section>

        {/* ── Primary Modules 2x2 ── */}
        <section>
          <p className="section-title">Acesso rápido</p>
          <div className="grid grid-cols-2 gap-3">
            {primaryModules.map((mod) => (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className="card-warm p-4 text-left flex flex-col gap-3 active:scale-[0.97] transition-transform touch-target"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">
                    {mod.label}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{mod.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Secondary Modules row ── */}
        <section>
          <p className="section-title">Mais recursos</p>
          <div className="grid grid-cols-4 gap-2">
            {secondaryModules.map((mod) => (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/30 active:scale-95 transition-transform touch-target"
                style={{ boxShadow: "var(--shadow-xs)" }}
              >
                <mod.icon className="h-5 w-5 text-primary" />
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight">
                  {mod.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Streak Card ── */}
        <section className="card-warm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Flame className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              {streakDays} dias consecutivos 🔥
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continue assim! Cada dia conta na sua recuperação.
            </p>
          </div>
        </section>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
    </div>
  );
}
