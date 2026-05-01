import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowLeft, Plus, Pencil, Camera, Star, Loader2, Check, X, Search,
  Calendar as CalendarIcon, BarChart3, User, Award, Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProType = "psicologo" | "terapeuta" | "psiquiatra";

interface Professional {
  id: string;
  user_id: string;
  full_name: string | null;
  specialty: string | null;
  professional_type: ProType | null;
  council_number: string | null;
  council_state: string | null;
  bio: string | null;
  photo_url: string | null;
  professional_email: string | null;
  whatsapp: string | null;
  meeting_link: string | null;
  approach: string[] | null;
  specialties: string[] | null;
  gambling_specialist: boolean;
  is_approved: boolean;
  is_online: boolean;
  hourly_rate: number | null;
  payout_amount: number | null;
  accepts_plan: boolean;
  total_sessions: number | null;
  rating: number | null;
  availability: Record<string, string[]>;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  user_id: string;
  professional_id: string;
  duration_minutes: number;
  rating: number | null;
}

const APPROACHES = ["TCC", "Psicanálise", "Humanista", "Integrativa", "Sistêmica", "Outra"];
const SPECIALTIES_LIST = [
  "Ludopatia", "Dependência química", "Ansiedade", "Depressão",
  "Trauma", "Família", "Relacionamentos",
];

const DAYS = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
];
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

const proSchema = z.object({
  full_name: z.string().trim().min(2, "Nome obrigatório").max(120),
  professional_type: z.enum(["psicologo","terapeuta","psiquiatra"]),
  specialty: z.string().trim().min(2, "Especialidade obrigatória").max(120),
  council_number: z.string().trim().min(2, "Registro obrigatório").max(40),
  council_state: z.string().trim().max(2).optional().or(z.literal("")),
  bio: z.string().trim().max(300, "Máx. 300 caracteres").optional().or(z.literal("")),
  professional_email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  meeting_link: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  hourly_rate: z.coerce.number().min(0).optional(),
  payout_amount: z.coerce.number().min(0).optional(),
});

const emptyDraft = {
  full_name: "",
  professional_type: "psicologo" as ProType,
  specialty: "",
  council_number: "",
  council_state: "",
  bio: "",
  professional_email: "",
  whatsapp: "",
  meeting_link: "",
  hourly_rate: 229.90,
  payout_amount: 160,
  approach: [] as string[],
  specialties: [] as string[],
  gambling_specialist: false,
  accepts_plan: false,
  is_approved: true,
  photo_url: "",
  availability: {} as Record<string, string[]>,
};

