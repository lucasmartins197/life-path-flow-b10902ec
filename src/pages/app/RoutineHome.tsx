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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Settings2, Loader2, CheckCircle2, BookOpen, Dumbbell, Smile, Leaf, Sparkles
} from "lucide-react";

/* ─── Types ─── */
interface DailyTask {
  id: string;
  user_id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  conteudo_ia: string;
  data: string;
  concluido: boolean;
  concluido_em: string | null;
}

interface RoutinePrefs {
  leitura_ativo: boolean;
  leitura_tipo: string;
  esporte_ativo: boolean;
  esporte_tipo: string;
  esporte_nivel: string;
  esporte_dias: string[];
  esporte_tempo: number;
  lazer_ativo: boolean;
  espiritualidade_ativo: boolean;
  configurado: boolean;
}

const DIAS = [
  { key: "seg", label: "Seg" }, { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" }, { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" }, { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
];

const CAT: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  leitura:        { label: "Leitura",          icon: <BookOpen className="h-5 w-5" />,  color: "#7C3AED" },
  esporte:        { label: "Esporte",           icon: <Dumbbell className="h-5 w-5" />,  color: "#059669" },
  lazer:          { label: "Lazer",             icon: <Smile className="h-5 w-5" />,     color: "#D97706" },
  espiritualidade:{ label: "Espiritualidade",   icon: <Leaf className="h-5 w-5" />,      color: "#2563EB" },
};

