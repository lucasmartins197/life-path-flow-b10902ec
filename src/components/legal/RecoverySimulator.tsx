import { useState } from "react";
import { Calculator, Scale, TrendingUp, AlertTriangle } from "lucide-react";

// Simulador de POTENCIAL de recuperacao (substitui o antigo DebtSimulator).
// Estima, a partir do valor perdido em apostas, quanto a pessoa poderia
// buscar em juizo — de forma CONSERVADORA e SEM prometer resultado.
// Base juridica (2026): teto do Juizado Especial Civel = 40 salarios minimos
// = R$ 64.840. Ate 20 SM (R$ 32.420) nao precisa de advogado. Acima do teto,
// a causa vai para a Justica Comum. Dano moral conservador em ludopatia/consumo.

const TETO_JUIZADO = 64840; // 40 salarios minimos (2026)
const SEM_ADVOGADO = 32420; // 20 salarios minimos (2026)

// Faixa conservadora de dano moral (estimativa, nao garantia)
const DANO_MORAL_MIN = 3000;
const DANO_MORAL_MAX = 15000;

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function RecoverySimulator() {
  const [valor, setValor] = useState<string>("");
  const [resultado, setResultado] = useState<null | {
    material: number;
    moralMin: number;
    moralMax: number;
    totalMin: number;
    totalMax: number;
    via: "juizado" | "comum";
    precisaAdvogado: boolean;
  }>(null);

  const simular = () => {
    const material = Math.max(0, Number(valor.replace(/\D/g, "")) || 0);
    if (material <= 0) {
      setResultado(null);
      return;
    }
    const totalMin = material + DANO_MORAL_MIN;
    const totalMax = material + DANO_MORAL_MAX;
    // A via se define pelo maior cenario possivel (mais seguro para orientar)
    const via: "juizado" | "comum" = totalMax <= TETO_JUIZADO ? "juizado" : "comum";
    const precisaAdvogado = via === "comum" || totalMax > SEM_ADVOGADO;

    setResultado({
      material,
      moralMin: DANO_MORAL_MIN,
      moralMax: DANO_MORAL_MAX,
      totalMin,
      totalMax,
      via,
      precisaAdvogado,
    });
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#1B433215" }}>
          <Calculator className="h-5 w-5" style={{ color: "#1B4332" }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Quanto você pode buscar?</h2>
          <p className="text-xs text-muted-foreground">Estimativa do potencial de recuperação</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Informe quanto você depositou ou perdeu em apostas e veja uma estimativa
        do que poderia ser pedido em juízo — o valor perdido mais uma possível
        indenização por dano moral.
      </p>

      <label className="text-sm font-semibold text-foreground block mb-1.5">
        Quanto você perdeu em apostas?
      </label>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3">
          <span className="text-sm text-muted-foreground">R$</span>
          <input
            type="text"
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="flex-1 bg-transparent py-3 text-sm outline-none text-foreground"
          />
        </div>
        <button
          onClick={simular}
          className="px-5 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
        >
          Simular
        </button>
      </div>

      {resultado && (
        <div className="space-y-3">
          <div className="rounded-xl bg-secondary/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valores perdidos (dano material)</span>
              <span className="font-semibold text-foreground">{formatBRL(resultado.material)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Possível dano moral</span>
              <span className="font-semibold text-foreground">
                {formatBRL(resultado.moralMin)} – {formatBRL(resultado.moralMax)}
              </span>
            </div>
            <div className="h-px bg-border/60" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" style={{ color: "#1B4332" }} />
                Potencial estimado
              </span>
              <span className="text-base font-bold" style={{ color: "#1B4332" }}>
                {formatBRL(resultado.totalMin)} – {formatBRL(resultado.totalMax)}
              </span>
            </div>
          </div>

          {/* Orientacao sobre a via */}
          <div className="rounded-xl p-3.5 flex gap-2.5" style={{ backgroundColor: "#C9A84C1A", border: "1px solid #C9A84C55" }}>
            <Scale className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#1B4332" }} />
            <div className="text-xs text-foreground/80 leading-relaxed">
              {resultado.via === "juizado" ? (
                <>
                  Nesse valor, o caso normalmente cabe no <strong>Juizado Especial Cível</strong>{" "}
                  (pequenas causas), que é mais rápido e de baixo custo — teto de
                  R$ 64.840.{" "}
                  {resultado.precisaAdvogado
                    ? "Acima de R$ 32.420, é preciso advogado."
                    : "Até R$ 32.420 você pode entrar sem advogado."}
                </>
              ) : (
                <>
                  Nesse valor, o caso ultrapassa o teto do Juizado (R$ 64.840) e
                  normalmente segue na <strong>Justiça Comum</strong>, com
                  advogado — o que permite pedir valores maiores, incluindo danos
                  morais mais expressivos.
                </>
              )}
            </div>
          </div>

          {/* Trava de seguranca: nao e promessa */}
          <div className="rounded-xl p-3.5 flex gap-2.5 bg-muted/50">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta é apenas uma <strong>estimativa educativa</strong>, não uma
              garantia de recebimento. O resultado real depende das provas, da
              conduta da casa de apostas e da decisão do juiz. Nem todo caso
              resulta em ressarcimento. Fale com um especialista para avaliar o
              seu caso concreto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
