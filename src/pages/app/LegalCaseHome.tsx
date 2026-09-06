import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Scale, Check, Clock, FileText, Loader2, MessageCircle } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP = "5516981916656";
const WHATSAPP_MSG = "Olá! Tenho uma dúvida sobre o andamento do meu processo jurídico no Saindo do Jogo.";

// As 5 etapas, em ordem. O status do caso aponta para uma delas.
const ETAPAS = [
  { key: "documentacao", label: "Aguardando documentação", desc: "Contratação confirmada! Envie seus documentos pelo WhatsApp para darmos início ao seu caso." },
  { key: "analise", label: "Em análise pela equipe", desc: "Nossa equipe jurídica está avaliando as provas e a viabilidade da ação." },
  { key: "protocolada", label: "Ação protocolada", desc: "Sua ação foi ajuizada e registrada na Justiça." },
  { key: "tramitacao", label: "Em tramitação", desc: "O processo está correndo na Justiça, aguardando as etapas legais." },
  { key: "concluido", label: "Concluído", desc: "Seu processo chegou ao desfecho. Fale conosco para os detalhes." },
];

interface LegalCase {
  id: string;
  titulo: string | null;
  status: string;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export default function LegalCaseHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<LegalCase[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("legal_cases")
        .select("id, titulo, status, observacao, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCases(data || []);
      setLoading(false);
    })();
  }, [user?.id]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const indiceAtual = (status: string) => {
    const i = ETAPAS.findIndex((e) => e.key === status);
    return i < 0 ? 0 : i;
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app/juridico")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mb-3"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
            >
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Meu Processo</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Acompanhe o andamento do seu caso</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 space-y-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cases.length === 0 ? (
          // Sem caso registrado ainda (pagou mas o caso ainda não foi criado,
          // ou a documentação ainda não chegou)
          <section className="bg-card border border-border/40 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">Seu caso está sendo preparado</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Assim que recebermos e organizarmos sua documentação, o andamento
              do seu processo aparecerá aqui. Nossa equipe entra em contato em
              até 24h após a contratação.
            </p>
          </section>
        ) : (
          cases.map((caso) => {
            const atual = indiceAtual(caso.status);
            return (
              <section key={caso.id} className="bg-card border border-border/40 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-foreground">
                    {caso.titulo || "Seu processo"}
                  </h2>
                  <span className="text-xs text-muted-foreground">Aberto em {fmt(caso.created_at)}</span>
                </div>
                {caso.observacao && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{caso.observacao}</p>
                )}

                {/* Linha do tempo das etapas */}
                <div className="mt-4 space-y-0">
                  {ETAPAS.map((etapa, i) => {
                    const feito = i < atual;
                    const emAndamento = i === atual;
                    const ehUltima = i === ETAPAS.length - 1;
                    return (
                      <div key={etapa.key} className="flex gap-3">
                        {/* coluna do marcador + linha vertical */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              feito
                                ? "bg-primary text-primary-foreground"
                                : emAndamento
                                ? "bg-primary/15 text-primary border-2 border-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {feito ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                          </div>
                          {!ehUltima && (
                            <div className={`w-0.5 flex-1 min-h-[28px] ${i < atual ? "bg-primary" : "bg-border"}`} />
                          )}
                        </div>
                        {/* texto da etapa */}
                        <div className={`pb-5 ${emAndamento ? "" : "opacity-70"}`}>
                          <p className={`text-sm font-semibold ${emAndamento ? "text-primary" : "text-foreground"}`}>
                            {etapa.label}
                            {emAndamento && <span className="ml-2 text-[11px] font-bold text-primary">• ATUAL</span>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{etapa.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground mt-1">
                  Última atualização: {fmt(caso.updated_at)}
                </p>
              </section>
            );
          })
        )}

        {/* Provas que fortalecem o caso — movido da tela pública para cá */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">Provas que fortalecem seu caso</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Quanto mais completa a documentação, mais forte fica sua ação. Reúna
            o que conseguir:
          </p>
          <ul className="space-y-2.5 text-sm text-foreground/80">
            <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Documentos pessoais (RG, CPF, comprovante de residência).</span></li>
            <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Extratos bancários e comprovantes de PIX/cartão para as casas (baixe em PDF pelo banco).</span></li>
            <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Dentro da plataforma: histórico de apostas, depósitos, saques e prints de saldo.</span></li>
            <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Laudo psicológico ou psiquiátrico de ludopatia, se houver.</span></li>
            <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Prints de publicidade abusiva (ganhos garantidos, notificações após perdas).</span></li>
          </ul>
        </section>

        {/* Dúvidas por WhatsApp */}
        <section className="bg-card border border-border/40 rounded-2xl p-5">
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            As atualizações desta tela são informativas. Para tirar dúvidas sobre
            o andamento do seu caso, fale com nossa equipe.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-white font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#25D366" }}
          >
            <MessageCircle className="h-5 w-5" />
            Tirar dúvidas pelo WhatsApp
          </a>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
