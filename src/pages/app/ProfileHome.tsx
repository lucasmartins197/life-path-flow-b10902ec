import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ChevronLeft, ChevronRight, Camera, Bell, Eye, Anchor, Shield, CreditCard,
  Lock, LogOut, Trash2, FileText, Star, Award, Flame, Calendar, Footprints,
  Loader2, Check, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/BottomNavigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

interface ProfileRow {
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  is_public: boolean;
  notifications_enabled: boolean;
  created_at: string;
}

interface MedalDef {
  id: string;
  name: string;
  description: string;
  step?: number;
}

const ALL_MEDALS: MedalDef[] = [
  { id: "step_1", name: "Reconhecimento", description: "Concluiu o passo 1 da jornada", step: 1 },
  { id: "step_2", name: "Aceitação", description: "Concluiu o passo 2 da jornada", step: 2 },
  { id: "step_3", name: "Coragem", description: "Concluiu o passo 3 da jornada", step: 3 },
  { id: "step_4", name: "Inventário", description: "Concluiu o passo 4 da jornada", step: 4 },
  { id: "step_5", name: "Confissão", description: "Concluiu o passo 5 da jornada", step: 5 },
  { id: "step_6", name: "Disposição", description: "Concluiu o passo 6 da jornada", step: 6 },
  { id: "step_7", name: "Humildade", description: "Concluiu o passo 7 da jornada", step: 7 },
  { id: "step_8", name: "Reparação", description: "Concluiu o passo 8 da jornada", step: 8 },
  { id: "step_9", name: "Restituição", description: "Concluiu o passo 9 da jornada", step: 9 },
  { id: "step_10", name: "Vigilância", description: "Concluiu o passo 10 da jornada", step: 10 },
  { id: "step_11", name: "Conexão", description: "Concluiu o passo 11 da jornada", step: 11 },
  { id: "step_12", name: "Serviço", description: "Concluiu o passo 12 da jornada", step: 12 },
];

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(100, "Máximo 100 caracteres"),
  city: z.string().trim().max(80, "Máximo 80 caracteres").optional().or(z.literal("")),
  bio: z.string().trim().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  current: z.string().min(6, "Mínimo 6 caracteres"),
  next: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres"),
  confirm: z.string(),
}).refine((d) => d.next === d.confirm, { message: "Senhas não coincidem", path: ["confirm"] });

