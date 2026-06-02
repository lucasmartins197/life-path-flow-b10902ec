import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function SimpleOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 - Dados pessoais
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [gamblingDuration, setGamblingDuration] = useState("");
  const [recoverySituation, setRecoverySituation] = useState("");

  // Step 2 - Dados clínicos
  const [totalLossRange, setTotalLossRange] = useState("");
  const [gamblingTypes, setGamblingTypes] = useState<string[]>([]);
  const [stopAttempts, setStopAttempts] = useState("");
  const [familyAware, setFamilyAware] = useState("");
  const [mentalHealthRisk, setMentalHealthRisk] = useState("");
  const [mainMotivation, setMainMotivation] = useState("");

  // Step 3 - Compromisso
  const [signature, setSignature] = useState("");

  async function handleStep1() {
    if (!fullName.trim() || !city.trim() || !gamblingDuration || !recoverySituation) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      city: city.trim(),
      gambling_duration: gamblingDuration,
      recovery_situation: recoverySituation,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setStep(2);
  }

  function toggleGamblingType(type: string) {
    setGamblingTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }

  async function handleStep2() {
    if (!totalLossRange || !stopAttempts || !familyAware || !mentalHealthRisk || !mainMotivation) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("onboarding_clinico").insert({
      user_id: user!.id,
      total_loss_range: totalLossRange,
      gambling_types: gamblingTypes,
      stop_attempts: stopAttempts,
      family_aware: familyAware,
      mental_health_risk: mentalHealthRisk,
      main_motivation: mainMotivation,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setStep(3);
  }

  async function handleStep3() {
    if (signature.trim().length < 2) {
      toast({ title: "Digite seu nome para assinar", variant: "destructive" });
      return;
    }
    setSaving(true);
    await supabase.from("recovery_commitments").insert({
      user_id: user!.id,
      signature_name: signature.trim(),
      signed_at: new Date().toISOString(),
    });
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user!.id);
    setSaving(false);
    onComplete();
    navigate("/app", { replace: true });
  }

  const firstName = fullName.split(" ")[0] || "você";

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">

        {/* Header */}
        <div className="w-full mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <p className="text-sm text-muted-foreground">Passo {step} de 3</p>
          <div className="flex gap-2 justify-center mt-2">
            {[1,2,3].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        {/* STEP 1 - Dados pessoais */}
        {step === 1 && (
          <div className="w-full space-y-4">
            <h1 className="text-2xl font-bold text-center">Sobre você</h1>
            <p className="text-muted-foreground text-center text-sm">Vamos começar com algumas informações básicas.</p>

            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input placeholder="Seu nome completo" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input placeholder="Sua cidade" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Há quanto tempo você aposta?</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={gamblingDuration} onChange={e => setGamblingDuration(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="menos_1_ano">Menos de 1 ano</option>
                <option value="1_3_anos">Entre 1 e 3 anos</option>
                <option value="3_5_anos">Entre 3 e 5 anos</option>
                <option value="5_10_anos">Entre 5 e 10 anos</option>
                <option value="mais_10_anos">Mais de 10 anos</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Sua situação atual</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={recoverySituation} onChange={e => setRecoverySituation(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="ainda_apostando">Ainda estou apostando</option>
                <option value="tentando_parar">Tentando parar</option>
                <option value="parei_recentemente">Parei recentemente</option>
                <option value="em_recuperacao">Em recuperação há algum tempo</option>
              </select>
            </div>
            <Button className="w-full" onClick={handleStep1} disabled={saving}>
              {saving ? "Salvando..." : "Continuar →"}
            </Button>
          </div>
        )}

        {/* STEP 2 - Dados clínicos */}
        {step === 2 && (
          <div className="w-full space-y-4">
            <h1 className="text-2xl font-bold text-center">Sua jornada</h1>
            <p className="text-muted-foreground text-center text-sm">Essas informações nos ajudam a personalizar seu acompanhamento.</p>

            <div className="space-y-2">
              <Label>Quanto você estima ter perdido com apostas?</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={totalLossRange} onChange={e => setTotalLossRange(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="menos_5k">Menos de R$ 5.000</option>
                <option value="5k_20k">Entre R$ 5.000 e R$ 20.000</option>
                <option value="20k_50k">Entre R$ 20.000 e R$ 50.000</option>
                <option value="50k_100k">Entre R$ 50.000 e R$ 100.000</option>
                <option value="mais_100k">Mais de R$ 100.000</option>
                <option value="prefiro_nao_dizer">Prefiro não dizer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tipos de apostas que você praticava</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Esportes", "Cassino online", "Jogos de carta", "Apostas ao vivo", "Loteria", "Outros"].map(type => (
                  <label key={type} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                    <input type="checkbox" checked={gamblingTypes.includes(type)} onChange={() => toggleGamblingType(type)} />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantas vezes já tentou parar?</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={stopAttempts} onChange={e => setStopAttempts(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="primeira_vez">É a primeira vez</option>
                <option value="1_2_vezes">1 a 2 vezes</option>
                <option value="3_5_vezes">3 a 5 vezes</option>
                <option value="mais_5_vezes">Mais de 5 vezes</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Sua família sabe do problema?</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={familyAware} onChange={e => setFamilyAware(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="sim_apoiam">Sim, e me apoiam</option>
                <option value="sim_nao_apoiam">Sim, mas não me apoiam</option>
                <option value="parcialmente">Parcialmente</option>
                <option value="nao">Não sabem</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Como está sua saúde mental atualmente?</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={mentalHealthRisk} onChange={e => setMentalHealthRisk(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="bem">Bem</option>
                <option value="ansioso">Ansioso(a)</option>
                <option value="deprimido">Deprimido(a)</option>
                <option value="pensamentos_ruins">Com pensamentos difíceis</option>
                <option value="nao_sei">Não sei dizer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Principal motivação para parar</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={mainMotivation} onChange={e => setMainMotivation(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="familia">Família</option>
                <option value="financeiro">Recuperação financeira</option>
                <option value="saude">Saúde mental</option>
                <option value="eu_mesmo">Por mim mesmo(a)</option>
                <option value="trabalho">Trabalho/carreira</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Voltar</Button>
              <Button className="flex-1" onClick={handleStep2} disabled={saving}>
                {saving ? "Salvando..." : "Continuar →"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 - Compromisso */}
        {step === 3 && (
          <div className="w-full space-y-4">
            <h1 className="text-2xl font-bold text-center">Seu Compromisso</h1>
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
              "Eu, <strong>{firstName}</strong>, me comprometo a percorrer essa jornada com honestidade, a cuidar de mim mesmo e a buscar ajuda quando precisar. Reconheço que cada dia longe das apostas é uma vitória, e escolho a minha vida a partir de hoje."
            </div>
            <div className="space-y-2">
              <Label>Digite seu nome para assinar</Label>
              <Input placeholder="Seu nome completo" value={signature} onChange={e => setSignature(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Voltar</Button>
              <Button className="flex-1" onClick={handleStep3} disabled={saving}>
                {saving ? "Salvando..." : "✓ Assinar e começar"}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
