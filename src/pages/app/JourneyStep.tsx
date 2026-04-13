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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AnaLetter from "@/components/journey/AnaLetter";
import {
  Loader2, ArrowLeft, CheckCircle, Clock, Award, Send,
} from "lucide-react";

/* ── Step metadata ── */
const STEP_META: Record<number, { name: string; subtitle: string; medal: string }> = {
  1: { name: "Reconhecimento", subtitle: "Admito que perdi o controle e que isso desorganizou minha vida", medal: "Coragem de Olhar" },
  2: { name: "Esperança", subtitle: "Posso recuperar minha lucidez", medal: "Esperança" },
  3: { name: "Entrega", subtitle: "Um propósito maior que meus impulsos", medal: "Entrega" },
  4: { name: "Inventário", subtitle: "Honestidade sobre o impacto", medal: "Inventário" },
  5: { name: "Verdade", subtitle: "Reconheço a dimensão real", medal: "Verdade" },
  6: { name: "Disponibilidade", subtitle: "Pronto para abandonar padrões", medal: "Disponibilidade" },
  7: { name: "Humildade", subtitle: "Peço força para transformar", medal: "Humildade" },
  8: { name: "Responsabilidade", subtitle: "Listo quem prejudiquei", medal: "Responsabilidade" },
  9: { name: "Reparação", subtitle: "Faço reparações possíveis", medal: "Reparação" },
  10: { name: "Vigilância", subtitle: "Inventário diário", medal: "Vigilância" },
  11: { name: "Conexão Real", subtitle: "Silêncio e direção", medal: "Conexão Real" },
  12: { name: "Propósito", subtitle: "Vivo e compartilho", medal: "Propósito" },
};

const CHECKLIST_ITEMS = [
  'Escrever em um papel: "Eu, [nome], admito que perdi o controle sobre as apostas." Assinar e guardar.',
  "Listar 3 situações em que as apostas prejudicaram sua vida nos últimos 3 meses",
  "Desligar todas as notificações de plataformas de apostas por 24 horas",
];

