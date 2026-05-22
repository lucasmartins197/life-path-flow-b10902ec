import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAnchorContacts } from "@/hooks/useAnchorContacts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ProntuarioCharts } from "@/components/prontuario/ProntuarioCharts";
import {
  FileText,
  Brain,
  Send,
  Share2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Heart,
  Activity,
  Wallet,
  Target,
  Award,
  Shield,
  Loader2,
  ArrowLeft,
  Utensils,
  Dumbbell,
  Calendar,
  ClipboardList,
} from "lucide-react";

interface Prontuario {
  patient_info: {
    name: string;
    age: string;
    journey_start: string;
    current_step: number;
    streak_days: number;
  };
  journey_status: {
    current_step: number;
    total_steps: number;
    completed_steps: string[];
    pending_steps: string[];
    progress_percentage: number;
    assessment: string;
  };
  routine_analysis: {
    days_tracked: number;
    average_mood: number | null;
    consistency_score: string;
    morning_adherence: string;
    afternoon_adherence: string;
    evening_adherence: string;
    assessment: string;
  };
  nutrition_summary: {
    total_meals_logged: number;
    avg_daily_calories: number;
    avg_protein: number;
    avg_carbs: number;
    avg_fat: number;
    assessment: string;
  };
  exercise_summary: {
    total_sessions: number;
    total_minutes: number;
    total_calories_burned: number;
    favorite_activities: string[];
    assessment: string;
  };
  financial_health: {
    total_income: number;
    total_expenses: number;
    debts_paid: number;
    pending_debts: number;
    assessment: string;
  };
  risk_assessment: {
    total_signals: number;
    critical_signals: number;
    recent_signals: string[];
    risk_level: string;
    assessment: string;
  };
  body_evolution: {
    has_data: boolean;
    weight_trend: string;
    assessment: string;
  };
  badges_achievements: {
    total_badges: number;
    badges: string[];
    assessment: string;
  };
  clinical_notes_summary: {
    total_entries: number;
    recent_themes: string[];
    assessment: string;
  };
  overall_assessment: {
    score: number;
    status: string;
    strengths: string[];
    areas_improvement: string[];
    recommendations: string[];
    evolution_comparison: string;
    professional_notes: string;
  };
  generated_at: string;
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "excelente": return "bg-green-500";
    case "bom": return "bg-emerald-500";
    case "regular": return "bg-yellow-500";
    case "atenção": return "bg-orange-500";
    case "crítico": return "bg-red-500";
    default: return "bg-muted";
  }
}

function getRiskColor(level: string) {
  switch (level?.toLowerCase()) {
    case "baixo": return "text-green-600 bg-green-500/10";
    case "moderado": return "text-yellow-600 bg-yellow-500/10";
    case "alto": return "text-orange-600 bg-orange-500/10";
    case "crítico": return "text-red-600 bg-red-500/10";
    default: return "text-muted-foreground bg-muted";
  }
}

