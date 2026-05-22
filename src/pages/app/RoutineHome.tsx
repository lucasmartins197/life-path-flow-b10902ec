import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Dumbbell, Smile, Leaf, CheckCircle2,
  ChevronRight, Settings2, Loader2, Play
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/* ─── Types ─── */
interface RoutinePreferences {
  user_id: string;
  leitura_ativo: boolean;
  leitura_tipo: string;
  esporte_ativo: boolean;
  esporte_tipo: string; // academia | corrida
  esporte_nivel: string;
  esporte_dias: string[];
  esporte_tempo: number;
  lazer_ativo: boolean;
  espiritualidade_ativo: boolean;
  configurado: boolean;
}

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
  progresso: string | null;
}

const DIAS_SEMANA = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
];

const CAT_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  leitura: { label: "Leitura", icon: <BookOpen className="h-5 w-5" />, color: "#7C3AED" },
  esporte: { label: "Esporte", icon: <Dumbbell className="h-5 w-5" />, color: "#059669" },
  lazer: { label: "Lazer", icon: <Smile className="h-5 w-5" />, color: "#D97706" },
  espiritualidade: { label: "Espiritualidade", icon: <Leaf className="h-5 w-5" />, color: "#2563EB" },
};

/* ─── Main component ─── */
export default function RoutineHome() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<RoutinePreferences | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [prefsRes, tasksRes] = await Promise.all([
      supabase.from("routine_preferences").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("daily_tasks").select("*").eq("user_id", user!.id).eq("data", today).order("categoria"),
    ]);
    setPrefs(prefsRes.data as RoutinePreferences | null);
    setTasks((tasksRes.data as DailyTask[]) || []);
    setLoading(false);
  }

  async function generateTodayTasks() {
    if (!prefs) return;
    setGenerating(true);
    try {
      const res = await fetch("https://apostandonavida.app.n8n.cloud/webhook/gerar-tarefas-diarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user!.id, data: today, preferences: prefs }),
      });
      if (res.ok) {
        await loadData();
        toast.success("Tarefas do dia geradas!");
      } else {
        toast.error("Erro ao gerar tarefas. Tente novamente.");
      }
    } catch {
      toast.error("Erro de conexão.");
    }
    setGenerating(false);
  }

  async function completeTask(taskId: string, progresso?: string) {
    await supabase.from("daily_tasks").update({
      concluido: true,
      concluido_em: new Date().toISOString(),
      progresso: progresso || null,
    }).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, concluido: true } : t));
    toast.success("Tarefa concluída! 🎉");
    // Notificar N8N para atualizar relatório
    fetch("https://apostandonavida.app.n8n.cloud/webhook/tarefa-concluida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user!.id, task_id: taskId, data: today }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não configurado ainda
  if (!prefs || !prefs.configurado) {
    return (
      <>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "#1B4332" }}>
            Configure sua rotina
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
            Configure uma vez. A partir daí, a IA sugere suas atividades todo dia automaticamente.
          </p>
          <div className="w-full space-y-3 mb-8">
            {Object.entries(CAT_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">IA personaliza para você</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full h-[52px] text-base font-bold rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            onClick={() => setSetupOpen(true)}>
            Configurar minha rotina
          </Button>
        </div>
        <BottomNavigation />
        <PortoSeguroButton />
        <SetupSheet open={setupOpen} onOpenChange={setSetupOpen} userId={user!.id} onSaved={loadData} />
      </>
    );
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.concluido).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1B4332" }}>Rotina de hoje</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button onClick={() => setSetupOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-border/50 bg-card">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="p-4 rounded-2xl bg-card border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{doneTasks}/{totalTasks} tarefas concluídas</p>
              <span className="text-sm font-bold" style={{ color: "#1B4332" }}>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #1B4332, #2D6A4F)" }} />
            </div>
          </div>
        )}
      </div>

      <div className="px-5 space-y-3">
        {/* Sem tarefas — gerar */}
        {totalTasks === 0 && (
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
              <Play className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-bold mb-2 text-center">Pronto para começar?</h2>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              A IA vai gerar as atividades personalizadas de hoje com base na sua rotina.
            </p>
            <Button className="h-[52px] px-8 text-base font-bold rounded-2xl text-white"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
              onClick={generateTodayTasks} disabled={generating}>
              {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Gerando...</> : "Gerar atividades de hoje"}
            </Button>
          </div>
        )}

        {/* Lista de tarefas */}
        {tasks.map(task => {
          const cfg = CAT_CONFIG[task.categoria] || CAT_CONFIG.lazer;
          return (
            <Card key={task.id} className={`border transition-all duration-200 ${task.concluido ? "opacity-60" : ""}`}
              style={{ borderColor: task.concluido ? "#E5E7EB" : `${cfg.color}30` }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${cfg.color}15` }}>
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${cfg.color}15`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {task.concluido && (
                        <CheckCircle2 className="h-4 w-4" style={{ color: "#059669" }} />
                      )}
                    </div>
                    <p className="font-semibold text-sm mb-1">{task.titulo}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{task.descricao}</p>
                    {task.conteudo_ia && (
                      <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed"
                        style={{ background: `${cfg.color}08`, color: "#374151" }}>
                        {task.conteudo_ia}
                      </div>
                    )}
                    {!task.concluido && (
                      <button onClick={() => completeTask(task.id)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                        style={{ background: `${cfg.color}15`, color: cfg.color }}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marcar como feito
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Todas concluídas */}
        {totalTasks > 0 && doneTasks === totalTasks && (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}>
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-bold mb-1">Rotina completa! 🎉</h2>
            <p className="text-sm text-muted-foreground text-center">
              Parabéns! Você completou todas as atividades de hoje.
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
      <SetupSheet open={setupOpen} onOpenChange={setSetupOpen} userId={user!.id} onSaved={loadData} existingPrefs={prefs} />
    </div>
  );
}

/* ─── Setup Sheet ─── */
function SetupSheet({ open, onOpenChange, userId, onSaved, existingPrefs }: {
  open: boolean; onOpenChange: (v: boolean) => void; userId: string;
  onSaved: () => void; existingPrefs?: RoutinePreferences | null;
}) {
  const [saving, setSaving] = useState(false);
  const [leituraAtivo, setLeituraAtivo] = useState(existingPrefs?.leitura_ativo ?? false);
  const [leituratipo, setLeituraTipo] = useState(existingPrefs?.leitura_tipo ?? "");
  const [esporteAtivo, setEsporteAtivo] = useState(existingPrefs?.esporte_ativo ?? false);
  const [esporteTipo, setEsporteTipo] = useState(existingPrefs?.esporte_tipo ?? "");
  const [esporteNivel, setEsporteNivel] = useState(existingPrefs?.esporte_nivel ?? "");
  const [esporteDias, setEsporteDias] = useState<string[]>(existingPrefs?.esporte_dias ?? []);
  const [esporteTempo, setEsporteTempo] = useState(existingPrefs?.esporte_tempo ?? 30);
  const [lazerAtivo, setLazerAtivo] = useState(existingPrefs?.lazer_ativo ?? false);
  const [espiritualidadeAtivo, setEspiritualidadeAtivo] = useState(existingPrefs?.espiritualidade_ativo ?? false);

  useEffect(() => {
    if (existingPrefs) {
      setLeituraAtivo(existingPrefs.leitura_ativo);
      setLeituraTipo(existingPrefs.leitura_tipo || "");
      setEsporteAtivo(existingPrefs.esporte_ativo);
      setEsporteTipo(existingPrefs.esporte_tipo || "");
      setEsporteNivel(existingPrefs.esporte_nivel || "");
      setEsporteDias(existingPrefs.esporte_dias || []);
      setEsporteTempo(existingPrefs.esporte_tempo || 30);
      setLazerAtivo(existingPrefs.lazer_ativo);
      setEspiritualidadeAtivo(existingPrefs.espiritualidade_ativo);
    }
  }, [existingPrefs, open]);

  const toggleDia = (dia: string) =>
    setEsporteDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);

  async function handleSave() {
    if (!leituraAtivo && !esporteAtivo && !lazerAtivo && !espiritualidadeAtivo) {
      toast.error("Selecione pelo menos uma categoria.");
      return;
    }
    setSaving(true);
    const payload = {
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
    };
    const { error } = await supabase.from("routine_preferences").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar. Tente novamente."); return; }
    toast.success("Rotina salva!");
    onOpenChange(false);
    onSaved();
  }

  const Chip = ({ label, selected, onSelect, color }: { label: string; selected: boolean; onSelect: () => void; color: string }) => (
    <button onClick={onSelect} className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95"
      style={selected ? { background: color, color: "#fff", borderColor: color } : { borderColor: "#E5E7EB", background: "#fff", color: "#374151" }}>
      {label}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0" style={{ height: "92vh" }}>
        <div className="h-full overflow-y-auto px-6 pb-28">
          <SheetHeader className="sticky top-0 bg-background pt-6 pb-4 z-10">
            <SheetTitle className="text-lg font-bold" style={{ letterSpacing: "-0.5px" }}>
              Configure sua rotina
            </SheetTitle>
            <p className="text-xs text-muted-foreground">A IA usa essas preferências para sugerir atividades todo dia</p>
          </SheetHeader>

          <div className="space-y-5">
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
                  <p className="text-xs text-muted-foreground">IA sugere livros e cronograma de leitura</p>
                </div>
                {leituraAtivo && <CheckCircle2 className="h-5 w-5" style={{ color: "#7C3AED" }} />}
              </button>
              {leituraAtivo && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "#7C3AED20" }}>
                  <p className="text-xs font-medium text-muted-foreground pt-3">Que tipo de livro você prefere?</p>
                  <div className="flex flex-wrap gap-2">
                    {["Autoconhecimento", "Espiritualidade", "Motivação", "Finanças", "Ficção", "Desenvolvimento pessoal"].map(t => (
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
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "#05966920" }}>
                  <div className="pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Modalidade</p>
                    <div className="flex gap-2">
                      <Chip label="Academia" selected={esporteTipo === "academia"} onSelect={() => setEsporteTipo("academia")} color="#059669" />
                      <Chip label="Corrida" selected={esporteTipo === "corrida"} onSelect={() => setEsporteTipo("corrida")} color="#059669" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Nível</p>
                    <div className="flex gap-2">
                      {["Iniciante", "Intermediário", "Avançado"].map(n => (
                        <Chip key={n} label={n} selected={esporteNivel === n} onSelect={() => setEsporteNivel(n)} color="#059669" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Dias por semana</p>
                    <div className="flex gap-1.5">
                      {DIAS_SEMANA.map(d => (
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
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Tempo por treino</p>
                    <div className="flex gap-2">
                      {[30, 45, 60, 90].map(t => (
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
                  <p className="text-xs text-muted-foreground">IA sugere vídeos de reflexão e conexão espiritual</p>
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
