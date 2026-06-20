import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMedals } from "@/hooks/useMedals";
import { useJourneyValidation, STEP_VALIDATION_MEDAL, STEP_TASK_LABEL } from "@/hooks/useJourneyValidation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Award,
  Headphones,
  Sparkles,
  MessageSquare,
  Compass,
  ArrowRight,
  CheckCircle,
  Lock,
  RefreshCw,
  PlayCircle,
  CheckSquare,
} from "lucide-react";
import { STEP_QUIZ } from "./quiz_data";

/* ── Áudio do passo (Supabase Storage) ── */
const AUDIO_BASE = "https://dmrlkxwpbwmzpdecsgnw.supabase.co/storage/v1/object/public/audios-jornada";
const STEP_AUDIO: Record<number, string> = {
  1: `${AUDIO_BASE}/passo1_reconhecimento.mp3`,
  2: `${AUDIO_BASE}/passo2_esperanca.mp3`,
  3: `${AUDIO_BASE}/passo3_entrega.mp3`,
  4: `${AUDIO_BASE}/passo4_inventario.mp3`,
  5: `${AUDIO_BASE}/passo5_verdade.mp3`,
  6: `${AUDIO_BASE}/passo6_disponibilidade.mp3`,
  7: `${AUDIO_BASE}/passo7_humildade.mp3`,
  8: `${AUDIO_BASE}/passo8_reparacao.mp3`,
  9: `${AUDIO_BASE}/passo9_responsabilidade.mp3`,
  10: `${AUDIO_BASE}/passo10_vigilancia.mp3`,
  11: `${AUDIO_BASE}/passo11_conexao.mp3`,
  12: `${AUDIO_BASE}/passo12_repasse.mp3`,
};

interface StepContent {
  name: string;
  medal: string;
  message: string;
  question: string;
  activity: string;
  activityButton: string;
  activityRoute: string;
  youtubeId: string;
}

