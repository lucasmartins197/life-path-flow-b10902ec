import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, ExternalLink, CalendarDays, Trash2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface WeeklyClass {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  scheduled_at: string;
  is_live: boolean;
}

function openGoogleCalendar(aula: { title: string; description: string | null; scheduled_at: string }) {
  const start = new Date(aula.scheduled_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", aula.title);
  url.searchParams.set("details", aula.description || "Aulão Semanal — Saindo do Jogo");
  url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
  window.open(url.toString(), "_blank");
}

export default function AulaoSemanal() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const [nextClass, setNextClass] = useState<WeeklyClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchNextClass();
  }, []);

  async function fetchNextClass() {
    setLoading(true);
    const { data, error } = await supabase
      .from("weekly_class")
      .select("*")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const c = data as WeeklyClass;
      setNextClass(c);
      setTitle(c.title || "");
      setDescription(c.description || "");
      setVideoUrl(c.video_url || "");
      setScheduledAt(c.scheduled_at?.slice(0, 16) || "");
      setIsLive(!!c.is_live);
    } else {
      setNextClass(null);
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setScheduledAt("");
      setIsLive(false);
    }
    setLoading(false);
  }

  async function notifyAllUsers(classTitle: string) {
    if (!user) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id");
    if (!profiles?.length) return;

    const rows = profiles
      .filter((p: any) => p.user_id && p.user_id !== user.id)
      .map((p: any) => ({
        user_id: p.user_id,
        actor_id: user.id,
        type: "weekly_class",
        read: false,
      }));

    if (rows.length) {
      await supabase.from("notifications").insert(rows as any);
    }
  }

  async function handleSave() {
    if (!title || !scheduledAt) {
      toast({ title: "Preencha título e data", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      title,
      description: description || null,
      video_url: videoUrl || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      is_live: isLive,
    };

    if (nextClass) {
      const { error } = await supabase
        .from("weekly_class")
        .update(payload)
        .eq("id", nextClass.id);
      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Aula atualizada" });
        fetchNextClass();
      }
    } else {
      const { error } = await supabase.from("weekly_class").insert(payload as any);
      if (error) {
        toast({ title: "Erro ao criar aula", variant: "destructive" });
      } else {
        toast({ title: "Aula criada" });
        await notifyAllUsers(title);
        fetchNextClass();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!nextClass) return;
    if (!confirm("Excluir esta aula?")) return;
    const { error } = await supabase.from("weekly_class").delete().eq("id", nextClass.id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Aula excluída" });
      fetchNextClass();
    }
  }

  const formattedDate = nextClass
    ? format(new Date(nextClass.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Aulão Semanal</h1>
            <p className="text-xs text-muted-foreground">Reunião gratuita com terapeuta toda semana</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Próxima aula</span>
              {nextClass?.is_live && (
                <Badge className="ml-auto bg-red-600 hover:bg-red-600 text-white gap-1">
                  <Radio className="h-3 w-3" /> AO VIVO
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="h-16 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : nextClass ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{nextClass.title}</h3>
                  {nextClass.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{nextClass.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="capitalize">{formattedDate}</span>
                </div>
                {nextClass.is_live ? (
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => nextClass.video_url && window.open(nextClass.video_url, "_blank")}
                    disabled={!nextClass.video_url}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Entrar agora
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => nextClass && openGoogleCalendar(nextClass)}
                    disabled={!nextClass}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Adicionar ao calendário
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhuma aula agendada no momento.</p>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Admin — {nextClass ? "Editar aula" : "Criar nova aula"}
              </p>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Como lidar com gatilhos" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Link do vídeo/reunião</Label>
                <Input id="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://meet.google.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e hora</Label>
                <Input id="date" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="live" className="text-sm">Ao vivo agora?</Label>
                  <p className="text-xs text-muted-foreground">Marca esta aula como em transmissão</p>
                </div>
                <Switch id="live" checked={isLive} onCheckedChange={setIsLive} />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar aula"}
                </Button>
                {nextClass && (
                  <Button variant="destructive" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