const MIN_HOURS = 12;

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

  // Sections
  const [currentSection, setCurrentSection] = useState(1);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [answers, setAnswers] = useState({ feeling: "", hardest_moment: "", commitment: "" });
  const [conversation, setConversation] = useState<ConvoMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userName, setUserName] = useState("");

  const allChecked = checkedItems.every(Boolean);
  const answersComplete = answers.feeling.trim() && answers.hardest_moment.trim() && answers.commitment.trim();

  /* Timer logic */
  const timeRemaining = useMemo(() => {
    if (!startedAt) return MIN_HOURS * 3600;
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    return Math.max(0, MIN_HOURS * 3600 - elapsed);
  }, [startedAt]);

  const canComplete = timeRemaining <= 0 && allChecked && answersComplete && conversation.length > 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  };

  /* Progress bar */
  const sectionProgress = useMemo(() => {
    let pct = 0;
    if (currentSection >= 2) pct += 20;
    if (allChecked) pct += 25;
    if (answersComplete) pct += 25;
    if (conversation.length > 0) pct += 20;
    if (progressData?.is_completed) pct = 100;
    return Math.min(pct, 100);
  }, [currentSection, allChecked, answersComplete, conversation, progressData]);

  /* ── Load ── */
  useEffect(() => {
    if (!user) return;
    loadProgress();
  }, [user, stepNumber]);

  // Timer tick
  useEffect(() => {
    if (!startedAt || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      // Force re-render for timer
      setStartedAt((prev) => prev);
    }, 60000);
    return () => clearInterval(interval);
  }, [startedAt, timeRemaining]);

  async function loadProgress() {
    setLoading(true);

    // Fetch user name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (profile?.full_name) setUserName(profile.full_name.split(" ")[0]);

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
    const payload = {
      checklist_items: checkedItems as unknown as any,
      answers: answers as unknown as any,
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
    await saveProgress({ current_section: 4 });
    setCurrentSection(4);
    // Call AI
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
        answers,
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
        current_section: 4,
        ai_conversation: finalConvo as unknown as any,
      });
    } catch (e: any) {
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
      current_section: 5,
    });

    // Update patient_profiles current_step
    await supabase
      .from("patient_profiles")
      .update({ current_step: stepNumber + 1 })
      .eq("user_id", user.id);

    // Also update trail_progress if step exists
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

  /* ── Celebration ── */
  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="text-center animate-scale-in px-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)", boxShadow: "0 0 40px rgba(201,168,76,0.5)" }}>
            <Award className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Parabéns! 🎉</h1>
          <p className="text-white/80 text-lg mb-1">Você conquistou a medalha</p>
          <p className="text-xl font-bold" style={{ color: "#E8D590" }}>🏅 {meta.medal}</p>
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
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app/jornada")} className="text-white hover:bg-white/20 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60">Passo {stepNumber} de 12</p>
              <h1 className="text-lg font-bold text-white truncate">{meta.name}</h1>
            </div>
            <span className="text-sm" style={{ color: "#E8D590" }}>🏅 {meta.medal}</span>
          </div>
          <p className="text-sm text-white/70 mb-3">{meta.subtitle}</p>
          <Progress value={sectionProgress} className="h-2 bg-white/20" />
          <div className="flex items-center justify-between mt-2 text-xs text-white/50">
            <span>{sectionProgress}% completo</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining > 0 ? `Disponível em: ${formatTime(timeRemaining)}` : "✅ Tempo cumprido"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">

        {/* ═══ SEÇÃO 1 — REFLEXÃO INICIAL ═══ */}
        {currentSection === 1 && (
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 space-y-5">
              <div className="text-4xl text-center mb-2">🌱</div>
              <p className="text-base leading-relaxed text-foreground">
                Você abriu esse aplicativo. Isso já foi uma escolha corajosa. Ninguém chega aqui por acidente — você chegou porque uma parte de você sabe que algo precisa mudar.
              </p>
              <p className="text-base leading-relaxed text-foreground">
                O Passo 1 não é sobre fraqueza. <strong>É sobre coragem de olhar para o que realmente está acontecendo.</strong>
              </p>
              <Button className="w-full" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} onClick={() => goToSection(2)}>
                Entendi, quero continuar →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ SEÇÃO 2 — ATIVIDADES EXTERNAS ═══ */}
        {currentSection >= 2 && (
          <Card className={currentSection > 2 && allChecked ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20" : ""}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                📋 O que você vai fazer FORA do app
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
                      // Auto-save
                      supabase.from("journey_progress").update({ checklist_items: next }).eq("id", progressData?.id);
                    }}
                    className="mt-1"
                  />
                  <label htmlFor={`check-${i}`} className={`text-sm cursor-pointer leading-relaxed ${checkedItems[i] ? "line-through text-muted-foreground" : ""}`}>
                    {item}
                  </label>
                </div>
              ))}

              {currentSection === 2 && (
                <Button className="w-full mt-2" disabled={!allChecked}
                  style={allChecked ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}}
                  onClick={() => goToSection(3)}>
                  {allChecked ? "Continuar para reflexões →" : "Complete todas as atividades"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ SEÇÃO 3 — QUESTÕES INTERNAS ═══ */}
        {currentSection >= 3 && (
          <Card className={currentSection > 3 && answersComplete ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20" : ""}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                💭 Responda com honestidade
                {answersComplete && currentSection > 3 && <CheckCircle className="h-4 w-4 text-green-600" />}
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

              {currentSection === 3 && (
                <Button className="w-full" disabled={!answersComplete || saving}
                  style={answersComplete ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}}
                  onClick={submitAnswers}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar respostas
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ SEÇÃO 4 — CARTA DA ANA ═══ */}
        {currentSection >= 4 && (
          <AnaLetter
            letters={conversation}
            isLoading={aiLoading}
            onSendReply={(text) => callAI(false, text)}
            maxExchanges={2}
          />
        )}
            </CardContent>
          </Card>
        )}

        {/* ═══ SEÇÃO 5 — CONCLUSÃO ═══ */}
        {currentSection >= 4 && conversation.length > 0 && (
          <Card className="border-2" style={{ borderColor: canComplete ? "#2D6A4F" : undefined }}>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <div className="text-3xl mb-2">🏅</div>
                <h3 className="font-bold text-lg">Concluir Passo {stepNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1">Medalha: {meta.medal}</p>
              </div>

              {/* Requirements */}
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
                  <span className={conversation.length > 0 ? "text-green-700" : "text-muted-foreground"}>Conversa com a Lia</span>
                </div>
                <div className="flex items-center gap-2">
                  {timeRemaining <= 0 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className={timeRemaining <= 0 ? "text-green-700" : "text-muted-foreground"}>
                    {timeRemaining > 0 ? `⏱ Disponível em: ${formatTime(timeRemaining)}` : "⏱ Tempo de comprometimento cumprido"}
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
                {canComplete ? "Concluir Passo e Ganhar Medalha 🏅" : "Complete os requisitos acima"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
