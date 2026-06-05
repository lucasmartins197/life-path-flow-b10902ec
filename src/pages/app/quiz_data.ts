// Quiz data for the 12 steps of the recovery journey.
// Each quiz has 3 multiple-choice questions; the user must get at least 2 right to pass.

export type QuizQuestion = {
  text: string;
  options: string[];
  correct: number; // index of correct option
};

export type StepQuiz = {
  questions: QuizQuestion[];
  depositoPrompt?: string;
};

export const STEP_QUIZ: Record<number, StepQuiz> = {
  1: {
    questions: [
      {
        text: "Qual é o primeiro passo para iniciar a recuperação da ludopatia?",
        options: [
          "Esconder o problema da família",
          "Reconhecer e admitir o problema",
          "Tentar recuperar o dinheiro perdido apostando mais",
          "Esperar o problema passar sozinho",
        ],
        correct: 1,
      },
      {
        text: "Por que é importante ser honesto consigo mesmo sobre os impactos do jogo?",
        options: [
          "Para se sentir culpado",
          "Para entender o tamanho real do problema e agir",
          "Para impressionar outras pessoas",
          "Para justificar continuar apostando",
        ],
        correct: 1,
      },
      {
        text: "Admitir o problema é sinal de:",
        options: ["Fraqueza", "Derrota", "Coragem e maturidade", "Vergonha"],
        correct: 2,
      },
    ],
  },
  2: {
    questions: [
      {
        text: "O que a esperança representa na recuperação?",
        options: [
          "Uma ilusão sem fundamento",
          "A crença de que mudança é possível, um dia de cada vez",
          "Garantia de que nunca haverá recaída",
          "Esperar passivamente que tudo melhore",
        ],
        correct: 1,
      },
      {
        text: "Visualizar um futuro melhor ajuda porque:",
        options: [
          "Substitui a necessidade de agir",
          "Direciona escolhas e motiva ações concretas hoje",
          "Faz o problema desaparecer",
          "Não tem efeito real",
        ],
        correct: 1,
      },
      {
        text: "A recuperação acontece:",
        options: [
          "De forma instantânea",
          "Apenas com medicamentos",
          "Um dia de cada vez, com consistência",
          "Sem esforço pessoal",
        ],
        correct: 2,
      },
    ],
  },
  3: {
    questions: [
      {
        text: "Pedir ajuda na recuperação é:",
        options: ["Sinal de fraqueza", "Uma decisão inteligente e corajosa", "Desnecessário", "Vergonhoso"],
        correct: 1,
      },
      {
        text: "Para que serve um Contato Âncora?",
        options: [
          "Para emprestar dinheiro quando faltar",
          "Para apostar junto",
          "Para apoiar e ser acionado em momentos de crise",
          "Para julgar suas escolhas",
        ],
        correct: 2,
      },
      {
        text: "Tentar se recuperar totalmente sozinho geralmente:",
        options: [
          "É o caminho mais eficaz",
          "Aumenta o risco de recaída",
          "Garante sucesso",
          "É recomendado por especialistas",
        ],
        correct: 1,
      },
    ],
  },
  4: {
    questions: [
      {
        text: "O que são gatilhos no contexto da ludopatia?",
        options: [
          "Apenas situações financeiras",
          "Emoções, lugares ou situações que despertam o desejo de apostar",
          "Sintomas físicos sem relação com o jogo",
          "Pensamentos positivos",
        ],
        correct: 1,
      },
      {
        text: "Identificar seus gatilhos serve para:",
        options: [
          "Evitá-los ou se preparar para enfrentá-los",
          "Justificar recaídas",
          "Ignorá-los",
          "Compartilhar nas redes sociais",
        ],
        correct: 0,
      },
      {
        text: "Qual destas situações é um gatilho comum?",
        options: ["Praticar exercício físico", "Tédio, ansiedade ou solidão", "Dormir bem", "Comer de forma saudável"],
        correct: 1,
      },
    ],
  },
  5: {
    questions: [
      {
        text: "Por que o silêncio alimenta o vício?",
        options: [
          "Porque mantém a vergonha e o isolamento",
          "Porque protege a pessoa",
          "Porque facilita o tratamento",
          "Porque não tem efeito",
        ],
        correct: 0,
      },
      {
        text: "Falar a verdade sobre o vício:",
        options: [
          "Aumenta a culpa para sempre",
          "Reduz o poder da vergonha e abre espaço para a cura",
          "Deve ser evitado a todo custo",
          "Piora o problema",
        ],
        correct: 1,
      },
      {
        text: "Compartilhar um depoimento, mesmo anônimo, ajuda porque:",
        options: [
          "Liberta a pessoa e pode inspirar outros",
          "Expõe sem necessidade",
          "Não tem impacto real",
          "Apenas serve para estatística",
        ],
        correct: 0,
      },
    ],
  },
  6: {
    questions: [
      {
        text: "Estar disponível para mudar significa:",
        options: [
          "Esperar a vontade aparecer",
          "Agir diferente todos os dias, mesmo sem vontade",
          "Mudar apenas quando for fácil",
          "Não precisar de esforço",
        ],
        correct: 1,
      },
      {
        text: "Por que rotinas saudáveis ajudam na recuperação?",
        options: [
          "Ocupam o espaço que o jogo ocupava",
          "Eliminam toda emoção",
          "Substituem a terapia",
          "Não têm efeito",
        ],
        correct: 0,
      },
      {
        text: "Mudança real exige:",
        options: ["Sorte", "Ações consistentes no dia a dia", "Apenas força de vontade pontual", "Esperar o tempo passar"],
        correct: 1,
      },
    ],
  },
  7: {
    questions: [
      {
        text: "Humildade na recuperação significa:",
        options: [
          "Se diminuir como pessoa",
          "Reconhecer que precisa de ajuda profissional e dos outros",
          "Aceitar passivamente o vício",
          "Esconder o problema",
        ],
        correct: 1,
      },
      {
        text: "A terapia com profissional especializado em ludopatia é importante porque:",
        options: [
          "Substitui a responsabilidade pessoal",
          "Oferece ferramentas e acompanhamento clínico sem julgamento",
          "Só serve para casos extremos",
          "É garantia de cura imediata",
        ],
        correct: 1,
      },
      {
        text: "A ilusão de controle no vício costuma:",
        options: [
          "Proteger a pessoa",
          "Manter o ciclo e aumentar prejuízos",
          "Acelerar a recuperação",
          "Indicar maturidade",
        ],
        correct: 1,
      },
    ],
  },
  8: {
    questions: [
      {
        text: "Reparação significa:",
        options: [
          "Apagar o passado",
          "Agir de forma diferente daqui em diante e reconstruir vínculos quando possível",
          "Esquecer quem foi afetado",
          "Pedir desculpa só de palavras",
        ],
        correct: 1,
      },
      {
        text: "Encarar as dívidas é importante porque:",
        options: [
          "Permite criar um plano real de organização financeira",
          "Aumenta a culpa sem propósito",
          "Não muda nada",
          "Substitui a recuperação",
        ],
        correct: 0,
      },
      {
        text: "Reparação só faz sentido quando:",
        options: [
          "Há tempo para reconstruir tudo de uma vez",
          "É feita com responsabilidade e mudança de comportamento",
          "Acontece em segredo",
          "Vem acompanhada de promessas vazias",
        ],
        correct: 1,
      },
    ],
  },
  9: {
    questions: [
      {
        text: "Responsabilidade na recuperação é:",
        options: [
          "Culpar os outros pelo vício",
          "Assumir as próprias escolhas e agir todos os dias",
          "Esperar que alguém resolva por você",
          "Negar o problema",
        ],
        correct: 1,
      },
      {
        text: "O check-in diário ajuda porque:",
        options: [
          "Cria consistência e fortalece a nova identidade",
          "Substitui qualquer outro recurso",
          "Não tem impacto",
          "Aumenta a ansiedade",
        ],
        correct: 0,
      },
      {
        text: "Cada dia sem apostar é:",
        options: ["Sorte", "Uma prova concreta da sua capacidade de mudança", "Sem importância", "Garantia eterna"],
        correct: 1,
      },
    ],
  },
  10: {
    questions: [
      {
        text: "A recaída costuma começar:",
        options: [
          "Na hora exata da aposta",
          "Antes, em pensamentos e sinais sutis",
          "Sem nenhum aviso",
          "Apenas por culpa dos outros",
        ],
        correct: 1,
      },
      {
        text: "Vigilância significa:",
        options: [
          "Viver com medo permanente",
          "Estar atento aos próprios pensamentos e gatilhos",
          "Controlar os outros",
          "Ignorar emoções",
        ],
        correct: 1,
      },
      {
        text: "Configurar alertas e ferramentas de proteção ajuda porque:",
        options: [
          "Age antes que o impulso se transforme em ação",
          "Substitui a vontade pessoal",
          "Não faz diferença",
          "Garante zero recaída",
        ],
        correct: 0,
      },
    ],
  },
  11: {
    questions: [
      {
        text: "Ter sentido e propósito na vida ajuda na recuperação porque:",
        options: [
          "Torna o jogo menos atrativo frente ao que importa",
          "Substitui qualquer tratamento",
          "Não tem relação com o vício",
          "Aumenta o risco de recaída",
        ],
        correct: 0,
      },
      {
        text: "O apoio jurídico para vítimas de apostas pode:",
        options: [
          "Servir apenas para empresas",
          "Ajudar a entender direitos e possíveis caminhos de reparação",
          "Garantir devolução automática de tudo",
          "Substituir o tratamento",
        ],
        correct: 1,
      },
      {
        text: "Conexão final significa:",
        options: [
          "Se isolar de todos",
          "Reconectar-se com pessoas, valores e propósito",
          "Encerrar a jornada",
          "Depender apenas de si mesmo",
        ],
        correct: 1,
      },
    ],
  },
  12: {
    questions: [
      {
        text: "Compartilhar sua história de recuperação:",
        options: [
          "Expõe sem propósito",
          "Pode inspirar e salvar outras pessoas e fortalece sua cura",
          "Não tem efeito",
          "Deve ser sempre evitado",
        ],
        correct: 1,
      },
      {
        text: "Ajudar outros na recuperação:",
        options: [
          "Atrapalha o próprio processo",
          "Faz parte do amadurecimento e da consolidação da mudança",
          "Só serve para os outros",
          "É opcional e irrelevante",
        ],
        correct: 1,
      },
      {
        text: "A jornada de 12 passos:",
        options: [
          "Termina e nunca mais precisa ser revisitada",
          "É um processo contínuo de cuidado e prática diária",
          "Garante imunidade ao vício",
          "Não exige manutenção",
        ],
        correct: 1,
      },
    ],
  },
};
