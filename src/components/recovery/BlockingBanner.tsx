import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";

export function BlockingBanner() {
  const navigate = useNavigate();

  // Botao fixo e chamativo na home: sempre visivel, leva a tela de bloqueio.
  return (
    <button
      onClick={() => navigate("/app/bloqueio")}
      className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.98] hover:scale-[1.01]"
      style={{
        background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
        boxShadow: "0 8px 24px rgba(27,67,50,0.25)",
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <Shield className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">
          Saiba como bloquear o acesso às casas de aposta
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
          Autoexclusão oficial + bloqueadores. Feche as portas que puxam você de volta.
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/70" />
    </button>
  );
}
