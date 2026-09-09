import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Utensils, 
  Dumbbell, 
  Activity,
  TrendingUp,
  Apple,
  Flame,
  Stethoscope,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function HealthHome() {
  const navigate = useNavigate();

  const todayStats = [
    { label: "Calorias", value: "1,450", target: "2,000", icon: Flame, color: "text-orange-500" },
    { label: "Proteína", value: "85g", target: "120g", icon: Apple, color: "text-green-500" },
    { label: "Exercício", value: "45min", target: "60min", icon: Activity, color: "text-blue-500" },
  ];

  const modules = [
    { 
      id: "therapy", 
      title: "Corpo Clínico", 
      description: "Psicólogos, psiquiatras e terapeutas",
      icon: Stethoscope, 
      path: "/app/terapia",
      color: "bg-primary/10 text-primary"
    },
    { 
      id: "nutrition", 
      title: "Nutrição", 
      description: "Registro de refeições e IA nutricional",
      icon: Utensils, 
      path: "/app/nutricao",
      color: "bg-orange-500/10 text-orange-600"
    },
    { 
      id: "exercise", 
      title: "Exercícios", 
      description: "Treinos personalizados e evolução corporal",
      icon: Dumbbell, 
      path: "/app/exercicios",
      color: "bg-blue-500/10 text-blue-600"
    },
    { 
      id: "legal", 
      title: "Apoio Jurídico", 
      description: "Advogados especializados e simulador de dívidas",
      icon: Scale, 
      path: "/app/juridico",
      color: "bg-primary/10 text-primary"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-health text-health-foreground">
        <div className="container px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/app")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">Saúde</h1>
              <p className="text-health-foreground/70 text-sm">
                IA Nutricional & Treinos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 -mt-4">
        {/* Today's Stats */}
        <Card className="card-premium mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Resumo de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {todayStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">
                    meta: {stat.target}
                  </p>
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: "70%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        <section className="space-y-3">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="w-full card-premium p-4 flex items-center gap-4 text-left"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.color}`}>
                <module.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{module.title}</h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
            </button>
          ))}
        </section>

        {/* Entenda a ludopatia — conteudo educativo */}
        <section className="mt-6 space-y-4">
          <div className="card-premium p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Entenda a ludopatia</h2>
                <p className="text-xs text-muted-foreground">O que a ciência diz sobre o vício em apostas</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A ludopatia — ou transtorno do jogo — é uma doença reconhecida pela
              Organização Mundial da Saúde, classificada ao lado das dependências
              químicas (CID F63.0). Não é falta de força de vontade nem fraqueza de
              caráter: é uma condição médica que afeta o cérebro e exige cuidado.
            </p>
          </div>

          <div className="card-premium p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">Por que é tão difícil parar sozinho</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              A aposta ativa no cérebro os mesmos circuitos de recompensa das drogas.
              Cada jogada libera dopamina, criando um ciclo que se retroalimenta — e o
              cérebro passa a pedir mais para sentir o mesmo. Por isso "só querer parar"
              raramente basta.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Um dos mecanismos mais traiçoeiros é o <strong>"quase ganhar"</strong>: perder por
              pouco ativa o cérebro quase tanto quanto ganhar, e alimenta a vontade de
              continuar. Não é você sendo fraco — é o jogo sendo desenhado para prender.
            </p>
          </div>

          <div className="card-premium p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Sinais de alerta</h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2.5"><Activity className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Pensar em apostas o tempo todo, planejando a próxima jogada.</span></li>
              <li className="flex gap-2.5"><Activity className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Precisar apostar valores cada vez maiores para sentir emoção.</span></li>
              <li className="flex gap-2.5"><Activity className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Tentar parar e não conseguir, com irritação ou inquietação.</span></li>
              <li className="flex gap-2.5"><Activity className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Apostar para "recuperar" o que perdeu (perseguir as perdas).</span></li>
              <li className="flex gap-2.5"><Activity className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span>Mentir para esconder o quanto joga.</span></li>
            </ul>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <p className="text-sm text-green-800 leading-relaxed">
              <strong>A boa notícia:</strong> como toda doença, a ludopatia tem tratamento — e
              quanto mais cedo se começa, maiores as chances de recuperação. Procurar
              ajuda não é fraqueza. É o ato mais corajoso que você pode fazer por você.
            </p>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
