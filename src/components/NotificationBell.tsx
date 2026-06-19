import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, MessageCircle, Heart, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string;
  type: "reaction" | "comment" | "weekly_class";
  post_id: string | null;
  reaction_type: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationItem extends NotificationRow {
  actor_name?: string;
  actor_avatar?: string | null;
}

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️",
  forca: "💪",
  gratidao: "🙏",
  apoio: "🤝",
};

function describeNotification(n: NotificationItem): string {
  if (n.type === "weekly_class") {
    return "Novo aulão semanal agendado! Toque para ver.";
  }
  if (n.type === "reaction") {
    const emoji = REACTION_EMOJI[n.reaction_type || "heart"] || "❤️";
    return `reagiu com ${emoji} à sua história`;
  }
  return "comentou na sua publicação";
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    console.log(`[NotificationBell] unread count for ${user.id}:`, count, "error:", error);
    setUnread(count || 0);
  }, [user]);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const rows = (data as NotificationRow[]) || [];
    const actorIds = [...new Set(rows.map((r) => r.actor_id))];
    let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (actorIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", actorIds);
      profilesMap = new Map(
        (profs || []).map((p: any) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
      );
    }
    const enriched: NotificationItem[] = rows.map((r) => {
      const p = profilesMap.get(r.actor_id);
      return {
        ...r,
        actor_name: p?.full_name || "Alguém",
        actor_avatar: p?.avatar_url || null,
      };
    });
    setItems(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          fetchUnreadCount();
          const row = payload.new as NotificationRow;
          let msg = "";
          if (row.type === "weekly_class") {
            msg = "Novo aulão semanal agendado 📹";
          } else if (row.type === "reaction") {
            msg = `Nova reação na sua história ${REACTION_EMOJI[row.reaction_type || "heart"] || "❤️"}`;
          } else {
            msg = "Novo comentário na sua publicação 💬";
          }
          toast(msg);
          if (open) fetchList();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount, fetchList, open]);

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next) fetchList();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
  };

  const handleClickItem = async (n: NotificationItem) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.type === "weekly_class") {
      navigate("/app/aulao");
    } else if (n.post_id) {
      navigate(`/app/comunidade?post=${n.post_id}`);
    } else {
      navigate("/app/comunidade");
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => handleOpen(true)}
        aria-label="Notificações"
        className="fixed z-40 top-3 right-4 safe-top w-10 h-10 rounded-full bg-card border border-border/60 shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">Notificações</SheetTitle>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Quando houver um novo aulão, alguém reagir ou comentar nas suas histórias, você verá aqui.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClickItem(n)}
                      className={`w-full text-left px-5 py-3.5 flex gap-3 items-start transition-colors hover:bg-muted/50 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="relative shrink-0">
                        {n.type === "weekly_class" ? (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Video className="h-5 w-5 text-primary" />
                          </div>
                        ) : n.actor_avatar ? (
                          <img
                            src={n.actor_avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            {(n.actor_name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                          {n.type === "reaction" ? (
                            <Heart className="h-3 w-3 text-destructive" />
                          ) : n.type === "weekly_class" ? (
                            <Video className="h-3 w-3 text-primary" />
                          ) : (
                            <MessageCircle className="h-3 w-3 text-primary" />
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {n.type === "weekly_class" ? (
                            <span className="text-foreground/80">{describeNotification(n)}</span>
                          ) : (
                            <>
                              <span className="font-semibold">{n.actor_name}</span>{" "}
                              <span className="text-foreground/80">{describeNotification(n)}</span>
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
