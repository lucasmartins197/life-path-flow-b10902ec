import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface OnboardingData {
  fullName: string;
  city: string;
  gamblingDuration: string;
  recoverySituation: string;
  totalLossRange: string;
  gamblingTypes: string[];
  stopAttempts: string;
  familyAware: string;
  mentalHealthRisk: string;
  mainMotivation: string;
  anchorName: string;
  anchorPhone: string;
  anchorRelation: string;
  anchorNotify: boolean;
  commitmentSignature: string;
}

const TOTAL_STEPS = 8;

const DURATION_OPTIONS = [
  { value: "menos_1_ano", label: "Menos de 1 ano" },
  { value: "1_a_3_anos", label: "1 a 3 anos" },
  { value: "3_a_5_anos", label: "3 a 5 anos" },
  { value: "mais_5_anos", label: "Mais de 5 anos" },
];

const SITUATION_OPTIONS = [
  { value: "quero_parar", label: "Quero parar mas não sei como" },
  { value: "ja_tentei", label: "Já tentei parar antes" },
  { value: "em_recaida", label: "Estou em recaída" },
  { value: "manter_firme", label: "Busco me manter firme" },
];

const RELATION_OPTIONS = [
  { value: "familiar", label: "Familiar" },
  { value: "amigo", label: "Amigo(a)" },
  { value: "conjuge", label: "Cônjuge" },
  { value: "outro", label: "Outro" },
];

const LOSS_RANGE_OPTIONS = [
  { value: "ate_5k", label: "Até R$ 5.000" },
  { value: "5k_20k", label: "R$ 5.000 a R$ 20.000" },
  { value: "20k_50k", label: "R$ 20.000 a R$ 50.000" },
  { value: "acima_50k", label: "Acima de R$ 50.000" },
  { value: "prefiro_nao_dizer", label: "Prefiro não informar" },
];

const GAMBLING_TYPES_OPTIONS = [
  { value: "apostas_esportivas", label: "Apostas esportivas (bets)" },
  { value: "cassino_online", label: "Cassino online / slots" },
  { value: "poker", label: "Poker" },
  { value: "loteria", label: "Loteria / raspadinha" },
  { value: "bingo", label: "Bingo" },
  { value: "outros", label: "Outros" },
];

const STOP_ATTEMPTS_OPTIONS = [
  { value: "nunca_tentei", label: "Nunca tentei parar" },
  { value: "uma_vez", label: "Já tentei 1 vez" },
  { value: "varias_vezes", label: "Já tentei várias vezes" },
  { value: "parei_voltei", label: "Parei, mas voltei" },
];

const FAMILY_AWARE_OPTIONS = [
  { value: "sim_apoiam", label: "Sim, e me apoiam" },
  { value: "sim_conflito", label: "Sim, mas há conflitos" },
  { value: "nao_sabem", label: "Não sabem" },
  { value: "nao_tenho_apoio", label: "Não tenho apoio familiar" },
];

const MENTAL_HEALTH_OPTIONS = [
  { value: "bem", label: "Estou bem emocionalmente" },
  { value: "ansioso", label: "Ansioso ou estressado" },
  { value: "deprimido", label: "Me sinto deprimido" },
  { value: "pensamentos_ruins", label: "Tenho pensamentos ruins às vezes" },
];

