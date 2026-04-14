import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft, ChevronRight, Settings2, Loader2, Play, Pause,
  CheckCircle, Send, Timer, Pencil,
  Activity, BookOpen, Leaf, Users, Dumbbell, X,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

/* ─── Types & constants ─── */
interface CategoryConfig { id: string; label: string; icon: React.ReactNode; color: string; }
const CAT_ICON_SIZE = "h-5 w-5";
const CATEGORIES: CategoryConfig[] = [
  { id: "esporte", label: "Esporte", icon: <Activity className={CAT_ICON_SIZE} />, color: "#059669" },
  { id: "academia", label: "Academia", icon: <Dumbbell className={CAT_ICON_SIZE} />, color: "#DC2626" },
  { id: "leitura", label: "Leitura", icon: <BookOpen className={CAT_ICON_SIZE} />, color: "#7C3AED" },
  { id: "espiritualidade", label: "Espiritualidade", icon: <Leaf className={CAT_ICON_SIZE} />, color: "#D97706" },
  { id: "social", label: "Interação Social", icon: <Users className={CAT_ICON_SIZE} />, color: "#2563EB" },
];

type StepOption = { label: string; value: string };
type FlowStep = { question: string; options: StepOption[]; key: string };

const NON_AI_SPORTS = ["Futebol", "Beach Tennis", "Vôlei", "Futebol Society"];
const NON_AI_SPORT_MESSAGES: Record<string, string> = {
  "Futebol": "Para jogar futebol, busque quadras para alugar na sua cidade. Recomendamos verificar apps como GetNinjas, ou pesquisar 'aluguel de quadra' no Google.",
  "Beach Tennis": "Para jogar beach tennis, busque arenas e espaços na sua cidade. Pesquise 'beach tennis' para encontrar locais próximos.",
  "Vôlei": "Para jogar vôlei, busque quadras e grupos na sua cidade. Pesquise 'vôlei amador' para encontrar locais e grupos.",
  "Futebol Society": "Para jogar futebol society, busque quadras para alugar na sua cidade. Pesquise 'quadra society' no Google.",
};

const DAY_MAP: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const DAY_LABELS: Record<string, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };

function getFlowSteps(categoryId: string, answers: Record<string, string>): FlowStep[] {
  if (categoryId === "esporte") {
    const steps: FlowStep[] = [
      { question: "Qual modalidade?", key: "type", options: [
        { label: "Caminhada", value: "Caminhada" }, { label: "Corrida", value: "Corrida" },
        { label: "Natação", value: "Natação" }, { label: "Futebol", value: "Futebol" },
        { label: "Vôlei", value: "Vôlei" }, { label: "Beach Tennis", value: "Beach Tennis" },
        { label: "Futebol Society", value: "Futebol Society" },
      ]},
    ];
    if (answers.type && !NON_AI_SPORTS.includes(answers.type)) {
      steps.push(
        { question: "Qual seu nível atual?", key: "level", options: [
          { label: "Iniciante", value: "Iniciante" }, { label: "Intermediário", value: "Intermediário" }, { label: "Avançado", value: "Avançado" },
        ]},
        { question: "Quanto tempo você tem disponível?", key: "duration", options: [
          { label: "20 min", value: "20" }, { label: "30 min", value: "30" },
          { label: "45 min", value: "45" }, { label: "60 min", value: "60" }, { label: "90 min", value: "90" },
        ]},
      );
    }
    return steps;
  }
  if (categoryId === "leitura") {
    return [
      { question: "Quanto tempo você tem?", key: "duration", options: [
        { label: "15 min", value: "15" }, { label: "30 min", value: "30" },
        { label: "45 min", value: "45" }, { label: "60 min", value: "60" },
      ]},
      { question: "Qual tema te interessa agora?", key: "theme", options: [
        { label: "Autoconhecimento", value: "Autoconhecimento" }, { label: "Espiritualidade", value: "Espiritualidade" },
        { label: "Finanças", value: "Finanças" }, { label: "Motivação", value: "Motivação" }, { label: "Ficção leve", value: "Ficção" },
      ]},
    ];
  }
  if (categoryId === "espiritualidade") {
    return [
      { question: "O que você prefere hoje?", key: "practice", options: [
        { label: "Meditação", value: "Meditação" }, { label: "Oração", value: "Oração" }, { label: "Reflexão escrita", value: "Reflexão" },
      ]},
      { question: "Quanto tempo você tem?", key: "duration", options: [
        { label: "5 min", value: "5" }, { label: "10 min", value: "10" },
        { label: "15 min", value: "15" }, { label: "20 min", value: "20" }, { label: "30 min", value: "30" },
      ]},
    ];
  }
  if (categoryId === "social") {
    return [
      { question: "Com quem você quer se conectar?", key: "with", options: [
        { label: "Família", value: "Família" }, { label: "Amigos", value: "Amigos" },
        { label: "Grupo de apoio", value: "Grupo de apoio" }, { label: "Contato Âncora", value: "Contato Âncora" },
      ]},
    ];
  }
  return [];
}

