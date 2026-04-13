import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { useCommunity, CommunityStory } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, Bookmark, Plus, Users, Clock, Sparkles, Award, Compass, Shield, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const journeyMomentLabels: Record<string, string> = {
  inicio: "Início da recuperação",
  desafio: "Desafio recente",
  conquista: "Conquista pessoal",
  reflexao: "Reflexão da jornada",
};

function RulesModal({ onAccept }: { onAccept: () => void }) {
  return (
    <Dialog open>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Regras da Comunidade</DialogTitle>
          <DialogDescription className="text-center text-base mt-2 leading-relaxed">
            Este é um espaço de apoio e respeito.{"\n"}
            Compartilhe sua verdade com responsabilidade.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground mt-2">
          <p>• Trate todos com empatia e respeito</p>
          <p>• Não incentive comportamentos de risco</p>
          <p>• Conteúdos inadequados serão removidos</p>
          <p>• Sua privacidade e a dos outros é prioridade</p>
        </div>
        <Button onClick={onAccept} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
          Entendo e quero participar
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CreateStoryDialog({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; content: string; journey_moment?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moment, setMoment] = useState("reflexao");

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onCreate({ title: title.trim(), content: content.trim(), journey_moment: moment });
    setTitle("");
    setContent("");
    setMoment("reflexao");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar minha história</DialogTitle>
          <DialogDescription>Cada história compartilhada pode ajudar alguém a continuar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Título da história</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: O dia que decidi mudar"
              maxLength={120}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Qual momento da sua jornada você está compartilhando?
            </label>
            <Select value={moment} onValueChange={setMoment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inicio">Início da recuperação</SelectItem>
                <SelectItem value="desafio">Desafio recente</SelectItem>
                <SelectItem value="conquista">Conquista pessoal</SelectItem>
                <SelectItem value="reflexao">Reflexão da jornada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Seu relato</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe o que você quiser..."
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/2000</p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Publicar história
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StoryCard({ story, onSupport }: { story: CommunityStory; onSupport: () => void }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="p-5 space-y-4 border border-border/50 shadow-sm">
      {/* Author header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={story.author_avatar} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
            {(story.author_name || "A").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{story.author_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {format(new Date(story.created_at), "d 'de' MMM", { locale: ptBR })}
            </span>
            {story.journey_moment && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {journeyMomentLabels[story.journey_moment] || story.journey_moment}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">{story.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-6">
          {story.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSupport}
          className={`gap-1.5 text-xs ${story.has_supported ? "text-primary font-semibold" : "text-muted-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${story.has_supported ? "fill-primary" : ""}`} />
          Apoiar {story.support_count > 0 && `(${story.support_count})`}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Comentar {story.comment_count > 0 && `(${story.comment_count})`}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground ml-auto">
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({ onCreateStory }: { onCreateStory: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma história ainda</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Seja o primeiro a compartilhar sua experiência e inspirar outras pessoas.
      </p>
      <Button onClick={onCreateStory} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
        <Plus className="h-4 w-4" />
        Compartilhar minha história
      </Button>
    </div>
  );
}

export default function CommunityHome() {
  const { stories, loading, hasAcceptedRules, acceptRules, createStory, toggleSupport } = useCommunity();
  const [showCreate, setShowCreate] = useState(false);

  if (hasAcceptedRules === false) {
    return <RulesModal onAccept={acceptRules} />;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Histórias que Conectam</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cada história compartilhada pode ajudar alguém a continuar.
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* CTA Card */}
        <Card className="p-4 border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Compartilhe sua experiência</p>
              <p className="text-xs text-muted-foreground">Sua história pode inspirar alguém hoje.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Stories Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2 bg-muted rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <EmptyState onCreateStory={() => setShowCreate(true)} />
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onSupport={() => toggleSupport(story.id, !!story.has_supported)}
            />
          ))
        )}
      </main>

      <CreateStoryDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createStory}
      />

      <FloatingAIButton />
      <BottomNavigation />
    </div>
  );
}
