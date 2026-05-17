import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMedals } from "@/hooks/useMedals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AnaLetter from "@/components/journey/AnaLetter";
import VideoPlayer from "@/components/journey/VideoPlayer";
import {
  Loader2, ArrowLeft, CheckCircle, Clock, Award, Send, Play, Frown, Meh, Smile, Flame, Leaf, Film, ClipboardList, MessageSquare, Headphones,
} from "lucide-react";

/* ── Step audio (Google Drive direct download) ── */
const STEP_AUDIO: Record<number, string> = {
  1: "https://drive.google.com/uc?export=download&id=1vA0l9CZK1CVv2RbP8ohAlv13aAJDSTqS",
  2: "https://drive.google.com/uc?export=download&id=1vW-vGZgzN2mwtfi9ilbRai0QVa-GYoHx",
  3: "https://drive.google.com/uc?export=download&id=1Ei49PpIkHzeuFX-xRJEizTQDw4Jd1rih",
  4: "https://drive.google.com/uc?export=download&id=1Qs-NEAL_rjbs_WvPvHMABc3I2I4W_6PZ",
  5: "https://drive.google.com/uc?export=download&id=1nTFaHJ3UwP-KG1cuekLojldo5jBkyfDj",
  6: "https://drive.google.com/uc?export=download&id=1lrj_W5zRksRNwguWvmyGNn-R2CPlb39p",
  7: "https://drive.google.com/uc?export=download&id=1h6CTkk0_Y-8jr5KOasWvli4JU9EYnhiT",
  8: "https://drive.google.com/uc?export=download&id=1vNJE3l8sfYxaZgSvnvHxAJ24lsJpgzZI",
  9: "https://drive.google.com/uc?export=download&id=1vmtwJJqO0Gpoi-JVSYPwFpIYewL0f3X0",
  10: "https://drive.google.com/uc?export=download&id=1sjv1n9oHmk2JlyXA7rZjSlg64CWbezBT",
  11: "https://drive.google.com/uc?export=download&id=1UKbokVn_DSNOE-vN-mr1ctkctUyyBnpc",
  12: "https://drive.google.com/uc?export=download&id=12lLG_MIjaQqnim4yP4FDu9F__nfK1GDb",
};

/* ── Step metadata ── */
const STEP_META: Record<number, { name: string; subtitle: string; medal: string }> = {
  1: { name: "Reconhecimento", subtitle: "Admito que perdi o controle e que isso desorganizou minha vida", medal: "Coragem de Olhar" },
  2: { name: "Esperança", subtitle: "Posso recuperar minha lucidez", medal: "Primeiro Raio de Luz" },
  3: { name: "Entrega", subtitle: "Um propósito maior que meus impulsos", medal: "Âncora Plantada" },
  4: { name: "Inventário", subtitle: "Honestidade sobre o impacto", medal: "Espelho Honesto" },
  5: { name: "Verdade", subtitle: "Reconheço a dimensão real", medal: "Voz que Liberta" },
  6: { name: "Disponibilidade", subtitle: "Pronto para abandonar padrões", medal: "Porta Aberta" },
  7: { name: "Humildade", subtitle: "Peço força para transformar", medal: "Força que Dobra" },
  8: { name: "Responsabilidade", subtitle: "Listo quem prejudiquei", medal: "Peso nos Ombros" },
  9: { name: "Reparação", subtitle: "Faço reparações possíveis", medal: "Ponte Reconstruída" },
  10: { name: "Vigilância", subtitle: "Inventário diário", medal: "Guarda Fiel" },
  11: { name: "Conexão Real", subtitle: "Silêncio e direção", medal: "Raízes Profundas" },
  12: { name: "Propósito", subtitle: "Vivo e compartilho", medal: "Farol Aceso" },
};

const CHECKLIST_ITEMS = [
  'Escrever em um papel: "Eu, [nome], admito que perdi o controle sobre as apostas." Assinar e guardar.',
  "Listar 3 situações em que as apostas prejudicaram sua vida nos últimos 3 meses",
  "Desligar todas as notificações de plataformas de apostas por 24 horas",
];

