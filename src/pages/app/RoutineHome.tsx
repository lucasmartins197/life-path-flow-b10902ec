import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ChevronLeft, Pencil, Loader2, Star, Play, Pause,
  CheckCircle, Smartphone, Send, BookOpen, Timer,
} from "lucide-react";

interface CategoryConfig { id: string; label: string; emoji: string; color: string; }

const CATEGORIES: CategoryConfig[] = [
  { id: "esporte", label: "Esporte", emoji: "🏃", color: "#059669" },
  { id: "leitura", label: "Leitura", emoji: "📚", color: "#7C3AED" },
  { id: "espiritualidade", label: "Espiritualidade", emoji: "🙏", color: "#D97706" },
  { id: "social", label: "Interação Social", emoji: "👥", color: "#2563EB" },
  { id: "academia", label: "Academia", emoji: "🏋️", color: "#DC2626" },
];

const SPORT_TYPES = ["Corrida", "Futebol", "Beach Tennis", "Vôlei", "Caminhada", "Natação", "Outro"];
const READING_THEMES = ["Autoajuda", "Espiritualidade", "Ficção", "Finanças", "Outro"];
const SPIRITUAL_PRACTICES = ["Meditação", "Oração", "Reflexão", "Outra"];
const SOCIAL_TYPES = ["Família", "Amigos", "Grupo de apoio"];
const GYM_LEVELS = ["Iniciante", "Intermediário", "Avançado"];
const GYM_FOCUS = ["Peito e Tríceps", "Costas e Bíceps", "Pernas", "Ombro", "Braço", "Full Body", "Cardio"];
const GYM_OBJECTIVES = ["Hipertrofia", "Emagrecimento", "Condicionamento", "Saúde geral"];
const GYM_FREQUENCY = ["3x semana", "4x semana", "5x semana"];

const BOOK_GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
];

