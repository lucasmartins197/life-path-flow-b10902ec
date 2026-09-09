import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  House, Users, Calendar, Menu,
  Shield, BookOpen, Video, Award, Wallet, Scale, Lock, Mail,
  Anchor, User as UserIcon, CreditCard, TrendingUp, Footprints, HeartHandshake,
  ChevronRight, LucideIcon,
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
}

// Itens do menu lateral, agrupados por categoria (navegação mais clara).
const menuGroups: { title: string; items: MoreItem[] }[] = [
  {
    title: "Minha recuperação",
    items: [
      { label: "Jornada", icon: Footprints, path: "/app/jornada" },
      { label: "Evolução", icon: TrendingUp, path: "/app/evolucao" },
      { label: "Medalhas", icon: Award, path: "/app/medalhas" },
      { label: "Minhas Cartas", icon: Mail, path: "/app/cartas" },
    ],
  },
  {
    title: "Apoio profissional",
    items: [
      { label: "Terapia", icon: HeartHandshake, path: "/app/terapia" },
      { label: "Apoio Jurídico", icon: Scale, path: "/app/juridico" },
      { label: "Aulão Semanal", icon: Video, path: "/app/aulao" },
    ],
  },
  {
    title: "Proteção",
    items: [
      { label: "Meu Escudo", icon: Shield, path: "/app/escudo" },
      { label: "Bloqueio de Apostas", icon: Lock, path: "/app/bloqueio" },
      { label: "Contato Âncora", icon: Anchor, path: "/app/ancora" },
    ],
  },
  {
    title: "Finanças",
    items: [
      { label: "Minhas Finanças", icon: Wallet, path: "/app/financas" },
    ],
  },
  {
    title: "Comunidade",
    items: [
      { label: "Histórias que Conectam", icon: BookOpen, path: "/app/comunidade" },
    ],
  },
  {
    title: "Conta",
    items: [
      { label: "Assinatura", icon: CreditCard, path: "/app/assinatura" },
      { label: "Perfil", icon: UserIcon, path: "/app/perfil" },
    ],
  },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);

  const handleMenuItem = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
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
                  <item.icon className={`h-5 w-5 ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
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

          {/* Sino de notificações — agora é um item da barra (não flutua mais) */}
          <div className="bottom-nav-item">
            <NotificationBell inline />
          </div>

          {/* Menu — abre o painel lateral */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`bottom-nav-item ${menuOpen ? "active" : ""}`}
          >
            <div className="nav-icon-bg">
              <Menu className={`h-5 w-5 ${menuOpen ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
            </div>
            <span
              className={`text-[10px] font-semibold tracking-tight ${
                menuOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Menu lateral (abre da direita) — organizado por categorias, visual limpo */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-[82vw] max-w-sm p-0 flex flex-col bg-background safe-top"
        >
          <SheetHeader className="text-left px-5 pt-6 pb-4 border-b border-border/40">
            <SheetTitle className="text-xl font-bold tracking-tight" style={{ color: "#1B4332" }}>
              Menu
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleMenuItem(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-muted active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#1B433212" }}>
                        <item.icon className="h-[18px] w-[18px]" style={{ color: "#1B4332" }} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