function getAiType(categoryId: string): string {
  const map: Record<string, string> = { esporte: "sport", academia: "workout", leitura: "reading", espiritualidade: "spirituality", social: "social" };
  return map[categoryId] || "suggestion";
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function getTodayDayLetter(diasSemana: string[]): string | null {
  const todayIndex = new Date().getDay(); // 0=dom
  const todayDias = diasSemana.filter(d => DAY_MAP[d] !== undefined);
  const sorted = todayDias.sort((a, b) => DAY_MAP[a] - DAY_MAP[b]);
  const todayIdx = sorted.findIndex(d => DAY_MAP[d] === todayIndex);
  if (todayIdx === -1) return null;
  return String.fromCharCode(65 + todayIdx); // A, B, C...
}

/* ─── Fitness Profile types ─── */
interface FitnessProfile {
  id: string;
  user_id: string;
  modalidade: string;
  nivel: string;
  objetivo: string;
  dias_semana: string[];
  tempo_disponivel: number;
  equipamento: string;
  peso_kg: number | null;
  altura_cm: number | null;
  restricoes: string | null;
}

/* ─── Main component ─── */
export default function RoutineHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [routineConfig, setRoutineConfig] = useState<any>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [userName, setUserName] = useState("");

  // Fitness profile state
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(null);
  const [showFitnessSetup, setShowFitnessSetup] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);

  // UI state
  const [showSetup, setShowSetup] = useState(false);
  const [tab, setTab] = useState<"hoje" | "historico">("hoje");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Step flow state
  const [flowCategory, setFlowCategory] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState(0);
  const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({});
  const [flowSelected, setFlowSelected] = useState<string | null>(null);

  // Activity state
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTotal, setTimerTotal] = useState(0);
  const [currentPlanStep, setCurrentPlanStep] = useState(0);

  // Completion state
  const [activityDone, setActivityDone] = useState(false);
  const [activityRating, setActivityRating] = useState(0);
  const [activityReport, setActivityReport] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");

  // Reflection
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionSent, setReflectionSent] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const greetingSub = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Como vai começar bem hoje?";
    if (h < 18) return "Que tal um momento para você?";
    return "Hora de cuidar de você";
  }, []);

  const isEvening = new Date().getHours() >= 19;

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [{ data: profile }, { data: routine }, { data: acts }, { data: fp }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user!.id).maybeSingle(),
      supabase.from("user_routine").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("routine_activities").select("*").eq("user_id", user!.id).order("completed_at", { ascending: false }).limit(50),
      supabase.from("user_fitness_profile" as any).select("*").eq("user_id", user!.id).maybeSingle(),
    ]);
    if (profile?.full_name) setUserName(profile.full_name.split(" ")[0]);
    if (routine) {
      setRoutineConfig(routine);
      const cats = Array.isArray(routine.categories) ? routine.categories as string[] : [];
      setActiveCategories(cats);
      setPreferences((routine.preferences as Record<string, any>) || {});
      if (cats.length > 0) fetchSuggestionAuto(cats, (routine.preferences as Record<string, any>) || {}, profile?.full_name?.split(" ")[0] || "");
    }
    if (acts) setActivities(acts);
    if (fp) {
      const fpData = fp as any;
      setFitnessProfile({
        id: fpData.id,
        user_id: fpData.user_id,
        modalidade: fpData.modalidade,
        nivel: fpData.nivel,
        objetivo: fpData.objetivo,
        dias_semana: Array.isArray(fpData.dias_semana) ? fpData.dias_semana : [],
        tempo_disponivel: fpData.tempo_disponivel,
        equipamento: fpData.equipamento,
        peso_kg: fpData.peso_kg,
        altura_cm: fpData.altura_cm,
        restricoes: fpData.restricoes,
      });
      // Load today's workout
      await loadTodayWorkout(fpData as any);
    }
    setLoading(false);
  }

  async function loadTodayWorkout(fp: FitnessProfile) {
    const weekNum = getWeekNumber();
    const dayLetter = getTodayDayLetter(fp.dias_semana);
    if (!dayLetter) {
      setTodayWorkout(null);
      return;
    }

    // Check if plan exists for this week
    const { data: existingPlan } = await supabase
      .from("weekly_workout_plan" as any)
      .select("*")
      .eq("user_id", user!.id)
      .eq("modalidade", fp.modalidade)
      .eq("week_number", weekNum)
      .eq("day_letter", dayLetter)
      .maybeSingle();

    if (existingPlan) {
      setTodayWorkout(existingPlan);
    } else {
      // Generate new weekly plan
      await generateWeeklyPlan(fp, weekNum);
    }
  }

  async function generateWeeklyPlan(fp: FitnessProfile, weekNum: number) {
    setWorkoutLoading(true);
    try {
      const { data } = await supabase.functions.invoke("routine-ai", {
        body: {
          type: "weekly_plan",
          preferences: {
            ...fp,
            week_number: weekNum,
          },
          userName,
        },
      });

      if (data?.message) {
        let parsed: any;
        try { parsed = JSON.parse(data.message); } catch { setWorkoutLoading(false); return; }

        if (parsed.days && Array.isArray(parsed.days)) {
          // Save all days to Supabase
          for (const day of parsed.days) {
            await supabase.from("weekly_workout_plan" as any).upsert({
              user_id: user!.id,
              modalidade: fp.modalidade,
              week_number: weekNum,
              day_letter: day.day_letter,
              muscle_groups: day.muscle_groups || [],
              exercises: day.exercises || [],
            } as any, { onConflict: "user_id,modalidade,week_number,day_letter" });
          }

          // Set today's workout
          const dayLetter = getTodayDayLetter(fp.dias_semana);
          if (dayLetter) {
            const todayPlan = parsed.days.find((d: any) => d.day_letter === dayLetter);
            if (todayPlan) {
              // Refetch from DB to get the saved version
              const { data: saved } = await supabase
                .from("weekly_workout_plan" as any)
                .select("*")
                .eq("user_id", user!.id)
                .eq("modalidade", fp.modalidade)
                .eq("week_number", weekNum)
                .eq("day_letter", dayLetter)
                .maybeSingle();
              if (saved) setTodayWorkout(saved);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to generate weekly plan:", e);
      toast.error("Erro ao gerar plano semanal");
    }
    setWorkoutLoading(false);
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

  async function saveRoutineConfig(cats: string[], prefs: Record<string, any>) {
    if (!user) return;
    if (routineConfig) { await supabase.from("user_routine").update({ categories: cats as any, preferences: prefs as any }).eq("id", routineConfig.id); }
    else { await supabase.from("user_routine").insert({ user_id: user.id, categories: cats as any, preferences: prefs as any } as any); }
    setActiveCategories(cats); setPreferences(prefs); setShowSetup(false);
    toast.success("Rotina salva"); loadData();
  }

  async function saveFitnessProfile(fp: Omit<FitnessProfile, "id" | "user_id">) {
    if (!user) return;
    const payload = { ...fp, user_id: user.id } as any;
    if (fitnessProfile) {
      await supabase.from("user_fitness_profile" as any).update(payload).eq("id", fitnessProfile.id);
    } else {
      await supabase.from("user_fitness_profile" as any).insert(payload);
    }
    setShowFitnessSetup(false);
    toast.success("Perfil de treino salvo");
    loadData();
  }

  // Start step flow for category
  function startFlow(categoryId: string) {
    if (categoryId === "academia") {
      if (!fitnessProfile) {
        setShowFitnessSetup(true);
        return;
      }
      // Has profile — show today's workout directly
      if (todayWorkout) {
        startWorkoutFromPlan(todayWorkout);
        return;
      }
      // No workout for today (rest day)
      toast("Hoje é dia de descanso. Aproveite para recuperar!");
      return;
    }
    setFlowCategory(categoryId);
    setFlowStep(0);
    setFlowAnswers({});
    setFlowSelected(null);
  }

  function startWorkoutFromPlan(plan: any) {
    const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
    const muscleGroups = Array.isArray(plan.muscle_groups) ? plan.muscle_groups : [];
    setActivityData({
      _category: "academia",
      _answers: { duration: String(fitnessProfile?.tempo_disponivel || 45) },
      _fromPlan: true,
      trainingName: `${muscleGroups.join(" + ")}`,
      exercises,
      muscle_groups: muscleGroups,
    });
    setTimerTotal((fitnessProfile?.tempo_disponivel || 45) * 60);
    setTimerSeconds(0);
    setCurrentPlanStep(0);
    setActivityDone(false);
    setActivityReport("");
    setActivityRating(0);
    setAiFeedback("");
  }

  function handleFlowNext() {
    if (!flowCategory || flowSelected === null) return;
    const steps = getFlowSteps(flowCategory, flowAnswers);
    const currentStep = steps[flowStep];
    const newAnswers = { ...flowAnswers, [currentStep.key]: flowSelected };
    setFlowAnswers(newAnswers);
    setFlowSelected(null);

    if (flowCategory === "esporte" && currentStep.key === "type" && NON_AI_SPORTS.includes(flowSelected)) {
      setFlowCategory(null);
      const msg = NON_AI_SPORT_MESSAGES[flowSelected] || `Busque locais para jogar ${flowSelected} na sua cidade.`;
      const searchQuery = encodeURIComponent(`${flowSelected} sua cidade`);
      setActivityData({
        _category: "esporte", _answers: newAnswers, _nonAiSport: true, _sportName: flowSelected,
        _message: msg, _searchUrl: `https://www.google.com/search?q=${searchQuery}`,
      });
      return;
    }

    const updatedSteps = getFlowSteps(flowCategory, newAnswers);
    if (flowStep + 1 < updatedSteps.length) {
      setFlowStep(flowStep + 1);
    } else {
      generatePlan(flowCategory, newAnswers);
    }
  }

  async function generatePlan(categoryId: string, answers: Record<string, string>) {
    setFlowCategory(null);
    setActivityLoading(true);
    setActivityDone(false);
    setActivityReport("");
    setActivityRating(0);
    setTimerSeconds(0);
    setCurrentPlanStep(0);
    setAiFeedback("");

    const aiType = getAiType(categoryId);
    const prefs = { ...(preferences[categoryId] || {}), ...answers };
    if (answers.duration) prefs.duration = parseInt(answers.duration);

    try {
      const { data } = await supabase.functions.invoke("routine-ai", {
        body: { type: aiType, category: categoryId, preferences: prefs, userName }
      });
      if (data?.message) {
        try { setActivityData({ ...JSON.parse(data.message), _category: categoryId, _answers: answers }); }
        catch { setActivityData({ text: data.message, _category: categoryId, _answers: answers }); }
      }
    } catch {
      setActivityData({ text: "Prepare-se para sua atividade!", _category: categoryId, _answers: answers });
    }
    setActivityLoading(false);
    const dur = parseInt(answers.duration || "30");
    setTimerTotal(dur * 60);
  }

  async function finishActivity() {
    if (!user || !activityData) return;
    const categoryId = activityData._category || "esporte";
    await supabase.from("routine_activities").insert({
      user_id: user.id, category: categoryId, activity_data: activityData as any,
      duration_minutes: Math.ceil(timerSeconds / 60), rating: activityRating || null
    } as any);

    if (activityReport.trim() || activityRating) {
      try {
        const { data } = await supabase.functions.invoke("routine-ai", {
          body: { type: "feedback", category: categoryId, preferences: { rating: activityRating, report: activityReport }, userName }
        });
        if (data?.message) setAiFeedback(data.message);
      } catch {}
    }

    setActivityDone(true);
    setTimerRunning(false);
    toast.success("Atividade concluída");
    loadData();
  }

  function resetActivity() {
    setActivityData(null);
    setActivityDone(false);
    setTimerSeconds(0);
    setTimerRunning(false);
    setAiFeedback("");
    setActivityReport("");
    setActivityRating(0);
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
    } catch { toast.error("Erro ao enviar reflexão"); }
    setReflectionLoading(false);
  }

  const todayCount = activities.filter(a => new Date(a.completed_at).toDateString() === new Date().toDateString()).length;

  const weeklyData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      days[key] = 0;
    }
    activities.forEach(a => {
      const d = new Date(a.completed_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 7) {
        const key = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
        if (key in days) days[key]++;
      }
    });
    return Object.entries(days).map(([name, count]) => ({ name, count }));
  }, [activities]);

  // ─── Loading ───
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse"><Activity className="h-5 w-5 text-primary" /></div>
        <div className="h-2 w-24 bg-muted rounded-full animate-pulse" />
      </div>
    </div>
  );

  // ─── Fitness Profile Setup Modal ───
  if (showFitnessSetup) {
    return <FitnessProfileSetup
      existing={fitnessProfile}
      onSave={saveFitnessProfile}
      onClose={() => setShowFitnessSetup(false)}
    />;
  }

  // ─── Step Flow ───
  if (flowCategory) {
    const steps = getFlowSteps(flowCategory, flowAnswers);
    const current = steps[flowStep];
    const progress = ((flowStep + 1) / steps.length) * 100;

    return (
      <div className="min-h-screen bg-[#F8F6F2] safe-top flex flex-col animate-fade-in">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (flowStep > 0) { setFlowStep(flowStep - 1); setFlowSelected(null); } else setFlowCategory(null); }}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">{flowStep + 1} de {steps.length}</span>
            <button onClick={() => setFlowCategory(null)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <div className="flex-1 px-6 pt-8">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8" style={{ letterSpacing: "-0.5px" }}>
            {current.question}
          </h2>
          <div className={`grid gap-3 ${current.options.length <= 3 ? "grid-cols-1" : "grid-cols-2"}`}>
            {current.options.map(opt => (
              <button key={opt.value} onClick={() => setFlowSelected(opt.value)}
                className="p-4 rounded-2xl border-[1.5px] text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  borderColor: flowSelected === opt.value ? "#1B4332" : "#E5E7EB",
                  background: flowSelected === opt.value ? "hsl(153 40% 15% / 0.05)" : "#fff",
                }}>
                <span className="font-semibold text-sm" style={{ color: flowSelected === opt.value ? "#1B4332" : "#374151" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 pb-8 pt-4">
          <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white transition-all duration-200"
            style={{ background: flowSelected ? "linear-gradient(135deg, #1B4332, #2D6A4F)" : "#D1D5DB" }}
            disabled={!flowSelected} onClick={handleFlowNext}>
            {flowStep + 1 === steps.length ? "Gerar plano" : "Continuar"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Activity Loading ───
  if (activityLoading || workoutLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] safe-top flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">Criando seu plano personalizado...</p>
        <p className="text-sm text-muted-foreground">Ana está preparando tudo para você</p>
      </div>
    );
  }

  // ─── Completion screen ───
  if (activityDone) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] safe-top flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.5px" }}>Atividade concluída</h2>
        <p className="text-muted-foreground mb-6">{Math.ceil(timerSeconds / 60)} minutos realizados</p>

        {aiFeedback && (
          <Card className="w-full mb-6 border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>A</div>
                <span className="text-sm font-semibold">Feedback da Ana</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{aiFeedback}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 mb-8">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setActivityRating(s)}
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 active:scale-95"
              style={{
                borderColor: activityRating >= s ? "#1B4332" : "#D1D5DB",
                background: activityRating >= s ? "#1B4332" : "transparent",
                color: activityRating >= s ? "#fff" : "#9CA3AF",
              }}>
              {s}
            </button>
          ))}
        </div>

        <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} onClick={resetActivity}>
          Voltar à rotina
        </Button>
      </div>
    );
  }

  // ─── Active Plan / Timer ───
  if (activityData) {
    const cat = CATEGORIES.find(c => c.id === activityData._category) || CATEGORIES[0];

    // Non-AI sport card
    if (activityData._nonAiSport) {
      return (
        <div className="min-h-screen bg-[#F8F6F2] safe-top pb-8 animate-fade-in">
          <div className="px-5 pt-5 pb-4">
            <button onClick={resetActivity} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform mb-4">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <div className="mx-5 rounded-2xl p-5 mb-4" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Esporte</p>
            <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.5px" }}>{activityData._sportName}</h2>
          </div>
          <div className="px-5 space-y-4">
            <Card className="border-none shadow-sm"><CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>A</div>
                <span className="text-sm font-semibold">Dica da Ana</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{activityData._message}</p>
            </CardContent></Card>
            <a href={activityData._searchUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
                Pesquisar no Google
              </Button>
            </a>
            <Button variant="outline" className="w-full h-[52px] text-base font-bold rounded-2xl" onClick={resetActivity}>
              Voltar à rotina
            </Button>
          </div>
        </div>
      );
    }

    // Build plan steps
    const planSteps: any[] = [];
    // From weekly plan (exercises array directly)
    if (activityData._fromPlan && activityData.exercises) {
      activityData.exercises.forEach((ex: any) => planSteps.push({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        description: ex.notes || "",
        phase: "Treino",
      }));
    } else {
      if (activityData.warmup) activityData.warmup.forEach((ex: any) => planSteps.push({ ...ex, phase: "Aquecimento" }));
      if (activityData.main) activityData.main.forEach((ex: any) => planSteps.push({ ...ex, phase: "Treino" }));
      if (activityData.finisher) activityData.finisher.forEach((ex: any) => planSteps.push({ ...ex, phase: "Finalizador" }));
      if (activityData.cooldown) activityData.cooldown.forEach((ex: any) => planSteps.push({ ...ex, phase: "Alongamento" }));
      if (activityData.steps) activityData.steps.forEach((s: string, i: number) => planSteps.push({ name: `Passo ${i + 1}`, description: s, phase: "Prática" }));
      if (activityData.sections) activityData.sections.forEach((s: any) => planSteps.push({ name: s.name, description: s.instructions, phase: s.duration }));
    }

    const hasStructuredPlan = planSteps.length > 0;

    // Timer screen (fullscreen dark)
    if (timerRunning && hasStructuredPlan) {
      const step = planSteps[currentPlanStep] || planSteps[0];
      const nextStep = planSteps[currentPlanStep + 1];
      const totalSteps = planSteps.length;
      const stepProgress = ((currentPlanStep + 1) / totalSteps) * 100;
      const radius = 100;
      const circumference = 2 * Math.PI * radius;
      const dashOffset = circumference * (1 - Math.min(timerSeconds / (timerTotal || 1800), 1));

      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top" style={{ background: "linear-gradient(180deg, #1B4332, #0f2b20)" }}>
          <div className="w-full mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-xs font-medium">Etapa {currentPlanStep + 1} de {totalSteps}</span>
              <span className="text-white/60 text-xs font-medium">{Math.round(stepProgress)}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white/40 transition-all duration-500" style={{ width: `${stepProgress}%` }} />
            </div>
          </div>
          <div className="relative mb-6">
            <svg width="240" height="240" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle cx="120" cy="120" r={radius} fill="none" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                transform="rotate(-90 120 120)" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white font-mono tracking-wider">{fmt(timerSeconds)}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white text-center mb-1">{step?.name || "Em progresso"}</h3>
          {step?.sets && <p className="text-white/70 text-sm">{step.sets}x{step.reps} — {step.rest}</p>}
          {step?.description && <p className="text-white/60 text-sm text-center mb-6 max-w-xs">{typeof step.description === 'string' ? step.description.slice(0, 120) : ''}</p>}
          {nextStep && <p className="text-white/40 text-xs mb-8">Próxima: {nextStep.name}</p>}
          <div className="flex items-center gap-6">
            <button onClick={() => setTimerRunning(false)}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
              <Pause className="h-6 w-6 text-white" />
            </button>
            {currentPlanStep < planSteps.length - 1 ? (
              <button onClick={() => { setCurrentPlanStep(p => p + 1); if (navigator.vibrate) navigator.vibrate(100); }}
                className="px-6 h-12 rounded-full bg-white/10 flex items-center gap-2 active:scale-95 transition-transform">
                <span className="text-white text-sm font-medium">Próxima</span>
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            ) : (
              <button onClick={finishActivity}
                className="px-6 h-12 rounded-full flex items-center gap-2 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}>
                <span className="text-sm font-bold" style={{ color: "#1B4332" }}>Concluir</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    // Plan view (paused or not started)
    return (
      <div className="min-h-screen bg-[#F8F6F2] safe-top pb-8 animate-fade-in">
        <div className="px-5 pt-5 pb-4">
          <button onClick={resetActivity} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform mb-4">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="mx-5 rounded-2xl p-5 mb-4" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">{cat.label}</p>
          <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: "-0.5px" }}>
            {activityData.trainingName || activityData.title || "Seu plano personalizado"}
          </h2>
          {activityData._answers?.duration && <p className="text-white/60 text-sm">{activityData._answers.duration} minutos</p>}
          {activityData.muscle_groups && <p className="text-white/70 text-sm mt-1">{activityData.muscle_groups.join(" + ")}</p>}
          {timerSeconds > 0 && <p className="text-white/70 text-sm mt-2 font-mono">{fmt(timerSeconds)} decorridos</p>}
        </div>

        <div className="px-5 space-y-3">
          {activityData.text && !hasStructuredPlan && (
            <Card className="border-none shadow-sm"><CardContent className="p-5 whitespace-pre-wrap text-sm leading-relaxed">{activityData.text}</CardContent></Card>
          )}

          {hasStructuredPlan && planSteps.map((step, i) => {
            const isActive = i === currentPlanStep;
            const isDone = i < currentPlanStep;
            return (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                    style={{
                      background: isDone ? "#1B4332" : isActive ? "#1B4332" : "#E5E7EB",
                      color: isDone || isActive ? "#fff" : "#9CA3AF",
                    }}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < planSteps.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
                </div>
                <Card className={`flex-1 border-none shadow-sm transition-all ${isActive ? "ring-1 ring-primary/20" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm flex-1">{step.name}</p>
                      {step.sets && <span className="text-xs text-muted-foreground shrink-0 ml-2">{step.sets}x{step.reps}</span>}
                    </div>
                    {step.phase && <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{step.phase}</span>}
                    {step.rest && <p className="text-xs text-muted-foreground">Descanso: {step.rest}</p>}
                    {step.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{typeof step.description === 'string' ? step.description : ''}</p>}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {activityData.closingMessage && (
            <Card className="border-none shadow-sm bg-accent/10"><CardContent className="p-4">
              <p className="text-xs font-semibold text-accent-foreground mb-1">Mensagem de encerramento</p>
              <p className="text-sm italic">{activityData.closingMessage}</p>
            </CardContent></Card>
          )}

          {activityData.books && activityData.books.map((book: any, i: number) => (
            <Card key={i} className="border-none shadow-sm"><CardContent className="p-5">
              <h3 className="font-bold text-sm">{book.title}</h3>
              <p className="text-xs text-muted-foreground">{book.author}</p>
              <p className="text-sm mt-2">{book.summary}</p>
              {book.recoveryBenefit && <p className="text-xs italic text-muted-foreground mt-2">{book.recoveryBenefit}</p>}
              {book.isFree && <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#065F46" }}>Disponível gratuitamente</span>}
              <div className="flex gap-2 mt-3">
                <a href={book.googleBooksLink || `https://books.google.com/books?q=${encodeURIComponent(book.title + " " + book.author)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all active:scale-95"
                  style={{ background: "#1B4332", color: "#fff" }}>Ver no Google Books</a>
                <a href={book.amazonLink || `https://www.amazon.com.br/s?k=${encodeURIComponent(book.title + " " + book.author)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all active:scale-95"
                  style={{ borderColor: "#E5E7EB" }}>Comprar na Amazon</a>
              </div>
            </CardContent></Card>
          ))}

          {activityData.dailyTip && (
            <Card className="border-none shadow-sm"><CardContent className="p-4">
              <p className="text-xs font-semibold mb-1">Dica do dia</p>
              <p className="text-sm text-muted-foreground">{activityData.dailyTip}</p>
            </CardContent></Card>
          )}

          {activityData.suggestion && (
            <Card className="border-none shadow-sm"><CardContent className="p-5">
              <p className="text-sm leading-relaxed">{activityData.suggestion}</p>
              {activityData.whyItHelps && <p className="text-xs text-muted-foreground mt-2 italic">{activityData.whyItHelps}</p>}
            </CardContent></Card>
          )}

          {/* Report textarea */}
          <div className="pt-2 space-y-2">
            <Textarea value={activityReport} onChange={e => setActivityReport(e.target.value)} placeholder="Como foi? (opcional)" rows={2} className="resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1 h-[52px] text-base font-bold rounded-2xl text-white gap-2"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
              onClick={() => { setTimerRunning(true); }}>
              {timerSeconds > 0 ? <><Play className="h-5 w-5" /> Continuar</> : <><Play className="h-5 w-5" /> Iniciar plano</>}
            </Button>
            {timerSeconds > 0 && (
              <Button variant="outline" className="h-[52px] rounded-2xl font-bold" onClick={finishActivity}>
                Concluir
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Screen ───
  return (
    <div className="min-h-screen bg-[#F8F6F2] safe-top pb-24">
      <header className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate("/app")} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button onClick={() => setShowSetup(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
            <Settings2 className="h-5 w-5 text-white" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.5px" }}>Rotina</h1>
        <p className="text-sm text-white/60 mt-0.5">{greeting}, {userName || "amigo"}. {greetingSub}</p>
        {todayCount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="text-sm font-medium" style={{ color: "#C9A84C" }}>{todayCount} atividade{todayCount > 1 ? "s" : ""} hoje</span>
          </div>
        )}
      </header>

      <div className="max-w-lg mx-auto px-5 pt-4 flex gap-2">
        {(["hoje", "historico"] as const).map(t => (
          <button key={t} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={tab === t ? { background: "#1B4332", color: "#fff" } : { background: "rgba(0,0,0,0.04)", color: "#9CA3AF" }}
            onClick={() => setTab(t)}>
            {t === "hoje" ? "Hoje" : "Histórico"}
          </button>
        ))}
      </div>

      <main className="max-w-lg mx-auto px-5 pt-4 space-y-3">
        {tab === "hoje" ? (<>
          {activeCategories.length === 0 && (
            <Card className="border-dashed border-2 border-border/50 bg-white/50">
              <CardContent className="py-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold" style={{ letterSpacing: "-0.5px" }}>Configure sua rotina</h3>
                <p className="text-sm text-muted-foreground">Escolha pelo menos 2 categorias para começar</p>
                <Button className="text-white rounded-xl" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} onClick={() => setShowSetup(true)}>
                  Personalizar rotina
                </Button>
              </CardContent>
            </Card>
          )}

          {activeCategories.length > 0 && (
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)", color: "#1B4332" }}>A</div>
                <p className="text-white/90 font-semibold text-sm">Sugestão da Ana</p>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 py-1"><div className="h-3 w-3/4 bg-white/10 rounded-full animate-pulse" /></div>
              ) : aiSuggestion ? (
                <p className="text-white/80 text-sm leading-relaxed font-light">{aiSuggestion}</p>
              ) : (
                <button onClick={() => fetchSuggestionAuto(activeCategories, preferences, userName)}
                  className="text-white/50 text-sm font-medium hover:text-white/70 transition-colors">Ver sugestão</button>
              )}
            </div>
          )}

          {/* Today's workout card (from fitness profile) */}
          {activeCategories.includes("academia") && fitnessProfile && todayWorkout && (
            <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)" }}>
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Treino de hoje</p>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {Array.isArray((todayWorkout as any).muscle_groups) ? (todayWorkout as any).muscle_groups.join(" + ") : "Treino"}
                  </h3>
                  <p className="text-white/70 text-xs mt-1">{fitnessProfile.tempo_disponivel} min · {fitnessProfile.nivel} · Semana {getWeekNumber()}</p>
                </div>
                <button onClick={() => setShowFitnessSetup(true)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-95">
                  <Pencil className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {Array.isArray((todayWorkout as any).exercises) && (todayWorkout as any).exercises.slice(0, 4).map((ex: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-sm font-medium">{ex.name}</span>
                    <span className="text-xs text-muted-foreground">{ex.sets}x{ex.reps}</span>
                  </div>
                ))}
                {Array.isArray((todayWorkout as any).exercises) && (todayWorkout as any).exercises.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">+{(todayWorkout as any).exercises.length - 4} exercícios</p>
                )}
              </div>
              <div className="px-4 pb-4">
                <Button className="w-full h-[48px] text-sm font-bold rounded-2xl text-white gap-2"
                  style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)" }}
                  onClick={() => startWorkoutFromPlan(todayWorkout)}>
                  <Play className="h-4 w-4" /> Iniciar treino
                </Button>
              </div>
            </div>
          )}

          {/* Rest day message */}
          {activeCategories.includes("academia") && fitnessProfile && !todayWorkout && !workoutLoading && (
            <Card className="border-none shadow-sm"><CardContent className="p-5 text-center">
              <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold">Dia de descanso</p>
              <p className="text-xs text-muted-foreground mt-1">Aproveite para se recuperar. Seus treinos estão programados para: {fitnessProfile.dias_semana.map(d => DAY_LABELS[d] || d).join(", ")}</p>
              <button onClick={() => setShowFitnessSetup(true)} className="text-xs text-primary font-medium mt-3 inline-block">Editar perfil</button>
            </CardContent></Card>
          )}

          {/* Category cards */}
          {activeCategories.map(catId => {
            // Skip academia here — it's handled above with the fitness profile card
            if (catId === "academia") {
              if (!fitnessProfile) {
                // Show setup prompt
                return (
                  <button key={catId} onClick={() => setShowFitnessSetup(true)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-all duration-200" style={{ height: "72px" }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#DC262612" }}>
                      <Dumbbell className="h-5 w-5" style={{ color: "#DC2626" }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-sm">Academia</p>
                      <p className="text-xs text-muted-foreground">Configure seu perfil de treino</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </button>
                );
              }
              return null; // Already rendered above
            }

            const cat = CATEGORIES.find(c => c.id === catId);
            if (!cat) return null;
            const todayDone = activities.some(a => a.category === catId && new Date(a.completed_at).toDateString() === new Date().toDateString());
            const lastActivity = activities.find(a => a.category === catId);
            const streak = activities.filter(a => a.category === catId).length;

            return (
              <button key={catId} onClick={() => startFlow(catId)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-all duration-200" style={{ height: "72px" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: `${cat.color}12` }}>
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{cat.label}</p>
                    {todayDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Feito</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastActivity ? `Última: ${new Date(lastActivity.completed_at).toLocaleDateString("pt-BR")}` : "Iniciar primeira"}
                    {streak > 0 && ` · ${streak}x`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {streak > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#065F46" }}>{streak}</span>}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </button>
            );
          })}

          {isEvening && activeCategories.length > 0 && (
            <Card className="border-none shadow-sm bg-white"><CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Reflexão do dia</h3>
              </div>
              {!reflectionSent ? (<>
                <p className="text-sm text-muted-foreground">Como foi seu dia hoje?</p>
                <Textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)} placeholder="Escreva sua reflexão..." rows={3} className="resize-none" />
                <Button className="w-full text-white rounded-xl" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }} disabled={!reflectionText.trim() || reflectionLoading} onClick={sendReflection}>
                  {reflectionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Enviar reflexão
                </Button>
              </>) : (
                <div className="space-y-2">
                  <p className="text-sm italic text-muted-foreground">"{reflectionText}"</p>
                  <div className="border-l-2 pl-3 py-2" style={{ borderColor: "#2D6A4F" }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{reflectionResponse}</p>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">— Ana</p>
                  </div>
                </div>
              )}
            </CardContent></Card>
          )}
        </>) : (
          <div className="space-y-4">
            <Card className="border-none shadow-sm bg-white"><CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3" style={{ letterSpacing: "-0.3px" }}>Consistência semanal</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs><linearGradient id="routineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2} /><stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                    </linearGradient></defs>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#1B4332" strokeWidth={2} fill="url(#routineGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>

            <Card className="border-none shadow-sm bg-white"><CardContent className="py-4 px-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)" }}>
                <Activity className="h-5 w-5" style={{ color: "#1B4332" }} />
              </div>
              <div>
                <p className="font-bold text-lg" style={{ letterSpacing: "-0.5px" }}>{activities.length}</p>
                <p className="text-xs text-muted-foreground">Total de atividades</p>
              </div>
            </CardContent></Card>

            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Últimas atividades</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
            ) : activities.slice(0, 15).map(a => {
              const cat = CATEGORIES.find(c => c.id === a.category);
              return (
                <div key={a.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${cat?.color || "#666"}12` }}>
                    <span style={{ color: cat?.color || "#666" }}>{cat?.icon || <Activity className="h-4 w-4" />}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{cat?.label || a.category}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.completed_at).toLocaleDateString("pt-BR")} · {a.duration_minutes} min</p>
                  </div>
                  {a.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full" style={{ background: a.rating >= i ? "#1B4332" : "#E5E7EB" }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <RoutineSetupSheet open={showSetup} onOpenChange={setShowSetup} activeCategories={activeCategories} preferences={preferences} onSave={saveRoutineConfig} />
      <BottomNavigation /><PortoSeguroButton /><AIChatPanel />
    </div>
  );
}

/* ─── Fitness Profile Setup ─── */
const DAYS_OPTIONS = [
  { value: "seg", label: "Seg" }, { value: "ter", label: "Ter" }, { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" }, { value: "sex", label: "Sex" }, { value: "sab", label: "Sáb" }, { value: "dom", label: "Dom" },
];

function FitnessProfileSetup({ existing, onSave, onClose }: {
  existing: FitnessProfile | null;
  onSave: (fp: Omit<FitnessProfile, "id" | "user_id">) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [modalidade, setModalidade] = useState(existing?.modalidade || "academia");
  const [nivel, setNivel] = useState(existing?.nivel || "");
  const [objetivo, setObjetivo] = useState(existing?.objetivo || "");
  const [diasSemana, setDiasSemana] = useState<string[]>(existing?.dias_semana || []);
  const [tempoDisponivel, setTempoDisponivel] = useState(existing?.tempo_disponivel || 45);
  const [equipamento, setEquipamento] = useState(existing?.equipamento || "academia_completa");
  const [pesoKg, setPesoKg] = useState(existing?.peso_kg?.toString() || "");
  const [alturaCm, setAlturaCm] = useState(existing?.altura_cm?.toString() || "");
  const [restricoes, setRestricoes] = useState(existing?.restricoes || "");

  const totalSteps = 5;

  const canContinue = () => {
    if (step === 0) return !!nivel;
    if (step === 1) return !!objetivo;
    if (step === 2) return diasSemana.length > 0;
    if (step === 3) return !!tempoDisponivel;
    return true;
  };

  const handleSave = () => {
    onSave({
      modalidade,
      nivel,
      objetivo,
      dias_semana: diasSemana,
      tempo_disponivel: tempoDisponivel,
      equipamento,
      peso_kg: pesoKg ? parseFloat(pesoKg) : null,
      altura_cm: alturaCm ? parseFloat(alturaCm) : null,
      restricoes: restricoes || null,
    });
  };

  const ChipSelect = ({ options, selected, onSelect, multi = false }: {
    options: { value: string; label: string }[];
    selected: string | string[];
    onSelect: (v: string) => void;
    multi?: boolean;
  }) => (
    <div className="grid grid-cols-2 gap-3">
      {options.map(opt => {
        const isActive = multi ? (selected as string[]).includes(opt.value) : selected === opt.value;
        return (
          <button key={opt.value} onClick={() => onSelect(opt.value)}
            className="p-4 rounded-2xl border-[1.5px] text-left transition-all duration-200 active:scale-[0.98]"
            style={{
              borderColor: isActive ? "#1B4332" : "#E5E7EB",
              background: isActive ? "hsl(153 40% 15% / 0.05)" : "#fff",
            }}>
            <span className="font-semibold text-sm" style={{ color: isActive ? "#1B4332" : "#374151" }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F6F2] safe-top flex flex-col animate-fade-in">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (step > 0) setStep(step - 1); else onClose(); }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">{step + 1} de {totalSteps}</span>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5" />
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto">
        {step === 0 && (<>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2" style={{ letterSpacing: "-0.5px" }}>Qual seu nível?</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Seja honesto — isso ajuda a montar o treino ideal</p>
          <ChipSelect
            options={[
              { value: "iniciante", label: "Iniciante" },
              { value: "intermediario", label: "Intermediário" },
              { value: "avancado", label: "Avançado" },
            ]}
            selected={nivel} onSelect={setNivel}
          />
        </>)}

        {step === 1 && (<>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2" style={{ letterSpacing: "-0.5px" }}>Qual seu objetivo?</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Isso define a estrutura dos treinos</p>
          <ChipSelect
            options={[
              { value: "hipertrofia", label: "Hipertrofia" },
              { value: "emagrecimento", label: "Emagrecimento" },
              { value: "condicionamento", label: "Condicionamento" },
              { value: "saude_geral", label: "Saúde geral" },
            ]}
            selected={objetivo} onSelect={setObjetivo}
          />
        </>)}

        {step === 2 && (<>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2" style={{ letterSpacing: "-0.5px" }}>Quais dias você treina?</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Selecione de 2 a 6 dias</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {DAYS_OPTIONS.map(d => {
              const active = diasSemana.includes(d.value);
              return (
                <button key={d.value}
                  onClick={() => setDiasSemana(prev => prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value])}
                  className="w-14 h-14 rounded-2xl border-[1.5px] flex items-center justify-center text-sm font-bold transition-all active:scale-95"
                  style={{
                    borderColor: active ? "#1B4332" : "#E5E7EB",
                    background: active ? "#1B4332" : "#fff",
                    color: active ? "#fff" : "#374151",
                  }}>
                  {d.label}
                </button>
              );
            })}
          </div>
          {diasSemana.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">{diasSemana.length} dia{diasSemana.length > 1 ? "s" : ""} por semana</p>
          )}
        </>)}

        {step === 3 && (<>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2" style={{ letterSpacing: "-0.5px" }}>Tempo por treino?</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Inclui aquecimento e alongamento</p>
          <ChipSelect
            options={[
              { value: "30", label: "30 min" },
              { value: "45", label: "45 min" },
              { value: "60", label: "60 min" },
              { value: "90", label: "90 min" },
            ]}
            selected={String(tempoDisponivel)}
            onSelect={v => setTempoDisponivel(parseInt(v))}
          />

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-bold" style={{ letterSpacing: "-0.3px" }}>Equipamento</h3>
            <ChipSelect
              options={[
                { value: "academia_completa", label: "Academia completa" },
                { value: "em_casa", label: "Em casa" },
                { value: "sem_equipamento", label: "Sem equipamento" },
              ]}
              selected={equipamento} onSelect={setEquipamento}
            />
          </div>
        </>)}

        {step === 4 && (<>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2" style={{ letterSpacing: "-0.5px" }}>Dados complementares</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Opcional — ajuda a personalizar os treinos</p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
                <Input type="number" placeholder="75" value={pesoKg} onChange={e => setPesoKg(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Altura (cm)</label>
                <Input type="number" placeholder="175" value={alturaCm} onChange={e => setAlturaCm(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Restrições ou lesões</label>
              <Textarea placeholder="Ex: dor no joelho, hérnia de disco..." value={restricoes} onChange={e => setRestricoes(e.target.value)} rows={3} className="resize-none" />
            </div>
          </div>
        </>)}
      </div>

      <div className="px-6 pb-8 pt-4">
        <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white transition-all duration-200"
          style={{ background: canContinue() ? "linear-gradient(135deg, #1B4332, #2D6A4F)" : "#D1D5DB" }}
          disabled={!canContinue()}
          onClick={() => { if (step < totalSteps - 1) setStep(step + 1); else handleSave(); }}>
          {step === totalSteps - 1 ? "Salvar e gerar treinos" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Routine Setup Sheet ─── */
const SPORT_TYPES = ["Corrida", "Futebol", "Beach Tennis", "Vôlei", "Caminhada", "Natação", "Outro"];
const READING_THEMES = ["Autoajuda", "Espiritualidade", "Ficção", "Finanças", "Outro"];
const SPIRITUAL_PRACTICES = ["Meditação", "Oração", "Reflexão", "Outra"];
const SOCIAL_TYPES = ["Família", "Amigos", "Grupo de apoio"];
const GYM_LEVELS = ["Iniciante", "Intermediário", "Avançado"];

function RoutineSetupSheet({ open, onOpenChange, activeCategories, preferences, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; activeCategories: string[]; preferences: Record<string, any>; onSave: (c: string[], p: Record<string, any>) => void;
}) {
  const [cats, setCats] = useState<string[]>(activeCategories);
  const [prefs, setPrefs] = useState<Record<string, any>>(preferences);
  useEffect(() => { setCats(activeCategories); setPrefs(preferences); }, [activeCategories, preferences, open]);
  const toggle = (id: string) => setCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const upd = (cId: string, k: string, v: any) => setPrefs(p => ({ ...p, [cId]: { ...(p[cId] || {}), [k]: v } }));

  const Chips = ({ opts, sel, onSel, col }: { opts: string[]; sel: string; onSel: (v: string) => void; col: string }) => (
    <div className="flex flex-wrap gap-1.5">{opts.map(t => (
      <button key={t} onClick={() => onSel(t)}
        className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 active:scale-95"
        style={sel === t ? { background: col, color: "#fff", borderColor: col } : { borderColor: "#E5E7EB", background: "#fff" }}>
        {t}
      </button>
    ))}</div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0" style={{ height: "90vh" }}>
        <div className="h-full overflow-y-auto px-6 pb-24">
          <SheetHeader className="sticky top-0 bg-background pt-6 pb-3 z-10">
            <SheetTitle className="text-lg font-bold" style={{ letterSpacing: "-0.5px" }}>Personalizar rotina</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione pelo menos 2 categorias:</p>
            {CATEGORIES.map(cat => {
              const a = cats.includes(cat.id);
              return (
                <div key={cat.id} className="space-y-2">
                  <button onClick={() => toggle(cat.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border-[1.5px] transition-all duration-200 active:scale-[0.98]"
                    style={{ borderColor: a ? cat.color : "#E5E7EB", background: a ? `${cat.color}08` : "#fff" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${cat.color}12` }}>
                      <span style={{ color: cat.color }}>{cat.icon}</span>
                    </div>
                    <span className="font-semibold text-sm flex-1 text-left">{cat.label}</span>
                    {a && <CheckCircle className="h-5 w-5" style={{ color: cat.color }} />}
                  </button>
                  {a && (
                    <div className="ml-4 pl-4 border-l-2 space-y-3 pb-2" style={{ borderColor: `${cat.color}30` }}>
                      {cat.id === "esporte" && <><label className="text-xs font-medium text-muted-foreground">Modalidade favorita</label><Chips opts={SPORT_TYPES} sel={prefs.esporte?.type || ""} onSel={v => upd("esporte", "type", v)} col={cat.color} /></>}
                      {cat.id === "leitura" && <><label className="text-xs font-medium text-muted-foreground">Tema favorito</label><Chips opts={READING_THEMES} sel={prefs.leitura?.theme || ""} onSel={v => upd("leitura", "theme", v)} col={cat.color} /></>}
                      {cat.id === "espiritualidade" && <><label className="text-xs font-medium text-muted-foreground">Prática preferida</label><Chips opts={SPIRITUAL_PRACTICES} sel={prefs.espiritualidade?.practice || ""} onSel={v => upd("espiritualidade", "practice", v)} col={cat.color} /></>}
                      {cat.id === "social" && <><label className="text-xs font-medium text-muted-foreground">Com quem</label><Chips opts={SOCIAL_TYPES} sel={prefs.social?.with || ""} onSel={v => upd("social", "with", v)} col={cat.color} /></>}
                      {cat.id === "academia" && <><label className="text-xs font-medium text-muted-foreground">Nível</label><Chips opts={GYM_LEVELS} sel={prefs.academia?.level || ""} onSel={v => upd("academia", "level", v)} col={cat.color} /></>}
                      <label className="text-xs font-medium text-muted-foreground">Horário preferido</label>
                      <Chips opts={["Manhã", "Tarde", "Noite"]} sel={prefs[cat.id]?.timePreference || ""} onSel={v => upd(cat.id, "timePreference", v)} col={cat.color} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white" disabled={cats.length < 2}
            style={cats.length >= 2 ? { background: "linear-gradient(135deg, #1B4332, #2D6A4F)" } : {}}
            onClick={() => onSave(cats, prefs)}>
            {cats.length < 2 ? `Selecione mais ${2 - cats.length}` : "Salvar rotina"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
