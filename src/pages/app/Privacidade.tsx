import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function Privacidade() {
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
        <h1 className="text-xl font-bold text-foreground mt-2">Política de Privacidade</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Quem somos</h2>
          <p>
            O <strong className="text-foreground">Stake Real</strong> é operado pela{" "}
            <strong className="text-foreground">Clínica Terapêutica Sobriety Ltda</strong> (CNPJ 46.115.913/0001-54).
            Levamos a sério a proteção dos seus dados pessoais e agimos em conformidade com a{" "}
            <strong className="text-foreground">Lei Geral de Proteção de Dados (LGPD)</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. Dados coletados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome, e-mail, telefone, CPF e data de nascimento (cadastro).</li>
            <li>CEP e endereço (para eventual faturamento ou suporte).</li>
            <li>Gênero e biografia (opcionais, para personalização).</li>
            <li>Dados de uso do app (rotina, evolução, interações na comunidade).</li>
            <li>Informações de saúde relatadas voluntariamente (prontuário, sinais de risco).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. Finalidade do uso</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Prestar os serviços terapêuticos e de acompanhamento oferecidos.</li>
            <li>Personalizar a experiência e conteúdo do app.</li>
            <li>Processar pagamentos e gerenciar assinaturas.</li>
            <li>Enviar comunicações importantes sobre saúde e segurança.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Compartilhamento</h2>
          <p>
            Não vendemos seus dados. Compartilhamos apenas com:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Profissionais de saúde credenciados, quando você agenda atendimento.</li>
            <li>Prestadores de serviço essenciais (processamento de pagamento, nuvem).</li>
            <li>Autoridades, quando legalmente exigido.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Segurança</h2>
          <p>
            Adotamos criptografia, controle de acesso baseado em funções (RBAC), auditoria de logs
            e outras medidas técnicas e administrativas para proteger suas informações.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Seus direitos (LGPD)</h2>
          <p>Você pode, a qualquer momento:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acessar, corrigir ou atualizar seus dados.</li>
            <li>Solicitar anonimização ou exclusão de dados pessoais.</li>
            <li>Revogar consentimentos previamente dados.</li>
            <li>Solicitar portabilidade dos dados.</li>
          </ul>
          <p className="mt-2">
            Para exercer seus direitos, envie um e-mail para{" "}
            <a href="mailto:contato@apostandonavida.com.br" className="text-primary underline">
              contato@apostandonavida.com.br
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Retenção</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política
            e para atender a obrigações legais. Após esse período, os dados são anonimizados ou excluídos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Contato do DPO</h2>
          <p>
            Nosso Encarregado de Proteção de Dados pode ser contatado pelo e-mail{" "}
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
