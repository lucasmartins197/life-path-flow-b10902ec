import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Anchor,
  ChevronLeft,
  Edit,
  Send,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  X,
} from "lucide-react";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAnchorContacts, AnchorContact } from "@/hooks/useAnchorContacts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const RELATIONS = [
  { value: "familiar", label: "Familiar" },
  { value: "conjuge", label: "Cônjuge" },
  { value: "amigo", label: "Amigo(a)" },
  { value: "colega", label: "Colega" },
  { value: "terapeuta", label: "Terapeuta" },
];

const anchorSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  relationship: z.string().min(1, "Selecione a relação"),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(20, "Telefone inválido")
    .regex(/^[+\d\s()-]+$/, "Telefone inválido"),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
});

interface AnchorSettings {
  notify_inactive: boolean;
  notify_step_complete: boolean;
  notify_relapse: boolean;
  weekly_report: boolean;
}

interface AnchorAlert {
  id: string;
  alert_type: string;
  status: string;
  sent_at: string;
}

const ALERT_LABELS: Record<string, string> = {
  emergency: "Pedido de apoio urgente",
  inactive: "Inatividade detectada",
  relapse: "Recaída registrada",
  step_complete: "Conclusão de passo",
  weekly_report: "Relatório semanal",
  invite: "Convite ao âncora",
  update: "Mensagem de atualização",
};

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const last4 = digits.slice(-4);
  const first2 = digits.slice(0, 2);
  return `(${first2}) *****-${last4}`;
}

