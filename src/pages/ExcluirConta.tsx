import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, Mail, Shield } from "lucide-react";

export default function ExcluirConta() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F0E8] safe-top safe-bottom">
      <header className="px-5 pt-7 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[#1B4332] hover:text-[#2D6A4F] transition-colors text-sm py-2 touch-target"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 rounded-full bg-[#1B4332]/10">
            <Trash2 className="h-6 w-6 text-[#1B4332]" />
          </div>
          <h1 className="text-xl font-bold text-[#1B4332]">
            Exclusão de Conta e Dados — Saindo do Jogo
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pb-12 space-y-6 text-sm text-[#1B4332]/80 leading-relaxed">
        <section className="rounded-xl border border-[#1B4332]/10 bg-white p-4 shadow-sm">
          <p>
            O aplicativo <strong className="text-[#1B4332]">Saindo do Jogo</strong>, operado pela{" "}
            <strong className="text-[#1B4332]">Clínica Terapêutica Sobriety Ltda</strong> (CNPJ{" "}
            <strong className="text-[#1B4332]">46.115.913/0001-54</strong>), permite que você exclua
            sua conta e seus dados a qualquer momento.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-[#1B4332]" />
            <h2 className="text-base font-semibold text-[#1B4332]">
              Como excluir sua conta pelo aplicativo
            </h2>
          </div>
          <ol className="list-decimal pl-5 space-y-2 rounded-xl border border-[#1B4332]/10 bg-white p-4 shadow-sm">
            <li>Abra o aplicativo e faça login</li>
            <li>Acesse a aba <strong className="text-[#1B4332]">Perfil</strong></li>
            <li>Role até o final da tela</li>
            <li>Toque em <strong className="text-[#1B4332]">Excluir conta</strong></li>
            <li>Confirme a exclusão nas duas etapas de segurança</li>
          </ol>
          <p className="mt-3">
            Ao confirmar, sua conta e todos os dados pessoais associados são removidos permanentemente.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1B4332] mb-3">
            Dados que são excluídos
          </h2>
          <ul className="list-disc pl-5 space-y-1 rounded-xl border border-[#1B4332]/10 bg-white p-4 shadow-sm">
            <li>Nome, e-mail, telefone, CPF e data de nascimento</li>
            <li>Endereço e dados de perfil</li>
            <li>Dados de saúde e prontuário</li>
            <li>Dados financeiros (dívidas, renda, metas)</li>
            <li>Histórico da jornada, rotina e evolução</li>
            <li>Publicações, comentários e mensagens na comunidade</li>
            <li>Medalhas e progresso</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1B4332] mb-3">
            Dados que podem ser mantidos
          </h2>
          <div className="rounded-xl border border-[#1B4332]/10 bg-white p-4 shadow-sm">
            <p>
              Registros de pagamento e dados fiscais podem ser mantidos pelo período exigido por
              obrigações legais e fiscais (conforme legislação brasileira), de forma desvinculada
              do seu perfil.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-[#1B4332]" />
            <h2 className="text-base font-semibold text-[#1B4332]">
              Exclusão alternativa por e-mail
            </h2>
          </div>
          <div className="rounded-xl border border-[#1B4332]/10 bg-white p-4 shadow-sm">
            <p>
              Caso não consiga acessar o aplicativo, envie uma solicitação de exclusão para{" "}
              <a
                href="mailto:contato@apostandonavida.com.br"
                className="text-[#1B4332] font-semibold underline"
              >
                contato@apostandonavida.com.br
              </a>{" "}
              informando o e-mail cadastrado. Processamos em até 30 dias.
            </p>
          </div>
        </section>

        <p className="text-xs text-[#1B4332]/60 pt-4">
          Última atualização: 25 de junho de 2026.
        </p>
      </main>
    </div>
  );
}
