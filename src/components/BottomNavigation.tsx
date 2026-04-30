import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  House,
  Compass,
  Heart,
  Calendar,
  LayoutGrid,
  Users,
  PlayCircle,
  Wallet,
  Scale,
  Anchor,
  User,
  CreditCard,
  Award,
  Shield,
  X,
} from "lucide-react";

const mainItems = [
  { id: "home",    label: "Home",    icon: House,    path: "/app" },
  { id: "jornada", label: "Jornada", icon: Compass,  path: "/app/jornada" },
  { id: "terapia", label: "Terapia", icon: Heart,    path: "/app/terapia" },
  { id: "rotina",  label: "Rotina",  icon: Calendar, path: "/app/rotina" },
];

const drawerItems = [
  { label: "Histórias",         icon: Users,      path: "/app/comunidade" },
  { label: "Aulão Semanal",     icon: PlayCircle, path: "/app/aulao" },
  { label: "Medalhas",          icon: Award,      path: "/app/medalhas" },
  { label: "Minhas Finanças",   icon: Wallet,     path: "/app/financas" },
  { label: "Apoio Jurídico",    icon: Scale,      path: "/app/juridico" },
  { label: "Bloqueio Apostas",  icon: Shield,     path: "/app/bloqueio" },
  { label: "Contato Âncora",    icon: Anchor,     path: "/app/ancora" },
  { label: "Perfil",            icon: User,       path: "/app/perfil" },
  { label: "Assinatura",        icon: CreditCard, path: "/app/assinatura" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 pb-10 safe-bottom animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Mais opções</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center touch-target"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {drawerItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary active:scale-95 transition-all touch-target"
                >
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
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

          {/* "Mais" button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="bottom-nav-item"
          >
            <div className="nav-icon-bg">
              <LayoutGrid className="h-5 w-5 stroke-[1.6]" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight text-muted-foreground">
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
