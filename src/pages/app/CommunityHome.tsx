import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useCommunityFeed, CommunityPost, PostComment, ReactionType } from "@/hooks/useCommunityFeed";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart, MessageCircle, Send, Plus, Users, ChevronLeft,
  Camera, MoreHorizontal, Flag, X, Image as ImageIcon, Video, UserPlus, UserCheck, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle
} from "@/components/ui/drawer";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const MOOD_CONFIG: Record<string, { label: string; color: string }> = {
  motivado: { label: "Motivado", color: "bg-emerald-100 text-emerald-800" },
  desafiador: { label: "Desafiador", color: "bg-amber-100 text-amber-800" },
  grato: { label: "Grato", color: "bg-violet-100 text-violet-800" },
  reflexivo: { label: "Reflexivo", color: "bg-sky-100 text-sky-800" },
};

const REACTIONS: { key: ReactionType; emoji: string; label: string }[] = [
  { key: "forca", emoji: "💪", label: "Força" },
  { key: "gratidao", emoji: "🙏", label: "Gratidão" },
  { key: "apoio", emoji: "❤️", label: "Apoio" },
];

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-violet-500 to-fuchsia-700",
  "from-sky-500 to-blue-700",
  "from-rose-500 to-pink-700",
  "from-lime-500 to-green-700",
  "from-cyan-500 to-indigo-700",
  "from-yellow-500 to-amber-700",
];