function getInitials(name: string | null) {
  if (!name) return "PR";
  return name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatBRL(v: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

export default function AdminProfessionals() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pros, setPros] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"dados"|"abordagem"|"disponibilidade"|"agenda"|"relatorio">("dados");

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [proRes, apptRes] = await Promise.all([
      supabase.from("professional_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("id, scheduled_at, status, user_id, professional_id, duration_minutes, rating").order("scheduled_at", { ascending: true }),
    ]);
    setPros((proRes.data as any) || []);
    setAppointments((apptRes.data as any) || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pros;
    return pros.filter(p =>
      (p.full_name ?? "").toLowerCase().includes(q)
      || (p.specialty ?? "").toLowerCase().includes(q)
      || (p.council_number ?? "").toLowerCase().includes(q),
    );
  }, [pros, search]);

  function openNew() {
    setEditingId(null);
    setDraft({ ...emptyDraft });
    setTab("dados");
    setOpen(true);
  }

  function openEdit(p: Professional) {
    setEditingId(p.id);
    setDraft({
      full_name: p.full_name ?? "",
      professional_type: (p.professional_type as ProType) ?? "psicologo",
      specialty: p.specialty ?? "",
      council_number: p.council_number ?? "",
      council_state: p.council_state ?? "",
      bio: p.bio ?? "",
      professional_email: p.professional_email ?? "",
      whatsapp: p.whatsapp ?? "",
      meeting_link: p.meeting_link ?? "",
      hourly_rate: Number(p.hourly_rate ?? 0),
      payout_amount: Number(p.payout_amount ?? 0),
      approach: p.approach ?? [],
      specialties: p.specialties ?? [],
      gambling_specialist: p.gambling_specialist,
      accepts_plan: p.accepts_plan,
      is_approved: p.is_approved,
      photo_url: p.photo_url ?? "",
      availability: (p.availability as any) ?? {},
    });
    setTab("dados");
    setOpen(true);
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = f.name.split(".").pop() || "jpg";
      const path = `pro-${editingId ?? "new"}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("professionals").upload(path, f, {
        upsert: true, cacheControl: "3600", contentType: f.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("professionals").getPublicUrl(path);
      setDraft(d => ({ ...d, photo_url: data.publicUrl }));
      toast({ title: "Foto enviada" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function toggleArr(key: "approach"|"specialties", v: string) {
    setDraft(d => {
      const arr = d[key];
      const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
      return { ...d, [key]: next };
    });
  }

  function toggleSlot(day: string, hour: string) {
    setDraft(d => {
      const cur = d.availability[day] ?? [];
      const next = cur.includes(hour) ? cur.filter(h => h !== hour) : [...cur, hour].sort();
      return { ...d, availability: { ...d.availability, [day]: next } };
    });
  }

  async function handleSave() {
    const parsed = proSchema.safeParse(draft);
    if (!parsed.success) {
      toast({ title: "Verifique os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: parsed.data.full_name,
        professional_type: parsed.data.professional_type,
        specialty: parsed.data.specialty,
        council_number: parsed.data.council_number,
        council_state: parsed.data.council_state || null,
        bio: parsed.data.bio || null,
        professional_email: parsed.data.professional_email || null,
        whatsapp: parsed.data.whatsapp || null,
        meeting_link: parsed.data.meeting_link || null,
        hourly_rate: parsed.data.hourly_rate ?? 0,
        payout_amount: parsed.data.payout_amount ?? 0,
        approach: draft.approach,
        specialties: draft.specialties,
        gambling_specialist: draft.gambling_specialist,
        accepts_plan: draft.accepts_plan,
        is_approved: draft.is_approved,
        photo_url: draft.photo_url || null,
        availability: draft.availability,
      };

      if (editingId) {
        const { error } = await supabase.from("professional_profiles").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        // For new pros without an auth user yet, attach to the admin's user_id as placeholder
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("professional_profiles").insert({
          ...payload, user_id: u.user?.id,
        } as any);
        if (error) throw error;
      }
      toast({ title: editingId ? "Profissional atualizado" : "Profissional cadastrado" });
      setOpen(false);
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Professional) {
    const next = !p.is_approved;
    const { error } = await supabase.from("professional_profiles")
      .update({ is_approved: next }).eq("id", p.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setPros(list => list.map(x => x.id === p.id ? { ...x, is_approved: next } : x));
    toast({ title: next ? "Profissional ativado" : "Profissional desativado" });
  }

  async function setApptStatus(id: string, status: "confirmed"|"cancelled"|"completed") {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setAppointments(list => list.map(a => a.id === id ? { ...a, status } : a));
    // Fire-and-forget n8n notification
    try {
      await supabase.functions.invoke("notify-guardian", {
        body: { type: "appointment_status", appointment_id: id, status },
      });
    } catch { /* ignore */ }
    toast({ title: status === "confirmed" ? "Consulta confirmada" : status === "cancelled" ? "Consulta cancelada" : "Consulta concluída" });
  }

  const totalActive = pros.filter(p => p.is_approved).length;
  const proAppts = (proId: string) => appointments.filter(a => a.professional_id === proId);
  const nextAppt = (proId: string) => proAppts(proId).find(a => a.status === "scheduled" || a.status === "confirmed");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* HEADER */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="p-1.5 hover:bg-white/10 rounded-md">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-primary-foreground/70">Painel Admin</p>
              <h1 className="text-lg font-bold">Profissionais</h1>
            </div>
          </div>
          <button
            onClick={openNew}
            className="h-10 px-4 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Cadastrar profissional
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-6 space-y-5">
        {/* Stats bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground text-base">{pros.length}</span>{" "}
            profissional{pros.length !== 1 ? "is" : ""} cadastrado{pros.length !== 1 ? "s" : ""}{" "}
            <span className="text-muted-foreground">·</span>{" "}
            <span className="text-emerald-600 font-medium">{totalActive} ativo{totalActive !== 1 ? "s" : ""}</span>
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, especialidade, CRP..."
              className="pl-9 h-10 w-72 bg-card"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
            <User className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum profissional encontrado</p>
            <button onClick={openNew} className="mt-4 text-sm text-primary font-semibold">
              Cadastrar o primeiro
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Profissional</th>
                  <th className="px-5 py-3 hidden md:table-cell">Especialidade</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Próxima consulta</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Sessões</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const next = nextAppt(p.id);
                  return (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-bold">{getInitials(p.full_name)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                              {p.full_name ?? "Sem nome"}
                              {p.gambling_specialist && (
                                <Award className="h-3.5 w-3.5" style={{ color: "#C9A84C" }} />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.council_number ? `${(p.council_state || "").toUpperCase()} ${p.council_number}` : "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-sm text-muted-foreground capitalize">
                        {p.professional_type ?? "—"}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                        {next ? new Date(next.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-sm">
                        {p.total_sessions ?? 0}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            p.is_approved
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_approved ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                          {p.is_approved ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(p)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                              p.is_approved
                                ? "text-muted-foreground hover:bg-muted"
                                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            {p.is_approved ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL — CADASTRO/EDIÇÃO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar profissional" : "Cadastrar profissional"}</DialogTitle>
            <DialogDescription>
              Preencha os dados. Os campos marcados são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 w-full">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="abordagem">Abordagem</TabsTrigger>
              <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
              <TabsTrigger value="agenda" disabled={!editingId}>Agenda</TabsTrigger>
              <TabsTrigger value="relatorio" disabled={!editingId}>Relatório</TabsTrigger>
            </TabsList>

            {/* DADOS */}
            <TabsContent value="dados" className="space-y-4 pt-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
                  {draft.photo_url ? (
                    <img src={draft.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">{getInitials(draft.full_name)}</span>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="h-9 px-3 rounded-md bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {draft.photo_url ? "Trocar foto" : "Enviar foto"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                  <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG. Máx 5MB.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Nome completo *">
                  <Input value={draft.full_name} maxLength={120}
                    onChange={e => setDraft(d => ({ ...d, full_name: e.target.value }))} />
                </Field>
                <Field label="Especialidade (cargo) *">
                  <select
                    value={draft.professional_type}
                    onChange={e => setDraft(d => ({ ...d, professional_type: e.target.value as ProType }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="psicologo">Psicólogo(a)</option>
                    <option value="terapeuta">Terapeuta</option>
                    <option value="psiquiatra">Psiquiatra</option>
                  </select>
                </Field>
                <Field label="Especialidade (resumo) *">
                  <Input value={draft.specialty} maxLength={120} placeholder="Ex.: Psicologia clínica"
                    onChange={e => setDraft(d => ({ ...d, specialty: e.target.value }))} />
                </Field>
                <Field label="Registro (CRP/CRM/CRT) *">
                  <div className="flex gap-2">
                    <Input value={draft.council_state} placeholder="UF" maxLength={2} className="w-16 uppercase"
                      onChange={e => setDraft(d => ({ ...d, council_state: e.target.value.toUpperCase() }))} />
                    <Input value={draft.council_number} placeholder="00000" maxLength={40}
                      onChange={e => setDraft(d => ({ ...d, council_number: e.target.value }))} />
                  </div>
                </Field>
                <Field label="Email profissional">
                  <Input type="email" value={draft.professional_email}
                    onChange={e => setDraft(d => ({ ...d, professional_email: e.target.value }))} />
                </Field>
                <Field label="WhatsApp (interno)">
                  <Input value={draft.whatsapp} placeholder="(11) 99999-0000"
                    onChange={e => setDraft(d => ({ ...d, whatsapp: e.target.value }))} />
                </Field>
              </div>

              <Field label={`Bio (${draft.bio.length}/300)`}>
                <Textarea value={draft.bio} maxLength={300} rows={3}
                  onChange={e => setDraft(d => ({ ...d, bio: e.target.value.slice(0, 300) }))} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Link de videochamada (Meet/Zoom)">
                  <Input value={draft.meeting_link} placeholder="https://meet.google.com/..."
                    onChange={e => setDraft(d => ({ ...d, meeting_link: e.target.value }))} />
                </Field>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <Label className="text-sm">Ativo no app</Label>
                  <Switch checked={draft.is_approved}
                    onCheckedChange={v => setDraft(d => ({ ...d, is_approved: v }))} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Valor cobrado (R$)">
                  <Input type="number" step="0.01" value={draft.hourly_rate}
                    onChange={e => setDraft(d => ({ ...d, hourly_rate: Number(e.target.value) }))} />
                </Field>
                <Field label="Repasse profissional (R$)">
                  <Input type="number" step="0.01" value={draft.payout_amount}
                    onChange={e => setDraft(d => ({ ...d, payout_amount: Number(e.target.value) }))} />
                </Field>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 self-end">
                  <Label className="text-sm">Aceita plano</Label>
                  <Switch checked={draft.accepts_plan}
                    onCheckedChange={v => setDraft(d => ({ ...d, accepts_plan: v }))} />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">Sessão de 45 min (fixo).</p>
            </TabsContent>

            {/* ABORDAGEM */}
            <TabsContent value="abordagem" className="space-y-5 pt-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Abordagem terapêutica</Label>
                <div className="flex flex-wrap gap-2">
                  {APPROACHES.map(a => {
                    const sel = draft.approach.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleArr("approach", a)}
                        className={`px-3 h-8 rounded-full text-sm font-medium border transition-colors ${
                          sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-foreground hover:bg-muted"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Especialidades</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_LIST.map(s => {
                    const sel = draft.specialties.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleArr("specialties", s)}
                        className={`px-3 h-8 rounded-full text-sm font-medium border transition-colors ${
                          sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-foreground hover:bg-muted"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-xl border-2"
                style={{
                  background: draft.gambling_specialist ? "linear-gradient(135deg, hsl(43 60% 96%), hsl(43 60% 92%))" : undefined,
                  borderColor: draft.gambling_specialist ? "#C9A84C" : "hsl(var(--border))",
                }}
              >
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5" style={{ color: draft.gambling_specialist ? "#C9A84C" : "hsl(var(--muted-foreground))" }} />
                  <div>
                    <p className="text-sm font-bold">Especialista em Ludopatia</p>
                    <p className="text-xs text-muted-foreground">Selo dourado destacado no app</p>
                  </div>
                </div>
                <Switch checked={draft.gambling_specialist}
                  onCheckedChange={v => setDraft(d => ({ ...d, gambling_specialist: v }))} />
              </div>
            </TabsContent>

            {/* DISPONIBILIDADE */}
            <TabsContent value="disponibilidade" className="pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                Toque em cada bloco para marcar como disponível (verde).
              </p>
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[64px_repeat(6,1fr)] gap-1.5">
                    <div />
                    {DAYS.map(d => (
                      <div key={d.key} className="text-xs font-bold text-center pb-1 text-muted-foreground">
                        {d.label}
                      </div>
                    ))}
                    {HOURS.map(h => (
                      <>
                        <div key={`l-${h}`} className="text-[11px] text-muted-foreground self-center font-mono">{h}</div>
                        {DAYS.map(d => {
                          const active = (draft.availability[d.key] ?? []).includes(h);
                          return (
                            <button
                              key={`${d.key}-${h}`}
                              onClick={() => toggleSlot(d.key, h)}
                              className={`h-8 rounded-md transition-colors ${
                                active
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-muted hover:bg-muted-foreground/20"
                              }`}
                              aria-label={`${d.label} ${h}`}
                            />
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* AGENDA */}
            <TabsContent value="agenda" className="pt-4">
              {editingId ? (
                <ProAgenda
                  appts={proAppts(editingId)}
                  onConfirm={(id) => setApptStatus(id, "confirmed")}
                  onCancel={(id) => setApptStatus(id, "cancelled")}
                  onComplete={(id) => setApptStatus(id, "completed")}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Salve o profissional para ver a agenda.</p>
              )}
            </TabsContent>

            {/* RELATÓRIO */}
            <TabsContent value="relatorio" className="pt-4">
              {editingId ? (
                <ProReport
                  appts={proAppts(editingId)}
                  payout={Number(draft.payout_amount ?? 0)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Salve o profissional para ver o relatório.</p>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <button onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar profissional
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ProAgenda({
  appts, onConfirm, onCancel, onComplete,
}: {
  appts: Appointment[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  if (appts.length === 0) {
    return (
      <div className="py-12 text-center">
        <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma consulta agendada</p>
      </div>
    );
  }
  const statusColor = (s: string) => ({
    scheduled: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-sky-100 text-sky-700",
    cancelled: "bg-muted text-muted-foreground",
  } as Record<string, string>)[s] ?? "bg-muted text-muted-foreground";
  const statusLabel = (s: string) => ({
    scheduled: "Aguardando",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  } as Record<string, string>)[s] ?? s;

  return (
    <div className="space-y-2">
      {appts.map(a => (
        <div key={a.id} className="border border-border/40 rounded-xl p-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {new Date(a.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Paciente #{a.user_id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor(a.status)}`}>
            {statusLabel(a.status)}
          </span>
          <div className="flex gap-1.5">
            {a.status === "scheduled" && (
              <button onClick={() => onConfirm(a.id)}
                className="text-xs h-8 px-3 rounded-md bg-emerald-600 text-white font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Confirmar
              </button>
            )}
            {(a.status === "scheduled" || a.status === "confirmed") && (
              <>
                <button onClick={() => onCancel(a.id)}
                  className="text-xs h-8 px-3 rounded-md bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Cancelar
                </button>
                {a.status === "confirmed" && (
                  <button onClick={() => onComplete(a.id)}
                    className="text-xs h-8 px-3 rounded-md bg-sky-600 text-white font-medium">
                    Concluir
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProReport({ appts, payout }: { appts: Appointment[]; payout: number }) {
  const startMonth = new Date();
  startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
  const monthAppts = appts.filter(a => new Date(a.scheduled_at) >= startMonth);
  const confirmed = monthAppts.filter(a => a.status === "confirmed" || a.status === "completed").length;
  const cancelled = monthAppts.filter(a => a.status === "cancelled").length;
  const completed = monthAppts.filter(a => a.status === "completed").length;
  const ratings = appts.filter(a => a.rating != null).map(a => a.rating!) as number[];
  const avg = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length) : 0;
  const totalPayout = completed * payout;

  const items = [
    { label: "Consultas no mês", value: monthAppts.length, icon: CalendarIcon },
    { label: "Confirmadas/concluídas", value: confirmed, icon: Check },
    { label: "Canceladas", value: cancelled, icon: X },
    { label: "Avaliação média", value: avg ? avg.toFixed(1) : "—", icon: Star },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map(it => (
          <div key={it.label} className="bg-muted/50 rounded-xl p-4">
            <it.icon className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold" style={{ color: "#1B4332" }}>{it.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{it.label}</p>
          </div>
        ))}
      </div>
      <div
        className="rounded-xl p-4 border-2"
        style={{ borderColor: "#1B4332", background: "linear-gradient(135deg, hsl(140 50% 96%), hsl(140 50% 92%))" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-4 w-4" style={{ color: "#1B4332" }} />
          <p className="text-sm font-bold" style={{ color: "#1B4332" }}>Repasses do mês</p>
        </div>
        <p className="text-2xl font-bold" style={{ color: "#1B4332" }}>{formatBRL(totalPayout)}</p>
        <p className="text-xs text-muted-foreground">{completed} consulta{completed !== 1 ? "s" : ""} concluída{completed !== 1 ? "s" : ""} × {formatBRL(payout)}</p>
      </div>
    </div>
  );
}