const STEPS: Record<number, StepContent> = {
  1: {
    name: "Reconhecimento",
    medal: "Coragem de Olhar",
    message: "O primeiro passo é o mais corajoso. Você admitiu o problema — isso já é uma vitória.",
    question: "Em quais áreas da sua vida o jogo causou mais impacto? Seja honesto consigo mesmo.",
    activity:
      "Complete seu perfil no app — quanto mais informações você registrar, mais personalizada será sua jornada.",
    activityButton: "Completar meu perfil",
    activityRoute: "/app/perfil",
    youtubeId: "dpvudFrQHJo",
  },
  2: {
    name: "Esperança",
    medal: "Primeiro Raio de Luz",
    message: "Pessoas perderam tudo e reconstruíram suas vidas. Você também pode — um dia de cada vez.",
    question: "Como seria sua vida daqui a 1 ano se você se mantiver na recuperação? Descreva com detalhes.",
    activity:
      "Publique sua primeira história no app. Não precisa se identificar — seu relato pode ser a esperança que outra pessoa precisa hoje.",
    activityButton: "Ir para Histórias que Conectam",
    activityRoute: "/app/comunidade",
    youtubeId: "xyaUZHTUHkU",
  },
  3: {
    name: "Entrega",
    medal: "Âncora Plantada",
    message: "Pedir ajuda não é fraqueza. É a decisão mais inteligente que você pode tomar agora.",
    question:
      "Quem é a pessoa de confiança que pode te apoiar nessa jornada? Já contou para ela sobre o que está passando?",
    activity:
      "Cadastre agora seu Contato Âncora — a pessoa que você liga nos momentos de crise. Ter esse contato salvo no app pode evitar uma recaída.",
    activityButton: "Cadastrar meu Contato Âncora",
    activityRoute: "/app/ancora",
    youtubeId: "82CZZveTJqE",
  },
  4: {
    name: "Inventário",
    medal: "Espelho Honesto",
    message: "Conhecer seus gatilhos é a arma mais poderosa contra a recaída.",
    question:
      "O que geralmente te levava a apostar? Tédio, ansiedade, dívidas, solidão? Identifique seus 3 principais gatilhos.",
    activity: "Cadastre as plataformas de apostas que você usava no Meu Escudo e ative o contato guardião.",
    activityButton: "Configurar Meu Escudo",
    activityRoute: "/app/escudo",
    youtubeId: "Y3hINuMsmrA",
  },
  5: {
    name: "Verdade",
    medal: "Voz que Liberta",
    message: "A vergonha perde força quando você fala. O silêncio alimenta o vício.",
    question:
      "Existe alguém importante na sua vida para quem você ainda não contou a verdade? O que te impede de falar?",
    activity:
      "Poste um depoimento anônimo em Histórias que Conectam. Falar a verdade — mesmo que anonimamente — é o primeiro passo para a cura.",
    activityButton: "Publicar depoimento anônimo",
    activityRoute: "/app/comunidade",
    youtubeId: "YpvINqS3uPw",
  },
  6: {
    name: "Disponibilidade",
    medal: "Porta Aberta",
    message: "Mudar exige mais do que querer — exige agir diferente todos os dias.",
    question: "Quais hábitos do seu dia a dia precisam mudar para afastar o risco de recaída? Liste pelo menos 3.",
    activity:
      "Crie sua primeira rotina no app. Estrutura diária é proteção — cada hábito saudável ocupa o espaço que o jogo ocupava.",
    activityButton: "Criar minha Rotina Inteligente",
    activityRoute: "/app/rotina",
    youtubeId: "oBi37roJ0RY",
  },
  7: {
    name: "Humildade",
    medal: "Força que Dobra",
    message: "Você não precisa ter tudo resolvido para pedir ajuda. Precisa apenas ser honesto.",
    question:
      "Em que momento do vício você mais se iludiu achando que estava no controle? O que essa ilusão te custou?",
    activity:
      "Agende sua primeira sessão de terapia online. Profissionais especializados em ludopatia estão aqui para te ajudar — sem julgamento.",
    activityButton: "Agendar sessão de Terapia",
    activityRoute: "/app/terapia",
    youtubeId: "RNkJUNA71MY",
  },
  8: {
    name: "Reparação",
    medal: "Ponte Reconstruída",
    message: "Você não pode mudar o passado. Mas pode mudar o que faz a partir de agora.",
    question: "Quem foi mais afetado pelo seu comportamento? O que você gostaria de dizer ou fazer por essa pessoa?",
    activity:
      "Registre suas dívidas no app. Encarar os números é o primeiro passo para reorganizar sua vida financeira com um plano real.",
    activityButton: "Ir para Finanças",
    activityRoute: "/app/financas",
    youtubeId: "sLsN078bgY8",
  },
  9: {
    name: "Responsabilidade",
    medal: "Peso nos Ombros",
    message: "Cada dia sem apostar é prova de que você é capaz. Construa sua nova identidade com ações.",
    question:
      "Que compromisso concreto você assume consigo mesmo hoje? Escreva como se fosse um contrato com você mesmo.",
    activity:
      "Ative o check-in diário na sua Rotina Inteligente. Registrar sua presença todo dia é o ato mais poderoso de responsabilidade que existe.",
    activityButton: "Ativar check-in diário",
    activityRoute: "/app/rotina",
    youtubeId: "7y1uvHZ_znY",
  },
  10: {
    name: "Vigilância",
    medal: "Guarda Fiel",
    message: "A recaída começa na cabeça antes de acontecer. Você já sabe reconhecer os sinais.",
    question: "Nos últimos dias sentiu vontade de apostar? O que aconteceu antes? Qual foi o gatilho?",
    activity:
      "Configure os alertas de proteção no Meu Escudo. Quando o risco aparecer, o app age antes que você precise agir sozinho.",
    activityButton: "Configurar alertas no Meu Escudo",
    activityRoute: "/app/escudo",
    youtubeId: "KvfQCwczYhI",
  },
  11: {
    name: "Conexão Final",
    medal: "Raízes Profundas",
    message: "Quando você tem razões para viver, o jogo perde o poder sobre você.",
    question: "O que te dá sentido e propósito além do jogo? Família, trabalho, um sonho? Escreva sobre isso.",
    activity:
      "Se você perdeu dinheiro para casas de apostas, pode haver um caminho jurídico para recuperá-lo. Acesse o Apoio Jurídico e entenda seus direitos.",
    activityButton: "Acessar Apoio Jurídico",
    activityRoute: "/app/juridico",
    youtubeId: "YpvINqS3uPw",
  },
  12: {
    name: "Repasse",
    medal: "Farol Aceso",
    message: "Sua história tem o poder de salvar outra pessoa. Compartilhar é parte da sua cura.",
    question:
      "Se você pudesse mandar uma mensagem para alguém no início do vício, o que diria? Escreva essa mensagem agora.",
    activity:
      "Publique sua história de conquista em Histórias que Conectam e compartilhe o app Saindo do Jogo com alguém que precisa. Você completa sua jornada ajudando outros a começar a deles.",
    activityButton: "Publicar minha conquista",
    activityRoute: "/app/comunidade",
    youtubeId: "xyaUZHTUHkU",
  },
};

