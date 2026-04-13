import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Compass,
  Stethoscope,
  Calendar,
  Users,
  PlayCircle,
  TrendingUp,
  Wallet,
  Scale,
  Anchor,
  CreditCard,
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";

const modules = [
  { label: "A Jornada",              sub: "12 Passos",           icon: Compass,      path: "/app/jornada",    accent: "bg-primary" },
  { label: "Terapia",                sub: "Profissionais",       icon: Stethoscope,  path: "/app/terapia",    accent: "bg-primary" },
  { label: "Rotina Diária",          sub: "Painel do dia",       icon: Calendar,     path: "/app/rotina",     accent: "bg-primary" },
  { label: "Histórias que Conectam", sub: "Comunidade",          icon: Users,        path: "/app/comunidade", accent: "bg-primary" },
  { label: "Aulão Semanal",          sub: "Ao vivo",             icon: PlayCircle,   path: "/app/aulao",      accent: "bg-primary" },
  { label: "Evolução",               sub: "Seu progresso",       icon: TrendingUp,   path: "/app/evolucao",   accent: "bg-primary" },
  { label: "Finanças",               sub: "Controle de caixa",   icon: Wallet,       path: "/app/financas",   accent: "bg-primary" },
  { label: "Apoio Jurídico",         sub: "Advogados",           icon: Scale,        path: "/app/juridico",   accent: "bg-primary" },
  { label: "Contato Âncora",         sub: "Rede de apoio",       icon: Anchor,       path: "/app/ancora",     accent: "bg-primary" },
  { label: "Minha Assinatura",       sub: "Plano e pagamento",   icon: CreditCard,   path: "/app/assinatura", accent: "bg-primary" },
];

export default function AppHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const firstName = profile?.full_name?.split(" ")[0] || "bem-vindo";

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-[11px] font-extrabold tracking-tight leading-none">
                AV
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              Apostando na Vida
            </span>
          </div>

          <p className="text-xs text-muted-foreground capitalize mb-0.5">{today}</p>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {firstName}!
          </h1>
        </div>
      </header>

      {/* ── Grid de módulos ── */}
      <main className="max-w-lg mx-auto px-5 pt-6">
        <div className="grid grid-cols-2 gap-3">
          {modules.map((mod) => (
            <button
              key={mod.path}
              onClick={() => navigate(mod.path)}
              className="card-premium p-4 text-left flex flex-col gap-3 hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl ${mod.accent} flex items-center justify-center`}>
                <mod.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">
                  {mod.label}
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">{mod.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
    </div>
  );
}
