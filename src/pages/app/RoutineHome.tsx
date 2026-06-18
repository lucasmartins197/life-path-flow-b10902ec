import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings, Loader2, BookOpen, Dumbbell, Smile, Leaf,
  CheckCircle2, Circle, ExternalLink, ChevronRight, Sparkles
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
  progresso: string | null;
}

interface Prefs {
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

const EMPTY_PREFS: Prefs = {
  leitura_ativo: false, leitura_tipo: "",
  esporte_ativo: false, esporte_tipo: "", esporte_nivel: "", esporte_dias: [], esporte_tempo: 30,
  lazer_ativo: false, espiritualidade_ativo: false, configurado: false,
};

const CAT: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  leitura:        { label: "Leitura",        icon: <BookOpen className="h-5 w-5" />,  color: "#7C3AED" },
  esporte:        { label: "Esporte",         icon: <Dumbbell className="h-5 w-5" />,  color: "#059669" },
  lazer:          { label: "Lazer",           icon: <Smile className="h-5 w-5" />,     color: "#D97706" },
  espiritualidade:{ label: "Espiritualidade", icon: <Leaf className="h-5 w-5" />,      color: "#2563EB" },
};

const DIAS = ["seg","ter","qua","qui","sex","sab","dom"];
const DIAS_LABEL: Record<string, string> = { seg:"Seg", ter:"Ter", qua:"Qua", qui:"Qui", sex:"Sex", sab:"Sáb", dom:"Dom" };

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/* ─── Main ─── */
export default function RoutineHome() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(EMPTY_PREFS);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [histTasks, setHistTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [tab, setTab] = useState<"hoje"|"historico">("hoje");
  // Modal de conclusão unificado
  const [doneModal, setDoneModal] = useState(false);
  const [activeTask, setActiveTask] = useState<DailyTask | null>(null);
  const [respostaTexto, setRespostaTexto] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [tempoMin, setTempoMin] = useState("");
  const [savingDone, setSavingDone] = useState(false);
  // Feedback da IA
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackCategoria, setFeedbackCategoria] = useState<string>("");

  useEffect(() => { if (user) loadAll(); }, [user]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadPrefs(), loadTasks()]);
    setLoading(false);
  }

  async function loadPrefs() {
    const { data } = await supabase
      .from("routine_preferences").select("*")
      .eq("user_id", user!.id).maybeSingle();
    if (data) setPrefs({ ...EMPTY_PREFS, ...(data as any) });
  }

  async function loadTasks() {
    const { data, error } = await supabase
      .from("daily_tasks").select("*")
      .eq("user_id", user!.id)
      .eq("data", todayLocal())
      .order("created_at", { ascending: true });
    if (error) { console.error("loadTasks error:", error); return; }
    // Garantir que concluido é boolean
    const normalized: DailyTask[] = ((data as any[]) || []).map(t => ({
      ...t,
      concluido: t.concluido === true,
    }));
    setTasks(normalized);
  }

  async function loadHistory() {
    const { data } = await supabase
      .from("daily_tasks").select("*")
      .eq("user_id", user!.id)
      .eq("concluido", true)
      .lt("data", todayLocal())
      .order("data", { ascending: false }).limit(30);
    setHistTasks(((data as any[]) || []).map(t => ({ ...t, concluido: true })));
  }

  async function generateTasks() {
    if (!prefs.configurado) { setSetupOpen(true); return; }
    setGenerating(true);
    const d = todayLocal();
    const diasSemana = ["dom","seg","ter","qua","qui","sex","sab"];
    const hoje = diasSemana[new Date().getDay()];

    // Verificar se já gerou hoje
    const { data: existing } = await supabase
      .from("daily_tasks").select("id")
      .eq("user_id", user!.id).eq("data", d).limit(1);
    if (existing && existing.length > 0) {
      toast.info("Atividades já geradas para hoje!");
      await loadTasks();
      setGenerating(false);
      return;
    }

    // Verificar progresso de leitura anterior
    let leituraDescricao = `Tema preferido: ${prefs.leitura_tipo || "livre"}`;
    let leituraIA = "";
    if (prefs.leitura_ativo) {
      const { data: readProg } = await supabase
        .from("reading_progress").select("*")
        .eq("user_id", user!.id).eq("ativo", true)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (readProg) {
        const rp = readProg as any;
        const falta = (rp.total_paginas || 0) - (rp.pagina_atual || 0);
        leituraDescricao = `Continue: "${rp.livro_titulo}" — página ${rp.pagina_atual || 0}`;
        leituraIA = `Continue lendo "${rp.livro_titulo}". Você está na página ${rp.pagina_atual || 0}${rp.total_paginas ? ` de ${rp.total_paginas}` : ""}. Meta de hoje: ler mais ${rp.paginas_por_dia || 15} páginas. ${falta > 0 ? `Faltam ${falta} páginas para terminar.` : ""}`;
      }
    }

    // Gerar sugestões via Edge Function
    async function getIA(categoria: string, extra?: string): Promise<string> {
      try {
        const { data } = await supabase.functions.invoke("routine-suggestion", {
          body: { categoria, prefs, extra }
        });
        return (data as any)?.sugestao || "";
      } catch { return ""; }
    }

    const newTasks: any[] = [];

    if (prefs.leitura_ativo) {
      const ia = leituraIA || await getIA("leitura");
      newTasks.push({
        user_id: user!.id, categoria: "leitura",
        titulo: "Leitura do dia", descricao: leituraDescricao,
        conteudo_ia: ia, data: d, concluido: false,
      });
    }

    if (prefs.esporte_ativo && Array.isArray(prefs.esporte_dias) && prefs.esporte_dias.includes(hoje)) {
      const ia = await getIA("esporte");
      newTasks.push({
        user_id: user!.id, categoria: "esporte",
        titulo: prefs.esporte_tipo === "academia" ? "Treino na academia" : "Treino de corrida",
        descricao: `${prefs.esporte_tipo} — ${prefs.esporte_nivel} — ${prefs.esporte_tempo}min`,
        conteudo_ia: ia, data: d, concluido: false,
      });
    }

    if (prefs.lazer_ativo) {
      const ia = await getIA("lazer");
      newTasks.push({
        user_id: user!.id, categoria: "lazer",
        titulo: "Momento de lazer", descricao: "Atividade saudável de hoje",
        conteudo_ia: ia, data: d, concluido: false,
      });
    }

    if (prefs.espiritualidade_ativo) {
      const ia = await getIA("espiritualidade");
      newTasks.push({
        user_id: user!.id, categoria: "espiritualidade",
        titulo: "Prática espiritual", descricao: "Conexão espiritual de hoje",
        conteudo_ia: ia, data: d, concluido: false,
      });
    }

    if (newTasks.length === 0) {
      toast.error("Nenhuma atividade para hoje. Verifique sua rotina.");
      setGenerating(false);
      return;
    }

    const { error } = await supabase.from("daily_tasks").insert(newTasks);
    if (error) { toast.error("Erro ao gerar: " + error.message); setGenerating(false); return; }
    toast.success("Atividades geradas!");
    await loadTasks();
    setGenerating(false);
  }

  // Abrir modal unificado de conclusão
  function openModal(task: DailyTask) {
    if (task.concluido) return;
    setActiveTask(task);
    setRespostaTexto("");
    setDistanciaKm("");
    setTempoMin("");
    setDoneModal(true);
  }

  async function concluirTarefa() {
    if (!activeTask) return;
    const cat = activeTask.categoria;

    const body: Record<string, unknown> = { task_id: activeTask.id };
    let progressoLabel = "";

    if (cat === "esporte") {
      const km = parseFloat(distanciaKm.replace(",", "."));
      const min = parseInt(tempoMin, 10);
      if (!km || !min) { toast.error("Informe distância e tempo."); return; }
      body.metricas_usuario = { distancia_km: km, tempo_min: min };
      progressoLabel = `${km} km · ${min} min`;
    } else if (cat === "leitura") {
      if (!respostaTexto.trim()) { toast.error("Escreva um resumo da leitura."); return; }
      body.resposta_usuario = respostaTexto.trim();
      progressoLabel = "Leitura registrada";
    } else {
      if (respostaTexto.trim()) body.resposta_usuario = respostaTexto.trim();
      progressoLabel = "Concluído";
    }

    setSavingDone(true);
    try {
      const { data, error } = await supabase.functions.invoke("concluir-tarefa", { body });
      if (error) throw error;
      const feedback = (data as any)?.feedback || "";

      setTasks(prev => prev.map(t => t.id === activeTask.id
        ? { ...t, concluido: true, concluido_em: new Date().toISOString(), progresso: progressoLabel }
        : t));
      setDoneModal(false);

      if (feedback) {
        setFeedbackText(feedback);
        setFeedbackCategoria(cat);
        setFeedbackModal(true);
      } else {
        toast.success("Tarefa concluída!");
      }
    } catch (e: any) {
      console.error("concluir-tarefa error:", e);
      toast.error("Erro ao concluir: " + (e?.message || "tente novamente"));
    } finally {
      setSavingDone(false);
    }
  }


  const doneTasks = tasks.filter(t => t.concluido === true).length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-5"
        style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)" }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-white">Rotina Inteligente</h1>
          <button onClick={() => setSetupOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15">
            <Settings className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="text-white/70 text-xs">
          {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}
        </p>
        {tasks.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-white/10">
            <div className="flex justify-between mb-1">
              <p className="text-white/80 text-xs">{doneTasks}/{tasks.length} concluídas</p>
              <p className="text-white text-xs font-bold">{progress}%</p>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{width:`${progress}%`}} />
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-2">
        {(["hoje","historico"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==="historico") loadHistory(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab===t ? {background:"#1B4332",color:"#fff"} : {background:"rgba(0,0,0,0.04)",color:"#9CA3AF"}}>
            {t==="hoje" ? "Hoje" : "Histórico"}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4 space-y-4">
        {tab === "hoje" && (<>
          {/* Vídeo */}
          <div>
            <p className="text-sm font-bold mb-2" style={{color:"#1B4332"}}>Reconectando-se à Vida</p>
            <div className="w-full rounded-xl overflow-hidden shadow bg-black">
              <iframe src="https://drive.google.com/file/d/1Bt_yn6VN_NXryCSEkuCH1ZHEt3bZkZZx/preview"
                width="100%" style={{aspectRatio:"16/9",border:"none"}}
                allow="autoplay" allowFullScreen title="Reconectando-se à Vida" />
            </div>
          </div>

          {/* Não configurado */}
          {!prefs.configurado ? (
            <div className="flex flex-col items-center py-8 text-center space-y-3">
              <p className="font-bold text-base">Configure sua rotina</p>
              <p className="text-sm text-muted-foreground max-w-xs">A IA vai sugerir atividades personalizadas todo dia</p>
              <Button onClick={() => setSetupOpen(true)} className="text-white rounded-xl px-8"
                style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
                Configurar agora
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            /* Gerar */
            <div className="flex flex-col items-center py-8 text-center space-y-3">
              <p className="font-bold text-base">Pronto para começar?</p>
              <p className="text-sm text-muted-foreground max-w-xs">A IA vai gerar suas atividades de hoje</p>
              <Button onClick={generateTasks} disabled={generating} className="text-white rounded-2xl h-12 px-8"
                style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
                {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Gerando...</> : "Gerar atividades de hoje"}
              </Button>
            </div>
          ) : (
            /* Lista */
            <div className="space-y-3">
              {tasks.map(task => {
                const cfg = CAT[task.categoria] || CAT.lazer;
                const done = task.concluido === true;
                return (
                  <div key={task.id} className="rounded-2xl border p-4 bg-white transition-all"
                    style={{borderColor: done ? "#E5E7EB" : `${cfg.color}40`, opacity: done ? 0.75 : 1}}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {done
                          ? <CheckCircle2 className="h-5 w-5" style={{color:"#059669"}} />
                          : <Circle className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{task.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.descricao}</p>
                        {task.conteudo_ia && (() => {
                          const ytMatch = task.conteudo_ia.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+\S*/);
                          const ytUrl = ytMatch?.[0];
                          const textOnly = ytUrl ? task.conteudo_ia.replace(ytUrl, "").trim() : task.conteudo_ia;
                          return (
                            <>
                              <p className="text-xs mt-2 leading-relaxed whitespace-pre-line" style={{color:"#374151"}}>{textOnly}</p>
                              {ytUrl && (
                                <a href={ytUrl} target="_blank" rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                                  style={{background:`${cfg.color}15`,color:cfg.color}}>
                                  <ExternalLink className="h-3 w-3"/>Assistir vídeo de hoje →
                                </a>
                              )}
                            </>
                          );
                        })()}
                        {task.categoria === "leitura" && !done && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <a href="https://www.gutenberg.org" target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                              style={{background:"#7C3AED15",color:"#7C3AED"}}>
                              <ExternalLink className="h-3 w-3"/>Project Gutenberg
                            </a>
                            <a href="https://openlibrary.org" target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                              style={{background:"#7C3AED15",color:"#7C3AED"}}>
                              <ExternalLink className="h-3 w-3"/>Open Library
                            </a>
                          </div>
                        )}
                        {task.progresso && done && (
                          <p className="text-xs mt-1 font-medium" style={{color:"#059669"}}>✓ {task.progresso}</p>
                        )}
                        {!done && (
                          <button onClick={() => openModal(task)}
                            className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                            style={{background:`${cfg.color}15`,color:cfg.color}}>
                            <ChevronRight className="h-3.5 w-3.5"/>Registrar progresso
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {doneTasks === tasks.length && tasks.length > 0 && (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 mb-2" style={{color:"#059669"}} />
                  <p className="font-bold">Rotina completa! 🎉</p>
                  <p className="text-sm text-muted-foreground">Parabéns, você concluiu tudo hoje!</p>
                </div>
              )}
            </div>
          )}
        </>)}

        {tab === "historico" && (
          <div className="space-y-3">
            {histTasks.length === 0
              ? <p className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade concluída ainda.</p>
              : histTasks.map(task => {
                const cfg = CAT[task.categoria] || CAT.lazer;
                return (
                  <div key={task.id} className="p-4 rounded-2xl border border-border/30 bg-white flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:`${cfg.color}15`}}>
                      <span style={{color:cfg.color}}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{task.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.data + "T12:00:00").toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}
                        {task.progresso && ` · ${task.progresso}`}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{color:"#059669"}} />
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <BottomNavigation />
      <PortoSeguroButton />

      {/* Modal Leitura */}
      <Sheet open={readModal} onOpenChange={setReadModal}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <div className="px-6 pt-6 pb-10 space-y-4">
            <SheetTitle className="text-lg font-bold">Como foi sua leitura?</SheetTitle>
            {readTask?.conteudo_ia && <p className="text-sm text-muted-foreground">{readTask.conteudo_ia}</p>}
            <div className="flex gap-2 flex-wrap">
              <a href="https://www.gutenberg.org" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl"
                style={{background:"#7C3AED15",color:"#7C3AED"}}>
                <ExternalLink className="h-3 w-3"/>Project Gutenberg
              </a>
              <a href="https://openlibrary.org" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl"
                style={{background:"#7C3AED15",color:"#7C3AED"}}>
                <ExternalLink className="h-3 w-3"/>Open Library
              </a>
              <a href="https://bdlb.bn.gov.br" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl"
                style={{background:"#7C3AED15",color:"#7C3AED"}}>
                <ExternalLink className="h-3 w-3"/>Biblioteca Digital BR
              </a>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quantas páginas você leu hoje?</label>
              <Input type="number" placeholder="Ex: 15" value={pagesRead}
                onChange={e => setPagesRead(e.target.value)} className="text-lg h-12" />
            </div>
            <Button onClick={saveReading} disabled={savingRead || !pagesRead}
              className="w-full h-12 text-base font-bold rounded-2xl text-white"
              style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
              {savingRead ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar progresso"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal Esporte */}
      <Sheet open={sportModal} onOpenChange={setSportModal}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <div className="px-6 pt-6 pb-10 space-y-4">
            <SheetTitle className="text-lg font-bold">Como foi o treino?</SheetTitle>
            {sportTask?.conteudo_ia && <p className="text-sm text-muted-foreground">{sportTask.conteudo_ia}</p>}
            <Input placeholder="Ex: Fiz o treino completo, me senti bem..." value={sportDesc}
              onChange={e => setSportDesc(e.target.value)} className="h-12" />
            <Button onClick={saveSport} disabled={savingSport}
              className="w-full h-12 text-base font-bold rounded-2xl text-white"
              style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
              {savingSport ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal Lazer */}
      <Sheet open={lazerModal} onOpenChange={setLazerModal}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <div className="px-6 pt-6 pb-10 space-y-4">
            <SheetTitle className="text-lg font-bold">Como foi seu momento de lazer?</SheetTitle>
            {lazerTask?.conteudo_ia && <p className="text-sm text-muted-foreground">{lazerTask.conteudo_ia}</p>}
            <Input placeholder="Ex: Assisti um filme, joguei com meu filho..." value={lazerDesc}
              onChange={e => setLazerDesc(e.target.value)} className="h-12" />
            <Button onClick={saveLazer} disabled={savingLazer}
              className="w-full h-12 text-base font-bold rounded-2xl text-white"
              style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
              {savingLazer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal Espiritualidade */}
      <Sheet open={espModal} onOpenChange={setEspModal}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <div className="px-6 pt-6 pb-10 space-y-4">
            <SheetTitle className="text-lg font-bold">Como foi sua prática espiritual?</SheetTitle>
            {espTask?.conteudo_ia && <p className="text-sm text-muted-foreground">{espTask.conteudo_ia}</p>}
            <Input placeholder="Ex: Meditei 10 minutos, orei pela manhã..." value={espDesc}
              onChange={e => setEspDesc(e.target.value)} className="h-12" />
            <Button onClick={saveEsp} disabled={savingEsp}
              className="w-full h-12 text-base font-bold rounded-2xl text-white"
              style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
              {savingEsp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Setup Sheet */}
      <SetupSheet open={setupOpen} onOpenChange={setSetupOpen} userId={user!.id}
        existingPrefs={prefs} onSaved={loadAll} />
    </div>
  );
}

/* ─── Setup Sheet ─── */
function SetupSheet({ open, onOpenChange, userId, existingPrefs, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  userId: string; existingPrefs: Prefs; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [leituraAtivo, setLeituraAtivo] = useState(false);
  const [leituraTipo, setLeituraTipo] = useState("");
  const [esporteAtivo, setEsporteAtivo] = useState(false);
  const [esporteTipo, setEsporteTipo] = useState("");
  const [esporteNivel, setEsporteNivel] = useState("");
  const [esporteDias, setEsporteDias] = useState<string[]>([]);
  const [esporteTempo, setEsporteTempo] = useState(30);
  const [lazerAtivo, setLazerAtivo] = useState(false);
  const [espAtivo, setEspAtivo] = useState(false);

  useEffect(() => {
    if (open) {
      setLeituraAtivo(existingPrefs.leitura_ativo || false);
      setLeituraTipo(existingPrefs.leitura_tipo || "");
      setEsporteAtivo(existingPrefs.esporte_ativo || false);
      setEsporteTipo(existingPrefs.esporte_tipo || "");
      setEsporteNivel(existingPrefs.esporte_nivel || "");
      setEsporteDias(Array.isArray(existingPrefs.esporte_dias) ? existingPrefs.esporte_dias : []);
      setEsporteTempo(existingPrefs.esporte_tempo || 30);
      setLazerAtivo(existingPrefs.lazer_ativo || false);
      setEspAtivo(existingPrefs.espiritualidade_ativo || false);
    }
  }, [open, existingPrefs]);

  const toggleDia = (d: string) =>
    setEsporteDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const Chip = ({ label, sel, onSel, color }: { label: string; sel: boolean; onSel: () => void; color: string }) => (
    <button onClick={onSel} className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95"
      style={sel ? {background:color,color:"#fff",borderColor:color} : {borderColor:"#E5E7EB",background:"#fff",color:"#374151"}}>
      {label}
    </button>
  );

  const CatCard = ({ id, label, icon, color, ativo, onToggle, children }: any) => (
    <div className="rounded-2xl border overflow-hidden" style={{borderColor: ativo ? `${color}40` : "#E5E7EB"}}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4"
        style={{background: ativo ? `${color}08` : "#fff"}}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:`${color}15`}}>
          <span style={{color}}>{icon}</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">{label}</p>
        </div>
        {ativo && <CheckCircle2 className="h-5 w-5" style={{color}} />}
      </button>
      {ativo && children && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3" style={{borderColor:`${color}20`}}>
          {children}
        </div>
      )}
    </div>
  );

  async function handleSave() {
    if (!leituraAtivo && !esporteAtivo && !lazerAtivo && !espAtivo) {
      toast.error("Selecione pelo menos uma categoria.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("routine_preferences").upsert({
      user_id: userId,
      leitura_ativo: leituraAtivo, leitura_tipo: leituraTipo,
      esporte_ativo: esporteAtivo, esporte_tipo: esporteTipo,
      esporte_nivel: esporteNivel, esporte_dias: esporteDias,
      esporte_tempo: esporteTempo,
      lazer_ativo: lazerAtivo,
      espiritualidade_ativo: espAtivo,
      configurado: true,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Rotina salva!");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0" style={{height:"92vh"}}>
        <div className="h-full overflow-y-auto px-6 pb-28">
          <SheetHeader className="sticky top-0 bg-background pt-6 pb-4 z-10">
            <SheetTitle className="text-lg font-bold">Configure sua rotina</SheetTitle>
            <p className="text-xs text-muted-foreground">Configure uma vez — a IA cuida do resto todo dia</p>
          </SheetHeader>
          <div className="space-y-4">
            <CatCard id="leitura" label="Leitura" icon={<BookOpen className="h-5 w-5"/>}
              color="#7C3AED" ativo={leituraAtivo} onToggle={() => setLeituraAtivo(p => !p)}>
              <p className="text-xs font-medium text-muted-foreground">Tipo de livro preferido</p>
              <div className="flex flex-wrap gap-2">
                {["Autoconhecimento","Espiritualidade","Motivação","Finanças","Ficção","Desenvolvimento pessoal"].map(t => (
                  <Chip key={t} label={t} sel={leituraTipo===t} onSel={() => setLeituraTipo(t)} color="#7C3AED" />
                ))}
              </div>
            </CatCard>

            <CatCard id="esporte" label="Esporte" icon={<Dumbbell className="h-5 w-5"/>}
              color="#059669" ativo={esporteAtivo} onToggle={() => setEsporteAtivo(p => !p)}>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Modalidade</p>
                <div className="flex gap-2">
                  <Chip label="Academia" sel={esporteTipo==="academia"} onSel={() => setEsporteTipo("academia")} color="#059669" />
                  <Chip label="Corrida" sel={esporteTipo==="corrida"} onSel={() => setEsporteTipo("corrida")} color="#059669" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Nível</p>
                <div className="flex gap-2">
                  {["Iniciante","Intermediário","Avançado"].map(n => (
                    <Chip key={n} label={n} sel={esporteNivel===n} onSel={() => setEsporteNivel(n)} color="#059669" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Dias por semana</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DIAS.map(d => (
                    <button key={d} onClick={() => toggleDia(d)}
                      className="w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={esporteDias.includes(d) ? {background:"#059669",color:"#fff"} : {background:"#F3F4F6",color:"#374151"}}>
                      {DIAS_LABEL[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Tempo por treino</p>
                <div className="flex gap-2">
                  {[30,45,60,90].map(t => (
                    <Chip key={t} label={`${t}min`} sel={esporteTempo===t} onSel={() => setEsporteTempo(t)} color="#059669" />
                  ))}
                </div>
              </div>
            </CatCard>

            <CatCard id="lazer" label="Lazer" icon={<Smile className="h-5 w-5"/>}
              color="#D97706" ativo={lazerAtivo} onToggle={() => setLazerAtivo(p => !p)} />

            <CatCard id="espiritualidade" label="Espiritualidade" icon={<Leaf className="h-5 w-5"/>}
              color="#2563EB" ativo={espAtivo} onToggle={() => setEspAtivo(p => !p)} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={handleSave} disabled={saving}
            className="w-full h-[52px] text-base font-bold rounded-2xl text-white"
            style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)"}}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
            Salvar rotina
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
