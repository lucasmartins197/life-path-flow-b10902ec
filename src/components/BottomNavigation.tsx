import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  House, Users, Calendar, Grid2x2,
  Shield, BookOpen, Video, Award, Wallet, Scale,
  Anchor, User as UserIcon, CreditCard, TrendingUp, Footprints, HeartHandshake,
  LucideIcon,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";

const mainItems = [
  { id: "home",      label: "Início",    icon: House,    path: "/app" },
  { id: "historias", label: "Histórias", icon: Users,    path: "/app/comunidade" },
  { id: "rotina",    label: "Rotina",    icon: Calendar, path: "/app/rotina" },
];

interface MoreItem {
  label: string;
  icon: LucideIcon;
  path: string;
  gradient: string;
}

const moreItems: MoreItem[] = [
  { label: "Jornada",         icon: Footprints,    path: "/app/jornada",         gradient: "linear-gradient(135deg, #1B4332, #2D6A4F)" },
  { label: "Terapia",         icon: HeartHandshake,path: "/app/terapia",         gradient: "linear-gradient(135deg, #1A3A5C, #2E6DA4)" },
  { label: "Meu Escudo",      icon: Shield,        path: "/app/escudo",          gradient: "linear-gradient(135deg, #2C2A4A, #4F518C)" },
  { label: "Aulão Semanal",   icon: Video,         path: "/app/aulao",           gradient: "linear-gradient(135deg, #1A1A2E, #16213E)" },
  { label: "Histórias",       icon: BookOpen,      path: "/app/comunidade",      gradient: "linear-gradient(135deg, #1B4332, #40916C)" },
  { label: "Medalhas",        icon: Award,         path: "/app/medalhas",        gradient: "linear-gradient(135deg, #8B6F1F, #C9A84C)" },
  { label: "Minhas Finanças", icon: Wallet,        path: "/app/financas",        gradient: "linear-gradient(135deg, #14532D, #166534)" },
  { label: "Apoio Jurídico",  icon: Scale,         path: "/app/juridico",        gradient: "linear-gradient(135deg, #2C2A4A, #4F518C)" },
  { label: "Contato Âncora",  icon: Anchor,        path: "/app/ancora",          gradient: "linear-gradient(135deg, #0C2340, #1A4A6E)" },
  { label: "Evolução",        icon: TrendingUp,    path: "/app/evolucao",        gradient: "linear-gradient(135deg, #1B4332, #40916C)" },
  { label: "Assinatura",      icon: CreditCard,    path: "/app/assinatura",      gradient: "linear-gradient(135deg, #5C2018, #9B4423)" },
  { label: "Perfil",          icon: UserIcon,      path: "/app/perfil",          gradient: "linear-gradient(135deg, #2D2D2D, #4A4A4A)" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  const handleMoreItem = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      <NotificationBell />
      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          {mainItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`bottom-nav-item ${active ? "active" : ""}`}
              >
                <div className="nav-icon-bg">
                  <item.icon
                    className={`h-5 w-5 ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-tight ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={`bottom-nav-item ${moreOpen ? "active" : ""}`}
          >
            <div className="nav-icon-bg">
              <Grid2x2 className={`h-5 w-5 ${moreOpen ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
            </div>
            <span
              className={`text-[10px] font-semibold tracking-tight ${
                moreOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Mais
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border/40 bg-background max-h-[85vh] overflow-y-auto safe-bottom"
        >
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg font-bold tracking-tight">
              Tudo do app
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-3 pb-4">
            {moreItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleMoreItem(item.path)}
                className="relative overflow-hidden flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl text-white transition-transform duration-150 active:scale-[0.96]"
                style={{
                  background: item.gradient,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                }}
              >
                <item.icon className="h-6 w-6 stroke-[1.8]" />
                <span className="text-[11px] font-semibold leading-tight text-center px-2 drop-shadow">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
