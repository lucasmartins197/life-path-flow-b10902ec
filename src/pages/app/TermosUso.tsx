import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function TermosUso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom pb-28">
      <header className="px-5 pt-7 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm py-2 touch-target"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-xl font-bold text-foreground mt-2">Termos de Uso</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Identificação</h2>
          <p>
            O aplicativo <strong className="text-foreground">Saindo do Jogo</strong> é operado pela{" "}
            <strong className="text-foreground">Clínica Terapêutica Sobriety Ltda</strong>, CNPJ{" "}
            <strong className="text-foreground">46.115.913/0001-54</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. Aceitação</h2>
          <p>
            Ao acessar e utilizar o Saindo do Jogo, você concorda integralmente com estes Termos de Uso.
            Caso não concorde, recomendamos que não utilize os serviços oferecidos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. Serviços</h2>
          <p>
            O app oferece ferramentas de autocuidado, acompanhamento terapêutico, conteúdo educativo
            e suporte comunitário voltados à recuperação da dependência de jogos e apostas.
            Não substituímos tratamento médico ou psiquiátrico presencial quando indicado.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Responsabilidades do Usuário</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornecer informações verdadeiras e atualizadas.</li>
            <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            <li>Utilizar o app de forma ética, sem prejudicar outros usuários.</li>
            <li>Notificar qualquer uso não autorizado de sua conta.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Conteúdo e Conduta</h2>
          <p>
            É proibido publicar conteúdo ofensivo, discriminatório, ilegal ou que promova jogos e apostas.
            Reservamo-nos o direito de moderar, remover conteúdo e suspender contas que violem estas regras.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Limitação de Responsabilidade</h2>
          <p>
            O Saindo do Jogo é uma ferramenta de apoio. Não nos responsabilizamos por crises clínicas
            não comunicadas ou por decisões tomadas pelo usuário fora do ambiente do app.
            Em emergências, utilize o botão Porto Seguro ou ligue diretamente para serviços de emergência.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Alterações</h2>
          <p>
            Podemos atualizar estes termos periodicamente. Notificaremos os usuários sobre mudanças
            significativas. O uso continuado do app após alterações implica aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{" "}
            <a href="mailto:contato@apostandonavida.com.br" className="text-primary underline">
              contato@apostandonavida.com.br
            </a>.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-4 pb-2">
          Última atualização: 04 de junho de 2026.
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}
