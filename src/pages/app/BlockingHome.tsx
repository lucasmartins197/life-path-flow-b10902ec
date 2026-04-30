import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, ExternalLink, Check, Apple, Smartphone, Copy } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useRecoveryCommitment } from "@/hooks/useRecoveryCommitment";
import { useToast } from "@/hooks/use-toast";

const BLOCKED_SITES = [
  "bet365.com",
  "sportingbet.com",
  "betano.com",
  "pixbet.com",
  "estrela.bet",
  "blaze.com",
  "brazino777.com",
  "betfair.com",
  "bodog.com",
  "betsson.com",
  "playpix.com",
  "mcgames.com",
];

const IOS_TUTORIAL =
  "https://support.apple.com/pt-br/guide/iphone/iphd1211/ios#:~:text=Vá%20para%20Ajustes%20%3E%20Tempo,Restrições%20de%20Conteúdo%20e%20Privacidade";
const ANDROID_TUTORIAL =
  "https://support.google.com/android/answer/9346420";

export default function BlockingHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { blockingConfigured, confirmBlocking } = useRecoveryCommitment();

  const copyAll = async () => {
    await navigator.clipboard.writeText(BLOCKED_SITES.join("\n"));
    toast({ title: "Lista copiada", description: "Cole na configuração de bloqueio do seu dispositivo." });
  };

  const handleConfirm = async () => {
    try {
      await confirmBlocking();
      toast({ title: "Bloqueio confirmado", description: "Obrigado por proteger sua jornada." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mb-3"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Proteja sua recuperação</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Bloqueio de sites de apostas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 space-y-5">
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-2">Por que bloquear?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bloquear o acesso aos sites de apostas no seu próprio celular é uma das formas
            mais eficazes de evitar recaídas. É um gesto de cuidado consigo mesmo — você não
            precisa contar só com a força de vontade.
          </p>
        </section>

        {/* Tutorial cards */}
        <section className="grid grid-cols-1 gap-3">
          <a
            href={IOS_TUTORIAL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-3 hover:bg-secondary/30 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
              <Apple className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Ver tutorial iOS</p>
              <p className="text-xs text-muted-foreground">Tempo de Uso — Restrições de Conteúdo</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <a
            href={ANDROID_TUTORIAL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-3 hover:bg-secondary/30 transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Ver tutorial Android</p>
              <p className="text-xs text-muted-foreground">Bem-estar Digital — Controles parentais</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </section>

        {/* Step by step */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-3">Passo a passo rápido</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-foreground/80">
                <strong>iOS:</strong> Ajustes → Tempo de Uso → Restrições de Conteúdo e Privacidade →
                Restrições de Conteúdo → Conteúdo Web → Limitar Sites Adultos → Adicionar Sites Nunca Permitidos.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-foreground/80">
                <strong>Android:</strong> Configurações → Bem-estar Digital → Controles parentais
                (Family Link) → Filtros do Chrome → Bloquear sites específicos.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span className="text-foreground/80">
                Cole a lista de sites abaixo. Defina uma senha que só uma pessoa de confiança saiba.
              </span>
            </li>
          </ol>
        </section>

        {/* Sites list */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Sites para bloquear</h2>
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar todos
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BLOCKED_SITES.map((site) => (
              <div
                key={site}
                className="text-xs font-mono bg-secondary/40 px-3 py-2 rounded-lg text-foreground/80 truncate"
              >
                {site}
              </div>
            ))}
          </div>
        </section>

        {/* Confirm button */}
        {blockingConfigured ? (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Bloqueio configurado</p>
              <p className="text-xs text-muted-foreground">Sua jornada está mais protegida.</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl text-white font-semibold transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
          >
            Já configurei o bloqueio
          </button>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
