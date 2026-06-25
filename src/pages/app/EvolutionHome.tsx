import { HealthDisclaimer } from "@/components/HealthDisclaimer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { ChevronLeft, Download, FileText, CalendarCheck, CheckCircle2, Loader2, ChevronRight, Star, Mail, Map, Brain, BookOpen, Flame, Sprout, Leaf, TreePine, Mountain, ClipboardCheck, Anchor, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface WeekSummary {
  jornada_passos: number;
  rotina_tarefas: number;
  rotina_concluidas: number;
  checkins: number;
  terapia_sessoes: number;
  historias: number;
}

interface Prontuario {
  id: string;
  resumo_clinico: string;
  nivel_risco: string;
  recomendacoes: string[];
  gerado_em: string;
}

interface OnboardingClinico {
  gambling_duration?: string;
  recovery_situation?: string;
  total_loss_range?: string;
  mental_health_risk?: string;
  main_motivation?: string;
}

const RISK_COLOR: Record<string, string> = {
  baixo: "#059669",
  medio: "#D97706",
  alto: "#DC2626",
  critico: "#7C2D12",
};

const RISK_LABEL: Record<string, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

const MOTIVATION_LABEL: Record<string, string> = {
  familia: "Minha família",
  financeiro: "Recuperação financeira",
  saude: "Minha saúde mental",
  eu_mesmo: "Por mim mesmo",
  trabalho: "Meu trabalho",
};

const MENTAL_LABEL: Record<string, string> = {
  bem: "Bem emocionalmente",
  ansioso: "Ansioso ou estressado",
  deprimido: "Deprimido",
  pensamentos_ruins: "Com pensamentos difíceis",
};

