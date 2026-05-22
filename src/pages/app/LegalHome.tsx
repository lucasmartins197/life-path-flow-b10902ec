import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  ChevronLeft,
  AlertTriangle,
  FileText,
  Home,
  Briefcase,
  AlertCircle,
  Shield,
  Heart,
  Users,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TopicKey = "dividas" | "patrimonio" | "trabalho" | "negativado" | "autoexclusao" | "familia";

interface Topic {
  key: TopicKey;
  icon: typeof FileText;
  title: string;
  subtitle: string;
}

const TOPICS: Topic[] = [
  { key: "dividas", icon: FileText, title: "Dívidas por Apostas", subtitle: "Seus direitos como devedor" },
  { key: "patrimonio", icon: Home, title: "Proteção do Patrimônio Familiar", subtitle: "Como proteger sua família" },
  { key: "trabalho", icon: Briefcase, title: "Direitos Trabalhistas", subtitle: "Ludopatia e o ambiente de trabalho" },
  { key: "negativado", icon: AlertCircle, title: "Nome Negativado", subtitle: "Como limpar seu nome" },
  { key: "autoexclusao", icon: Shield, title: "Medidas de Autoexclusão", subtitle: "Proteja-se legalmente das apostas" },
  { key: "familia", icon: Heart, title: "Impacto na Família", subtitle: "Divórcio, guarda e pensão" },
];

// Lightweight markdown renderer (headings, bullets, bold)
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: number) => {
    if (listBuffer.length) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1.5 my-3 text-sm text-foreground/90 leading-relaxed">
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const formatInline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      flushList(idx);
      return;
    }
    if (line.startsWith("### ")) {
      flushList(idx);
      elements.push(
        <h4 key={idx} className="font-semibold text-base text-foreground mt-4 mb-2">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList(idx);
      elements.push(
        <h3 key={idx} className="font-bold text-lg text-foreground mt-5 mb-2">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      flushList(idx);
      elements.push(
        <h2 key={idx} className="font-bold text-xl text-foreground mt-5 mb-3">
          {line.slice(2)}
        </h2>
      );
    } else if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
    } else {
      flushList(idx);
      elements.push(
        <p
          key={idx}
          className="text-sm text-foreground/90 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
  });
  flushList(lines.length);
  return elements;
}

export default function LegalHome() {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (priceAlias: "legal_consult" | "legal_full") => {
    setCheckoutLoading(priceAlias);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        navigate("/auth");
        return;
      }
      const priceMap = {
        legal_consult: "price_1Ta1p00oEfdN4xGLiElxDceu",
        legal_full: "price_1Ta1p00oEfdN4xGLiElxDceu",
      };
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          user_id: user.id,
          email: user.email,
          price_id: priceMap[priceAlias],
          mode: "payment",
          success_path: "/app/juridico?success=true",
          cancel_path: "/app/juridico",
        },
      });
      console.log("checkout response:", data, error);
      if (error) {
        toast.error("Erro: " + error.message);
        return;
      }
      if (data?.error) {
        toast.error("Erro: " + data.error);
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("URL de pagamento não retornada");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao iniciar pagamento");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openTopic = async (topic: Topic) => {
    setActiveTopic(topic);
    setContent("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("legal-info", {
        body: { topic: topic.key },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data?.content || "Não foi possível carregar o conteúdo.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar conteúdo");
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* Header */}
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
              <Scale className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Apoio Jurídico</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Entenda seus direitos e encontre orientação
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {/* Vídeo introdutório */}
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#1B4332" }}>
            Entenda seus direitos
          </h2>
          <div className="w-full rounded-xl overflow-hidden shadow-md bg-black">
            <iframe
              src="https://drive.google.com/file/d/1gfJ9MPX_-izhSjYMQQTi-L-k-yrIJLGB/preview"
              width="100%"
              style={{ aspectRatio: "16 / 9", border: "none" }}
              allow="autoplay"
              allowFullScreen
              title="Entenda seus direitos"
            />
          </div>
        </section>

        {/* Aviso */}
        <div className="rounded-xl bg-card border border-border border-l-4 border-l-warning p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            As informações aqui são <strong className="font-semibold">educativas</strong> e não substituem
            consultoria jurídica profissional. Para seu caso específico, consulte um advogado.
          </p>
        </div>

        {/* Tópicos */}
        <section>
          <p className="section-title flex items-center gap-2">
            <Scale className="h-3.5 w-3.5" />
            Temas jurídicos
          </p>
          <div className="space-y-3">
            {TOPICS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => openTopic(t)}
                  className="w-full card-premium p-4 flex items-center gap-4 text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Marketplace de advogados */}
        <section>
          <button
            onClick={() => navigate("/app/juridico/advogados")}
            className="w-full card-premium p-4 flex items-center gap-4 text-left hover:scale-[1.01] active:scale-[0.99] transition-transform border-l-4 border-l-primary"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Encontre um advogado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Profissionais especializados em dívidas e ludopatia
              </p>
            </div>
          </button>
        </section>

        {/* Pacote de atendimento jurídico */}
        <section>
          <p className="section-title flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Pacote de atendimento
          </p>
          <div className="card-premium p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Primeira Consulta Jurídica</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Avaliação inicial com advogado especializado
                </p>
                <p className="text-base font-bold text-foreground mt-2">R$ 199,90</p>
              </div>
            </div>
            <button
              onClick={() => handleCheckout("legal_consult")}
              disabled={checkoutLoading === "legal_consult"}
              className="btn-cta w-full mt-3 py-2.5 text-sm disabled:opacity-60"
            >
              {checkoutLoading === "legal_consult" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Contratar — R$ 199,90"
              )}
            </button>
          </div>
        </section>


        {/* LGPD */}
        <div className="rounded-xl border border-border p-4 flex gap-3">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Conteúdo educativo gerado com apoio de IA. Sempre verifique informações atualizadas e consulte
            profissionais qualificados.
          </p>
        </div>
      </main>

      {/* Topic Dialog */}
      <Dialog open={!!activeTopic} onOpenChange={(o) => !o && setActiveTopic(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0">
          {activeTopic && (
            <>
              <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <activeTopic.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{activeTopic.title}</p>
                  <p className="text-xs text-muted-foreground">{activeTopic.subtitle}</p>
                </div>
                <button
                  onClick={() => setActiveTopic(null)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Gerando explicação...</p>
                  </div>
                ) : (
                  <div className="prose-content">{renderMarkdown(content)}</div>
                )}
                <div className="mt-6 rounded-lg bg-warning/10 border border-warning/30 p-3 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Conteúdo educativo. Consulte um advogado para orientação sobre seu caso.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
