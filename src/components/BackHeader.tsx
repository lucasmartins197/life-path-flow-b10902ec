import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";

interface BackHeaderProps {
  to?: string;
  label?: string;
}

export function BackHeader({ to, label = "Voltar" }: BackHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={() => (to ? navigate(to) : navigate(-1))}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm py-2 touch-target"
      >
        <ChevronLeft className="h-4 w-4" />
        {label}
      </button>
      <PortoSeguroButton />
    </div>
  );
}
