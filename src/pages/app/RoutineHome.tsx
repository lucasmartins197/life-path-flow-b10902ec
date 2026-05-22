import { useEffect, useState } from "react";
import { Settings, CheckCircle2, Circle, Loader2, History, ListTodo, BookOpen, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { BackHeader } from "@/components/BackHeader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoutinePreferences {
  leitura_ativo: boolean;
  leitura_tipo: string;
  esporte_ativo: boolean;
  esporte_tipo: string;
  esporte_nivel: string;
  esporte_dias: number;
  esporte_tempo: number;
  lazer_ativo: boolean;
  espiritualidade_ativo: boolean;
  configurado: boolean;
}

interface DailyTask {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  conteudo_ia: string;
  data: string;
  concluido: boolean;
  concluido_em: string | null;
}

const DEFAULT_PREFS: RoutinePreferences = {
  leitura_ativo: false,
  leitura_tipo: "",
  esporte_ativo: false,
  esporte_tipo: "",
  esporte_nivel: "",
  esporte_dias: 0,
  esporte_tempo: 30,
  lazer_ativo: false,
  espiritualidade_ativo: false,
  configurado: false,
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function RoutineHome() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<RoutinePreferences>(DEFAULT_PREFS);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [history, setHistory] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readingTask, setReadingTask] = useState<DailyTask | null>(null);
  const [readingPages, setReadingPages] = useState<string>("");
  const [savingReading, setSavingReading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadPrefs(), loadTasks(), loadHistory()]);
    setLoading(false);
  };

  const loadPrefs = async () => {
    const { data } = await supabase
      .from("routine_preferences")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      const d: any = data;
      setPrefs({
        ...DEFAULT_PREFS,
        ...d,
        esporte_dias: Array.isArray(d.esporte_dias)
          ? d.esporte_dias.length || DEFAULT_PREFS.esporte_dias
          : Number(d.esporte_dias) || DEFAULT_PREFS.esporte_dias,
      });
    }
  };

  const loadTasks = async () => {
    const { data } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user!.id)
      .eq("data", today())
      .order("created_at", { ascending: true });
    setTasks((data as DailyTask[]) || []);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user!.id)
      .eq("concluido", true)
      .lt("data", today())
      .order("data", { ascending: false })
      .limit(50);
    setHistory((data as DailyTask[]) || []);
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      leitura_ativo: prefs.leitura_ativo,
      leitura_tipo: prefs.leitura_tipo,
      esporte_ativo: prefs.esporte_ativo,
      esporte_tipo: prefs.esporte_tipo,
      esporte_nivel: prefs.esporte_nivel,
      esporte_dias: Array.from({ length: prefs.esporte_dias }, (_, i) => String(i)),
      esporte_tempo: prefs.esporte_tempo,
      lazer_ativo: prefs.lazer_ativo,
      espiritualidade_ativo: prefs.espiritualidade_ativo,
      configurado: true,
    };
    const { error } = await supabase
      .from("routine_preferences")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar preferências");
      return;
    }
    setPrefs((p) => ({ ...p, configurado: true }));
    toast.success("Preferências salvas");
    setSettingsOpen(false);
  };

  async function gerarSugestaoIA(categoria: string): Promise<string> {
    try {
      let context: any = {};
      if (categoria === "leitura" && user) {
        const { data: lp } = await supabase
          .from("reading_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("ativo", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lp) context.livroAtual = lp;
      }
      const { data, error } = await supabase.functions.invoke("routine-suggestion", {
        body: { categoria, prefs, context },
      });
      if (error) {
        console.error("routine-suggestion error", error);
        return "";
      }
      return (data?.sugestao as string) || "";
    } catch (e) {
      console.error(e);
      return "";
    }
  }


  const generateTodayTasks = async () => {
    if (!user) return;
    setGenerating(true);
    const d = today();

    const { data: existing } = await supabase
      .from("daily_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("data", d)
      .limit(1);
    if (existing && existing.length > 0) {
      setGenerating(false);
      toast.info("Suas atividades de hoje já foram geradas.");
      void loadTasks();
      return;
    }

    const newTasks: Omit<DailyTask, "id" | "concluido" | "concluido_em">[] = [];

    if (prefs.leitura_ativo) {
      newTasks.push({
        categoria: "leitura",
        titulo: "Leitura do dia",
        descricao: `Tema preferido: ${prefs.leitura_tipo || "livre"}`,
        conteudo_ia: await gerarSugestaoIA("leitura"),
        data: d,
      });
    }
    if (prefs.esporte_ativo) {
      newTasks.push({
        categoria: "esporte",
        titulo: prefs.esporte_tipo === "academia" ? "Treino na academia" : "Treino de corrida",
        descricao: `${prefs.esporte_tipo || "esporte"} — ${prefs.esporte_nivel || "iniciante"} — ${prefs.esporte_tempo || 30}min`,
        conteudo_ia: await gerarSugestaoIA("esporte"),
        data: d,
      });
    }
    if (prefs.lazer_ativo) {
      newTasks.push({
        categoria: "lazer",
        titulo: "Momento de lazer",
        descricao: "Atividade saudável de hoje",
        conteudo_ia: await gerarSugestaoIA("lazer"),
        data: d,
      });
    }
    if (prefs.espiritualidade_ativo) {
      newTasks.push({
        categoria: "espiritualidade",
        titulo: "Prática espiritual",
        descricao: "Conexão espiritual de hoje",
        conteudo_ia: await gerarSugestaoIA("espiritualidade"),
        data: d,
      });
    }

    if (newTasks.length === 0) {
      setGenerating(false);
      toast.error("Ative ao menos uma categoria nas configurações");
      return;
    }

    const { error } = await supabase
      .from("daily_tasks")
      .insert(newTasks.map((t) => ({ ...t, user_id: user.id })));

    setGenerating(false);
    if (error) {
      toast.error("Erro ao gerar atividades");
      return;
    }
    toast.success("Atividades de hoje geradas pela IA!");
    void loadTasks();
  };

  const markDone = async (id: string) => {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ concluido: true, concluido_em: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao marcar tarefa");
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, concluido: true } : t)));
  };

  const resetRoutine = async () => {
    if (!user) return;
    if (!window.confirm("Tem certeza que deseja resetar sua rotina? Suas preferências e tarefas de hoje serão apagadas.")) return;
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("routine_preferences").delete().eq("user_id", user.id),
      supabase.from("daily_tasks").delete().eq("user_id", user.id).eq("data", today()),
    ]);
    setSaving(false);
    if (e1 || e2) {
      toast.error("Erro ao resetar rotina");
      return;
    }
    setPrefs(DEFAULT_PREFS);
    setTasks([]);
    setSettingsOpen(false);
    toast.success("Rotina resetada. Configure novamente quando quiser.");
  };

  const SettingsSheet = (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center touch-target">
          <Settings className="h-5 w-5 text-white" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configurar rotina</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Leitura</Label>
              <Switch
                checked={prefs.leitura_ativo}
                onCheckedChange={(v) => setPrefs({ ...prefs, leitura_ativo: v })}
              />
            </div>
            {prefs.leitura_ativo && (
              <Select
                value={prefs.leitura_tipo}
                onValueChange={(v) => setPrefs({ ...prefs, leitura_tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="autoajuda">Autoajuda</SelectItem>
                  <SelectItem value="ficcao">Ficção</SelectItem>
                  <SelectItem value="biografia">Biografia</SelectItem>
                  <SelectItem value="espiritualidade">Espiritualidade</SelectItem>
                  <SelectItem value="negocios">Negócios</SelectItem>
                </SelectContent>
              </Select>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Esporte</Label>
              <Switch
                checked={prefs.esporte_ativo}
                onCheckedChange={(v) => setPrefs({ ...prefs, esporte_ativo: v })}
              />
            </div>
            {prefs.esporte_ativo && (
              <div className="space-y-3">
                <Select
                  value={prefs.esporte_tipo}
                  onValueChange={(v) => setPrefs({ ...prefs, esporte_tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academia">Academia</SelectItem>
                    <SelectItem value="corrida">Corrida</SelectItem>
                    <SelectItem value="caminhada">Caminhada</SelectItem>
                    <SelectItem value="ciclismo">Ciclismo</SelectItem>
                    <SelectItem value="natacao">Natação</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={prefs.esporte_nivel}
                  onValueChange={(v) => setPrefs({ ...prefs, esporte_nivel: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Dias/semana</Label>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={prefs.esporte_dias}
                      onChange={(e) =>
                        setPrefs({ ...prefs, esporte_dias: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tempo (min)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={180}
                      value={prefs.esporte_tempo}
                      onChange={(e) =>
                        setPrefs({ ...prefs, esporte_tempo: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="flex items-center justify-between">
            <Label className="text-base font-semibold">Lazer</Label>
            <Switch
              checked={prefs.lazer_ativo}
              onCheckedChange={(v) => setPrefs({ ...prefs, lazer_ativo: v })}
            />
          </section>

          <section className="flex items-center justify-between">
            <Label className="text-base font-semibold">Espiritualidade</Label>
            <Switch
              checked={prefs.espiritualidade_ativo}
              onCheckedChange={(v) => setPrefs({ ...prefs, espiritualidade_ativo: v })}
            />
          </section>

          <Button
            onClick={savePrefs}
            disabled={saving}
            className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar rotina
          </Button>

          <Button
            onClick={resetRoutine}
            disabled={saving}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Resetar rotina (começar do zero)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-[#F5F0E8] safe-top pb-28">
      <BackHeader />

      <header
        className="px-5 pt-2 pb-5"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Rotina Inteligente</h1>
            <p className="text-white/75 text-xs mt-0.5">Seu dia com propósito</p>
          </div>
          {SettingsSheet}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 space-y-5">
        <section
          className="overflow-hidden rounded-2xl bg-black"
          style={{ aspectRatio: "16 / 9" }}
        >
          <iframe
            src="https://drive.google.com/file/d/1Bt_yn6VN_NXryCSEkuCH1ZHEt3bZkZZx/preview"
            allow="autoplay"
            className="w-full h-full"
            allowFullScreen
          />
        </section>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#1B4332]" />
          </div>
        ) : !prefs.configurado ? (
          <div className="bg-white rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <p className="text-foreground font-medium">
              Configure sua rotina para começar.
            </p>
            <p className="text-sm text-muted-foreground">
              Escolha categorias e preferências para receber atividades personalizadas.
            </p>
            <Button
              onClick={() => setSettingsOpen(true)}
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]"
            >
              Configurar rotina
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="hoje">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="hoje" className="gap-2">
                <ListTodo className="h-4 w-4" /> Hoje
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <History className="h-4 w-4" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hoje" className="space-y-3 mt-4">
              {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center space-y-4 shadow-sm">
                  <p className="text-foreground font-medium">
                    Nenhuma atividade para hoje ainda.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gere sua rotina baseada nas suas preferências.
                  </p>
                  <Button
                    onClick={generateTodayTasks}
                    disabled={generating}
                    className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]"
                  >
                    {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Gerar atividades de hoje
                  </Button>
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {t.concluido ? (
                        <CheckCircle2 className="h-5 w-5 text-[#1B4332] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{t.titulo}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {t.descricao}
                        </p>
                        {t.conteudo_ia && (
                          <p className="text-sm text-foreground/80 mt-2 whitespace-pre-line">
                            {t.conteudo_ia}
                          </p>
                        )}
                        <span className="inline-block text-[10px] uppercase tracking-wider mt-2 px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] font-semibold">
                          {t.categoria}
                        </span>
                      </div>
                    </div>
                    {!t.concluido && (
                      <Button
                        onClick={() => markDone(t.id)}
                        variant="outline"
                        className="w-full border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white"
                      >
                        Marcar como feito
                      </Button>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-3 mt-4">
              {history.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
                  Você ainda não concluiu atividades em dias anteriores.
                </div>
              ) : (
                history.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#1B4332] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{t.titulo}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(t.data).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <span className="inline-block text-[10px] uppercase tracking-wider mt-2 px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] font-semibold">
                        {t.categoria}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
