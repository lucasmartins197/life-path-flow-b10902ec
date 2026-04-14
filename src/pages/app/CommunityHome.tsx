import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { useCommunityFeed, CommunityPost, PostComment } from "@/hooks/useCommunityFeed";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart, MessageCircle, Send, Plus, Users, ChevronLeft,
  Camera, MoreHorizontal, Flag, X, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const MOOD_CONFIG: Record<string, { label: string; color: string }> = {
  motivado: { label: "Motivado", color: "bg-emerald-100 text-emerald-800" },
  desafiador: { label: "Desafiador", color: "bg-amber-100 text-amber-800" },
  grato: { label: "Grato", color: "bg-violet-100 text-violet-800" },
  reflexivo: { label: "Reflexivo", color: "bg-sky-100 text-sky-800" },
};

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
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
  open, onClose, onCreate, onUploadImage
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { content: string; image_url?: string; mood?: string; anonymous?: boolean }) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem deve ter no máximo 2MB");
      return;
    }
    setUploading(true);
    const url = await onUploadImage(file);
    if (url) setImageUrl(url);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await onCreate({
      content: content.trim(),
      image_url: imageUrl || undefined,
      mood: mood || undefined,
      anonymous,
    });
    setContent("");
    setMood(null);
    setAnonymous(false);
    setImageUrl(null);
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto pb-20">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Novo post</DialogTitle>
          <DialogDescription className="text-sm">Compartilhe com a comunidade</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="O que você quer compartilhar hoje?"
              rows={5}
              className="resize-none text-base"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/500</p>
          </div>

          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="Preview" className="w-full rounded-xl aspect-[4/3] object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-1.5"
            >
              {uploading ? (
                <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {uploading ? "Enviando..." : "Foto"}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
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

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Postar anonimamente</p>
              <p className="text-xs text-muted-foreground">Seu nome aparecerá como "Guerreiro Anônimo"</p>
            </div>
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-white h-12 text-base font-semibold"
          >
            {submitting ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsDrawer({
  open, onClose, postId, onAddComment
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
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={c.author_avatar} />
                  <AvatarFallback className="text-xs bg-muted">{(c.author_name || "A")[0]}</AvatarFallback>
                </Avatar>
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
            placeholder="Escreva um comentário..."
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
  post,
  onLike,
  onComment,
  onReport,
  onMessage,
}: {
  post: CommunityPost;
  onLike: () => void;
  onComment: () => void;
  onReport: () => void;
  onMessage: () => void;
}) {
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = () => {
    if (!post.has_liked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 400);
    }
    onLike();
  };

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start gap-3">
        <Avatar className="h-10 w-10 border-2 border-[#1B4332]/10">
          {post.author_avatar ? (
            <AvatarImage src={post.author_avatar} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-sm font-bold">
              {(post.author_name || "G")[0]}
            </AvatarFallback>
          )}
        </Avatar>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReport} className="text-destructive gap-2">
              <Flag className="h-4 w-4" /> Reportar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mood badge */}
      {post.mood && MOOD_CONFIG[post.mood] && (
        <div className="px-4 pb-2">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${MOOD_CONFIG[post.mood].color}`}>
            {MOOD_CONFIG[post.mood].label}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-xl aspect-[4/3] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 pt-1 flex items-center gap-1 border-t border-border/20 mx-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all active:scale-95 ${
            post.has_liked ? "text-red-500 font-semibold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart
            className={`h-[18px] w-[18px] transition-transform ${
              post.has_liked ? "fill-red-500" : ""
            } ${likeAnimating ? "animate-[pulse_0.4s_ease-in-out]" : ""}`}
          />
          {post.likes_count > 0 && post.likes_count}
        </button>
        <button
          onClick={onComment}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {post.comments_count > 0 && post.comments_count}
        </button>
        {!post.anonymous && (
          <button
            onClick={onMessage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95 ml-auto"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </Card>
  );
}

export default function CommunityHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    posts, loading, createPost, toggleLike, addComment, reportPost, uploadPostImage
  } = useCommunityFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [hasAcceptedRules, setHasAcceptedRules] = useState<boolean | null>(null);

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
      {/* Header */}
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
              <div>
                <h1 className="text-lg font-bold text-[#1B4332] tracking-tight" style={{ letterSpacing: "-0.5px" }}>
                  Histórias que Conectam
                </h1>
              </div>
            </div>
            <button
              onClick={() => navigate("/app/mensagens")}
              className="p-2 rounded-lg hover:bg-black/5 transition-colors relative"
            >
              <Send className="h-5 w-5 text-[#1B4332]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* Create Post CTA */}
        <Card
          className="p-4 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setShowCreate(true)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-[#1B4332]/10">
              <AvatarFallback className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-sm font-bold">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground flex-1">O que você quer compartilhar hoje?</p>
            <div className="flex gap-1.5">
              <div className="w-8 h-8 rounded-full bg-[#1B4332]/5 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-[#1B4332]" />
              </div>
            </div>
          </div>
        </Card>

        {/* Feed */}
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
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1B4332]/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhuma história ainda</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Seja o primeiro a compartilhar. Sua experiência pode inspirar alguém.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => toggleLike(post.id, !!post.has_liked)}
              onComment={() => setCommentsPostId(post.id)}
              onReport={() => reportPost(post.id, "Conteúdo inadequado")}
              onMessage={() => navigate(`/app/mensagens?to=${post.user_id}`)}
            />
          ))
        )}
      </main>

      <CreatePostDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPost}
        onUploadImage={uploadPostImage}
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

      <FloatingAIButton />
      <BottomNavigation />
    </div>
  );
}
