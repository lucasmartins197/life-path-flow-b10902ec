import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, ExternalLink, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface WeeklyClass {
  id: string;
  link: string;
  scheduled_at: string;
  created_by: string | null;
}

export default function AulaoSemanal() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const [nextClass, setNextClass] = useState<WeeklyClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [editLink, setEditLink] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

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
      setNextClass(data as WeeklyClass);
      setEditLink(data.link);
      setEditDate(data.scheduled_at?.slice(0, 16) || "");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!editLink || !editDate) return;
    setSaving(true);

    if (nextClass) {
      const { error } = await supabase
        .from("weekly_class")
        .update({ link: editLink, scheduled_at: new Date(editDate).toISOString() })
        .eq("id", nextClass.id);
      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Aula atualizada" });
        fetchNextClass();
      }
    } else {
      const { error } = await supabase
        .from("weekly_class")
        .insert({ link: editLink, scheduled_at: new Date(editDate).toISOString(), created_by: user?.id });
      if (error) {
        toast({ title: "Erro ao criar aula", variant: "destructive" });
      } else {
        toast({ title: "Aula criada" });
        fetchNextClass();
      }
    }
    setSaving(false);
  }

  const formattedDate = nextClass
    ? format(new Date(nextClass.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
        {/* Next class card */}
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Próxima aula</span>
            </div>

            {loading ? (
              <div className="h-16 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : formattedDate ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="capitalize">{formattedDate}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => nextClass?.link && window.open(nextClass.link, "_blank")}
                  disabled={!nextClass?.link}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Entrar na Reunião
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhuma aula agendada no momento.</p>
            )}

            {/* Admin controls */}
            {isAdmin && (
              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin — Configurar aula</p>
                <Input
                  placeholder="Link da reunião (ex: https://meet.google.com/...)"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                />
                <Input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <Button variant="outline" className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : nextClass ? "Atualizar aula" : "Criar aula"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past classes */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Aulas anteriores</h2>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Em breve</p>
              <p className="text-xs text-muted-foreground/60 mt-1">As gravações das aulas aparecerão aqui.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