export default function ProntuarioHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { contacts, primaryContact } = useAnchorContacts();
  const { toast } = useToast();
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const generateProntuario = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prontuario", {});
      if (error) throw error;
      if (data?.prontuario) {
        setProntuario(data.prontuario);
        toast({ title: "Prontuário gerado!", description: "Relatório completo gerado pela IA." });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao gerar", description: e.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToContact = async (contactName: string, contactType: string) => {
    setIsSending(true);
    try {
      // Save as patient record entry
      await supabase.from("patient_record_entries").insert({
        patient_id: user!.id,
        entry_type: "prontuario_ai",
        title: `Prontuário IA - ${new Date().toLocaleDateString("pt-BR")}`,
        content: JSON.stringify(prontuario),
        metadata: { sent_to: contactName, contact_type: contactType, generated_at: prontuario?.generated_at },
      });

      toast({
        title: `Prontuário enviado!`,
        description: `Relatório salvo e compartilhado com ${contactName} (${contactType}).`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const p = prontuario;

  return (
    <div className="min-h-screen bg-background safe-top pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-display font-bold">Prontuário Médico</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Relatório completo gerado por IA com base na sua evolução
          </p>
        </div>
      </header>

      <main className="container px-4 -mt-4 pb-6 space-y-4">
        {/* Generate Button */}
        {!prontuario && (
          <Card className="card-premium">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Gerar Prontuário com IA</h2>
              <p className="text-muted-foreground text-sm">
                A IA analisará todos os seus dados — jornada, rotinas, nutrição, exercícios, finanças e sinais de risco — para gerar um prontuário médico completo.
              </p>
              <Button onClick={generateProntuario} disabled={isGenerating} size="lg" className="w-full">
                {isGenerating ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />Analisando dados...</>
                ) : (
                  <><Brain className="h-5 w-5 mr-2" />Gerar Prontuário</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card className="card-premium">
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">A IA está analisando seus dados dos últimos 30 dias...</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Jornada", "Nutrição", "Exercícios", "Rotina", "Finanças", "Risco"].map(item => (
                  <Badge key={item} variant="secondary" className="animate-pulse">{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prontuario Result */}
        {p && !isGenerating && (
          <>
            {/* Overall Score Card */}
            <Card className="card-premium overflow-hidden">
              <div className={`h-2 ${getStatusColor(p.overall_assessment?.status)}`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Paciente</p>
                    <h2 className="text-xl font-bold">{p.patient_info?.name || profile?.full_name || "—"}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-primary">{p.overall_assessment?.score ?? "—"}</p>
                    <Badge className={getStatusColor(p.overall_assessment?.status) + " text-white"}>
                      {p.overall_assessment?.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{p.patient_info?.current_step}/12</p>
                    <p className="text-xs text-muted-foreground">Passo Atual</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{p.patient_info?.streak_days || 0}</p>
                    <p className="text-xs text-muted-foreground">Dias de Streak</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{p.journey_status?.progress_percentage || 0}%</p>
                    <p className="text-xs text-muted-foreground">Progresso</p>
                  </div>
                </div>
                <Progress value={p.journey_status?.progress_percentage || 0} className="mt-4" />
              </CardContent>
            </Card>

            {/* Send Actions */}
            <Card className="card-premium">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Compartilhar Prontuário
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    disabled={isSending}
                    onClick={() => sendToContact("Profissional de Saúde", "medico")}
                  >
                    <Send className="h-4 w-4 mr-2" /> Enviar ao Médico/Terapeuta
                  </Button>
                  {primaryContact && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      disabled={isSending}
                      onClick={() => sendToContact(primaryContact.name, "ancora")}
                    >
                      <Heart className="h-4 w-4 mr-2" /> Enviar para {primaryContact.name} (Âncora)
                    </Button>
                  )}
                  {contacts.filter(c => !c.is_primary).map(contact => (
                    <Button
                      key={contact.id}
                      variant="outline"
                      className="justify-start"
                      disabled={isSending}
                      onClick={() => sendToContact(contact.name, "ancora")}
                    >
                      <Send className="h-4 w-4 mr-2" /> Enviar para {contact.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>


            {/* Evolution Charts */}
            <ProntuarioCharts />

            {/* Tabs with detailed data */}
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="saude">Saúde</TabsTrigger>
                <TabsTrigger value="rotina">Rotina</TabsTrigger>
                <TabsTrigger value="risco">Risco</TabsTrigger>
              </TabsList>

              {/* Geral Tab */}
              <TabsContent value="geral" className="space-y-4">
                {/* Journey */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" /> Status da Jornada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.journey_status?.assessment}</p>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold mb-1 text-foreground">Passos Concluídos:</p>
                      <div className="flex flex-wrap gap-1">
                        {p.journey_status?.completed_steps?.map((s, i) => (
                          <Badge key={i} variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />{s}</Badge>
                        )) || <span className="text-xs text-muted-foreground">Nenhum ainda</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1 text-foreground">Pendentes:</p>
                      <div className="flex flex-wrap gap-1">
                        {p.journey_status?.pending_steps?.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Evolution Comparison */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" /> Comparação de Evolução
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.overall_assessment?.evolution_comparison}</p>
                  </CardContent>
                </Card>

                {/* Strengths & Improvements */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" /> Pontos Fortes & Melhorias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-1">Pontos Fortes:</p>
                      <ul className="space-y-1">
                        {p.overall_assessment?.strengths?.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-orange-600 mb-1">Áreas de Melhoria:</p>
                      <ul className="space-y-1">
                        {p.overall_assessment?.areas_improvement?.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" /> Recomendações Clínicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {p.overall_assessment?.recommendations?.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold">{i + 1}.</span>
                          <span className="text-muted-foreground">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" /> Conquistas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{p.badges_achievements?.assessment}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.badges_achievements?.badges?.map((b, i) => (
                        <Badge key={i} variant="secondary">{b}</Badge>
                      )) || <span className="text-xs text-muted-foreground">Nenhuma conquista ainda</span>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Saúde Tab */}
              <TabsContent value="saude" className="space-y-4">
                {/* Nutrition */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-green-500" /> Nutrição
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{p.nutrition_summary?.total_meals_logged || 0}</p>
                        <p className="text-xs text-muted-foreground">Refeições</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{p.nutrition_summary?.avg_daily_calories || 0}</p>
                        <p className="text-xs text-muted-foreground">kcal/dia (média)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div><span className="font-bold text-foreground">{p.nutrition_summary?.avg_protein || 0}g</span><br/>Proteína</div>
                      <div><span className="font-bold text-foreground">{p.nutrition_summary?.avg_carbs || 0}g</span><br/>Carboidrato</div>
                      <div><span className="font-bold text-foreground">{p.nutrition_summary?.avg_fat || 0}g</span><br/>Gordura</div>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.nutrition_summary?.assessment}</p>
                  </CardContent>
                </Card>

                {/* Exercise */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-blue-500" /> Exercícios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-lg font-bold">{p.exercise_summary?.total_sessions || 0}</p>
                        <p className="text-xs text-muted-foreground">Sessões</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-lg font-bold">{p.exercise_summary?.total_minutes || 0}</p>
                        <p className="text-xs text-muted-foreground">Minutos</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-lg font-bold">{p.exercise_summary?.total_calories_burned || 0}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                    </div>
                    {p.exercise_summary?.favorite_activities?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.exercise_summary.favorite_activities.map((a, i) => (
                          <Badge key={i} variant="secondary">{a}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{p.exercise_summary?.assessment}</p>
                  </CardContent>
                </Card>

                {/* Body Evolution */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-500" /> Evolução Corporal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.body_evolution?.assessment}</p>
                    {p.body_evolution?.weight_trend && (
                      <p className="text-sm mt-2"><span className="font-semibold">Tendência:</span> {p.body_evolution.weight_trend}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rotina Tab */}
              <TabsContent value="rotina" className="space-y-4">
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" /> Análise de Rotina
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{p.routine_analysis?.days_tracked || 0}</p>
                        <p className="text-xs text-muted-foreground">Dias Rastreados</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{p.routine_analysis?.average_mood ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Humor Médio</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Consistência:</span><Badge variant="secondary">{p.routine_analysis?.consistency_score}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Manhã:</span><span>{p.routine_analysis?.morning_adherence}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Tarde:</span><span>{p.routine_analysis?.afternoon_adherence}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Noite:</span><span>{p.routine_analysis?.evening_adherence}</span></div>
                    </div>
                    <Separator />
                    <p className="text-sm text-muted-foreground">{p.routine_analysis?.assessment}</p>
                  </CardContent>
                </Card>

                {/* Finance */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-500" /> Saúde Financeira
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-500/10 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-600">R$ {p.financial_health?.total_income || 0}</p>
                        <p className="text-xs text-muted-foreground">Receitas</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-red-600">R$ {p.financial_health?.total_expenses || 0}</p>
                        <p className="text-xs text-muted-foreground">Despesas</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center text-sm">
                      <div><span className="font-bold text-green-600">{p.financial_health?.debts_paid || 0}</span><br/><span className="text-xs text-muted-foreground">Dívidas Pagas</span></div>
                      <div><span className="font-bold text-orange-600">{p.financial_health?.pending_debts || 0}</span><br/><span className="text-xs text-muted-foreground">Dívidas Pendentes</span></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.financial_health?.assessment}</p>
                  </CardContent>
                </Card>

                {/* Clinical Notes */}
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" /> Resumo Clínico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm"><span className="font-semibold">{p.clinical_notes_summary?.total_entries || 0}</span> entradas registradas</p>
                    {p.clinical_notes_summary?.recent_themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.clinical_notes_summary.recent_themes.map((t, i) => (
                          <Badge key={i} variant="outline">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{p.clinical_notes_summary?.assessment}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Risco Tab */}
              <TabsContent value="risco" className="space-y-4">
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" /> Avaliação de Risco
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nível de Risco:</span>
                      <Badge className={getRiskColor(p.risk_assessment?.risk_level)}>
                        {p.risk_assessment?.risk_level?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{p.risk_assessment?.total_signals || 0}</p>
                        <p className="text-xs text-muted-foreground">Sinais Totais</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-red-600">{p.risk_assessment?.critical_signals || 0}</p>
                        <p className="text-xs text-muted-foreground">Sinais Críticos</p>
                      </div>
                    </div>
                    {p.risk_assessment?.recent_signals?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Sinais Recentes:</p>
                        <ul className="space-y-1">
                          {p.risk_assessment.recent_signals.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500 mt-1 shrink-0" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Separator />
                    <p className="text-sm text-muted-foreground">{p.risk_assessment?.assessment}</p>
                  </CardContent>
                </Card>

                {/* Professional Notes */}
                <Card className="card-premium bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Notas para o Profissional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.overall_assessment?.professional_notes}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Regenerate */}
            <Button variant="outline" className="w-full" onClick={generateProntuario} disabled={isGenerating}>
              <RefreshCw className="h-4 w-4 mr-2" /> Gerar Novo Prontuário
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Gerado em: {p.generated_at ? new Date(p.generated_at).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR")}
            </p>
          </>
        )}
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
