import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const COMMITMENT_TEXT = `Eu reconheço que o vício em apostas tem causado sofrimento à minha vida e às pessoas que amo. A partir de hoje, assumo o compromisso comigo mesmo de buscar minha recuperação com honestidade, disciplina e coragem.

Comprometo-me a usar as ferramentas deste programa, a ser transparente com meu acompanhamento e a pedir ajuda quando precisar. Sei que a recuperação é um caminho, e dou hoje o primeiro passo.`;

export function SimpleOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [gamblingDuration, setGamblingDuration] = useState("");
  const [recoverySituation, setRecoverySituation] = useState("");
  const [signature, setSignature] = useState("");

  async function handleStep1() {
    if (!user) return;
    if (!fullName.trim() || !city.trim() || !gamblingDuration.trim() || !recoverySituation.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        city: city.trim(),
        gambling_duration: gamblingDuration.trim(),
        recovery_situation: recoverySituation.trim(),
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setStep(2);
  }

  async function handleStep2() {
    if (!user) return;
    if (signature.trim().toLowerCase() !== fullName.trim().toLowerCase()) {
      toast({
        title: "Assinatura inválida",
        description: "Digite seu nome completo exatamente como informado.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast({ title: "Erro ao concluir", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    onComplete();
    navigate("/app", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom px-4 py-8 flex items-start justify-center">
      <Card className="w-full max-w-lg">
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
              <CardDescription>Vamos começar com algumas informações sobre você.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gamblingDuration">Há quanto tempo você aposta?</Label>
                <Input
                  id="gamblingDuration"
                  placeholder="Ex.: 3 anos"
                  value={gamblingDuration}
                  onChange={(e) => setGamblingDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recoverySituation">Sua situação atual de recuperação</Label>
                <Textarea
                  id="recoverySituation"
                  placeholder="Conte brevemente como você está hoje."
                  value={recoverySituation}
                  onChange={(e) => setRecoverySituation(e.target.value)}
                  rows={4}
                />
              </div>
              <Button className="w-full" onClick={handleStep1} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Compromisso de Recuperação</CardTitle>
              <CardDescription>Leia com atenção e assine digitando seu nome completo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-4 text-sm whitespace-pre-line leading-relaxed">
                {COMMITMENT_TEXT}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Assine digitando seu nome completo</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={fullName}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
                  Voltar
                </Button>
                <Button className="flex-1" onClick={handleStep2} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assinar e começar"}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
