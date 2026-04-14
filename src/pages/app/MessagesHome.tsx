import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export default function MessagesHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const toUserId = searchParams.get("to");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(toUserId);
  const [activeName, setActiveName] = useState("");
  const [activeAvatar, setActiveAvatar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: allMsgs } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!allMsgs || allMsgs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convMap = new Map<string, { last: typeof allMsgs[0]; unread: number }>();
    for (const msg of allMsgs) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { last: msg, unread: 0 });
      }
      if (msg.receiver_id === user.id && !msg.read_at) {
        const entry = convMap.get(otherId)!;
        entry.unread++;
      }
    }

    const userIds = [...convMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const convList: Conversation[] = userIds.map((uid) => {
      const entry = convMap.get(uid)!;
      const profile = profileMap.get(uid);
      return {
        user_id: uid,
        display_name: profile?.full_name || "Usuário",
        avatar_url: profile?.avatar_url || null,
        last_message: entry.last.content,
        last_at: entry.last.created_at,
        unread: entry.unread,
      };
    });

    convList.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
    setConversations(convList);
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages(data || []);

    // Mark as read
    if (data?.some((m) => m.receiver_id === user.id && !m.read_at)) {
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .is("read_at", null);
    }

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [user]);

  const openChat = async (userId: string, name: string, avatar: string | null) => {
    setActiveChat(userId);
    setActiveName(name);
    setActiveAvatar(avatar);
    await fetchMessages(userId);
  };

  const sendMessage = async () => {
    if (!user || !activeChat || !text.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: activeChat,
      content: text.trim(),
    });
    if (!error) {
      setText("");
      await fetchMessages(activeChat);
    }
    setSending(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // If "to" param, open that chat
  useEffect(() => {
    if (toUserId && user) {
      supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", toUserId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) openChat(data.user_id, data.full_name || "Usuário", data.avatar_url);
        });
    }
  }, [toUserId, user]);

  // Realtime
  useEffect(() => {
    if (!activeChat || !user) return;
    const channel = supabase
      .channel(`dm-${activeChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === user.id && msg.receiver_id === activeChat) ||
          (msg.sender_id === activeChat && msg.receiver_id === user.id)
        ) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user]);

  if (activeChat) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#F8F6F2" }}>
        {/* Chat header */}
        <header className="sticky top-0 z-30 bg-white border-b border-black/5 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              setActiveChat(null);
              setMessages([]);
              fetchConversations();
            }}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-[#1B4332]" />
          </button>
          <Avatar className="h-9 w-9">
            {activeAvatar ? <AvatarImage src={activeAvatar} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-xs font-bold">
              {activeName[0]}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-bold text-[#1B4332]">{activeName}</p>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">
              Inicie a conversa com uma mensagem de apoio.
            </p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? "bg-[#1B4332] text-white rounded-br-md"
                      : "bg-white text-foreground rounded-bl-md shadow-sm"
                  }`}
                >
                  <p>{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white px-4 py-3 flex gap-2 pb-safe">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Mensagem..."
            className="flex-1 h-10 px-4 rounded-full border bg-muted/30 text-sm outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95 shrink-0"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F8F6F2" }}>
      <header className="sticky top-0 z-30 bg-[#F8F6F2]/95 backdrop-blur-md border-b border-black/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate("/app/comunidade")} className="p-1 -ml-1 rounded-lg hover:bg-black/5">
            <ChevronLeft className="h-5 w-5 text-[#1B4332]" />
          </button>
          <h1 className="text-lg font-bold text-[#1B4332] tracking-tight" style={{ letterSpacing: "-0.5px" }}>
            Mensagens
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="p-4 rounded-2xl border-0 shadow-sm bg-white flex gap-3 animate-pulse">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <Send className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Envie uma mensagem a partir de um post no feed</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Card
              key={conv.user_id}
              className="p-4 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => openChat(conv.user_id, conv.display_name, conv.avatar_url)}
            >
              <Avatar className="h-12 w-12">
                {conv.avatar_url ? <AvatarImage src={conv.avatar_url} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white font-bold">
                  {conv.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground truncate">{conv.display_name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conv.last_at), { addSuffix: false, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-[#1B4332] flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-white font-bold">{conv.unread}</span>
                </div>
              )}
            </Card>
          ))
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
