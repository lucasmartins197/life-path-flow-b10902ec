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
      </main>

      <BottomNavigation />
    </div>
  );
}