export default function JourneyStep() {
  const { stepNumber: stepParam } = useParams();
  const stepNumber = parseInt(stepParam || "1");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardMedal } = useMedals();
  const { isUnlocked, isDone: taskValidated, isAdmin, refetch: revalidate, validations } = useJourneyValidation();
  const step = STEPS[stepNumber] || STEPS[1];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [resposta, setResposta] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [anaFeedback, setAnaFeedback] = useState<string | null>(null);
  const [showAnaFeedback, setShowAnaFeedback] = useState(false);

  // Quiz states
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const quiz = STEP_QUIZ[stepNumber];

  const stepUnlocked = isUnlocked(stepNumber);
  const stepTaskDone = taskValidated(stepNumber);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase
          .from("jornada_respostas" as any)
          .select("resposta, audio_played, quiz_passed")
          .eq("user_id", user.id)
          .eq("step_number", stepNumber)
          .maybeSingle(),
        supabase
          .from("journey_progress")
          .select("is_completed")
          .eq("user_id", user.id)
          .eq("step_number", stepNumber)
          .maybeSingle(),
      ]);
      const row = r as any;
      if (row?.resposta) setResposta(row.resposta);
      if (row?.audio_played) setAudioPlayed(true);
      if (row?.quiz_passed) {
        setQuizSubmitted(true);
        setQuizPassed(true);
      }
      if (p?.is_completed) setIsCompleted(true);
      setLoading(false);
    })();
  }, [user, stepNumber]);

  async function persistFlag(flag: "audio_played" | "quiz_passed", value: boolean) {
    if (!user) return;
    await supabase
      .from("jornada_respostas" as any)
      .upsert(
        { user_id: user.id, step_number: stepNumber, [flag]: value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,step_number" },
      );
  }

  async function handleRevalidate() {
    toast({ title: "Verificando..." });
    const result = await revalidate();
    setTimeout(() => {
      const done = isAdmin || !!result.data?.[stepNumber]?.done;
      if (done) {
        toast({ title: "✅ Atividade concluída!" });
      } else {
        toast({ title: "⏳ Atividade ainda pendente" });
      }
    }, 1000);
  }

  // Refetch validation when route changes (e.g., returning from /app/perfil to /app/jornada/N)
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => revalidate(), 500);
    return () => clearTimeout(timer);
  }, [location.pathname, user]);

  // Refetch validation when tab/window regains focus or becomes visible again
  useEffect(() => {
    if (!user) return;
    const handler = () => {
      if (document.visibilityState === "visible") revalidate();
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [user]);

  async function saveResposta() {
    if (!user || !resposta.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("jornada_respostas" as any)
      .upsert(
        {
          user_id: user.id,
          step_number: stepNumber,
          resposta: resposta.trim(),
          audio_played: audioPlayed,
          quiz_passed: quizPassed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,step_number" },
      );
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Resposta salva", description: "Sua reflexão foi guardada." });
    }
  }

  function fireConfetti() {
    const end = Date.now() + 1500;
    const colors = ["#C9A84C", "#E8D590", "#1B4332", "#2D6A4F"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  /** Validates against Supabase, then completes the step + awards medal. */
  async function completeStep() {
    if (!user) return;
    if (!resposta.trim()) {
      toast({
        variant: "destructive",
        title: "Reflexão necessária",
        description: "Responda a pergunta antes de concluir.",
      });
      return;
    }
    setCompleting(true);
    await saveResposta();

    // Force a fresh validation read
    const fresh = await revalidate();
    const passed = isAdmin || !!fresh.data?.[stepNumber]?.done;

    if (!passed) {
      setCompleting(false);
      toast({
        variant: "destructive",
        title: "Tarefa ainda não concluída",
        description: STEP_TASK_LABEL[stepNumber],
      });
      return;
    }

    // upsert journey_progress
    const { data: existing } = await supabase
      .from("journey_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("step_number", stepNumber)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("journey_progress")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("journey_progress").insert({
        user_id: user.id,
        step_number: stepNumber,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    await supabase
      .from("patient_profiles")
      .update({ current_step: stepNumber + 1 })
      .eq("user_id", user.id);

    // Award both the validation medal and the legacy journey medal
    await awardMedal(STEP_VALIDATION_MEDAL[stepNumber].id);
    await awardMedal(`journey-${stepNumber}`);

    setIsCompleted(true);

    // Try to get a personalized message from Ana before celebration
    let feedbackText: string | null = null;
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const { data: fbData } = await supabase.functions.invoke("journey-feedback", {
        body: {
          step_number: stepNumber,
          depoimento: resposta,
          user_name: prof?.full_name || "você",
        },
      });
      feedbackText = (fbData as any)?.feedback || null;
    } catch (e) {
      console.warn("journey-feedback failed:", e);
    }

    setCompleting(false);

    if (feedbackText) {
      setAnaFeedback(feedbackText);
      setShowAnaFeedback(true);
    } else {
      triggerCelebration();
    }
  }

  function triggerCelebration() {
    setShowCelebration(true);
    if (stepNumber === 12) fireConfetti();
    setTimeout(() => navigate("/app/jornada"), stepNumber === 12 ? 4200 : 2800);
  }

  if (showCelebration) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
      >
        <div className="text-center animate-scale-in w-full max-w-sm">
          {/* Medalha */}
          <div
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #C9A84C, #E8D590)",
              boxShadow: "0 0 40px rgba(201,168,76,0.5)",
            }}
          >
            <Award className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Parabéns!</h1>
          <p className="text-white/80 text-base mb-1">Você conquistou a medalha</p>
          <p className="text-lg font-bold mb-6 flex items-center justify-center gap-2" style={{ color: "#E8D590" }}>
            <Award className="h-5 w-5" /> {step.medal}
          </p>

          {/* Mensagem da Ana */}
          <div
            className="rounded-2xl p-5 text-left"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-[#F5F0E8] flex items-center justify-center shrink-0 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
                  <circle cx="50" cy="50" r="50" fill="#F5F0E8" />
                  <path d="M22 50 Q22 22 50 22 Q78 22 78 50 L78 60 Q70 50 50 50 Q30 50 22 60 Z" fill="#1B4332" />
                  <ellipse cx="50" cy="58" rx="22" ry="26" fill="#E8C9A8" />
                  <ellipse cx="42" cy="58" rx="2" ry="2.5" fill="#1B4332" />
                  <ellipse cx="58" cy="58" rx="2" ry="2.5" fill="#1B4332" />
                  <path d="M42 70 Q50 76 58 70" stroke="#1B4332" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#C9A84C" }}>
                  Ana
                </p>
                <p className="text-xs text-white/60">
                  Passo {stepNumber} — {step.name}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/90 italic">"{step.message}"</p>
          </div>
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

  /* ── Locked screen: previous step task not validated yet ── */
  if (!stepUnlocked) {
    return (
      <div className="min-h-screen bg-background pb-24 safe-top">
        <div style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
          <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/jornada")}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60">Passo {stepNumber} de 12</p>
              <h1 className="text-lg font-bold text-white truncate">{step.name}</h1>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 pt-10 flex flex-col items-center text-center animate-fade-in">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: "#E5E7EB" }}
          >
            <Lock className="h-9 w-9" style={{ color: "#6B7280" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Passo bloqueado</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Complete a tarefa anterior para desbloquear este passo.
          </p>
          <div
            className="rounded-2xl p-4 w-full max-w-sm mb-6 text-left"
            style={{ background: "#F5F0E8", border: "1px solid #E8D590" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#1B4332" }}>
              Tarefa do Passo {stepNumber - 1}
            </p>
            <p className="text-sm" style={{ color: "#1B4332" }}>
              {STEP_TASK_LABEL[stepNumber - 1]}
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-sm">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/app/jornada/${stepNumber - 1}`)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Ir ao passo anterior
            </Button>
            <Button
              className="flex-1 text-white"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
              onClick={() => handleRevalidate()}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Verificar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/jornada")}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60">Passo {stepNumber} de 12</p>
              <h1 className="text-lg font-bold text-white truncate">{step.name}</h1>
            </div>
            <span className="text-sm flex items-center gap-1" style={{ color: "#E8D590" }}>
              <Award className="h-4 w-4" /> {step.medal}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-5 space-y-5">
        {/* 1. ÁUDIO */}
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
                <p className="text-sm font-semibold truncate">{step.name}</p>
              </div>
              {audioPlayed && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(201,168,76,0.2)", color: "#E8D590" }}
                >
                  <CheckCircle className="h-3 w-3" /> Ouvido
                </span>
              )}
            </div>
            <audio
              ref={audioRef}
              controls
              preload="none"
              className="w-full"
              onPlay={() => {
                if (!audioPlayed) {
                  setAudioPlayed(true);
                  persistFlag("audio_played", true);
                }
              }}
              onEnded={() => {
                if (!audioPlayed) {
                  setAudioPlayed(true);
                  persistFlag("audio_played", true);
                }
              }}
            >
              <source src={STEP_AUDIO[stepNumber]} type="audio/mpeg" />
              Seu navegador não suporta áudio HTML5.
            </audio>
            {!audioPlayed && (
              <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                ▶️ Ouça o áudio para liberar o questionário
              </p>
            )}
          </div>
        )}

        {/* QUIZ — aparece após ouvir o áudio */}
        {audioPlayed && quiz && !isCompleted && (
          <div className="rounded-2xl p-5 bg-card border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5" style={{ color: "#1B4332" }} />
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#1B4332" }}>
                Questionário do Passo {stepNumber}
              </h2>
              {quizPassed && (
                <span
                  className="ml-auto text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "#D1FAE5", color: "#065F46" }}
                >
                  <CheckCircle className="h-3 w-3" /> Aprovado
                </span>
              )}
            </div>

            <div className="space-y-5">
              {quiz.questions.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {qi + 1}. {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = quizAnswers[qi] === oi;
                      const isCorrect = oi === q.correct;
                      const showResult = quizSubmitted;
                      let bg = "bg-secondary/40 border-border/30";
                      if (showResult && selected && isCorrect) bg = "bg-green-50 border-green-400";
                      else if (showResult && selected && !isCorrect) bg = "bg-red-50 border-red-400";
                      else if (showResult && isCorrect) bg = "bg-green-50 border-green-300";
                      else if (selected) bg = "border-primary bg-primary/5";
                      return (
                        <button
                          key={oi}
                          disabled={quizSubmitted}
                          onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${bg}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!quizSubmitted ? (
              <Button
                onClick={() => {
                  const answered = Object.keys(quizAnswers).length;
                  if (answered < quiz.questions.length) {
                    toast({ variant: "destructive", title: "Responda todas as perguntas antes de continuar" });
                    return;
                  }
                  const correct = quiz.questions.filter((q, i) => quizAnswers[i] === q.correct).length;
                  setQuizSubmitted(true);
                  if (correct >= 2) {
                    setQuizPassed(true);
                    persistFlag("quiz_passed", true);
                    toast({ title: `✅ ${correct}/3 corretas! Muito bem!` });
                  } else {
                    toast({
                      variant: "destructive",
                      title: `❌ ${correct}/3 corretas. Releia o conteúdo e tente novamente.`,
                    });
                    setTimeout(() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }, 3000);
                  }
                }}
                className="w-full mt-4"
                style={{ background: "#1B4332", color: "white" }}
              >
                Confirmar respostas
              </Button>
            ) : quizPassed ? (
              <p className="text-center text-sm text-green-600 font-medium mt-4">
                ✅ Questionário concluído! Agora escreva seu depoimento abaixo.
              </p>
            ) : (
              <p className="text-center text-sm text-red-500 mt-4">
                Revise o conteúdo e tente novamente em instantes...
              </p>
            )}
          </div>
        )}

        {/* 2. MENSAGEM IMPACTANTE */}
        <div className="rounded-2xl p-5 shadow-md" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#E8D590" }} />
            <p className="text-white text-base font-medium leading-snug">{step.message}</p>
          </div>
        </div>

        {/* 3. DEPOIMENTO — aparece após quiz aprovado */}
        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5" style={{ color: "#1B4332" }} />
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#1B4332" }}>
              Seu Depoimento
            </h2>
            {resposta.trim().length >= 50 && (
              <span
                className="ml-auto text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                style={{ background: "#D1FAE5", color: "#065F46" }}
              >
                <CheckCircle className="h-3 w-3" /> Salvo
              </span>
            )}
          </div>
          {!quizPassed && !isCompleted && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              🔒 Complete o questionário para liberar o depoimento
            </p>
          )}
          <p className="text-foreground text-sm mb-3 leading-relaxed">{quiz?.depositoPrompt || step.question}</p>
          <Textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Escreva aqui seu depoimento (mínimo 50 caracteres)..."
            rows={5}
            className="resize-none"
            disabled={!quizPassed && !isCompleted}
          />
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${resposta.length >= 50 ? "text-green-600" : "text-muted-foreground"}`}>
              {resposta.length}/50 mínimo
            </span>
            <Button
              onClick={saveResposta}
              disabled={saving || resposta.trim().length < 50 || (!quizPassed && !isCompleted)}
              variant="outline"
              size="sm"
              style={{ borderColor: "#1B4332", color: "#1B4332" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar depoimento"}
            </Button>
          </div>
        </div>

        {/* 4. ATIVIDADE PRÁTICA */}
        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-5 w-5" style={{ color: "#1B4332" }} />
            <h2 className="text-sm font-bold uppercase tracking-wide flex-1" style={{ color: "#1B4332" }}>
              Atividade prática
            </h2>
            {stepTaskDone ? (
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide"
                style={{ background: "#D1FAE5", color: "#065F46" }}
              >
                <CheckCircle className="h-3 w-3" /> Concluída
              </span>
            ) : (
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide"
                style={{ background: "#FEF3C7", color: "#92400E" }}
              >
                Pendente
              </span>
            )}
          </div>
          <p className="text-foreground text-sm mb-2 leading-relaxed">{step.activity}</p>
          <p className="text-xs text-muted-foreground mb-4 italic">
            Tarefa validada automaticamente: {STEP_TASK_LABEL[stepNumber]}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(step.activityRoute)}
              className="flex-1 text-white"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              {step.activityButton}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleRevalidate()} title="Verificar tarefa">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 5. VÍDEO YOUTUBE */}
        <div className="rounded-2xl overflow-hidden shadow-md bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${step.youtubeId}?rel=0&modestbranding=1`}
            style={{ width: "100%", aspectRatio: "16/9", border: "none" }}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`Vídeo do Passo ${stepNumber}`}
          />
        </div>

        {/* CONCLUIR PASSO */}
        {/* Checklist de requisitos */}
        {!isCompleted && (
          <div className="rounded-2xl p-4 bg-card border border-border">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Para concluir este passo:
            </p>
            <div className="space-y-2">
              <div
                className={`flex items-center gap-2 text-sm ${audioPlayed ? "text-green-600" : "text-muted-foreground"}`}
              >
                {audioPlayed ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Ouvir o áudio
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${quizPassed ? "text-green-600" : "text-muted-foreground"}`}
              >
                {quizPassed ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Responder o questionário (2/3 corretas)
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${resposta.trim().length >= 50 ? "text-green-600" : "text-muted-foreground"}`}
              >
                {resposta.trim().length >= 50 ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Escrever depoimento (mín. 50 caracteres)
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${stepTaskDone || isAdmin ? "text-green-600" : "text-muted-foreground"}`}
              >
                {stepTaskDone || isAdmin ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                Completar atividade prática
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={completeStep}
          disabled={
            completing ||
            !resposta.trim() ||
            resposta.trim().length < 50 ||
            (!stepTaskDone && !isAdmin) ||
            (!quizPassed && !isCompleted)
          }
          className="w-full h-12 text-white font-semibold disabled:opacity-60"
          style={{
            background: isCompleted
              ? "linear-gradient(135deg, #C9A84C, #E8D590)"
              : (stepTaskDone || isAdmin) && quizPassed && resposta.trim().length >= 50
                ? "linear-gradient(135deg, #1B4332, #2D6A4F)"
                : "#9CA3AF",
          }}
        >
          {completing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isCompleted ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" /> Passo concluído
            </>
          ) : !audioPlayed ? (
            <>
              <PlayCircle className="h-5 w-5 mr-2" /> Ouça o áudio primeiro
            </>
          ) : !quizPassed ? (
            <>
              <Lock className="h-5 w-5 mr-2" /> Complete o questionário
            </>
          ) : resposta.trim().length < 50 ? (
            <>
              <Lock className="h-5 w-5 mr-2" /> Escreva seu depoimento
            </>
          ) : !stepTaskDone && !isAdmin ? (
            <>
              <Lock className="h-5 w-5 mr-2" /> Complete a atividade prática
            </>
          ) : (
            <>
              Concluir Passo {stepNumber}
              <Award className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