const MOTIVATION_OPTIONS = [
  { value: "familia", label: "Minha família" },
  { value: "financeiro", label: "Recuperar minha situação financeira" },
  { value: "saude", label: "Minha saúde mental" },
  { value: "eu_mesmo", label: "Por mim mesmo" },
  { value: "trabalho", label: "Meu trabalho / carreira" },
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: profile?.full_name ?? "",
    city: "",
    gamblingDuration: "",
    recoverySituation: "",
    totalLossRange: "",
    gamblingTypes: [],
    stopAttempts: "",
    familyAware: "",
    mentalHealthRisk: "",
    mainMotivation: "",
    anchorName: "",
    anchorPhone: "",
    anchorRelation: "",
    anchorNotify: true,
    commitmentSignature: "",
  });

  // Auto-advance splash
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => goNext(), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  function goNext() {
    setDirection("forward");
    setStep((s) => {
      const next = Math.min(TOTAL_STEPS, s + 1) as StepId;
      console.log("goNext called, current step:", s, "→ next:", next, "TOTAL_STEPS:", TOTAL_STEPS);
      return next;
    });
  }
  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(1, s - 1) as StepId);
  }

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const firstName = useMemo(
    () => (data.fullName.trim().split(/\s+/)[0] || "amigo").trim(),
    [data.fullName]
  );

  async function saveProfileBasics() {
    if (!user) { console.log("saveProfileBasics: no user"); return false; }
    setSaving(true);
    console.log("saveProfileBasics: saving for user", user.id, "data:", { fullName: data.fullName, city: data.city });
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName.trim(),
        city: data.city.trim() || null,
        gambling_duration: data.gamblingDuration || null,
        recovery_situation: data.recoverySituation || null,
      })
      .eq("id", user.id);
    setSaving(false);
    console.log("saveProfileBasics result:", error ? "ERROR: " + error.message : "OK");
    if (error) {
      console.error("saveProfileBasics error:", JSON.stringify(error));
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }

  async function saveClinicalData() {
    if (!user) return false;
    setSaving(true);
    const { error } = await supabase
      .from("onboarding_clinico")
      .upsert({
        user_id: user.id,
        total_loss_range: data.totalLossRange || null,
        gambling_types: data.gamblingTypes,
        stop_attempts: data.stopAttempts || null,
        family_aware: data.familyAware || null,
        mental_health_risk: data.mentalHealthRisk || null,
        main_motivation: data.mainMotivation || null,
        created_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível salvar dados clínicos", description: error.message, variant: "destructive" });
      return false;
    }
    // Enviar para N8N gerar prontuário e alertar admin se risco elevado
    try {
      await fetch("https://apostandonavida.app.n8n.cloud/webhook/onboarding-clinico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          full_name: data.fullName,
          city: data.city,
          gambling_duration: data.gamblingDuration,
          recovery_situation: data.recoverySituation,
          total_loss_range: data.totalLossRange,
          gambling_types: data.gamblingTypes,
          stop_attempts: data.stopAttempts,
          family_aware: data.familyAware,
          mental_health_risk: data.mentalHealthRisk,
          main_motivation: data.mainMotivation,
          anchor_name: data.anchorName,
          anchor_phone: data.anchorPhone,
        }),
      });
    } catch (e) {
      console.error("N8N webhook error:", e);
    }
    return true;
  }

  async function saveAnchor() {
    if (!user) return false;
    if (!data.anchorName.trim() || !data.anchorPhone.trim() || !data.anchorRelation) {
      return true; // skipped
    }
    setSaving(true);
    const { error } = await supabase.from("anchor_contacts").insert({
      user_id: user.id,
      name: data.anchorName.trim(),
      phone: data.anchorPhone.trim(),
      relationship: data.anchorRelation,
      is_primary: true,
      receive_alerts: data.anchorNotify,
      receive_reports: data.anchorNotify,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível salvar o âncora", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }

  async function saveCommitment() {
    if (!user) return false;
    setSaving(true);
    const { error } = await supabase.from("recovery_commitments").upsert(
      {
        user_id: user.id,
        signature_name: data.commitmentSignature.trim(),
        signed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível assinar", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }

  async function finishOnboarding(target: "step1" | "explore") {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    setSaving(false);
    onComplete();
    navigate(target === "step1" ? "/app/jornada/1" : "/app", { replace: true });
  }

  // Validation per step
  const canContinue =
    (step === 3 &&
      data.fullName.trim().length >= 2 &&
      data.city.trim().length >= 2 &&
      data.gamblingDuration &&
      data.recoverySituation) ||
    (step === 4 &&
      data.totalLossRange !== "" &&
      data.stopAttempts !== "" &&
      data.familyAware !== "" &&
      data.mentalHealthRisk !== "" &&
      data.mainMotivation !== "") ||
    (step !== 3 && step !== 4);

  const slideAnim = direction === "forward" ? "animate-slide-in-right" : "animate-fade-in";

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Progress dots */}
      {step > 1 && step < TOTAL_STEPS && (
        <div className="absolute top-0 left-0 right-0 z-10 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => {
            const idx = i + 2; // dots represent steps 2..7
            const active = idx <= step;
            return (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  active ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            );
          })}
        </div>
      )}

      {/* Back button */}
      {step > 2 && step < TOTAL_STEPS && (
        <button
          onClick={goBack}
          className="absolute top-[max(env(safe-area-inset-top),1rem)] left-4 z-20 h-11 w-11 rounded-full flex items-center justify-center bg-background/80 backdrop-blur text-foreground hover:bg-muted transition"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div key={step} className={cn("h-full w-full", slideAnim)}>
        {step === 1 && <SplashScreen />}
        {step === 2 && <WelcomeScreen onStart={goNext} onLogin={() => navigate("/auth")} />}
        {step === 3 && (
          <AboutYouScreen
            data={data}
            update={update}
            onContinue={async () => {
              if (!canContinue) return;
              await saveProfileBasics();
              goNext();
            }}
            saving={saving}
          />
        )}
        {step === 4 && (
          <ClinicalScreen
            data={data}
            update={update}
            onContinue={async () => {
              if (!canContinue) return;
              const ok = await saveClinicalData();
              if (ok) goNext();
            }}
            saving={saving}
          />
        )}
        {step === 5 && <MeetAnaScreen firstName={firstName} onContinue={goNext} />}
        {step === 6 && (
          <AnchorScreen
            data={data}
            update={update}
            onConfirm={async () => {
              const ok = await saveAnchor();
              if (ok) goNext();
            }}
            onSkip={goNext}
            saving={saving}
          />
        )}
        {step === 7 && (
          <CommitmentScreen
            firstName={firstName}
            data={data}
            update={update}
            onSign={async () => {
              if (data.commitmentSignature.trim().length < 2) {
                toast({ title: "Digite seu nome para assinar", variant: "destructive" });
                return;
              }
              const ok = await saveCommitment();
              if (ok) goNext();
            }}
            saving={saving}
          />
        )}
        {step === 8 && (
          <ReadyScreen
            firstName={firstName}
            onStart={() => finishOnboarding("step1")}
            onExplore={() => finishOnboarding("explore")}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────── SCREENS ─────────────── */

function SplashScreen() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-primary text-primary-foreground px-6">
      <div className="animate-scale-in flex flex-col items-center">
        <div className="h-28 w-28 rounded-full border-4 border-[hsl(var(--gold,40_60%_54%))] flex items-center justify-center mb-6 shadow-2xl">
          <span
            className="text-6xl font-bold"
            style={{ color: "#C9A84C", fontFamily: "Georgia, serif" }}
          >
            A
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Stake Real</h1>
        <p className="mt-2 text-base" style={{ color: "#A8C9B5" }}>
          Sua jornada de recuperação
        </p>
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div
      className="h-full w-full flex flex-col px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)]"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Illustration */}
        <svg viewBox="0 0 240 200" className="w-56 h-44 mb-8 animate-fade-in" aria-hidden>
          {/* Sun */}
          <circle cx="170" cy="80" r="28" fill="#C9A84C" opacity="0.95" />
          <circle cx="170" cy="80" r="36" fill="#C9A84C" opacity="0.25" />
          {/* Horizon line */}
          <line x1="0" y1="150" x2="240" y2="150" stroke="#1B4332" strokeWidth="1.5" opacity="0.4" />
          {/* Person silhouette */}
          <g fill="#1B4332">
            <circle cx="80" cy="95" r="11" />
            <path d="M80 108 L72 150 L88 150 Z" />
            <rect x="78" y="108" width="4" height="42" rx="2" />
          </g>
          {/* Ground */}
          <path d="M0 150 Q120 165 240 150 L240 200 L0 200 Z" fill="#1B4332" opacity="0.85" />
        </svg>
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#1B4332" }}>
          Você deu o primeiro passo.
        </h2>
        <p className="mt-3 text-base leading-relaxed max-w-sm" style={{ color: "#1B4332", opacity: 0.78 }}>
          A coragem de estar aqui já é uma vitória. Vamos caminhar juntos.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={onStart}
          className="w-full h-12 text-base font-semibold"
          style={{ backgroundColor: "#1B4332", color: "white" }}
        >
          Começar minha jornada
        </Button>
        <button
          onClick={onLogin}
          className="w-full text-sm underline-offset-4 hover:underline"
          style={{ color: "#1B4332", opacity: 0.7 }}
        >
          Já tenho conta — Fazer login
        </button>
      </div>
    </div>
  );
}

function AboutYouScreen({
  data,
  update,
  onContinue,
  saving,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  onContinue: () => void;
  saving: boolean;
}) {
  return (
    <div className="h-full w-full flex flex-col bg-background px-6 pt-[max(env(safe-area-inset-top),4rem)] pb-[max(env(safe-area-inset-bottom),2rem)] overflow-y-auto">
      <h2 className="text-2xl font-bold tracking-tight mb-6" style={{ color: "#1B4332" }}>
        Antes de começar, me conta um pouco sobre você
      </h2>

      <div className="space-y-5">
        <div>
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Seu nome"
            className="mt-1.5 h-12"
          />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Sua cidade"
            className="mt-1.5 h-12"
          />
        </div>

        <div>
          <Label className="block mb-2">Há quanto tempo as apostas fazem parte da sua vida?</Label>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("gamblingDuration", opt.value)}
                className={cn(
                  "min-h-12 px-3 py-2 rounded-lg border text-sm text-left transition",
                  data.gamblingDuration === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="block mb-2">Como você descreveria sua situação hoje?</Label>
          <div className="space-y-2">
            {SITUATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("recoverySituation", opt.value)}
                className={cn(
                  "w-full min-h-12 px-4 py-3 rounded-lg border text-sm text-left transition",
                  data.recoverySituation === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onContinue}
        disabled={
          saving ||
          data.fullName.trim().length < 2 ||
          data.city.trim().length < 2 ||
          !data.gamblingDuration ||
          !data.recoverySituation
        }
        className="w-full h-12 mt-8 text-base font-semibold"
        style={{ backgroundColor: "#1B4332", color: "white" }}
      >
        {saving ? "Salvando..." : "Continuar"}
      </Button>
    </div>
  );
}

function ClinicalScreen({
  data,
  update,
  onContinue,
  saving,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  onContinue: () => void;
  saving: boolean;
}) {
  const canContinue =
    data.totalLossRange !== "" &&
    data.stopAttempts !== "" &&
    data.familyAware !== "" &&
    data.mentalHealthRisk !== "" &&
    data.mainMotivation !== "";

  function toggleGamblingType(value: string) {
    const current = data.gamblingTypes;
    if (current.includes(value)) {
      update("gamblingTypes", current.filter((v) => v !== value));
    } else {
      update("gamblingTypes", [...current, value]);
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-background px-6 pt-[max(env(safe-area-inset-top),4rem)] pb-[max(env(safe-area-inset-bottom),2rem)] overflow-y-auto">
      <div style={{background:'red',color:'white',padding:'20px',fontSize:'24px'}}>STEP 4 - CLÍNICO</div>

      <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#1B4332" }}>
        Precisamos entender melhor sua situação
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Essas informações são confidenciais e nos ajudam a personalizar sua jornada.
      </p>

      <div className="space-y-6">
        {/* Tipos de jogo */}
        <div>
          <Label className="block mb-2 font-medium">Quais tipos de jogo você praticava? (pode marcar vários)</Label>
          <div className="grid grid-cols-2 gap-2">
            {GAMBLING_TYPES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleGamblingType(opt.value)}
                className={cn(
                  "min-h-11 px-3 py-2 rounded-lg border text-sm text-left transition",
                  data.gamblingTypes.includes(opt.value)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Perdas estimadas */}
        <div>
          <Label className="block mb-2 font-medium">Quanto você estima ter perdido com apostas no total?</Label>
          <div className="space-y-2">
            {LOSS_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("totalLossRange", opt.value)}
                className={cn(
                  "w-full min-h-11 px-4 py-2 rounded-lg border text-sm text-left transition",
                  data.totalLossRange === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tentativas de parar */}
        <div>
          <Label className="block mb-2 font-medium">Você já tentou parar de jogar antes?</Label>
          <div className="grid grid-cols-2 gap-2">
            {STOP_ATTEMPTS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("stopAttempts", opt.value)}
                className={cn(
                  "min-h-11 px-3 py-2 rounded-lg border text-sm text-left transition",
                  data.stopAttempts === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Família */}
        <div>
          <Label className="block mb-2 font-medium">Sua família ou pessoas próximas sabem do seu problema?</Label>
          <div className="space-y-2">
            {FAMILY_AWARE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("familyAware", opt.value)}
                className={cn(
                  "w-full min-h-11 px-4 py-2 rounded-lg border text-sm text-left transition",
                  data.familyAware === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Saúde mental */}
        <div>
          <Label className="block mb-2 font-medium">Como você está se sentindo emocionalmente agora?</Label>
          <div className="space-y-2">
            {MENTAL_HEALTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("mentalHealthRisk", opt.value)}
                className={cn(
                  "w-full min-h-11 px-4 py-2 rounded-lg border text-sm text-left transition",
                  data.mentalHealthRisk === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {data.mentalHealthRisk === "pensamentos_ruins" && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                💛 Obrigado por compartilhar isso. Nossa equipe será notificada para te dar suporte especial. Você não está sozinho.
              </p>
            </div>
          )}
        </div>

        {/* Motivação */}
        <div>
          <Label className="block mb-2 font-medium">O que mais te motiva a se recuperar?</Label>
          <div className="space-y-2">
            {MOTIVATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("mainMotivation", opt.value)}
                className={cn(
                  "w-full min-h-11 px-4 py-2 rounded-lg border text-sm text-left transition",
                  data.mainMotivation === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onContinue}
        disabled={saving || !canContinue}
        className="w-full h-12 mt-8 mb-4 text-base font-semibold"
        style={{ backgroundColor: "#1B4332", color: "white" }}
      >
        {saving ? "Salvando..." : "Continuar"}
      </Button>
    </div>
  );
}

function MeetAnaScreen({ firstName, onContinue }: { firstName: string; onContinue: () => void }) {
  const fullText = `Sou sua companheira nessa jornada. Estarei aqui todos os dias — para te ouvir, te orientar e celebrar cada passo seu. Você não está sozinho.`;
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="h-full w-full flex flex-col items-center text-center px-6 pt-[max(env(safe-area-inset-top),5rem)] pb-[max(env(safe-area-inset-bottom),2rem)]"
      style={{ backgroundColor: "#1B4332" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Ana avatar */}
        <div className="h-32 w-32 rounded-full mb-6 overflow-hidden border-4 border-[#C9A84C] bg-[#F5F0E8] flex items-center justify-center animate-scale-in">
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
            <circle cx="50" cy="50" r="50" fill="#F5F0E8" />
            {/* hair */}
            <path d="M22 50 Q22 22 50 22 Q78 22 78 50 L78 60 Q70 50 50 50 Q30 50 22 60 Z" fill="#1B4332" />
            {/* face */}
            <ellipse cx="50" cy="58" rx="22" ry="26" fill="#E8C9A8" />
            {/* eyes */}
            <ellipse cx="42" cy="58" rx="2" ry="2.5" fill="#1B4332" />
            <ellipse cx="58" cy="58" rx="2" ry="2.5" fill="#1B4332" />
            {/* smile */}
            <path d="M42 70 Q50 76 58 70" stroke="#1B4332" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* cheeks */}
            <circle cx="38" cy="66" r="2.5" fill="#C9A84C" opacity="0.4" />
            <circle cx="62" cy="66" r="2.5" fill="#C9A84C" opacity="0.4" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">
          Olá, {firstName}! Eu sou a Ana.
        </h2>
        <p className="text-base text-white/90 leading-relaxed max-w-sm min-h-[120px]">
          {typed}
          <span className="inline-block w-0.5 h-4 bg-white/80 ml-0.5 animate-pulse" />
        </p>
      </div>

      <Button
        onClick={onContinue}
        className="w-full h-12 text-base font-semibold bg-white hover:bg-white/90"
        style={{ color: "#1B4332" }}
      >
        Olá, Ana! Vamos começar.
      </Button>
    </div>
  );
}

function AnchorScreen({
  data,
  update,
  onConfirm,
  onSkip,
  saving,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  onConfirm: () => void;
  onSkip: () => void;
  saving: boolean;
}) {
  const valid = data.anchorName.trim() && data.anchorPhone.trim() && data.anchorRelation;
  return (
    <div className="h-full w-full flex flex-col bg-background px-6 pt-[max(env(safe-area-inset-top),4rem)] pb-[max(env(safe-area-inset-bottom),2rem)] overflow-y-auto">
      <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#1B4332" }}>
        Escolha seu Contato Âncora
      </h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Seu âncora é alguém de confiança que saberá da sua jornada e poderá ser avisado se você precisar de apoio.
      </p>

      <div className="space-y-5">
        <div>
          <Label htmlFor="anchorName">Nome do âncora</Label>
          <Input
            id="anchorName"
            value={data.anchorName}
            onChange={(e) => update("anchorName", e.target.value)}
            placeholder="Nome completo"
            className="mt-1.5 h-12"
          />
        </div>
        <div>
          <Label htmlFor="anchorPhone">WhatsApp ou telefone</Label>
          <Input
            id="anchorPhone"
            type="tel"
            value={data.anchorPhone}
            onChange={(e) => update("anchorPhone", e.target.value)}
            placeholder="(00) 00000-0000"
            className="mt-1.5 h-12"
          />
        </div>
        <div>
          <Label className="block mb-2">Relação</Label>
          <div className="grid grid-cols-2 gap-2">
            {RELATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("anchorRelation", opt.value)}
                className={cn(
                  "min-h-12 px-3 py-2 rounded-lg border text-sm transition",
                  data.anchorRelation === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <Switch
            checked={data.anchorNotify}
            onCheckedChange={(v) => update("anchorNotify", v)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed">
            Autorizo o app a notificar meu âncora se eu ficar inativo por 3 dias
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button
          onClick={onConfirm}
          disabled={!valid || saving}
          className="w-full h-12 text-base font-semibold"
          style={{ backgroundColor: "#1B4332", color: "white" }}
        >
          {saving ? "Salvando..." : "Confirmar âncora"}
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition"
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}

function CommitmentScreen({
  firstName,
  data,
  update,
  onSign,
  saving,
}: {
  firstName: string;
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  onSign: () => void;
  saving: boolean;
}) {
  return (
    <div
      className="h-full w-full flex flex-col px-6 pt-[max(env(safe-area-inset-top),5rem)] pb-[max(env(safe-area-inset-bottom),2rem)] overflow-y-auto"
      style={{ backgroundColor: "#1B4332" }}
    >
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full flex items-center justify-center mb-6 animate-scale-in" style={{ backgroundColor: "rgba(201,168,76,0.15)" }}>
          <Shield className="h-10 w-10" style={{ color: "#C9A84C" }} strokeWidth={1.8} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Seu Compromisso de Recuperação</h2>
        <p className="text-base text-white/90 leading-relaxed max-w-sm">
          Eu, <span className="font-semibold text-[#C9A84C]">{firstName}</span>, me comprometo a percorrer
          essa jornada com honestidade, a cuidar de mim mesmo e a buscar ajuda quando precisar.
        </p>

        <div className="w-full mt-8">
          <Label htmlFor="signature" className="text-white/80 mb-2 block text-left">
            Digite seu nome para assinar
          </Label>
          <Input
            id="signature"
            value={data.commitmentSignature}
            onChange={(e) => update("commitmentSignature", e.target.value)}
            placeholder="Seu nome completo"
            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
          />
        </div>
      </div>

      <Button
        onClick={onSign}
        disabled={saving || data.commitmentSignature.trim().length < 2}
        className="w-full h-12 mt-6 text-base font-semibold"
        style={{ backgroundColor: "#C9A84C", color: "#1B4332" }}
      >
        {saving ? "Assinando..." : "Assinar meu compromisso"}
      </Button>
    </div>
  );
}

function ReadyScreen({
  firstName,
  onStart,
  onExplore,
  saving,
}: {
  firstName: string;
  onStart: () => void;
  onExplore: () => void;
  saving: boolean;
}) {
  return (
    <div className="h-full w-full flex flex-col bg-background px-6 pt-[max(env(safe-area-inset-top),4rem)] pb-[max(env(safe-area-inset-bottom),2rem)] overflow-hidden relative">
      {/* Confetti */}
      <Confetti />

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-6 animate-scale-in" style={{ backgroundColor: "rgba(201,168,76,0.15)" }}>
          <Sparkles className="h-8 w-8" style={{ color: "#C9A84C" }} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#1B4332" }}>
          Sua jornada começa agora, {firstName}!
        </h2>
        <p className="text-base text-muted-foreground mb-8">
          O Passo 1 está esperando por você.
        </p>

        <div className="w-full max-w-sm rounded-2xl border-2 p-5 text-left shadow-lg" style={{ borderColor: "#1B4332", backgroundColor: "#F5F0E8" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#C9A84C" }}>
            Passo 1
          </span>
          <h3 className="text-lg font-bold mt-1" style={{ color: "#1B4332" }}>
            Reconhecimento
          </h3>
          <p className="text-sm mt-1" style={{ color: "#1B4332", opacity: 0.75 }}>
            Admito que perdi o controle
          </p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <Button
          onClick={onStart}
          disabled={saving}
          className="w-full h-12 text-base font-semibold"
          style={{ backgroundColor: "#1B4332", color: "white" }}
        >
          Ir para o Passo 1
        </Button>
        <button
          onClick={onExplore}
          disabled={saving}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition"
        >
          Explorar o app primeiro
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2 + Math.random() * 1.5,
        color: i % 2 === 0 ? "#1B4332" : "#C9A84C",
        size: 6 + Math.random() * 6,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