const MOOD_OPTIONS = [
  { Icon: Frown, label: "Mal" },
  { Icon: Meh, label: "Regular" },
  { Icon: Smile, label: "Ok" },
  { Icon: Flame, label: "Motivado" },
];

const TIME_OPTIONS = [
  "Menos de 1 ano",
  "1-3 anos",
  "3-5 anos",
  "Mais de 5 anos",
];

const MIN_HOURS = 12;
const TOTAL_SECTIONS = 6;

interface ConvoMsg {
  role: "user" | "assistant";
  content: string;
}

export default function JourneyStep() {
  const { stepNumber: stepParam } = useParams();
  const stepNumber = parseInt(stepParam || "1");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardMedal } = useMedals();
  const meta = STEP_META[stepNumber] || STEP_META[1];

  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);

  // Sections: 1=intake, 2=video, 3=checklist, 4=questions, 5=AI, 6=conclusion
  const [currentSection, setCurrentSection] = useState(1);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [answers, setAnswers] = useState({ feeling: "", hardest_moment: "", commitment: "" });
  const [conversation, setConversation] = useState<ConvoMsg[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userName, setUserName] = useState("");

  // Intake form (Etapa 1)
  const [intakeMood, setIntakeMood] = useState("");
  const [intakeReason, setIntakeReason] = useState("");
  const [intakeTime, setIntakeTime] = useState("");

  // Video (Etapa 2)
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const intakeComplete = intakeMood && intakeReason.trim() && intakeTime;
  const allChecked = checkedItems.every(Boolean);
  const answersComplete = answers.feeling.trim() && answers.hardest_moment.trim() && answers.commitment.trim();

  /* Timer logic */
  const timeRemaining = useMemo(() => {
    if (!startedAt) return MIN_HOURS * 3600;
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    return Math.max(0, MIN_HOURS * 3600 - elapsed);
  }, [startedAt]);

  const canComplete = allChecked && answersComplete && conversation.length > 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  };

  /* ── Load ── */
  useEffect(() => {
    if (!user) return;
    loadProgress();
  }, [user, stepNumber]);

  // Timer tick
  useEffect(() => {
    if (!startedAt || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setStartedAt((prev) => prev);
    }, 60000);
    return () => clearInterval(interval);
  }, [startedAt, timeRemaining]);

  // Video watched is now triggered at 90% playback by VideoPlayer


  async function loadProgress() {
    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (profile?.full_name) setUserName(profile.full_name.split(" ")[0]);

    // Load video_url from journey_steps if exists
    const { data: stepData } = await supabase
      .from("journey_steps")
      .select("video_url")
      .eq("step_number", stepNumber)
      .maybeSingle();
    if (stepData?.video_url) setVideoUrl(stepData.video_url);

    const { data } = await supabase
      .from("journey_progress")
      .select("*")
      .eq("user_id", user!.id)
      .eq("step_number", stepNumber)
      .maybeSingle();

    if (data) {
      setProgressData(data);
      setStartedAt(data.started_at);
      setCurrentSection(data.current_section || 1);
      const cl = data.checklist_items;
      if (Array.isArray(cl) && cl.length === CHECKLIST_ITEMS.length) {
        setCheckedItems(cl.map(Boolean));
      }
      const a = data.answers as any;
      if (a && typeof a === "object") {
        setAnswers({
          feeling: a.feeling || "",
          hardest_moment: a.hardest_moment || "",
          commitment: a.commitment || "",
        });
        if (a.intake_mood) setIntakeMood(a.intake_mood);
        if (a.intake_reason) setIntakeReason(a.intake_reason);
        if (a.intake_time) setIntakeTime(a.intake_time);
        if (a.video_watched) setVideoWatched(true);
      }
      const conv = data.ai_conversation;
      if (Array.isArray(conv)) setConversation(conv as unknown as ConvoMsg[]);
    } else {
      const { data: newData } = await supabase
        .from("journey_progress")
        .insert({ user_id: user!.id, step_number: stepNumber })
        .select()
        .single();
      if (newData) {
        setProgressData(newData);
        setStartedAt(newData.started_at);
      }
    }
    setLoading(false);
  }

  async function saveProgress(updates: Record<string, any> = {}) {
    if (!user || !progressData) return;
    const allAnswers = {
      ...answers,
      intake_mood: intakeMood,
      intake_reason: intakeReason,
      intake_time: intakeTime,
      video_watched: videoWatched,
    };
    const payload = {
      checklist_items: checkedItems as unknown as any,
      answers: allAnswers as unknown as any,
      ai_conversation: conversation as unknown as any,
      current_section: currentSection,
      ...updates,
    };
    await supabase
      .from("journey_progress")
      .update(payload)
      .eq("id", progressData.id);
  }

  /* ── Sections ── */
  function goToSection(n: number) {
    setCurrentSection(n);
    saveProgress({ current_section: n });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitAnswers() {
    setSaving(true);
    await saveProgress({ current_section: 5 });
    setCurrentSection(5);
    await callAI(true);
    setSaving(false);
  }

  async function callAI(isInitial = false, userReply?: string) {
    setAiLoading(true);
    try {
      let updatedConvo = isInitial ? [] : [...conversation];

      if (!isInitial && userReply) {
        const userMsg: ConvoMsg = { role: "user", content: userReply };
        updatedConvo = [...updatedConvo, userMsg];
        setConversation(updatedConvo);
      }

      const body: any = {
        answers: {
          ...answers,
          intake_mood: intakeMood,
          intake_reason: intakeReason,
          intake_time: intakeTime,
        },
        stepNumber,
        conversation: updatedConvo,
        userName: userName || undefined,
        isReply: !isInitial,
      };

      const { data, error } = await supabase.functions.invoke("journey-ai", { body });

      if (error) throw error;
      if (data?.error) {
        toast({ variant: "destructive", title: "Erro", description: data.error });
        return;
      }

      const aiMsg: ConvoMsg = { role: "assistant", content: data.message };
      const finalConvo = [...updatedConvo, aiMsg];
      setConversation(finalConvo);
      await saveProgress({
        current_section: 5,
        ai_conversation: finalConvo as unknown as any,
      });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível obter resposta da IA." });
    } finally {
      setAiLoading(false);
    }
  }

  async function completeStep() {
    if (!canComplete || !user) return;
    setSaving(true);
    await saveProgress({
      is_completed: true,
      completed_at: new Date().toISOString(),
      current_section: 6,
    });

    await supabase
      .from("patient_profiles")
      .update({ current_step: stepNumber + 1 })
      .eq("user_id", user.id);

    const { data: stepData } = await supabase
      .from("journey_steps")
      .select("id")
      .eq("step_number", stepNumber)
      .maybeSingle();

    if (stepData) {
      await supabase.from("trail_progress").upsert([{
        user_id: user.id,
        step_id: stepData.id,
        is_completed: true,
        completed_at: new Date().toISOString(),
        exercises_completed: answers as unknown as any,
        reflection_answers: conversation as unknown as any,
        video_watched: true,
      }], { onConflict: "user_id,step_id" });
    }

    await awardMedal(`journey-${stepNumber}`);
    setShowCelebration(true);
    setTimeout(() => navigate("/app/jornada"), 3000);
    setSaving(false);
  }

  /* ── Step indicator ── */
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 py-3">
      {Array.from({ length: TOTAL_SECTIONS }, (_, i) => {
        const n = i + 1;
        const isActive = n === currentSection;
        const isDone = n < currentSection;
        return (
          <div key={n} className="flex items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: isDone
                  ? "#2D6A4F"
                  : isActive
                  ? "linear-gradient(135deg, #C9A84C, #E8D590)"
                  : "#E5E7EB",
                color: isDone || isActive ? "#fff" : "#9CA3AF",
              }}
            >
              {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : n}
            </div>
            {n < TOTAL_SECTIONS && (
              <div
                className="w-4 h-0.5 mx-0.5"
                style={{ background: isDone ? "#2D6A4F" : "#E5E7EB" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Celebration ── */
  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="text-center animate-scale-in px-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)", boxShadow: "0 0 40px rgba(201,168,76,0.5)" }}>
            <Award className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Parabéns!</h1>
          <p className="text-white/80 text-lg mb-1">Você conquistou a medalha</p>
          <p className="text-xl font-bold flex items-center justify-center gap-2" style={{ color: "#E8D590" }}><Award className="h-5 w-5" /> {meta.medal}</p>
          <p className="text-white/50 text-sm mt-6">Redirecionando para a Jornada...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app/jornada")} className="text-white hover:bg-white/20 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60">Passo {stepNumber} de 12</p>
              <h1 className="text-lg font-bold text-white truncate">{meta.name}</h1>
            </div>
            <span className="text-sm flex items-center gap-1" style={{ color: "#E8D590" }}><Award className="h-4 w-4" /> {meta.medal}</span>
          </div>
          <p className="text-sm text-white/70 mb-2">{meta.subtitle}</p>
        </div>

      </div>

      {/* Step indicator */}
      <StepIndicator />

      <div className="max-w-2xl mx-auto px-5 pb-5 space-y-5">

        {/* ═══ ÁUDIO DO PASSO ═══ */}
        {STEP_AUDIO[stepNumber] && (
          <div
            className="rounded-2xl p-4 shadow-md"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
          >
            <div className="flex items-center gap-2 mb-3 text-white">
              <Headphones className="h-4 w-4" style={{ color: "#E8D590" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest" style={{ color: "#E8D590" }}>
                  Áudio do Passo {stepNumber}
                </p>
                <p className="text-sm font-semibold truncate">{meta.name}</p>
              </div>
            </div>
            <audio controls preload="none" className="w-full">
              <source src={STEP_AUDIO[stepNumber]} type="audio/mpeg" />
              Seu navegador não suporta áudio HTML5.
            </audio>
          </div>
        )}

        {/* ═══ ETAPA 1 — FORMULÁRIO DE ENTRADA ═══ */}
        {currentSection === 1 && (
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 space-y-5">
              <div className="text-center mb-2">
                <Leaf className="h-7 w-7 mx-auto mb-2 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Antes de começar, me conta...</h2>
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Como você está se sentindo agora?</label>
                <div className="grid grid-cols-4 gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setIntakeMood(m.label)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: intakeMood === m.label ? "#2D6A4F" : "#E5E7EB",
                        background: intakeMood === m.label ? "#E8F5E9" : "transparent",
                      }}
                    >
                      <m.Icon className="h-6 w-6" style={{ color: intakeMood === m.label ? "#1B4332" : "#6B7280" }} />
                      <span className="text-xs font-medium" style={{ color: intakeMood === m.label ? "#1B4332" : "#6B7280" }}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium">O que te trouxe até aqui hoje?</label>
                <Textarea
                  value={intakeReason}
                  onChange={(e) => setIntakeReason(e.target.value)}
                  placeholder="Conte com suas palavras..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Há quanto tempo as apostas fazem parte da sua vida?</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setIntakeTime(t)}
                      className="p-3 rounded-xl border-2 text-sm font-medium transition-all"
                      style={{
                        borderColor: intakeTime === t ? "#2D6A4F" : "#E5E7EB",
                        background: intakeTime === t ? "#E8F5E9" : "transparent",
                        color: intakeTime === t ? "#1B4332" : "#6B7280",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full text-white"
                disabled={!intakeComplete}
                style={intakeComplete ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}}
                onClick={() => goToSection(2)}
              >
                Começar minha jornada →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ ETAPA 2 — VÍDEO ═══ */}
        {currentSection === 2 && (
          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {/* Video player / placeholder */}
              <VideoPlayer
                url={videoUrl}
                watched={videoWatched}
                onWatched={() => {
                  setVideoWatched(true);
                  saveProgress({ video_watched: true } as any);
                }}
              />

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-foreground">Passo {stepNumber} — {meta.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1"><Film className="h-3.5 w-3.5" /> 3 min</p>
                </div>

                {!videoWatched && videoUrl && (
                  <p className="text-xs text-muted-foreground text-center">
                    Assista a pelo menos 90% do vídeo para liberar a próxima seção.
                  </p>
                )}
                {!videoWatched && !videoUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setVideoWatched(true)}
                  >
                    Marcar como assistido
                  </Button>
                )}

                {videoWatched && (
                  <Button
                    className="w-full text-white"
                    style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
                    onClick={() => goToSection(3)}
                  >
                    Já assisti, continuar →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ ETAPA 3 — ATIVIDADES EXTERNAS (checklist) ═══ */}
        {currentSection === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> O que você vai fazer FORA do app
                {allChecked && <CheckCircle className="h-4 w-4 text-green-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {CHECKLIST_ITEMS.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Checkbox
                    id={`check-${i}`}
                    checked={checkedItems[i]}
                    onCheckedChange={(checked) => {
                      const next = [...checkedItems];
                      next[i] = !!checked;
                      setCheckedItems(next);
                      supabase.from("journey_progress").update({ checklist_items: next }).eq("id", progressData?.id);
                    }}
                    className="mt-1"
                  />
                  <label htmlFor={`check-${i}`} className={`text-sm cursor-pointer leading-relaxed ${checkedItems[i] ? "line-through text-muted-foreground" : ""}`}>
                    {item}
                  </label>
                </div>
              ))}

              <Button
                className="w-full mt-2 text-white"
                disabled={!allChecked}
                style={allChecked ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}}
                onClick={() => goToSection(4)}
              >
                {allChecked ? "Continuar para reflexões →" : "Complete todas as atividades"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ ETAPA 4 — QUESTÕES INTERNAS ═══ */}
        {currentSection === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Responda com honestidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Em uma palavra, como você se sente agora que admitiu esse problema?</label>
                <Input
                  value={answers.feeling}
                  onChange={(e) => setAnswers((p) => ({ ...p, feeling: e.target.value }))}
                  placeholder="Ex: aliviado, assustado, esperançoso..."
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Qual foi o momento mais difícil que as apostas causaram na sua vida recentemente?</label>
                <Textarea
                  value={answers.hardest_moment}
                  onChange={(e) => setAnswers((p) => ({ ...p, hardest_moment: e.target.value }))}
                  placeholder="Descreva com sinceridade..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">O que você está disposto a fazer diferente a partir de hoje?</label>
                <Textarea
                  value={answers.commitment}
                  onChange={(e) => setAnswers((p) => ({ ...p, commitment: e.target.value }))}
                  placeholder="Seu compromisso consigo mesmo..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                className="w-full text-white"
                disabled={!answersComplete || saving}
                style={answersComplete ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}}
                onClick={submitAnswers}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar respostas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ ETAPA 5 — CARTA DA ANA ═══ */}
        {currentSection === 5 && (
          <AnaLetter
            letters={conversation}
            isLoading={aiLoading}
            onSendReply={(text) => callAI(false, text)}
            maxExchanges={2}
          />
        )}

        {/* ═══ ETAPA 6 — CONCLUSÃO ═══ */}
        {currentSection >= 5 && conversation.length > 0 && (
          <Card className="border-2" style={{ borderColor: canComplete ? "#2D6A4F" : undefined }}>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-bold text-lg">Concluir Passo {stepNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1">Medalha: {meta.medal}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {allChecked ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className={allChecked ? "text-green-700" : "text-muted-foreground"}>Atividades externas completas</span>
                </div>
                <div className="flex items-center gap-2">
                  {answersComplete ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className={answersComplete ? "text-green-700" : "text-muted-foreground"}>Reflexões respondidas</span>
                </div>
                <div className="flex items-center gap-2">
                  {conversation.length > 0 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className={conversation.length > 0 ? "text-green-700" : "text-muted-foreground"}>Carta da Ana recebida</span>
                </div>
                <div className="flex items-center gap-2">
                  {timeRemaining <= 0 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className={timeRemaining <= 0 ? "text-green-700" : "text-muted-foreground"}>
                    {timeRemaining > 0 ? `Disponível em: ${formatTime(timeRemaining)}` : "Tempo cumprido"}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!canComplete || saving}
                style={canComplete ? { background: "linear-gradient(135deg, #C9A84C, #E8D590)", color: "#1B4332" } : {}}
                onClick={completeStep}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2" />}
                {canComplete ? "Concluir Passo e Ganhar Medalha" : "Complete os requisitos acima"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
