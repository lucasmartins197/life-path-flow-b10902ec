import { useNavigate, useLocation } from "react-router-dom";
import { House, Compass, Stethoscope, Calendar, Users, PlayCircle, TrendingUp } from "lucide-react";

const navItems = [
  { id: "home",       label: "Home",      icon: House,        path: "/app" },
  { id: "jornada",    label: "Jornada",   icon: Compass,      path: "/app/jornada" },
  { id: "terapia",    label: "Terapia",   icon: Stethoscope,  path: "/app/terapia" },
  { id: "rotina",     label: "Rotina",    icon: Calendar,     path: "/app/rotina" },
  { id: "comunidade", label: "Histórias", icon: Users,        path: "/app/comunidade" },
  { id: "aulao",      label: "Aulão",     icon: PlayCircle,   path: "/app/aulao" },
  { id: "evolucao",   label: "Evolução",  icon: TrendingUp,   path: "/app/evolucao" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`bottom-nav-item ${active ? "active" : ""}`}
            >
              <div className="nav-icon-bg">
                <item.icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
              </div>
              <span className={`text-[10px] font-medium tracking-tight ${active ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
