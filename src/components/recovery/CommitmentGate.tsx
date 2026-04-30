import { useState } from "react";
import { Shield, PenLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRecoveryCommitment } from "@/hooks/useRecoveryCommitment";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Full-screen gate shown the first time a user opens the app.
 * Blocks access until they sign the recovery commitment.
 */
export function CommitmentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { commitment, loading, hasSigned, sign } = useRecoveryCommitment();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Don't gate before auth resolves or while we don't have a user
  if (!user || loading) return <>{children}</>;
  if (hasSigned) return <>{children}</>;

  const handleSign = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      toast({
        title: "Assinatura inválida",
        description: "Digite seu nome completo para assinar.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await sign(trimmed);
      toast({ title: "Compromisso assinado", description: "Sua jornada começa agora." });
    } catch (e: any) {
      toast({ title: "Erro ao assinar", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto safe-top safe-bottom">
      <div className="min-h-screen flex flex-col px-6 py-10 max-w-lg mx-auto">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
        >
          <Shield className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
          Compromisso de Recuperação
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Antes de começar sua jornada, peço que assine um compromisso simbólico com você mesmo.
          Esta é uma promessa pessoal — o primeiro passo da sua recuperação.
        </p>

        <div
          className="rounded-2xl border border-border/50 bg-card p-5 mb-6"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent 0 27px, hsl(var(--border)/0.3) 27px 28px)",
          }}
        >
          <p className="text-foreground leading-7 font-serif italic">
            "Para minha recuperação, eu me comprometo a não acessar plataformas de apostas
            durante minha jornada. Reconheço que cada dia longe das apostas é uma vitória,
            e escolho cuidar de mim a partir de hoje."
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <Label htmlFor="signature" className="flex items-center gap-2 text-sm">
            <PenLine className="h-4 w-4 text-primary" />
            Sua assinatura digital
          </Label>
          <Input
            id="signature"
            placeholder="Digite seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="font-serif italic text-base h-12"
            style={{ fontFamily: "'Georgia', serif" }}
          />
          <p className="text-xs text-muted-foreground">
            Ao assinar, você confirma seu compromisso. Data e hora serão registradas.
          </p>
        </div>

        <button
          onClick={handleSign}
          disabled={submitting || name.trim().length < 3}
          className="w-full h-13 py-4 rounded-2xl text-white font-semibold disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
        >
          {submitting ? "Registrando..." : "Assinar meu compromisso"}
        </button>
      </div>
    </div>
  );
}
