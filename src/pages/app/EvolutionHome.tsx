import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import {
  TrendingUp,
  Flame,
  Target,
  Calendar,
  Award,
  Activity,
  Heart,
  Wallet,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function EvolutionHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Fetch patient profile for journey stats
  const { data: patientProfile } = useQuery({
    queryKey: ["patient-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch trail progress
  const { data: trailProgress } = useQuery({
    queryKey: ["trail-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("trail_progress")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch exercise stats
  const { data: exerciseStats } = useQuery({
    queryKey: ["exercise-stats", user?.id],
    queryFn: async () => {
      if (!user) return { totalMinutes: 0, totalCalories: 0 };
      const { data } = await supabase
        .from("exercise_logs")
        .select("duration_minutes, calories_burned")
        .eq("user_id", user.id);
      
      if (!data) return { totalMinutes: 0, totalCalories: 0 };
      
      return data.reduce(
        (acc, log) => ({
          totalMinutes: acc.totalMinutes + log.duration_minutes,
          totalCalories: acc.totalCalories + Number(log.calories_burned),
        }),
        { totalMinutes: 0, totalCalories: 0 }
      );
    },
    enabled: !!user,
  });

  // Fetch nutrition stats
  const { data: nutritionStats } = useQuery({
    queryKey: ["nutrition-stats", user?.id],
    queryFn: async () => {
      if (!user) return { totalMeals: 0, avgCalories: 0 };
      const { data } = await supabase
        .from("nutrition_logs")
        .select("calories")
        .eq("user_id", user.id);
      
      if (!data || data.length === 0) return { totalMeals: 0, avgCalories: 0 };
      
      const totalCalories = data.reduce((sum, log) => sum + Number(log.calories), 0);
      return {
        totalMeals: data.length,
        avgCalories: Math.round(totalCalories / data.length),
      };
    },
    enabled: !!user,
  });

  const completedSteps = trailProgress?.filter((p) => p.is_completed).length || 0;
  const streakDays = patientProfile?.streak_days || 0;
  const currentStep = patientProfile?.current_step || 1;

  const evolutionCards = [
    {
      title: "Dias de Streak",
      value: streakDays,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "Sua consistência na jornada",
    },
    {
      title: "Passos Concluídos",
      value: `${completedSteps}/12`,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Progresso na jornada dos 12 passos",
    },
    {
      title: "Exercícios",
      value: `${exerciseStats?.totalMinutes || 0} min`,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: `${exerciseStats?.totalCalories || 0} calorias queimadas`,
    },
    {
      title: "Refeições",
      value: nutritionStats?.totalMeals || 0,
      icon: Heart,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: `Média de ${nutritionStats?.avgCalories || 0} kcal/refeição`,
    },
  ];

  const quickActions = [
    {
      title: "Ver Prontuário",
      description: "Histórico completo de registros",
      icon: BarChart3,
      path: "/app/prontuario",
    },
    {
      title: "Relatório Diário",
      description: "Resumo gerado pela IA",
      icon: Calendar,
      path: "/app/relatorio",
    },
    {
      title: "Conquistas",
      description: "Medalhas e marcos alcançados",
      icon: Award,
      path: "/app/conquistas",
    },
  ];

  return (
    <div className="min-h-screen bg-background safe-top pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container px-4 py-6">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm mb-3"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6" />
            <h1 className="text-2xl font-display font-bold">Minha Evolução</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Acompanhe seu progresso e conquistas
          </p>
        </div>
      </header>

      <main className="container px-4 -mt-4 pb-6">
        {/* Main Progress Card */}
        <Card className="card-premium mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Jornada</p>
                <h2 className="text-3xl font-bold text-foreground">
                  Passo {currentStep}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round((completedSteps / 12) * 100)}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / 12) * 100}%` }}
              />
            </div>

            <div className="flex justify-between mt-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < completedSteps
                      ? "bg-primary"
                      : i === currentStep - 1
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          {evolutionCards.map((card, index) => (
            <Card key={index} className="card-premium">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center mb-3`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm font-medium text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-4">
            Detalhes da Evolução
          </h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="card-premium cursor-pointer"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Weekly Summary */}
        <section className="mt-6">
          <Card className="card-premium bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-display font-semibold">
                  Meta da Semana
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Continue mantendo sua rotina consistente. Você está no caminho certo!
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">5/7</p>
                  <p className="text-xs text-muted-foreground">Dias ativos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">3</p>
                  <p className="text-xs text-muted-foreground">Exercícios</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">100%</p>
                  <p className="text-xs text-muted-foreground">Rotina</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Porto Seguro Button */}
      <PortoSeguroButton />

      {/* AI Chat */}
    </div>
  );
}
