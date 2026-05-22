import { useNavigate, useLocation } from "react-router-dom";
import { House, Users, Calendar } from "lucide-react";

const mainItems = [
  { id: "home",      label: "Início",    icon: House,    path: "/app" },
  { id: "historias", label: "Histórias", icon: Users,    path: "/app/comunidade" },
  { id: "rotina",    label: "Rotina",    icon: Calendar, path: "/app/rotina" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
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
      </div>
    </nav>
  );
}
