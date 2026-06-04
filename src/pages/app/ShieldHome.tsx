import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Shield, Plus, Trash2, Apple, Smartphone, UserRound, Mail, Phone,
  Heart, Flame, AlertTriangle, Check, Sparkles, X, MessageCircle, Copy, ExternalLink,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useShield } from "@/hooks/useShield";

const BREATHING_TIPS = [
  "Respire fundo: 4 segundos inspirando, 7 segurando, 8 soltando. Repita 3 vezes.",
  "Saia agora do lugar onde está. Caminhe por 2 minutos — só isso já reduz o impulso.",
  "Beba um copo grande de água gelada lentamente. O corpo se reorganiza.",
  "Ligue para alguém de confiança e diga: 'Estou sentindo vontade'. Você não precisa lutar sozinho.",
  "Lembra do motivo pelo qual começou esta jornada. Esse motivo ainda existe — e é maior que o impulso.",
];

export default function ShieldHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    loading, sites, guardian, streak, todayConfirmation, configured,
    addSite, toggleSite, removeSite, saveGuardian, registerTemptation, confirmDay,
  } = useShield();

  const [newUrl, setNewUrl] = useState("");
  const [tab, setTab] = useState<"iphone" | "android">("iphone");
  const [showTemptation, setShowTemptation] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipReady, setTipReady] = useState(false);

  // Guardian form
  const [gName, setGName] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [gNotify, setGNotify] = useState(true);
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  // 21h confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (guardian) {
      setGName(guardian.guardian_name || "");
      setGEmail(guardian.guardian_email || "");
      setGPhone(guardian.guardian_phone || "");
      setGNotify(guardian.notify_on_temptation);
    }
  }, [guardian]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 21 && !todayConfirmation && !loading) setShowConfirmation(true);
  }, [todayConfirmation, loading]);

  const handleAddSite = async () => {
    try {
      await addSite(newUrl);
      setNewUrl("");
      toast({ title: "Site adicionado à sua lista" });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const handleSaveGuardian = async () => {
    if (gName.trim().length < 2) {
      toast({ title: "Informe o nome do seu Guardião", variant: "destructive" });
      return;
    }
    if (!gEmail && !gPhone) {
      toast({ title: "Informe email ou telefone", variant: "destructive" });
      return;
    }
    setSavingGuardian(true);
    try {
      await saveGuardian({
        guardian_name: gName.trim(),
        guardian_email: gEmail.trim() || undefined,
        guardian_phone: gPhone.trim() || undefined,
        notify_on_temptation: gNotify,
      });
      toast({ title: "Guardião registrado", description: "Convite enviado com instruções." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleTemptation = async () => {
    setShowTemptation(true);
    setTipReady(false);
    setTipIndex(Math.floor(Math.random() * BREATHING_TIPS.length));
    // Ana responde em < 3s
    setTimeout(() => setTipReady(true), 1200);
    try {
      await registerTemptation();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDay = async (clean: boolean) => {
    try {
      await confirmDay(clean);
      setShowConfirmation(false);
      toast({
        title: clean ? "Mais um dia de vitória!" : "Obrigada por sua honestidade",
        description: clean
          ? "Você fortaleceu sua jornada hoje."
          : "Recaída faz parte do processo. Estamos juntos.",
      });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-3"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">Meu Escudo</h1>
              <p className="text-sm text-muted-foreground">Sua proteção contra recaída</p>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-600">{streak}d</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 space-y-6">
        {/* SEÇÃO 4 — DETECTOR (no topo, prioridade) */}
        <section>
          <button
            onClick={handleTemptation}
            className="w-full p-5 rounded-2xl text-white font-semibold text-base flex items-center gap-3 transition-all active:scale-[0.98] shadow-lg"
            style={{
              background: "linear-gradient(135deg, hsl(0 75% 45%), hsl(0 80% 55%))",
              boxShadow: "0 10px 30px -10px hsl(0 75% 45% / 0.5)",
            }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold">Estou sentindo vontade de apostar agora</p>
              <p className="text-xs opacity-90 mt-0.5">Toque aqui — a Ana atende imediatamente</p>
            </div>
          </button>
        </section>

        {/* SEÇÃO 1 — SITES */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <h2 className="text-base font-bold mb-1">Sites bloqueados</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Lista das casas de aposta que você quer evitar. Use no Tempo de Uso / Bem-estar Digital do seu celular.
          </p>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="adicionar site (ex: pixbet.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
              className="h-10 text-sm"
            />
            <button
              onClick={handleAddSite}
              disabled={!newUrl.trim()}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <ul className="space-y-1.5">
              {sites.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/30"
                >
                  <span className={`flex-1 text-sm font-mono truncate ${s.active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {s.url}
                  </span>
                  <Switch
                    checked={s.active}
                    onCheckedChange={(v) => toggleSite(s.id, v)}
                  />
                  {!s.is_default && (
                    <button
                      onClick={() => removeSite(s.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* SEÇÃO 2 — TUTORIAL */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <h2 className="text-base font-bold mb-3">Como bloquear no celular</h2>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="iphone" className="gap-2">
                <Apple className="h-4 w-4" /> iPhone
              </TabsTrigger>
              <TabsTrigger value="android" className="gap-2">
                <Smartphone className="h-4 w-4" /> Android
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iphone">
              <ol className="space-y-3 text-sm">
                {[
                  "Abra Ajustes no iPhone",
                  "Toque em Tempo de Uso",
                  "Toque em Restrições de Conteúdo e Privacidade",
                  "Ative e toque em Restrições de Conteúdo",
                  "Toque em Conteúdo Web → Limitar sites adultos",
                  "Em Nunca Permitir, adicione cada site da sua lista",
                  "Defina uma senha que não seja fácil — peça para alguém de confiança definir por você",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-foreground/85 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="android">
              <ol className="space-y-3 text-sm">
                {[
                  "Abra Configurações",
                  "Toque em Bem-estar digital e controle parental",
                  "Toque em Controles parentais (Family Link)",
                  "Ative e configure a restrição de sites — adicione cada URL da sua lista",
                  "Peça a um Guardião para definir a senha de bloqueio",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-foreground/85 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </TabsContent>
          </Tabs>
        </section>

        {/* SEÇÃO 3 — ÂNCORA DIGITAL */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold">Guardião Digital</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Uma pessoa de confiança que define a senha do bloqueio — assim você não consegue desativar sozinho num momento de fragilidade.
          </p>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Nome do guardião" className="h-10" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</Label>
              <Input
                type="email"
                value={gEmail}
                onChange={(e) => setGEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5"><Phone className="h-3 w-3" /> Telefone (opcional)</Label>
              <Input
                value={gPhone}
                onChange={(e) => setGPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                className="h-10"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
              <div className="flex-1 pr-3">
                <p className="text-sm font-medium">Avisar em momentos de tentação</p>
                <p className="text-xs text-muted-foreground">O guardião recebe alerta quando você toca o botão vermelho</p>
              </div>
              <Switch checked={gNotify} onCheckedChange={setGNotify} />
            </div>
            <button
              onClick={handleSaveGuardian}
              disabled={savingGuardian}
              className="w-full h-11 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              {savingGuardian ? "Salvando..." : guardian ? "Atualizar guardião" : "Convidar guardião"}
            </button>
            {guardian?.invite_sent_at && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <Check className="h-3 w-3 text-primary" />
                Convite enviado em {new Date(guardian.invite_sent_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </section>

        {/* SEÇÃO 5 — STATUS DA CONFIGURAÇÃO */}
        <section
          className="rounded-2xl p-4 border"
          style={
            configured
              ? { background: "hsl(140 50% 95%)", borderColor: "hsl(140 40% 70%)" }
              : { background: "hsl(45 90% 95%)", borderColor: "hsl(45 60% 70%)" }
          }
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: configured ? "hsl(140 60% 35%)" : "hsl(35 90% 50%)",
              }}
            >
              {configured ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: configured ? "#0E3320" : "#5A3A00" }}>
                {configured ? "Escudo ativo" : "Escudo incompleto"}
              </p>
              <p className="text-xs" style={{ color: configured ? "#1E5638" : "#7A5A20" }}>
                {configured
                  ? "Sua proteção está configurada. Mantenha o bloqueio nativo ativo."
                  : "Configure pelo menos um site e um guardião."}
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />

      {/* === Detector de tentação modal === */}
      {showTemptation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl animate-slide-up safe-bottom">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ana</p>
                  <p className="text-sm font-bold">Estou aqui com você</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemptation(false)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {!tipReady ? (
              <div className="flex items-center gap-2 py-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                <span className="text-sm text-muted-foreground ml-1">Ana está respondendo...</span>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-primary/5 mb-4 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {BREATHING_TIPS[tipIndex]}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-4 text-center">
                  Esse impulso passa em 5 a 15 minutos. Você é maior que ele.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setShowTemptation(false); navigate("/app/ancora"); }}
                    className="py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold"
                  >
                    Acionar âncora
                  </button>
                  <button
                    onClick={() => setShowTemptation(false)}
                    className="py-3 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
                  >
                    <MessageCircle className="h-4 w-4" /> Já passou
                  </button>
                </div>
                {guardian?.notify_on_temptation && (
                  <p className="text-[10px] text-muted-foreground text-center mt-3">
                    Seu guardião foi avisado — você não está sozinho.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* === Confirmação 21h === */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl animate-slide-up safe-bottom">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ana — confirmação do dia</p>
                <p className="text-sm font-bold">Você ficou longe das apostas hoje?</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 mb-5 leading-relaxed">
              Sua resposta é sigilosa e me ajuda a acompanhar sua jornada com você.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleConfirmDay(true)}
                className="w-full py-3.5 rounded-2xl text-white font-semibold active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
              >
                Sim — dia limpo
              </button>
              <button
                onClick={() => handleConfirmDay(false)}
                className="w-full py-3.5 rounded-2xl border border-border bg-secondary/40 text-foreground font-semibold active:scale-[0.98]"
              >
                Não — quero conversar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