export default function EvolutionHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingClinico | null>(null);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyCheckins, setWeeklyCheckins] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState<"semana" | "prontuarios" | "historico">("semana");
  const [gerando, setGerando] = useState(false);
  const [expandedHistorico, setExpandedHistorico] = useState<Record<string, boolean>>({});

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { if (user) loadAll(); }, [user]);

  async function loadAll() {
    setLoading(true);
    const [profileRes, prontuariosRes, onboardingRes, journeyRes, checkinsRes, tasksRes, therapyRes, storiesRes, streakTotalRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user!.id).maybeSingle(),
      supabase.from("prontuarios").select("*").eq("user_id", user!.id).order("gerado_em", { ascending: false }).limit(6),
      supabase.from("onboarding_clinico").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("journey_progress").select("step_number, completed, is_completed").eq("user_id", user!.id),
      supabase.from("gambling_streak").select("confirmation_date, stayed_clean").eq("user_id", user!.id).eq("stayed_clean", true).gte("confirmation_date", weekStartStr),
      supabase.from("daily_tasks").select("concluido").eq("user_id", user!.id).gte("data", weekStartStr),
      supabase.from("payments").select("id").eq("user_id", user!.id).eq("payment_type", "therapy").eq("status", "completed"),
      supabase.from("community_posts").select("id").eq("user_id", user!.id).gte("created_at", weekStart.toISOString()),
      supabase.from("gambling_streak").select("confirmation_date, stayed_clean").eq("user_id", user!.id).eq("stayed_clean", true),
    ]);

    if (profileRes.data?.full_name) setUserName(profileRes.data.full_name.split(" ")[0]);
    console.log("prontuarios carregados:", prontuariosRes.data, "user id:", user!.id, "error:", prontuariosRes.error);
    setProntuarios((prontuariosRes.data as Prontuario[]) || []);
    setOnboarding(onboardingRes.data as unknown as OnboardingClinico | null);

    const completedSteps = (journeyRes.data || []).filter((j: any) => j.completed || j.is_completed).length;
    setJourneyProgress(completedSteps);

    const checkinDates = new Set((checkinsRes.data || []).map((c: any) => c.confirmation_date));
    setStreakDays((streakTotalRes.data || []).length);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });
    setWeeklyCheckins(weekDays.map((d) => checkinDates.has(d)));

    const allTasks = tasksRes.data || [];
    const doneTasks = allTasks.filter((t: any) => t.concluido).length;

    setWeekSummary({
      jornada_passos: completedSteps,
      rotina_tarefas: allTasks.length,
      rotina_concluidas: doneTasks,
      checkins: checkinDates.size,
      terapia_sessoes: (therapyRes.data || []).length,
      historias: (storiesRes.data || []).length,
    });

    setLoading(false);
  }

  interface JourneyLevel {
    nome: string;
    icon: LucideIcon;
    cor: string;
    proximo: number | null;
  }

  function getJourneyLevel(dias: number): JourneyLevel {
    if (dias >= 180) return { nome: "Inspiração", icon: Star, cor: "#7C3AED", proximo: null };
    if (dias >= 90) return { nome: "Veterano", icon: Mountain, cor: "#059669", proximo: 180 };
    if (dias >= 30) return { nome: "Firme", icon: TreePine, cor: "#0891B2", proximo: 90 };
    if (dias >= 7) return { nome: "Construindo", icon: Leaf, cor: "#D97706", proximo: 30 };
    return { nome: "Primeiros Passos", icon: Sprout, cor: "#65A30D", proximo: 7 };
  }

  const level = getJourneyLevel(streakDays);
  const LevelIcon = level.icon;
  const nextLevelName = level.proximo === 7 ? "Construindo" : level.proximo === 30 ? "Firme" : level.proximo === 90 ? "Veterano" : level.proximo === 180 ? "Inspiração" : null;
  const progressToNext = level.proximo ? Math.min((streakDays / level.proximo) * 100, 100) : 100;

  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const weekCheckins = weeklyCheckins.reduce((acc, checked) => acc + (checked ? 1 : 0), 0);


  async function gerarProntuario() {
    if (gerando) return;
    setGerando(true);
    toast.info("Gerando prontuário com IA...");
    try {
      const { data, error } = await supabase.functions.invoke("gerar-prontuario", {
        body: { user_id: user!.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao gerar prontuário");
      await loadAll();
      toast.success("Prontuário gerado!");
    } catch (e: any) {
      console.error("Erro ao gerar prontuário:", e);
      toast.error(e?.message || "Erro ao gerar prontuário.");
    } finally {
      setGerando(false);
    }
  }

  function baixarPDF(p: Prontuario) {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(27, 67, 50);
    doc.text("Relatório Clínico", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Apostando na Vida", margin, y);
    y += 10;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.text(`Data: ${new Date(p.gerado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
    y += 6;
    doc.text(`Nível de risco: ${RISK_LABEL[p.nivel_risco] || p.nivel_risco}`, margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(27, 67, 50);
    doc.text("Resumo clínico", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const resumoLines = doc.splitTextToSize(p.resumo_clinico || "—", maxWidth);
    doc.text(resumoLines, margin, y);
    y += resumoLines.length * 6 + 8;

    if (p.recomendacoes && p.recomendacoes.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(27, 67, 50);
      doc.text("Recomendações", margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      p.recomendacoes.forEach((rec) => {
        const lines = doc.splitTextToSize(`• ${rec}`, maxWidth);
        if (y + lines.length * 6 > 280) { doc.addPage(); y = 20; }
        doc.text(lines, margin, y);
        y += lines.length * 6 + 2;
      });
    }

    doc.save(`prontuario_${new Date(p.gerado_em).toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
    toast.success("PDF baixado!");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
        className="px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-6">
        <button onClick={() => navigate("/app")}
          className="flex items-center gap-1.5 text-white/70 mb-4 text-sm active:scale-[0.98] transition-transform">
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">Minha Evolução</h1>
        <p className="text-white/60 text-sm">Acompanhe sua jornada de recuperação</p>

        {/* Nível de Jornada */}
        <div className="mt-5 bg-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <LevelIcon className="h-10 w-10" style={{ color: level.cor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Nível da Jornada</p>
              <p className="text-white text-2xl font-bold mt-0.5 truncate" style={{ color: level.cor }}>{level.nome}</p>
              <p className="text-white/80 text-sm mt-0.5">
                {streakDays} {streakDays === 1 ? "dia firme" : "dias firmes"} na sua jornada
              </p>
            </div>
          </div>

          {level.proximo && nextLevelName && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/70">Faltam {level.proximo - streakDays} dias para {nextLevelName}</span>
                <span className="text-white/80 font-medium">{streakDays}/{level.proximo}</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-white/15">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressToNext}%`, background: level.cor }} />
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60 text-xs italic leading-relaxed">
              Recuperação é uma jornada diária, não um destino. Cada dia conta.
            </p>
          </div>
        </div>

        {/* Presença esta semana */}
        <div className="mt-3 bg-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Presença esta semana</p>
            <p className="text-white text-sm font-semibold">{weekCheckins} dos 7 dias</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            {weeklyCheckins.map((checked, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full aspect-square rounded-full flex items-center justify-center transition-colors"
                  style={{ background: checked ? level.cor : "rgba(255,255,255,0.12)" }}>
                  {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
                <span className="text-[10px] text-white/50 font-medium">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-2">
        {(["semana", "prontuarios", "historico"] as const).map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] transition-transform"
            style={activeTab === tab
              ? { background: "#1B4332", color: "#fff" }
              : { background: "rgba(0,0,0,0.04)", color: "#9CA3AF" }}>
            {tab === "semana" ? "Esta semana" : tab === "prontuarios" ? "Prontuários" : "Histórico"}
          </button>
        ))}
      </div>

      {/* Atalho: Minhas Cartas */}
      <div className="px-5 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <button
          onClick={() => navigate("/app/cartas")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #5C4A1A, #C9A84C)",
            boxShadow: "0 6px 18px rgba(92,74,26,0.18)",
          }}
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-tight">Minhas Cartas</div>
            <div className="text-white/80 text-[11px] mt-0.5">
              Releia suas reflexões da jornada
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
        </button>
      </div>


      <div className="px-5 pt-4 space-y-4">

        {/* ABA: ESTA SEMANA */}
        {activeTab === "semana" && (<>
          {/* Cards da semana */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Dias de check-in", value: weekSummary?.checkins || 0, suffix: "/ 7", icon: CalendarCheck, color: "#1B4332" },
              { label: "Tarefas concluídas", value: weekSummary?.rotina_concluidas || 0, suffix: `/ ${weekSummary?.rotina_tarefas || 0}`, icon: CheckCircle2, color: "#7C3AED" },
              { label: "Passos da jornada", value: journeyProgress, suffix: "/ 12", icon: Map, color: "#059669" },
              { label: "Sessões de terapia", value: weekSummary?.terapia_sessoes || 0, suffix: "", icon: Brain, color: "#2563EB" },
              { label: "Histórias publicadas", value: weekSummary?.historias || 0, suffix: "", icon: BookOpen, color: "#D97706" },
              { label: "Dias sem apostar", value: streakDays, suffix: "", icon: Flame, color: "#DC2626" },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label}
                  className="bg-white border border-gray-100 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={22} style={{ color: card.color }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: card.color }}>
                    {card.value}<span className="text-sm font-normal text-gray-400 ml-1">{card.suffix}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Como eu estava vs como estou */}
          {onboarding && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p className="font-semibold text-sm mb-3" style={{ color: "#1B4332" }}>Seu ponto de partida</p>
              <div className="space-y-3">
                {onboarding.mental_health_risk && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Estado emocional inicial</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                      {MENTAL_LABEL[onboarding.mental_health_risk] || onboarding.mental_health_risk}
                    </span>
                  </div>
                )}
                {onboarding.main_motivation && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Principal motivação</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">
                      {MOTIVATION_LABEL[onboarding.main_motivation] || onboarding.main_motivation}
                    </span>
                  </div>
                )}
                {onboarding.gambling_duration && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Tempo de vício</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {onboarding.gambling_duration}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 italic">Você está na semana {Math.ceil(streakDays / 7) || 1} da sua jornada. Continue!</p>
              </div>
            </div>
          )}
        </>)}

        {/* ABA: PRONTUÁRIOS */}
        {activeTab === "prontuarios" && (<>
          <HealthDisclaimer />

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "#1B4332" }}>Prontuários da IA</p>
            <button onClick={gerarProntuario}
              disabled={gerando}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              style={{ background: "#1B4332" }}>
              {gerando ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando...</>) : "+ Gerar novo"}
            </button>
          </div>

          <p className="text-xs text-gray-400">{prontuarios.length} prontuários encontrados</p>

          {prontuarios.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-700 mb-1">Nenhum prontuário ainda</p>
              <p className="text-sm text-gray-400 mb-4">A IA gera um relatório clínico completo baseado no seu progresso</p>
              <button onClick={gerarProntuario}
                disabled={gerando}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                style={{ background: "#1B4332" }}>
                {gerando ? (<><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>) : "Gerar primeiro prontuário"}
              </button>
            </div>
          ) : (<>
            {/* Prontuário atual (mais recente) */}
            {(() => { const p = prontuarios[0]; return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Relatório Clínico</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.gerado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {p.nivel_risco && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: `${RISK_COLOR[p.nivel_risco]}15`,
                      color: RISK_COLOR[p.nivel_risco]
                    }}>
                    Risco {RISK_LABEL[p.nivel_risco] || p.nivel_risco}
                  </span>
                )}
              </div>

              {p.resumo_clinico && (
                <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">{p.resumo_clinico}</p>
              )}

              {p.recomendacoes && p.recomendacoes.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {p.recomendacoes.slice(0, 3).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button
                  onClick={() => baixarPDF(p)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-[0.98] transition-transform"
                  style={{ background: "#1B433215", color: "#1B4332" }}>
                  <Download className="h-3.5 w-3.5" /> Baixar PDF
                </button>
                <button
                  onClick={() => {
                    const text = `Meu prontuário de recuperação:\n\n${p.resumo_clinico}`;
                    if (navigator.share) {
                      navigator.share({ title: "Meu Prontuário", text });
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success("Copiado para a área de transferência!");
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-[0.98] transition-transform"
                  style={{ background: "#7C3AED15", color: "#7C3AED" }}>
                  Compartilhar
                </button>
              </div>
            </div>
            ); })()}

            {/* Histórico (até 5 prontuários anteriores) */}
            {prontuarios.length > 1 && (
              <div className="pt-2">
                <p className="text-sm font-semibold mb-2" style={{ color: "#1B4332" }}>Histórico</p>
                <div className="space-y-2">
                  {prontuarios.slice(1, 6).map((p) => {
                    const expanded = !!expandedHistorico[p.id];
                    return (
                      <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                              <FileText className="h-3.5 w-3.5 text-gray-500" />
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {new Date(p.gerado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.nivel_risco && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  background: `${RISK_COLOR[p.nivel_risco]}15`,
                                  color: RISK_COLOR[p.nivel_risco]
                                }}>
                                {RISK_LABEL[p.nivel_risco] || p.nivel_risco}
                              </span>
                            )}
                            <button
                              onClick={() => setExpandedHistorico((s) => ({ ...s, [p.id]: !s[p.id] }))}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg active:scale-[0.98] transition-transform"
                              style={{ background: "#1B433215", color: "#1B4332" }}>
                              {expanded ? "Ocultar" : "Ver"}
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                            {p.resumo_clinico && (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Resumo clínico</p>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.resumo_clinico}</p>
                              </div>
                            )}
                            {p.recomendacoes && p.recomendacoes.length > 0 && (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Recomendações</p>
                                <div className="space-y-1.5">
                                  {p.recomendacoes.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                      <p className="text-xs text-gray-600 leading-relaxed">{rec}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => baixarPDF(p)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-[0.98] transition-transform"
                              style={{ background: "#1B433215", color: "#1B4332" }}>
                              <Download className="h-3.5 w-3.5" /> Baixar PDF
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>)}
        </>)}

        {/* ABA: HISTÓRICO */}
        {activeTab === "historico" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold" style={{ color: "#1B4332" }}>Marcos da sua jornada</p>
            {[
              { label: "Iniciou a jornada", desc: "Deu o primeiro passo corajoso", icon: Sprout, color: "#65A30D", done: true },
              { label: "Completou o onboarding", desc: "Compartilhou sua história inicial", icon: ClipboardCheck, color: "#1B4332", done: !!onboarding },
              { label: `${journeyProgress} passos concluídos`, desc: "Na jornada dos 12 passos", icon: Map, color: "#059669", done: journeyProgress > 0 },
              { label: "Cadastrou contato âncora", desc: "Tem alguém por perto", icon: Anchor, color: "#2563EB", done: false },
              { label: "Primeira sessão de terapia", desc: "Buscou ajuda profissional", icon: Brain, color: "#7C3AED", done: (weekSummary?.terapia_sessoes || 0) > 0 },
              { label: "Publicou uma história", desc: "Compartilhou com a comunidade", icon: BookOpen, color: "#D97706", done: (weekSummary?.historias || 0) > 0 },
            ].map((marco, i) => {
              const MarcoIcon = marco.icon;
              return (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ opacity: marco.done ? 1 : 0.45, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <MarcoIcon size={22} style={{ color: marco.color }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{marco.label}</p>
                  <p className="text-xs text-gray-400">{marco.desc}</p>
                </div>
                {marco.done
                  ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#059669" }} />
                  : <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                }
              </div>
            );})}
          </div>
        )}
      </div>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