export default function AnchorHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contacts, primaryContact, addContact, updateContact } = useAnchorContacts();

  const [settings, setSettings] = useState<AnchorSettings>({
    notify_inactive: true,
    notify_step_complete: true,
    notify_relapse: true,
    weekly_report: true,
  });
  const [alerts, setAlerts] = useState<AnchorAlert[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const [editing, setEditing] = useState<AnchorContact | null>(null);
  const [sendingEmergency, setSendingEmergency] = useState(false);

  const [form, setForm] = useState({
    name: "",
    relationship: "familiar",
    phone: "+55 ",
    email: "",
    sendInvite: true,
  });

  const anchor = primaryContact || contacts[0];

  useEffect(() => {
    if (!user) return;
    loadSettings();
    loadAlerts();
  }, [user]);

  const loadSettings = async () => {
    const { data } = await supabase.from("anchor_settings").select("*").eq("user_id", user!.id).maybeSingle();
    if (data) {
      setSettings({
        notify_inactive: data.notify_inactive,
        notify_step_complete: data.notify_step_complete,
        notify_relapse: data.notify_relapse,
        weekly_report: data.weekly_report,
      });
    }
  };

  const loadAlerts = async () => {
    const { data } = await supabase
      .from("anchor_alerts")
      .select("id, alert_type, sent_at")
      .eq("user_id", user!.id)
      .order("sent_at", { ascending: false })
      .limit(10);
    if (data) setAlerts(data as AnchorAlert[]);
  };

  const updateSetting = async (key: keyof AnchorSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await supabase
      .from("anchor_settings")
      .upsert({ user_id: user!.id, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", relationship: "familiar", phone: "+55 ", email: "", sendInvite: true });
    setDialogOpen(true);
  };

  const openEdit = () => {
    if (!anchor) return;
    setEditing(anchor);
    setForm({
      name: anchor.name,
      relationship: anchor.relationship,
      phone: anchor.phone,
      email: anchor.email || "",
      sendInvite: false,
    });
    setDialogOpen(true);
  };

  const notifyWebhook = async (type: string, payload: any) => {
    try {
      await supabase.functions.invoke("notify-guardian", {
        body: { type, ...payload },
      });
    } catch (e) {
      console.warn("notify-guardian failed", e);
    }
  };

  const logAlert = async (alert_type: string, message?: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("anchor_alerts")
      .insert({
        user_id: user.id,
        contact_id: anchor?.id,
        alert_type,
        message,
        status: "sent",
      })
      .select("id, alert_type, status, sent_at")
      .single();
    if (data) setAlerts((prev) => [data as AnchorAlert, ...prev]);
  };

  const handleSave = async () => {
    const parsed = anchorSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    const data = parsed.data;
    if (editing) {
      await updateContact(editing.id, {
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        email: data.email || null,
      });
      toast.success("Âncora atualizado");
    } else {
      const ok = await addContact({
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        email: data.email || undefined,
        is_primary: contacts.length === 0,
        receive_alerts: true,
        receive_reports: true,
      });
      if (!ok) return;
      if (form.sendInvite) {
        await notifyWebhook("invite", {
          guardian_name: data.name,
          guardian_phone: data.phone,
          guardian_email: data.email,
          user_name: user?.user_metadata?.full_name || "Um usuário",
        });
        await logAlert("invite", `Convite enviado para ${data.name}`);
        toast.success("Convite enviado ao âncora");
      }
    }
    setDialogOpen(false);
  };

  const handleSendUpdate = async () => {
    if (!anchor) return;
    // Abre WhatsApp do próprio usuário com mensagem pré-preenchida
    const userName = user?.user_metadata?.full_name || "Seu apoiado";
    const phone = anchor.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá ${anchor.name}! Sou ${userName} e estou usando o app Stake Real para me recuperar. Queria te dar uma atualização: estou bem e continuando minha jornada. Obrigado pelo seu apoio! 💚`,
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    await logAlert("update", "Mensagem de atualização enviada via WhatsApp");
    toast.success("Abrindo WhatsApp...");
  };

  const handleEmergency = async () => {
    if (!anchor) return;
    setSendingEmergency(true);
    try {
      // Abre WhatsApp do próprio usuário com mensagem de urgência
      const userName = user?.user_metadata?.full_name || "Seu apoiado";
      const phone = anchor.phone.replace(/\D/g, "");
      const message = encodeURIComponent(
        `🚨 ${anchor.name}, preciso de ajuda urgente! Estou com muita vontade de apostar e preciso do seu apoio agora. Por favor, me liga ou me manda mensagem o mais rápido possível. - ${userName}`,
      );
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      await logAlert("emergency", "Pedido de apoio urgente enviado via WhatsApp");
      toast.success("Abrindo WhatsApp para contato urgente...");
    } finally {
      setSendingEmergency(false);
      setConfirmEmergency(false);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-5 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Anchor className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meu Contato Âncora</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Sua rede de apoio fora do app</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {/* Seção 1 — Âncora */}
        {anchor ? (
          <section className="card-premium p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {anchor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{anchor.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {RELATIONS.find((r) => r.value === anchor.relationship)?.label || anchor.relationship}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {maskPhone(anchor.phone)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-[10px] font-semibold text-success uppercase tracking-wide">Ativo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={openEdit}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={handleSendUpdate}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
                Atualização
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border-2 border-dashed border-primary/40 p-6 text-center">
            <Anchor className="h-10 w-10 mx-auto text-primary/60 mb-3" />
            <p className="text-sm text-foreground font-medium">Você ainda não tem um âncora cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Escolha alguém de confiança para te acompanhar</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Cadastrar meu âncora
            </button>
          </section>
        )}

        {/* Seção 2 — O que é */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <h2 className="font-bold text-base mb-3">Por que ter um âncora?</h2>
          <ul className="space-y-2.5 text-sm">
            <li className="flex gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-primary-foreground shrink-0" />
              <span>Alguém que sabe da sua jornada e te apoia</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-primary-foreground shrink-0" />
              <span>Recebe alertas se você ficar inativo por 3 dias</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-primary-foreground shrink-0" />
              <span>Uma âncora humana quando o impulso aparecer</span>
            </li>
          </ul>
        </section>

        {/* Seção 3 — Notificações */}
        <section>
          <p className="section-title">Notificações ao âncora</p>
          <div className="card-premium p-2 divide-y divide-border">
            {[
              { key: "notify_inactive", label: "Notificar se eu ficar inativo por 3 dias" },
              { key: "notify_step_complete", label: "Notificar quando eu concluir um passo" },
              { key: "notify_relapse", label: "Notificar em caso de recaída registrada" },
              { key: "weekly_report", label: "Enviar relatório semanal do meu progresso" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-3.5">
                <span className="text-sm text-foreground flex-1">{item.label}</span>
                <Switch
                  checked={settings[item.key as keyof AnchorSettings]}
                  onCheckedChange={(v) => updateSetting(item.key as keyof AnchorSettings, v)}
                  disabled={!anchor}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Seção 4 — Emergência */}
        {anchor && (
          <section>
            <button
              onClick={() => setConfirmEmergency(true)}
              className="w-full h-14 rounded-xl bg-destructive text-destructive-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-lg"
              style={{ backgroundColor: "#DC2626" }}
            >
              <AlertTriangle className="h-5 w-5" />
              Preciso do meu âncora AGORA
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Notifica {anchor.name} imediatamente via WhatsApp
            </p>
          </section>
        )}

        {/* Seção 5 — Histórico */}
        <section>
          <p className="section-title">Histórico de alertas</p>
          {alerts.length === 0 ? (
            <div className="card-premium p-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum alerta enviado ainda</p>
            </div>
          ) : (
            <div className="card-premium divide-y divide-border">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Send className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ALERT_LABELS[a.alert_type] || a.alert_type}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{new Date(a.sent_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      a.status === "sent" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {a.status === "sent" ? "Enviado" : a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Dialog cadastro/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar âncora" : "Cadastrar meu âncora"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="anchor-name">Nome completo</Label>
              <Input
                id="anchor-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={120}
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div>
              <Label>Relação</Label>
              <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="anchor-phone">WhatsApp</Label>
              <Input
                id="anchor-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+55 11 99999-0000"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="anchor-email">Email (opcional)</Label>
              <Input
                id="anchor-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                placeholder="email@exemplo.com"
              />
            </div>
            {!editing && (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Enviar convite ao âncora</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Mensagem explicando o app e o papel dele</p>
                </div>
                <Switch checked={form.sendInvite} onCheckedChange={(v) => setForm({ ...form, sendInvite: v })} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
            >
              Salvar âncora
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação emergência */}
      <AlertDialog open={confirmEmergency} onOpenChange={setConfirmEmergency}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acionar contato âncora?</AlertDialogTitle>
            <AlertDialogDescription>
              Vamos notificar <strong>{anchor?.name}</strong> agora via WhatsApp pedindo apoio urgente. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmergency}
              disabled={sendingEmergency}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sendingEmergency ? "Enviando..." : "Sim, notificar agora"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