function gradientFor(userId: string) {
  const sum = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

function AnonAvatar({ userId, size = 10 }: { userId: string; size?: 8 | 10 }) {
  const initials = userId.slice(0, 2).toUpperCase();
  const sizeClass = size === 8 ? "h-8 w-8" : "h-10 w-10";
  return (
    <Avatar className={`${sizeClass} border-2 border-[#1B4332]/10`}>
      <AvatarFallback className={`bg-gradient-to-br ${gradientFor(userId)} text-white text-sm font-bold`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function RulesAcceptance({ onAccept }: { onAccept: () => void }) {
  return (
    <Dialog open>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
              <Shield className="h-7 w-7 text-[#1B4332]" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Regras da Comunidade</DialogTitle>
          <DialogDescription className="text-center text-base mt-2 leading-relaxed">
            Este é um espaço de apoio e respeito mútuo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground mt-2">
          <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1.5 shrink-0" /> Trate todos com empatia e respeito</p>
          <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1.5 shrink-0" /> Não incentive comportamentos de risco</p>
          <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1.5 shrink-0" /> Conteúdos inadequados serão removidos</p>
          <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1.5 shrink-0" /> Sua privacidade é prioridade</p>
        </div>
        <Button onClick={onAccept} className="w-full mt-4 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white">
          Entendo e quero participar
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CreatePostDialog({
  open, onClose, onCreate, onUploadImage, onUploadVideo,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { content: string; image_url?: string; video_url?: string; mood?: string; anonymous?: boolean }) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  onUploadVideo: (file: File) => Promise<string | null>;
}) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem deve ter no máximo 5MB");
      return;
    }
    setUploading(true);
    const url = await onUploadImage(file);
    if (url) { setImageUrl(url); setVideoUrl(null); }
    setUploading(false);
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("Vídeo deve ter no máximo 50MB");
      return;
    }
    setUploading(true);
    const url = await onUploadVideo(file);
    if (url) { setVideoUrl(url); setImageUrl(null); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await onCreate({
      content: content.trim(),
      image_url: imageUrl || undefined,
      video_url: videoUrl || undefined,
      mood: mood || undefined,
      anonymous,
    });
    setContent(""); setMood(null); setImageUrl(null); setVideoUrl(null); setAnonymous(true);
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto pb-20">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Novo post</DialogTitle>
          <DialogDescription className="text-sm">Compartilhe sua história com a comunidade</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="O que você quer compartilhar hoje?"
            rows={5}
            className="resize-none text-base"
          />
          <p className="text-xs text-muted-foreground -mt-3 text-right">{content.length}/500</p>

          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="Preview" className="w-full rounded-xl aspect-[4/3] object-cover" />
              <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          {videoUrl && (
            <div className="relative">
              <video src={videoUrl} controls className="w-full rounded-xl aspect-video bg-black" />
              <button onClick={() => setVideoUrl(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => imgRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Camera className="h-4 w-4" /> Foto
            </Button>
            <Button variant="outline" size="sm" onClick={() => vidRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Video className="h-4 w-4" /> Vídeo
            </Button>
            {uploading && <span className="text-xs text-muted-foreground">Enviando...</span>}
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <input ref={vidRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoSelect} className="hidden" />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Como você está se sentindo?</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setMood(mood === key ? null : key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    mood === key ? cfg.color + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Como deseja publicar?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAnonymous(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-2 ${
                  !anonymous
                    ? "bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                Publicar com meu nome
              </button>
              <button
                onClick={() => setAnonymous(true)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-2 ${
                  anonymous
                    ? "bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                Publicar anonimamente
              </button>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting || uploading}
            className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-white h-12 text-base font-semibold"
          >
            {submitting ? "Publicando..." : anonymous ? "Publicar anonimamente" : "Publicar com meu nome"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsDrawer({
  open, onClose, postId, onAddComment, onFetchComments
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  onAddComment: (postId: string, content: string) => Promise<boolean | undefined>;
  onFetchComments: (postId: string) => Promise<PostComment[]>;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      onFetchComments(postId).then((data) => {
        setComments(data);
        setLoading(false);
      });
    }
  }, [open, postId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = await onAddComment(postId, text.trim());
    if (ok) {
      const updated = await onFetchComments(postId);
      setComments(updated);
      setText("");
    }
    setSending(false);
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Comentários</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum comentário ainda. Seja o primeiro.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <AnonAvatar userId={c.user_id} size={8} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{c.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t px-4 py-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            placeholder="Comentar anonimamente..."
            className="flex-1 h-10 px-3 rounded-full border bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="rounded-full bg-[#1B4332] hover:bg-[#1B4332]/90 h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PostCard({
  post, currentUserId, onReact, onComment, onReport, onToggleFollow, onDelete,
}: {
  post: CommunityPost;
  currentUserId?: string;
  onReact: (r: ReactionType) => void;
  onComment: () => void;
  onReport: () => void;
  onToggleFollow: () => void;
  onDelete: () => Promise<boolean>;
}) {
  const isOwn = post.user_id === currentUserId;
  const totalReactions =
    (post.reactions_count?.heart || 0) +
    (post.reactions_count?.forca || 0) +
    (post.reactions_count?.gratidao || 0) +
    (post.reactions_count?.apoio || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await onDelete();
    setDeleting(false);
    setShowDeleteDialog(false);
    if (ok) {
      toast.success("Publicação excluída");
    } else {
      toast.error("Erro ao excluir publicação");
    }
  };

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex items-start gap-3">
        <AnonAvatar userId={post.user_id} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{post.author_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{timeAgo(post.created_at)}</span>
            {post.author_step && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B4332] text-white font-medium">
                Passo {post.author_step}
              </span>
            )}
          </div>
        </div>
        {!isOwn && (
          <button
            onClick={onToggleFollow}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
              post.is_following_author
                ? "bg-[#1B4332]/10 text-[#1B4332]"
                : "bg-[#1B4332] text-white hover:bg-[#1B4332]/90"
            }`}
          >
            {post.is_following_author ? (
              <><UserCheck className="h-3 w-3" /> Seguindo</>
            ) : (
              <><UserPlus className="h-3 w-3" /> Seguir</>
            )}
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwn && (
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive gap-2">
                <Trash2 className="h-4 w-4" /> Excluir publicação
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onReport} className="text-destructive gap-2">
              <Flag className="h-4 w-4" /> Reportar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {post.mood && MOOD_CONFIG[post.mood] && (
        <div className="px-4 pb-2">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${MOOD_CONFIG[post.mood].color}`}>
            {MOOD_CONFIG[post.mood].label}
          </span>
        </div>
      )}

      <div className="px-4 pb-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {post.image_url && (
        <div className="px-4 pb-3">
          <img src={post.image_url} alt="Post" className="w-full rounded-xl aspect-[4/3] object-cover" loading="lazy" />
        </div>
      )}

      {post.video_url && (
        <div className="px-4 pb-3">
          <video src={post.video_url} controls playsInline className="w-full rounded-xl aspect-video bg-black" preload="metadata" />
        </div>
      )}

      {/* Reactions row */}
      <div className="px-4 pt-1 pb-2 flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onReact("heart")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all active:scale-95 ${
            post.my_reactions?.includes("heart") ? "bg-red-50 text-red-500 font-semibold" : "bg-muted/60 text-muted-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${post.my_reactions?.includes("heart") ? "fill-red-500" : ""}`} />
          {(post.reactions_count?.heart || 0) > 0 && (post.reactions_count?.heart || 0)}
        </button>
        {REACTIONS.map((r) => {
          const active = post.my_reactions?.includes(r.key);
          const count = post.reactions_count?.[r.key] || 0;
          return (
            <button
              key={r.key}
              onClick={() => onReact(r.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all active:scale-95 ${
                active ? "bg-[#1B4332]/10 text-[#1B4332] font-semibold ring-1 ring-[#1B4332]/30" : "bg-muted/60 text-muted-foreground"
              }`}
              aria-label={r.label}
            >
              <span className="text-sm leading-none">{r.emoji}</span>
              {count > 0 && count}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-3 pt-1 flex items-center gap-1 border-t border-border/20 mx-4">
        <span className="text-xs text-muted-foreground pl-1">
          {totalReactions} {totalReactions === 1 ? "reação" : "reações"}
        </span>
        <button
          onClick={onComment}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95 ml-auto"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {post.comments_count > 0 && post.comments_count}
        </button>
      </div>
    </Card>

    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Excluir publicação</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>);
}

export default function CommunityHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    posts, loading, createPost, toggleReaction, toggleFollow,
    addComment, reportPost, deletePost, uploadPostImage, uploadPostVideo, fetchComments,
  } = useCommunityFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [hasAcceptedRules, setHasAcceptedRules] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"all" | "following">("all");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("community_rules_acceptance")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setHasAcceptedRules(!!data));
  }, [user]);

  const handleAcceptRules = async () => {
    if (!user) return;
    await supabase.from("community_rules_acceptance").insert({ user_id: user.id });
    setHasAcceptedRules(true);
  };

  const visiblePosts = useMemo(() => {
    if (tab === "following") return posts.filter((p) => p.is_following_author);
    return posts;
  }, [posts, tab]);

  if (hasAcceptedRules === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F6F2" }}>
        <div className="h-8 w-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAcceptedRules === false) {
    return <RulesAcceptance onAccept={handleAcceptRules} />;
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F8F6F2" }}>
      <header className="sticky top-0 z-30 bg-[#F8F6F2]/95 backdrop-blur-md border-b border-black/5">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/app")}
                className="p-1 -ml-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[#1B4332]" />
              </button>
              <h1 className="text-lg font-bold text-[#1B4332] tracking-tight" style={{ letterSpacing: "-0.5px" }}>
                Histórias que Conectam
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-black/5 p-1 rounded-xl">
            <button
              onClick={() => setTab("all")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "all" ? "bg-white text-[#1B4332] shadow-sm" : "text-muted-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTab("following")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "following" ? "bg-white text-[#1B4332] shadow-sm" : "text-muted-foreground"
              }`}
            >
              Seguindo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        <Card
          className="p-4 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setShowCreate(true)}
        >
          <div className="flex items-center gap-3">
            {user && <AnonAvatar userId={user.id} />}
            <p className="text-sm text-muted-foreground flex-1">O que você quer compartilhar hoje?</p>
            <div className="flex gap-1.5">
              <div className="w-8 h-8 rounded-full bg-[#1B4332]/5 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-[#1B4332]" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1B4332]/5 flex items-center justify-center">
                <Video className="h-4 w-4 text-[#1B4332]" />
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 rounded-2xl border-0 shadow-sm bg-white">
                <div className="flex gap-3 mb-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              </Card>
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1B4332]/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {tab === "following" ? "Nenhum post de quem você segue" : "Nenhuma história ainda"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {tab === "following"
                ? "Siga outros guerreiros para ver as histórias deles aqui."
                : "Seja o primeiro a compartilhar. Sua experiência pode inspirar alguém."}
            </p>
            {tab !== "following" && (
              <Button onClick={() => setShowCreate(true)} className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Compartilhar
              </Button>
            )}
          </div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onReact={(r) => toggleReaction(post.id, r)}
              onComment={() => setCommentsPostId(post.id)}
              onReport={() => reportPost(post.id, "Conteúdo inadequado")}
              onToggleFollow={() => toggleFollow(post.user_id)}
              onDelete={() => deletePost(post.id)}
            />
          ))
        )}
      </main>

      <CreatePostDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPost}
        onUploadImage={uploadPostImage}
        onUploadVideo={uploadPostVideo}
      />

      {commentsPostId && (
        <CommentsDrawer
          open={!!commentsPostId}
          onClose={() => setCommentsPostId(null)}
          postId={commentsPostId}
          onAddComment={addComment}
          onFetchComments={fetchComments}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
