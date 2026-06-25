import { Info } from "lucide-react";

export function HealthDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <p className={compact ? "text-[11px] leading-snug" : "text-xs leading-relaxed"}>
        Este app tem caráter educativo e de apoio. Não substitui consulta, diagnóstico ou tratamento médico. Sempre consulte um profissional de saúde qualificado para aconselhamento médico.
      </p>
    </div>
  );
}