/* ─── Main ─── */
export default function RoutineHome() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<RoutinePrefs | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [tab, setTab] = useState<"hoje" | "historico">("hoje");
  const [histTasks, setHistTasks] = useState<DailyTask[]>([]);
  const [userName, setUserName] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { if (user) loadAll(); }, [user]);

  async function loadAll() {
    setLoading(true);
    const [prefsRes, tasksRes, profileRes] = await Promise.all([
      supabase.from("routine_preferences").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("daily_tasks").select("*").eq("user_id", user!.id).eq("data", today).order("categoria"),
      supabase.from("profiles").select("full_name").eq("user_id", user!.id).maybeSingle(),
    ]);
    setPrefs(prefsRes.data as RoutinePrefs | null);
    setTasks((tasksRes.data as DailyTask[]) || []);
    if (profileRes.data?.full_name) setUserName(profileRes.data.full_name.split(" ")[0]);
    setLoading(false);
  }

  async function loadHistory() {
    const { data } = await supabase
      .from("daily_tasks").select("*").eq("user_id", user!.id)
      .neq("data", today).eq("concluido", true)
      .order("data", { ascending: false }).limit(30);
    setHistTasks((data as DailyTask[]) || []);
  }

  async function generateTasks() {
    if (!prefs) return;
    setGenerating(true);
    const diasSemana = ["dom","seg","ter","qua","qui","sex","sab"];
    const hoje = diasSemana[new Date().getDay()];
    const newTasks: any[] = [];

    if (prefs.leitura_ativo) {
      newTasks.push({
        user_id: user!.id, categoria: "leitura",
        titulo: "Leitura do dia",
        descricao: `Tema preferido: ${prefs.leitura_tipo || "livre"}`,
        conteudo_ia: "Separe 30 minutos tranquilos, desligue as notificacoes e mergulhe na leitura. Cada pagina e um passo na sua jornada de recuperacao.",
        data: today, concluido: false,
      });
    }

    if (prefs.esporte_ativo && prefs.esporte_dias?.includes(hoje)) {
      newTasks.push({
        user_id: user!.id, categoria: "esporte",
        titulo: prefs.esporte_tipo === "academia" ? "Treino na academia" : "Treino de corrida",
        descricao: `${prefs.esporte_tipo === "academia" ? "Academia" : "Corrida"} — Nivel ${prefs.esporte_nivel || "iniciante"} — ${prefs.esporte_tempo || 30} minutos`,
        conteudo_ia: "O exercicio libera endorfinas que combatem a ansiedade. Cada treino e uma vitoria dupla na sua recuperacao!",
        data: today, concluido: false,
      });
    }

    if (prefs.lazer_ativo) {
      newTasks.push({
        user_id: user!.id, categoria: "lazer",
        titulo: "Momento de lazer",
        descricao: "Reserve tempo para uma atividade que te da prazer hoje.",
        conteudo_ia: "O lazer saudavel preenche o espaco que o jogo ocupava. Curta sem culpa — voce merece!",
        data: today, concluido: false,
      });
    }

    if (prefs.espiritualidade_ativo) {
      newTasks.push({
        user_id: user!.id, categoria: "espiritualidade",
        titulo: "Reflexao espiritual",
        descricao: "Assista um video de conexao espiritual e reflita sobre seu dia.",
        conteudo_ia: "A conexao espiritual fortalece seu centro interno e reduz a vulnerabilidade a recaida.",
        data: today, concluido: false,
      });
    }

    if (newTasks.length === 0) {
      toast.error("Nenhuma atividade para hoje. Verifique sua configuracao de rotina.");
      setGenerating(false);
      return;
    }

    const { error } = await supabase.from("daily_tasks").insert(newTasks);
    if (error) {
      console.error("daily_tasks error:", error);
      toast.error("Erro ao gerar atividades: " + error.message);
      setGenerating(false);
      return;
    }

    const { data } = await supabase.from("daily_tasks").select("*").eq("user_id", user!.id).eq("data", today).order("categoria");
    setTasks((data as DailyTask[]) || []);
    toast.success("Atividades do dia geradas!");
    setGenerating(false);
  }

  async function completeTask(taskId: string) {
    const { error } = await supabase.from("daily_tasks")
      .update({ concluido: true, concluido_em: new Date().toISOString() })
      .eq("id", taskId);
    if (error) { toast.error("Erro ao concluir."); return; }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, concluido: true } : t));
    toast.success("Atividade concluida!");
  }

  const doneTasks = tasks.filter(t => t.concluido).length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header verde */}
      <header className="px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-5"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-white">Rotina Inteligente</h1>
          <button onClick={() => setSetupOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15">
            <Settings2 className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="text-white/70 text-xs">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        {/* Progresso */}
        {tasks.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-white/80 text-xs font-medium">{doneTasks}/{tasks.length} concluidas</p>
              <p className="text-white font-bold text-xs">{progress}%</p>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-2">
        {(["hoje", "historico"] as const).map(t => (
          <button key={t}
            onClick={() => { setTab(t); if (t === "historico") loadHistory(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === t
              ? { background: "#1B4332", color: "#fff" }
              : { background: "rgba(0,0,0,0.04)", color: "#9CA3AF" }}>
            {t === "hoje" ? "Hoje" : "Historico"}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4 space-y-4">
        {tab === "hoje" && (<>

          {/* Video */}
          <div>
            <p className="text-sm font-bold mb-2" style={{ color: "#1B4332" }}>Reconectando-se a Vida</p>
            <div className="w-full rounded-xl overflow-hidden shadow-md bg-black">
              <iframe
                src="https://drive.google.com/file/d/1Bt_yn6VN_NXryCSEkuCH1ZHEt3bZkZZx/preview"
                width="100%"
                style={{ aspectRatio: "16/9", border: "none" }}
                allow="autoplay"
                allowFullScreen
                title="Reconectando-se a Vida"
              />
            </div>
          </div>

          {/* Nao configurado */}
          {!prefs || !prefs.configurado ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Configure sua rotina</h3>
                <p className="text-sm text-muted-foreground">A IA vai sugerir atividades personalizadas todo dia</p>
                <Button className="text-white rounded-xl"
                  style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
                  onClick={() => setSetupOpen(true)}>
                  Configurar agora
                </Button>
              </CardContent>
            </Card>
          ) : tasks.length === 0 ? (
            /* Botao gerar */
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-center">Pronto para comecar?</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                A IA vai gerar suas atividades personalizadas de hoje.
              </p>
              <Button className="h-12 px-8 text-base font-bold rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
                onClick={generateTasks} disabled={generating}>
                {generating
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Gerando...</>
                  : "Gerar atividades de hoje"}
              </Button>
            </div>
          ) : (
            /* Lista de tarefas */
            <div className="space-y-3">
              <p className="text-sm font-bold" style={{ color: "#1B4332" }}>Atividades de hoje</p>
              {tasks.map(task => {
                const cfg = CAT[task.categoria] || CAT.lazer;
                return (
                  <div key={task.id}
                    className="p-4 rounded-2xl border transition-all"
                    style={{
                      borderColor: task.concluido ? "#E5E7EB" : `${cfg.color}40`,
                      background: task.concluido ? "#F9FAF8" : "#fff",
                      opacity: task.concluido ? 0.75 : 1,
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${cfg.color}15` }}>
                        <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-sm">{task.titulo}</p>
                          {task.concluido && (
                            <span className="text-xs font-bold shrink-0" style={{ color: "#059669" }}>Feito!</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{task.descricao}</p>
                        {task.conteudo_ia && (
                          <p className="text-xs mt-2 leading-relaxed" style={{ color: "#374151" }}>
                            {task.conteudo_ia}
                          </p>
                        )}
                        {!task.concluido && (
                          <button
                            onClick={() => completeTask(task.id)}
                            className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                            style={{ background: `${cfg.color}15`, color: cfg.color }}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Marcar como feito
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {doneTasks === tasks.length && tasks.length > 0 && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}>
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-bold">Rotina completa!</p>
                  <p className="text-sm text-muted-foreground">Parabens, voce concluiu tudo hoje.</p>
                </div>
              )}
            </div>
          )}
        </>)}

        {tab === "historico" && (
          <div className="space-y-3">
            {histTasks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade concluida ainda.</p>
            ) : histTasks.map(task => {
              const cfg = CAT[task.categoria] || CAT.lazer;
              return (
                <div key={task.id} className="p-4 rounded-2xl border border-border/30 bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cfg.color}15` }}>
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{task.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.data).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#059669" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
      <SetupSheet open={setupOpen} onOpenChange={setSetupOpen} userId={user!.id} existingPrefs={prefs} onSaved={loadAll} />
    </div>
  );
}

/* ─── Setup Sheet ─── */
function SetupSheet({ open, onOpenChange, userId, existingPrefs, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  userId: string; existingPrefs: RoutinePrefs | null; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [leituraAtivo, setLeituraAtivo] = useState(false);
  const [leituratipo, setLeituraTipo] = useState("");
  const [esporteAtivo, setEsporteAtivo] = useState(false);
  const [esporteTipo, setEsporteTipo] = useState("");
  const [esporteNivel, setEsporteNivel] = useState("");
  const [esporteDias, setEsporteDias] = useState<string[]>([]);
  const [esporteTempo, setEsporteTempo] = useState(30);
  const [lazerAtivo, setLazerAtivo] = useState(false);
  const [espiritualidadeAtivo, setEspiritualidadeAtivo] = useState(false);

  useEffect(() => {
    if (existingPrefs && open) {
      setLeituraAtivo(existingPrefs.leitura_ativo || false);
      setLeituraTipo(existingPrefs.leitura_tipo || "");
      setEsporteAtivo(existingPrefs.esporte_ativo || false);
      setEsporteTipo(existingPrefs.esporte_tipo || "");
      setEsporteNivel(existingPrefs.esporte_nivel || "");
      setEsporteDias(existingPrefs.esporte_dias || []);
      setEsporteTempo(existingPrefs.esporte_tempo || 30);
      setLazerAtivo(existingPrefs.lazer_ativo || false);
      setEspiritualidadeAtivo(existingPrefs.espiritualidade_ativo || false);
    }
  }, [existingPrefs, open]);

  const toggleDia = (d: string) =>
    setEsporteDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const Chip = ({ label, selected, onSelect, color }: { label: string; selected: boolean; onSelect: () => void; color: string }) => (
    <button onClick={onSelect}
      className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95"
      style={selected
        ? { background: color, color: "#fff", borderColor: color }
        : { borderColor: "#E5E7EB", background: "#fff", color: "#374151" }}>
      {label}
    </button>
  );

  async function handleSave() {
    if (!leituraAtivo && !esporteAtivo && !lazerAtivo && !espiritualidadeAtivo) {
      toast.error("Selecione pelo menos uma categoria.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("routine_preferences").upsert({
      user_id: userId,
      leitura_ativo: leituraAtivo,
      leitura_tipo: leituratipo,
      esporte_ativo: esporteAtivo,
      esporte_tipo: esporteTipo,
      esporte_nivel: esporteNivel,
      esporte_dias: esporteDias,
      esporte_tempo: esporteTempo,
      lazer_ativo: lazerAtivo,
      espiritualidade_ativo: espiritualidadeAtivo,
      configurado: true,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { console.error(error); toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Rotina salva!");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0" style={{ height: "92vh" }}>
        <div className="h-full overflow-y-auto px-6 pb-28">
          <SheetHeader className="sticky top-0 bg-background pt-6 pb-4 z-10">
            <SheetTitle className="text-lg font-bold">Configure sua rotina</SheetTitle>
            <p className="text-xs text-muted-foreground">Configure uma vez — a IA cuida do resto todo dia</p>
          </SheetHeader>

          <div className="space-y-4">
            {/* LEITURA */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: leituraAtivo ? "#7C3AED40" : "#E5E7EB" }}>
              <button onClick={() => setLeituraAtivo(p => !p)}
                className="w-full flex items-center gap-3 p-4"
                style={{ background: leituraAtivo ? "#7C3AED08" : "#fff" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#7C3AED15" }}>
                  <BookOpen className="h-5 w-5" style={{ color: "#7C3AED" }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Leitura</p>
                  <p className="text-xs text-muted-foreground">IA sugere livros e cronograma</p>
                </div>
                {leituraAtivo && <CheckCircle2 className="h-5 w-5" style={{ color: "#7C3AED" }} />}
              </button>
              {leituraAtivo && (
                <div className="px-4 pb-4 border-t pt-3 space-y-2" style={{ borderColor: "#7C3AED20" }}>
                  <p className="text-xs font-medium text-muted-foreground">Tipo de livro preferido</p>
                  <div className="flex flex-wrap gap-2">
                    {["Autoconhecimento","Espiritualidade","Motivacao","Financas","Ficcao","Desenvolvimento pessoal"].map(t => (
                      <Chip key={t} label={t} selected={leituratipo === t} onSelect={() => setLeituraTipo(t)} color="#7C3AED" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ESPORTE */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: esporteAtivo ? "#05966940" : "#E5E7EB" }}>
              <button onClick={() => setEsporteAtivo(p => !p)}
                className="w-full flex items-center gap-3 p-4"
                style={{ background: esporteAtivo ? "#05966908" : "#fff" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#05966915" }}>
                  <Dumbbell className="h-5 w-5" style={{ color: "#059669" }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Esporte</p>
                  <p className="text-xs text-muted-foreground">IA gera treino personalizado todo dia</p>
                </div>
                {esporteAtivo && <CheckCircle2 className="h-5 w-5" style={{ color: "#059669" }} />}
              </button>
              {esporteAtivo && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3" style={{ borderColor: "#05966920" }}>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Modalidade</p>
                    <div className="flex gap-2">
                      <Chip label="Academia" selected={esporteTipo === "academia"} onSelect={() => setEsporteTipo("academia")} color="#059669" />
                      <Chip label="Corrida" selected={esporteTipo === "corrida"} onSelect={() => setEsporteTipo("corrida")} color="#059669" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Nivel</p>
                    <div className="flex gap-2">
                      {["Iniciante","Intermediario","Avancado"].map(n => (
                        <Chip key={n} label={n} selected={esporteNivel === n} onSelect={() => setEsporteNivel(n)} color="#059669" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Dias por semana</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {DIAS.map(d => (
                        <button key={d.key} onClick={() => toggleDia(d.key)}
                          className="w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95"
                          style={esporteDias.includes(d.key)
                            ? { background: "#059669", color: "#fff" }
                            : { background: "#F3F4F6", color: "#374151" }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Tempo por treino</p>
                    <div className="flex gap-2">
                      {[30,45,60,90].map(t => (
                        <Chip key={t} label={`${t}min`} selected={esporteTempo === t} onSelect={() => setEsporteTempo(t)} color="#059669" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LAZER */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: lazerAtivo ? "#D9770640" : "#E5E7EB" }}>
              <button onClick={() => setLazerAtivo(p => !p)}
                className="w-full flex items-center gap-3 p-4"
                style={{ background: lazerAtivo ? "#D9770608" : "#fff" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#D9770615" }}>
                  <Smile className="h-5 w-5" style={{ color: "#D97706" }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Lazer</p>
                  <p className="text-xs text-muted-foreground">Registre suas atividades de lazer do dia</p>
                </div>
                {lazerAtivo && <CheckCircle2 className="h-5 w-5" style={{ color: "#D97706" }} />}
              </button>
            </div>

            {/* ESPIRITUALIDADE */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: espiritualidadeAtivo ? "#2563EB40" : "#E5E7EB" }}>
              <button onClick={() => setEspiritualidadeAtivo(p => !p)}
                className="w-full flex items-center gap-3 p-4"
                style={{ background: espiritualidadeAtivo ? "#2563EB08" : "#fff" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#2563EB15" }}>
                  <Leaf className="h-5 w-5" style={{ color: "#2563EB" }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Espiritualidade</p>
                  <p className="text-xs text-muted-foreground">IA sugere videos de reflexao espiritual</p>
                </div>
                {espiritualidadeAtivo && <CheckCircle2 className="h-5 w-5" style={{ color: "#2563EB" }} />}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar rotina"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