function getInitials(name: string | null) {
  if (!name) return "AV";
  return name.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function ProfileHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editable fields (draft)
  const [draftName, setDraftName] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftBio, setDraftBio] = useState("");

  // Stats
  const [currentStep, setCurrentStep] = useState(1);
  const [streak, setStreak] = useState(0);
  const [earnedSteps, setEarnedSteps] = useState<number[]>([]);

  // Modals
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [medalOpen, setMedalOpen] = useState<MedalDef | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, patientRes, journeyRes] = await Promise.all([
        supabase.from("profiles")
          .select("full_name, avatar_url, city, bio, is_public, notifications_enabled, created_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("patient_profiles")
          .select("current_step, streak_days")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("journey_progress")
          .select("step_number, is_completed")
          .eq("user_id", user.id)
          .eq("is_completed", true),
      ]);

      const p = (profileRes.data ?? {
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: null,
        city: null,
        bio: null,
        is_public: true,
        notifications_enabled: true,
        created_at: user.created_at ?? new Date().toISOString(),
      }) as ProfileRow;
      setProfile(p);
      setDraftName(p.full_name ?? "");
      setDraftCity(p.city ?? "");
      setDraftBio(p.bio ?? "");

      setCurrentStep(patientRes.data?.current_step ?? 1);
      setStreak(patientRes.data?.streak_days ?? 0);
      setEarnedSteps((journeyRes.data ?? []).map((r: any) => r.step_number));
    } catch (e: any) {
      toast({ title: "Erro ao carregar perfil", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máx. 5MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase.from("profiles")
        .update({ avatar_url: url }).eq("user_id", user.id);
      if (updErr) throw updErr;
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      toast({ title: "Foto atualizada" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) return;
    const parsed = profileSchema.safeParse({
      full_name: draftName, city: draftCity, bio: draftBio,
    });
    if (!parsed.success) {
      toast({
        title: "Campos inválidos",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: parsed.data.full_name,
        city: parsed.data.city || null,
        bio: parsed.data.bio || null,
      }).eq("user_id", user.id);
      if (error) throw error;
      setProfile((p) => p ? {
        ...p,
        full_name: parsed.data.full_name,
        city: parsed.data.city || null,
        bio: parsed.data.bio || null,
      } : p);
      setEditing(false);
      toast({ title: "Perfil atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleSetting(key: "is_public" | "notifications_enabled", value: boolean) {
    if (!user || !profile) return;
    setProfile({ ...profile, [key]: value });
    const { error } = await supabase.from("profiles").update({ [key]: value }).eq("user_id", user.id);
    if (error) {
      setProfile({ ...profile, [key]: !value });
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }

  async function handlePasswordChange() {
    const parsed = passwordSchema.safeParse({
      current: pwCurrent, next: pwNext, confirm: pwConfirm,
    });
    if (!parsed.success) {
      toast({
        title: "Verifique os campos",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }
    if (!user?.email) return;
    setPwSaving(true);
    try {
      // Re-auth to validate current password
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email, password: pwCurrent,
      });
      if (signErr) throw new Error("Senha atual incorreta");
      const { error: updErr } = await supabase.auth.updateUser({ password: pwNext });
      if (updErr) throw updErr;
      toast({ title: "Senha alterada" });
      setPwOpen(false);
      setPwCurrent(""); setPwNext(""); setPwConfirm("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    try {
      // Soft cleanup of user-owned data; auth user removal would require an edge function with service role
      await supabase.from("profiles").update({
        full_name: "Conta excluída",
        bio: null, city: null, avatar_url: null, is_public: false,
      }).eq("user_id", user.id);
      await signOut();
      toast({ title: "Conta excluída", description: "Você foi desconectado." });
      navigate("/auth");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  const memberDays = profile ? daysSince(profile.created_at) : 0;
  const earnedCount = earnedSteps.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* HEADER */}
      <header className="bg-card border-b border-border/60 px-5 pt-6 pb-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => editing ? setEditing(false) : navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <h1 className="text-base font-bold tracking-tight">Meu Perfil</h1>
          {editing ? (
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="text-sm font-semibold text-primary disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-primary"
            >
              Editar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {/* SEÇÃO 1 — IDENTIDADE */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div
                className="w-[120px] h-[120px] rounded-full flex items-center justify-center overflow-hidden border-4 border-background"
                style={{
                  background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
                  boxShadow: "0 12px 28px -10px hsl(140 50% 20% / 0.35)",
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold tracking-wider">
                    {getInitials(profile?.full_name ?? null)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
                aria-label="Trocar foto"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome completo</Label>
              {editing ? (
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  maxLength={100}
                  className="mt-1 h-10"
                />
              ) : (
                <p className="text-base font-semibold mt-0.5">{profile?.full_name ?? "—"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cidade</Label>
              {editing ? (
                <Input
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  maxLength={80}
                  placeholder="Ex.: São Paulo"
                  className="mt-1 h-10"
                />
              ) : (
                <p className="text-sm mt-0.5">{profile?.city || "—"}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Bio (aparece na comunidade)</Label>
                {editing && (
                  <span className="text-[10px] text-muted-foreground">{draftBio.length}/100</span>
                )}
              </div>
              {editing ? (
                <Textarea
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value.slice(0, 100))}
                  maxLength={100}
                  rows={2}
                  placeholder="Uma frase curta sobre você"
                  className="mt-1 resize-none"
                />
              ) : (
                <p className="text-sm mt-0.5 leading-relaxed">{profile?.bio || "—"}</p>
              )}
            </div>
          </div>
        </section>

        {/* SEÇÃO 2 — JORNADA */}
        <section>
          <h2 className="text-base font-bold mb-3 px-1">Minha jornada</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Footprints} label="Passo atual" value={`${currentStep} de 12`} />
            <StatCard icon={Award} label="Medalhas" value={`${earnedCount}`} />
            <StatCard icon={Flame} label="Streak" value={`${streak}d`} />
            <StatCard icon={Calendar} label="Dias no app" value={`${memberDays}`} />
          </div>
        </section>

        {/* SEÇÃO 3 — MEDALHAS */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <h2 className="text-base font-bold mb-3">Minhas medalhas</h2>
          <div className="grid grid-cols-4 gap-3">
            {ALL_MEDALS.map((m) => {
              const earned = m.step ? earnedSteps.includes(m.step) : false;
              return (
                <button
                  key={m.id}
                  onClick={() => earned && setMedalOpen(m)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={
                      earned
                        ? {
                            background: "linear-gradient(135deg, #C9A84C, #E8C977)",
                            boxShadow: "0 8px 20px -8px hsl(43 60% 50% / 0.55)",
                          }
                        : { background: "hsl(var(--muted))" }
                    }
                  >
                    {earned ? (
                      <Star className="h-6 w-6 text-white fill-white" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${earned ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 4 — CONFIGURAÇÕES */}
        <section className="bg-card border border-border/40 rounded-2xl overflow-hidden">
          <h2 className="text-base font-bold px-5 pt-5 pb-2">Configurações</h2>
          <SettingToggle
            icon={Bell}
            label="Notificações push"
            checked={!!profile?.notifications_enabled}
            onChange={(v) => toggleSetting("notifications_enabled", v)}
          />
          <SettingToggle
            icon={Eye}
            label="Perfil público na comunidade"
            checked={!!profile?.is_public}
            onChange={(v) => toggleSetting("is_public", v)}
          />
          <SettingLink icon={Anchor} label="Meu Contato Âncora" onClick={() => navigate("/app/ancora")} />
          <SettingLink icon={Shield} label="Meu Escudo" onClick={() => navigate("/app/escudo")} />
          <SettingLink icon={CreditCard} label="Minha Assinatura" onClick={() => navigate("/app/assinatura")} />
          <SettingLink icon={Lock} label="Alterar senha" onClick={() => setPwOpen(true)} last />
        </section>

        {/* SEÇÃO 5 — CONTA */}
        <section className="space-y-2">
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
            className="w-full h-12 rounded-xl bg-destructive/10 text-destructive font-semibold flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-destructive/15 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <button
            onClick={() => { setDeleteStep(1); setDeleteConfirmText(""); setDeleteOpen(true); }}
            className="w-full h-11 rounded-xl bg-transparent text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir conta
          </button>
        </section>

        {/* SEÇÃO 6 — SOBRE */}
        <section className="bg-card border border-border/40 rounded-2xl overflow-hidden">
          <h2 className="text-base font-bold px-5 pt-5 pb-2">Sobre o app</h2>
          <div className="px-5 py-3 flex items-center justify-between border-b border-border/30">
            <span className="text-sm text-muted-foreground">Versão</span>
            <span className="text-sm font-mono">1.0.0</span>
          </div>
          <SettingLink
            icon={FileText}
            label="Política de Privacidade"
            onClick={() => window.open("https://apostandonavida.com.br/privacidade", "_blank", "noopener")}
          />
          <SettingLink
            icon={FileText}
            label="Termos de Uso"
            onClick={() => window.open("https://apostandonavida.com.br/termos", "_blank", "noopener")}
          />
          <SettingLink
            icon={Star}
            label="Avalie o app"
            onClick={() => {
              const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              window.open(
                isiOS
                  ? "https://apps.apple.com/app/apostando-na-vida"
                  : "https://play.google.com/store/apps/details?id=br.com.apostandonavida",
                "_blank", "noopener"
              );
            }}
            last
          />
        </section>
      </main>

      <BottomNavigation />

      {/* PASSWORD MODAL */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Use uma senha forte que você não usa em outros sites.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Senha atual</Label>
              <Input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Nova senha</Label>
              <Input type="password" value={pwNext} onChange={(e) => setPwNext(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Confirmar nova senha</Label>
              <Input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPwOpen(false)}
              className="h-10 px-4 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={pwSaving}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {pwSaving ? "Salvando..." : "Alterar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MEDAL DETAIL */}
      <Dialog open={!!medalOpen} onOpenChange={(o) => !o && setMedalOpen(null)}>
        <DialogContent className="max-w-xs">
          <div className="flex flex-col items-center text-center pt-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #E8C977)",
                boxShadow: "0 12px 28px -10px hsl(43 60% 50% / 0.55)",
              }}
            >
              <Star className="h-9 w-9 text-white fill-white" />
            </div>
            <DialogTitle>{medalOpen?.name}</DialogTitle>
            <DialogDescription className="mt-1">{medalOpen?.description}</DialogDescription>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE ACCOUNT — DOUBLE CONFIRM */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir conta
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? "Esta ação removerá seus dados pessoais do app. Sua jornada e progresso serão apagados."
                : "Para confirmar, digite EXCLUIR no campo abaixo."}
            </DialogDescription>
          </DialogHeader>
          {deleteStep === 2 && (
            <Input
              placeholder="Digite EXCLUIR"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              autoFocus
            />
          )}
          <DialogFooter>
            <button
              onClick={() => setDeleteOpen(false)}
              className="h-10 px-4 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
            >
              <X className="h-3.5 w-3.5 inline mr-1" /> Cancelar
            </button>
            {deleteStep === 1 ? (
              <button
                onClick={() => setDeleteStep(2)}
                className="h-10 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold"
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "EXCLUIR"}
                className="h-10 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value,
}: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-4">
      <Icon className="h-4 w-4 text-primary mb-2" />
      <p className="text-2xl font-bold tracking-tight" style={{ color: "#1B4332" }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function SettingLink({
  icon: Icon, label, onClick, last,
}: { icon: any; label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-5 py-4 flex items-center gap-3 hover:bg-muted/40 transition-colors ${last ? "" : "border-b border-border/30"}`}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 text-left text-sm">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function SettingToggle({
  icon: Icon, label, checked, onChange,
}: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="w-full px-5 py-3.5 flex items-center gap-3 border-b border-border/30">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
