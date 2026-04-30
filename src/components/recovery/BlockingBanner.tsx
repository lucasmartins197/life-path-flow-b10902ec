import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";
import { useRecoveryCommitment } from "@/hooks/useRecoveryCommitment";

export function BlockingBanner() {
  const navigate = useNavigate();
  const { hasSigned, blockingConfigured, loading } = useRecoveryCommitment();

  if (loading || !hasSigned || blockingConfigured) return null;

  return (
    <button
      onClick={() => navigate("/app/bloqueio")}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, hsl(45 90% 95%), hsl(45 90% 90%))",
        borderColor: "hsl(45 60% 70%)",
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
        <Shield className="h-4 w-4" style={{ color: "#A06800" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#5A3A00" }}>
          Proteja sua jornada
        </p>
        <p className="text-xs" style={{ color: "#7A5A20" }}>
          Configure o bloqueio de sites agora
        </p>
      </div>
      <ChevronRight className="h-4 w-4" style={{ color: "#7A5A20" }} />
    </button>
  );
}