export default function RoutineHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [routineConfig, setRoutineConfig] = useState<any>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [tab, setTab] = useState<"hoje" | "historico">("hoje");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activityReport, setActivityReport] = useState("");
  const [activityRating, setActivityRating] = useState(0);
  const [activityDone, setActivityDone] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionSent, setReflectionSent] = useState(false);
  const [userName, setUserName] = useState("");
  // Gym pre-form
  const [showGymForm, setShowGymForm] = useState(false);
  const [gymForm, setGymForm] = useState({ peso: "", altura: "", objetivo: "", nivel: "", disponibilidade: "", foco: "" });
  // Breathing animation
  const [breathPhase, setBreathPhase] = useState<"inspire" | "hold" | "expire">("inspire");
  const [breathTimer, setBreathTimer] = useState(0);
  const [breathActive, setBreathActive] = useState(false);
  // Meditation audio
  const [meditationAudioLoading, setMeditationAudioLoading] = useState(false);
  const [meditationAudioUrl, setMeditationAudioUrl] = useState<string | null>(null);
  const [meditationPlaying, setMeditationPlaying] = useState(false);
  const [meditationAudioRef] = useState<{ current: HTMLAudioElement | null }>({ current: null });
  const [meditationProgress, setMeditationProgress] = useState(0);
  const [meditationDuration, setMeditationDuration] = useState(0);
  const [meditationSpeed, setMeditationSpeed] = useState(1);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 6 && h < 11) return "Bom dia! Como vai começar bem hoje?";
    if (h >= 11 && h < 18) return "Boa tarde! Que tal um momento para você?";
    return "Boa noite! Hora de cuidar de você.";
  }, []);

  const isEvening = new Date().getHours() >= 19;

  useEffect(() => { if (user) loadData(); }, [user]);
  useEffect(() => { if (!timerRunning) return; const i = setInterval(() => setTimerSeconds(s => s + 1), 1000); return () => clearInterval(i); }, [timerRunning]);

  // Breathing cycle
  useEffect(() => {
    if (!breathActive) return;
    const cycle = () => {
      setBreathPhase("inspire"); setBreathTimer(4);
      const i1 = setTimeout(() => { setBreathPhase("hold"); setBreathTimer(4); }, 4000);
      const i2 = setTimeout(() => { setBreathPhase("expire"); setBreathTimer(4); }, 8000);
      return [i1, i2];
    };
    const ids = cycle();
    const interval = setInterval(() => { cycle(); }, 12000);
    return () => { ids.forEach(clearTimeout); clearInterval(interval); };
  }, [breathActive]);

  useEffect(() => {
    if (!breathActive) return;
    if (breathTimer <= 0) return;
    const t = setTimeout(() => setBreathTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [breathTimer, breathActive]);

  async function loadData() {
    setLoading(true);
    const [{ data: profile }, { data: routine }, { data: acts }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user!.id).maybeSingle(),
      supabase.from("user_routine").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("routine_activities").select("*").eq("user_id", user!.id).order("completed_at", { ascending: false }).limit(20),
    ]);
    if (profile?.full_name) setUserName(profile.full_name.split(" ")[0]);
    if (routine) {
      setRoutineConfig(routine);
      const cats = Array.isArray(routine.categories) ? routine.categories as string[] : [];
      setActiveCategories(cats);
      setPreferences((routine.preferences as Record<string, any>) || {});
      // Auto-fetch suggestion if has categories
      if (cats.length > 0) fetchSuggestionAuto(cats, (routine.preferences as Record<string, any>) || {}, profile?.full_name?.split(" ")[0] || "");
    }
    if (acts) setActivities(acts);
    setLoading(false);
  }

  async function fetchSuggestionAuto(cats: string[], prefs: Record<string, any>, name: string) {
    setAiLoading(true);
    try {
      const { data } = await supabase.functions.invoke("routine-ai", {
        body: { type: "suggestion", preferences: { ...prefs, activeCategories: cats }, userName: name }
      });
      if (data?.message) setAiSuggestion(data.message);
    } catch {}
    setAiLoading(false);
  }

  async function fetchSuggestion() {
    setAiLoading(true);
    try {
      const { data } = await supabase.functions.invoke("routine-ai", {
        body: { type: "suggestion", preferences: { ...preferences, activeCategories }, userName }
      });
      if (data?.message) setAiSuggestion(data.message);
    } catch {}
    setAiLoading(false);
  }

  async function saveRoutineConfig(cats: string[], prefs: Record<string, any>) {
    if (!user) return;
    if (routineConfig) { await supabase.from("user_routine").update({ categories: cats as any, preferences: prefs as any }).eq("id", routineConfig.id); }
    else { await supabase.from("user_routine").insert({ user_id: user.id, categories: cats as any, preferences: prefs as any } as any); }
    setActiveCategories(cats); setPreferences(prefs); setShowSetup(false);
    toast({ title: "Rotina salva!" }); loadData();
  }

  async function startActivity(categoryId: string) {
    // If gym, show pre-form first
    if (categoryId === "academia") {
      setShowGymForm(true);
      return;
    }
    doStartActivity(categoryId);
  }

  async function doStartActivity(categoryId: string, extraPrefs?: any) {
    setActiveActivity(categoryId); setActivityLoading(true); setActivityDone(false); setActivityReport(""); setActivityRating(0); setTimerSeconds(0); setBreathActive(false);
    const catPrefs = { ...(preferences[categoryId] || {}), ...(extraPrefs || {}) };
    let aiType = "suggestion";
    if (categoryId === "esporte") aiType = "sport";
    else if (categoryId === "academia") aiType = "workout";
    else if (categoryId === "leitura") aiType = "reading";
    else if (categoryId === "espiritualidade") aiType = "spirituality";
    else if (categoryId === "social") aiType = "social";
    try {
      const { data } = await supabase.functions.invoke("routine-ai", {
        body: { type: aiType, category: categoryId, preferences: catPrefs, userName }
      });
      if (data?.message) {
        try { setActivityData(JSON.parse(data.message)); } catch { setActivityData({ text: data.message }); }
      }
    } catch { setActivityData({ text: "Prepare-se para sua atividade!" }); }
    setActivityLoading(false);
  }

  async function finishActivity() {
    if (!user || !activeActivity) return;
    await supabase.from("routine_activities").insert({
      user_id: user.id, category: activeActivity, activity_data: activityData as any,
      duration_minutes: Math.ceil(timerSeconds / 60), rating: activityRating || null
    } as any);
    if (activityReport.trim()) {
      try {
        const { data } = await supabase.functions.invoke("routine-ai", {
          body: { type: "feedback", category: activeActivity, preferences: { rating: activityRating, report: activityReport }, userName }
        });
        if (data?.message) toast({ title: "Ana disse:", description: data.message.slice(0, 200) });
      } catch {}
    }
    setActivityDone(true); setTimerRunning(false); setBreathActive(false);
    toast({ title: "Atividade concluída! 🎉" }); loadData();
  }

  async function sendReflection() {
    if (!user || !reflectionText.trim()) return;
    setReflectionLoading(true);
    try {
      const { data } = await supabase.functions.invoke("routine-ai", { body: { type: "reflection", reflectionContent: reflectionText, userName } });
      const r = data?.message || "";
      setReflectionResponse(r);
      await supabase.from("daily_reflections").insert({ user_id: user.id, content: reflectionText, ai_response: r } as any);
      setReflectionSent(true);
    } catch { toast({ variant: "destructive", title: "Erro" }); }
    setReflectionLoading(false);
  }

  async function generateMeditationAudio() {
    if (!activityData?.steps) return;
    setMeditationAudioLoading(true);
    try {
      const meditationText = [
        activityData.title || "Meditação guiada",
        ...activityData.steps,
        activityData.closingMessage || "",
      ].filter(Boolean).join(". ");

      const { data, error } = await supabase.functions.invoke("generate-meditation-audio", {
        body: { text: meditationText },
      });
      if (error) throw error;
      if (data?.audioBase64) {
        const url = `data:audio/mpeg;base64,${data.audioBase64}`;
        setMeditationAudioUrl(url);
        const audio = new Audio(url);
        meditationAudioRef.current = audio;
        audio.addEventListener("loadedmetadata", () => setMeditationDuration(audio.duration));
        audio.addEventListener("timeupdate", () => setMeditationProgress(audio.currentTime));
        audio.addEventListener("ended", () => { setMeditationPlaying(false); setMeditationProgress(0); });
      } else if (data?.audioUrl) {
        setMeditationAudioUrl(data.audioUrl);
        const audio = new Audio(data.audioUrl);
        meditationAudioRef.current = audio;
        audio.addEventListener("loadedmetadata", () => setMeditationDuration(audio.duration));
        audio.addEventListener("timeupdate", () => setMeditationProgress(audio.currentTime));
        audio.addEventListener("ended", () => { setMeditationPlaying(false); setMeditationProgress(0); });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao gerar áudio", description: e?.message || "Tente novamente" });
    }
    setMeditationAudioLoading(false);
  }

  function toggleMeditationPlay() {
    const audio = meditationAudioRef.current;
    if (!audio) return;
    if (meditationPlaying) { audio.pause(); } else { audio.play(); }
    setMeditationPlaying(!meditationPlaying);
  }

  function seekMeditation(delta: number) {
    const audio = meditationAudioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }

  function changeMeditationSpeed() {
    const speeds = [0.75, 1, 1.25];
    const next = speeds[(speeds.indexOf(meditationSpeed) + 1) % speeds.length];
    setMeditationSpeed(next);
    if (meditationAudioRef.current) meditationAudioRef.current.playbackRate = next;
  }

  const fmtAudioTime = (s: number) => {
    if (!s || isNaN(s)) return "00:00";
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const todayCount = activities.filter(a => new Date(a.completed_at).toDateString() === new Date().toDateString()).length;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  /* ── Gym pre-form ── */
  if (showGymForm) {
    return (
      <div className="min-h-screen bg-background safe-top pb-8">
        <div style={{ background: "#DC2626" }} className="px-5 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowGymForm(false)}><ChevronLeft className="h-5 w-5" /></Button>
            <div><p className="text-white font-bold">🏋️ Montar Treino</p><p className="text-white/70 text-xs">Preencha para a IA gerar seu treino</p></div>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Peso (kg)</label><Input type="number" placeholder="75" value={gymForm.peso} onChange={e => setGymForm(p => ({ ...p, peso: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Altura (cm)</label><Input type="number" placeholder="175" value={gymForm.altura} onChange={e => setGymForm(p => ({ ...p, altura: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Objetivo</label>
            <div className="flex flex-wrap gap-1.5 mt-1">{GYM_OBJECTIVES.map(o => <button key={o} onClick={() => setGymForm(p => ({ ...p, objetivo: o }))} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all" style={gymForm.objetivo === o ? { background: "#DC2626", color: "#fff", borderColor: "#DC2626" } : { borderColor: "#E5E7EB" }}>{o}</button>)}</div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Nível</label>
            <div className="flex flex-wrap gap-1.5 mt-1">{GYM_LEVELS.map(l => <button key={l} onClick={() => setGymForm(p => ({ ...p, nivel: l }))} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all" style={gymForm.nivel === l ? { background: "#DC2626", color: "#fff", borderColor: "#DC2626" } : { borderColor: "#E5E7EB" }}>{l}</button>)}</div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Disponibilidade</label>
            <div className="flex flex-wrap gap-1.5 mt-1">{GYM_FREQUENCY.map(f => <button key={f} onClick={() => setGymForm(p => ({ ...p, disponibilidade: f }))} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all" style={gymForm.disponibilidade === f ? { background: "#DC2626", color: "#fff", borderColor: "#DC2626" } : { borderColor: "#E5E7EB" }}>{f}</button>)}</div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Foco do dia</label>
            <div className="flex flex-wrap gap-1.5 mt-1">{GYM_FOCUS.map(f => <button key={f} onClick={() => setGymForm(p => ({ ...p, foco: f }))} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all" style={gymForm.foco === f ? { background: "#DC2626", color: "#fff", borderColor: "#DC2626" } : { borderColor: "#E5E7EB" }}>{f}</button>)}</div>
          </div>
          <Button className="w-full text-white" style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)" }}
            disabled={!gymForm.objetivo || !gymForm.nivel || !gymForm.foco}
            onClick={() => { setShowGymForm(false); doStartActivity("academia", { ...preferences.academia, ...gymForm }); }}>
            Gerar treino com IA 💪
          </Button>
        </div>
      </div>
    );
  }

  /* ── Active activity ── */
  if (activeActivity && !activityDone) {
    const cat = CATEGORIES.find(c => c.id === activeActivity)!;
    if (offlineMode) return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <Smartphone className="h-16 w-16 text-white/60 mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">📵 Hora de largar o celular!</h2>
        <p className="text-white/70 text-center mb-8">Foque na sua atividade. Volte quando terminar.</p>
        <div className="text-5xl font-mono text-white mb-8">{fmt(timerSeconds)}</div>
        <Button variant="outline" className="text-white border-white/30" onClick={() => { setOfflineMode(false); setTimerRunning(false); }}>Voltei! ✋</Button>
      </div>
    );

    return (
      <div className="min-h-screen bg-background safe-top pb-8">
        <div style={{ background: cat.color }} className="px-5 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setActiveActivity(null)}><ChevronLeft className="h-5 w-5" /></Button>
            <div className="flex-1">
              <p className="text-white/70 text-sm">{cat.emoji} {cat.label}</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono text-white">{fmt(timerSeconds)}</span>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => setTimerRunning(!timerRunning)}>{timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 py-5 space-y-4 overflow-y-auto">
          {activityLoading ? (
            <div className="flex flex-col items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mb-3" /><p className="text-sm text-muted-foreground">Ana está preparando sua atividade...</p></div>
          ) : (
            <>
              {/* Generic text */}
              {activityData?.text && <Card><CardContent className="pt-5 whitespace-pre-wrap text-sm leading-relaxed">{activityData.text}</CardContent></Card>}

              {/* Workout / Sport structured */}
              {activityData?.warmup && (<>
                {activityData.trainingName && <h2 className="font-bold text-base">{activityData.trainingName}</h2>}
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">🔥 Aquecimento</h3>
                {activityData.warmup.map((ex: any, i: number) => <Card key={i}><CardContent className="py-3 px-4"><p className="font-semibold text-sm">{ex.name}</p><p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p>{ex.sets && <p className="text-xs text-muted-foreground">{ex.sets}x{ex.reps}</p>}{ex.tip && <p className="text-xs mt-1" style={{ color: "#059669" }}>💡 {ex.tip}</p>}</CardContent></Card>)}
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mt-4">💪 Treino Principal</h3>
                {activityData.main?.map((ex: any, i: number) => <Card key={i}><CardContent className="py-3 px-4"><div className="flex justify-between items-start"><div><p className="font-semibold text-sm">{ex.name}</p>{ex.muscle && <p className="text-[10px] text-muted-foreground">{ex.muscle}</p>}</div><span className="text-xs text-muted-foreground shrink-0">{ex.sets}x{ex.reps}</span></div><p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p>{ex.suggestedLoad && <p className="text-xs font-medium mt-1">💪 Carga: {ex.suggestedLoad}</p>}{ex.rest && <p className="text-xs text-muted-foreground">⏱ {ex.rest}</p>}{ex.tip && <p className="text-xs mt-1" style={{ color: "#059669" }}>💡 {ex.tip}</p>}</CardContent></Card>)}
                {activityData.finisher && (<><h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mt-4">🔥 Finalizador</h3>{activityData.finisher.map((ex: any, i: number) => <Card key={i}><CardContent className="py-3 px-4"><p className="font-semibold text-sm">{ex.name}</p><p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p></CardContent></Card>)}</>)}
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mt-4">🧘 Alongamento</h3>
                {activityData.cooldown?.map((ex: any, i: number) => <Card key={i}><CardContent className="py-3 px-4"><p className="font-semibold text-sm">{ex.name}</p><p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p>{ex.duration && <p className="text-xs text-muted-foreground">⏱ {ex.duration}</p>}</CardContent></Card>)}
                {activityData.nutritionTip && <Card style={{ background: "#FEF3C7" }}><CardContent className="pt-4"><p className="text-xs font-bold" style={{ color: "#92400E" }}>🍽️ Dica nutricional pós-treino</p><p className="text-sm mt-1" style={{ color: "#78350F" }}>{activityData.nutritionTip}</p></CardContent></Card>}
              </>)}

              {/* Reading — books */}
              {activityData?.books && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">📚 Livros recomendados para você</h3>
                  {activityData.books.map((book: any, i: number) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="h-24 flex items-end p-3" style={{ background: BOOK_GRADIENTS[i % BOOK_GRADIENTS.length] }}>
                        <div><p className="text-white font-bold text-sm drop-shadow">{book.title}</p><p className="text-white/80 text-xs">{book.author}</p></div>
                      </div>
                      <CardContent className="pt-3 space-y-2">
                        <p className="text-sm">{book.summary}</p>
                        <p className="text-xs italic text-muted-foreground">{book.recoveryBenefit}</p>
                        {book.freeLink && <a href={book.freeLink} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#7C3AED" }}>📖 Ler gratuitamente</a>}
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setTimerRunning(true)}><BookOpen className="h-3.5 w-3.5 mr-1" /> Quero ler este</Button>
                      </CardContent>
                    </Card>
                  ))}
                  {activityData.dailyTip && <Card style={{ background: "#FEF3C7" }}><CardContent className="pt-4"><p className="text-xs font-bold" style={{ color: "#92400E" }}>💡 Dica do dia</p><p className="text-sm mt-1" style={{ color: "#78350F" }}>{activityData.dailyTip}</p></CardContent></Card>}
                </div>
              )}
              {/* Legacy single book */}
              {activityData?.book && !activityData?.books && <Card><CardContent className="pt-5 space-y-3"><h3 className="font-bold">📖 {activityData.book.title}</h3><p className="text-sm text-muted-foreground">{activityData.book.author}</p><p className="text-sm">{activityData.book.reason}</p></CardContent></Card>}

              {/* Spirituality steps */}
              {activityData?.steps && (
                <Card><CardContent className="pt-5 space-y-3">
                  <h3 className="font-bold">{activityData.title || "Sua prática"}</h3>
                  {activityData.steps.map((step: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#FDE68A", color: "#92400E" }}>{i + 1}</span>
                      <p className="text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                  {activityData.closingMessage && <p className="text-sm italic text-muted-foreground pt-2">{activityData.closingMessage}</p>}
                  {activityData.verse && <div className="p-3 rounded-xl" style={{ background: "#FEF3C7" }}><p className="text-sm italic" style={{ color: "#78350F" }}>"{activityData.verse}"</p></div>}
                </CardContent></Card>
              )}

              {/* Breathing exercise for spirituality/meditation */}
              {activeActivity === "espiritualidade" && (preferences.espiritualidade?.practice === "Meditação" || !preferences.espiritualidade?.practice) && (
                <Card className="border-2" style={{ borderColor: "#D97706" }}><CardContent className="pt-5 space-y-4 text-center">
                  <h3 className="font-bold text-sm">🫁 Exercício de Respiração</h3>
                  {!breathActive ? (
                    <Button size="sm" variant="outline" onClick={() => setBreathActive(true)}><Timer className="h-4 w-4 mr-1" /> Iniciar respiração guiada</Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-1000"
                        style={{
                          background: breathPhase === "inspire" ? "#059669" : breathPhase === "hold" ? "#D97706" : "#2563EB",
                          transform: breathPhase === "inspire" ? "scale(1.3)" : breathPhase === "expire" ? "scale(0.8)" : "scale(1)",
                        }}>
                        <span className="text-white font-bold text-lg">{breathTimer}s</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: breathPhase === "inspire" ? "#059669" : breathPhase === "hold" ? "#D97706" : "#2563EB" }}>
                        {breathPhase === "inspire" ? "Inspire..." : breathPhase === "hold" ? "Segure..." : "Expire..."}
                      </p>
                      <p className="text-xs text-muted-foreground">4s inspire · 4s segure · 4s expire</p>
                      <Button size="sm" variant="ghost" onClick={() => setBreathActive(false)}>Parar</Button>
                    </div>
                  )}
                </CardContent></Card>
              )}

              {/* Social suggestion */}
              {activityData?.suggestion && (
                <Card><CardContent className="pt-5 space-y-3">
                  <p className="text-3xl text-center">{activityData.emoji || "👥"}</p>
                  <p className="text-sm text-center leading-relaxed">{activityData.suggestion}</p>
                  {activityData.whyItHelps && <div className="p-3 rounded-xl" style={{ background: "#EFF6FF" }}><p className="text-xs font-medium" style={{ color: "#1E40AF" }}>💙 Por que faz bem</p><p className="text-sm mt-1" style={{ color: "#1E3A5F" }}>{activityData.whyItHelps}</p></div>}
                </CardContent></Card>
              )}

              <Button variant="outline" className="w-full" onClick={() => { setOfflineMode(true); setTimerRunning(true); }}>
                <Smartphone className="h-4 w-4 mr-2" /> Iniciar atividade offline
              </Button>

              <Card className="border-2" style={{ borderColor: "#2D6A4F" }}><CardContent className="pt-5 space-y-4">
                <h3 className="font-bold text-center">Como foi? 💪</h3>
                <div className="flex justify-center gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setActivityRating(s)} className="p-1"><Star className={`h-7 w-7 ${activityRating >= s ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} /></button>)}</div>
                <Textarea value={activityReport} onChange={e => setActivityReport(e.target.value)} placeholder="Conte como foi..." rows={3} className="resize-none" />
                <Button className="w-full text-white" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} onClick={finishActivity}>Concluir atividade ✅</Button>
              </CardContent></Card>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="px-5 pt-6 pb-4" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate("/app")}><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowSetup(true)}><Pencil className="h-4 w-4" /></Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Minha Rotina</h1>
          <p className="text-sm text-white/70 mt-1">{greeting}</p>
          {todayCount > 0 && <div className="mt-2 flex items-center gap-2"><CheckCircle className="h-4 w-4" style={{ color: "#E8D590" }} /><span className="text-sm" style={{ color: "#E8D590" }}>{todayCount} atividade{todayCount > 1 ? "s" : ""} hoje</span></div>}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-3 flex gap-2">
        {(["hoje", "historico"] as const).map(t => (
          <button key={t} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === t ? { background: "#1B4332", color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}
            onClick={() => setTab(t)}>{t === "hoje" ? "Hoje" : "Histórico"}</button>
        ))}
      </div>

      <main className="max-w-lg mx-auto px-5 pt-3 space-y-3">
        {tab === "hoje" ? (<>
          {activeCategories.length === 0 && (
            <Card className="border-dashed border-2"><CardContent className="py-8 text-center space-y-3">
              <p className="text-3xl">🎯</p><h3 className="font-bold">Configure sua rotina</h3>
              <p className="text-sm text-muted-foreground">Escolha pelo menos 2 categorias</p>
              <Button style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} className="text-white" onClick={() => setShowSetup(true)}>Personalizar minha rotina</Button>
            </CardContent></Card>
          )}
          {activeCategories.length > 0 && (
            <Card className="border-none shadow-lg overflow-hidden" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}><span className="text-sm">🌱</span></div>
                  <p className="text-white font-semibold text-sm">Ana sugere para você agora:</p>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin text-white/70" /><span className="text-white/60 text-sm">Carregando sugestão...</span></div>
                ) : aiSuggestion ? (
                  <p className="text-white/90 text-sm leading-relaxed">{aiSuggestion}</p>
                ) : (
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white" onClick={fetchSuggestion}>Ver sugestão da Ana →</Button>
                )}
              </CardContent>
            </Card>
          )}
          {activeCategories.map(catId => {
            const cat = CATEGORIES.find(c => c.id === catId); if (!cat) return null;
            const catPrefs = preferences[catId] || {};
            const todayDone = activities.some(a => a.category === catId && new Date(a.completed_at).toDateString() === new Date().toDateString());
            return (
              <Card key={catId}><CardContent className="p-0"><div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${cat.color}15` }}><span className="text-2xl">{cat.emoji}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-bold text-sm">{cat.label}</p>{todayDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#065F46" }}>✅ Feito</span>}</div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {catId === "esporte" && (catPrefs.type || "Configurar")}
                    {catId === "leitura" && `${catPrefs.theme || "Autoajuda"} · ${catPrefs.duration || 30} min`}
                    {catId === "espiritualidade" && (catPrefs.practice || "Meditação")}
                    {catId === "social" && (catPrefs.with || "Família")}
                    {catId === "academia" && `${catPrefs.level || "Iniciante"} · ${catPrefs.focus || "Full Body"}`}
                  </p>
                </div>
                <Button size="sm" className="shrink-0 text-white" style={{ background: cat.color }} onClick={() => startActivity(catId)}><Play className="h-3.5 w-3.5 mr-1" /> Iniciar</Button>
              </div></CardContent></Card>
            );
          })}
          {isEvening && activeCategories.length > 0 && (
            <Card className="border-none shadow-lg" style={{ background: "#FAF8F3" }}><CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2"><span className="text-xl">🌙</span><h3 className="font-bold text-sm">Reflexão do dia</h3></div>
              {!reflectionSent ? (<>
                <p className="text-sm text-muted-foreground">Como foi seu dia hoje?</p>
                <Textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)} placeholder="Escreva sua reflexão..." rows={3} className="resize-none" />
                <Button className="w-full text-white" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} disabled={!reflectionText.trim() || reflectionLoading} onClick={sendReflection}>
                  {reflectionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Enviar reflexão
                </Button>
              </>) : (
                <div className="space-y-2">
                  <p className="text-sm italic text-muted-foreground">"{reflectionText}"</p>
                  <div className="border-l-4 pl-3 py-2" style={{ borderColor: "#2D6A4F" }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{reflectionResponse}</p>
                    <p className="text-xs text-muted-foreground mt-2">— Ana 🌱</p>
                  </div>
                </div>
              )}
            </CardContent></Card>
          )}
        </>) : (
          <div className="space-y-4">
            <Card><CardContent className="py-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}><span className="text-xl">🔥</span></div>
              <div><p className="font-bold text-lg">{activities.length} atividades</p><p className="text-xs text-muted-foreground">Total registrado</p></div>
            </CardContent></Card>
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Últimas atividades</h3>
            {activities.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada.</p> : activities.slice(0, 10).map(a => {
              const cat = CATEGORIES.find(c => c.id === a.category);
              return <Card key={a.id}><CardContent className="py-3 px-4 flex items-center gap-3">
                <span className="text-xl">{cat?.emoji || "📋"}</span>
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{cat?.label || a.category}</p><p className="text-xs text-muted-foreground">{new Date(a.completed_at).toLocaleDateString("pt-BR")} · {a.duration_minutes} min</p></div>
                {a.rating && <div className="flex items-center gap-0.5"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /><span className="text-xs font-bold">{a.rating}</span></div>}
              </CardContent></Card>;
            })}
          </div>
        )}
      </main>

      <RoutineSetupSheet open={showSetup} onOpenChange={setShowSetup} activeCategories={activeCategories} preferences={preferences} onSave={saveRoutineConfig} />
      <BottomNavigation /><PortoSeguroButton /><AIChatPanel />
    </div>
  );
}

function RoutineSetupSheet({ open, onOpenChange, activeCategories, preferences, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; activeCategories: string[]; preferences: Record<string, any>; onSave: (c: string[], p: Record<string, any>) => void; }) {
  const [cats, setCats] = useState<string[]>(activeCategories);
  const [prefs, setPrefs] = useState<Record<string, any>>(preferences);
  useEffect(() => { setCats(activeCategories); setPrefs(preferences); }, [activeCategories, preferences, open]);
  const toggle = (id: string) => setCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const upd = (cId: string, k: string, v: any) => setPrefs(p => ({ ...p, [cId]: { ...(p[cId] || {}), [k]: v } }));
  const Chips = ({ opts, sel, onSel, col }: { opts: string[]; sel: string; onSel: (v: string) => void; col: string }) => (
    <div className="flex flex-wrap gap-1.5">{opts.map(t => <button key={t} onClick={() => onSel(t)} className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all" style={sel === t ? { background: col, color: "#fff", borderColor: col } : { borderColor: "#E5E7EB" }}>{t}</button>)}</div>
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <div className="max-h-[85vh] overflow-y-auto px-6 pb-6">
          <SheetHeader className="sticky top-0 bg-background pt-6 pb-3 z-10"><SheetTitle>Personalizar minha rotina</SheetTitle></SheetHeader>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Selecione pelo menos 2 categorias:</p>
            {CATEGORIES.map(cat => {
              const a = cats.includes(cat.id);
              return (<div key={cat.id} className="space-y-2">
                <button onClick={() => toggle(cat.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all" style={{ borderColor: a ? cat.color : "#E5E7EB", background: a ? `${cat.color}08` : "transparent" }}>
                  <span className="text-2xl">{cat.emoji}</span><span className="font-semibold text-sm flex-1 text-left">{cat.label}</span>{a && <CheckCircle className="h-5 w-5" style={{ color: cat.color }} />}
                </button>
                {a && <div className="ml-4 pl-4 border-l-2 space-y-2" style={{ borderColor: `${cat.color}30` }}>
                  {cat.id === "esporte" && <><label className="text-xs font-medium text-muted-foreground">Modalidade</label><Chips opts={SPORT_TYPES} sel={prefs.esporte?.type || ""} onSel={v => upd("esporte", "type", v)} col={cat.color} /></>}
                  {cat.id === "leitura" && <><label className="text-xs font-medium text-muted-foreground">Tema</label><Chips opts={READING_THEMES} sel={prefs.leitura?.theme || ""} onSel={v => upd("leitura", "theme", v)} col={cat.color} /><label className="text-xs font-medium text-muted-foreground">Tempo</label><Chips opts={["15 min","30 min","45 min","60 min"]} sel={`${prefs.leitura?.duration || 30} min`} onSel={v => upd("leitura", "duration", parseInt(v))} col={cat.color} /></>}
                  {cat.id === "espiritualidade" && <><label className="text-xs font-medium text-muted-foreground">Prática</label><Chips opts={SPIRITUAL_PRACTICES} sel={prefs.espiritualidade?.practice || ""} onSel={v => upd("espiritualidade", "practice", v)} col={cat.color} /><label className="text-xs font-medium text-muted-foreground">Duração</label><Chips opts={["5 min","10 min","15 min","20 min"]} sel={`${prefs.espiritualidade?.duration || 10} min`} onSel={v => upd("espiritualidade", "duration", parseInt(v))} col={cat.color} /></>}
                  {cat.id === "social" && <><label className="text-xs font-medium text-muted-foreground">Com quem</label><Chips opts={SOCIAL_TYPES} sel={prefs.social?.with || ""} onSel={v => upd("social", "with", v)} col={cat.color} /></>}
                  {cat.id === "academia" && <><label className="text-xs font-medium text-muted-foreground">Nível</label><Chips opts={GYM_LEVELS} sel={prefs.academia?.level || ""} onSel={v => upd("academia", "level", v)} col={cat.color} /><label className="text-xs font-medium text-muted-foreground">Foco padrão</label><Chips opts={GYM_FOCUS} sel={prefs.academia?.focus || ""} onSel={v => upd("academia", "focus", v)} col={cat.color} /></>}
                  <label className="text-xs font-medium text-muted-foreground">Horário preferido</label>
                  <Chips opts={["Manhã","Tarde","Noite"]} sel={prefs[cat.id]?.timePreference || ""} onSel={v => upd(cat.id, "timePreference", v)} col={cat.color} />
                </div>}
              </div>);
            })}
            <Button className="w-full text-white" disabled={cats.length < 2} style={cats.length >= 2 ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}} onClick={() => onSave(cats, prefs)}>
              {cats.length < 2 ? `Selecione mais ${2 - cats.length}` : "Salvar rotina"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
