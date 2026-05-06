import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  X,
  Star, Heart, AlertCircle, LifeBuoy, Compass, ClipboardList, Apple, Dumbbell,
  type LucideIcon,
} from "lucide-react";

interface DailyAIData {
  greeting: string;
  journey_summary: string;
  nutrition_summary: string;
  exercise_summary: string;
  routine_summary: string;
  risk_alert: string | null;
  daily_tip: string;
  motivation_quote: string;
  overall_mood: string;
  priority_actions: string[];
  score: number;
}

function getMoodConfig(mood: string): { color: string; label: string; Icon: LucideIcon } {
  switch (mood) {
    case "positivo": return { color: "bg-green-500", label: "Tudo certo!", Icon: Star };
    case "neutro": return { color: "bg-blue-500", label: "Atenção leve", Icon: Heart };
    case "atencao": return { color: "bg-orange-500", label: "Atenção", Icon: AlertCircle };
    case "critico": return { color: "bg-red-500", label: "Precisa de apoio", Icon: LifeBuoy };
    default: return { color: "bg-primary", label: "Seu dia", Icon: Sparkles };
  }
}

export function DailyReportCard() {
  const { user } = useAuth();
  const [aiData, setAiData] = useState<DailyAIData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTriedToday, setHasTriedToday] = useState(false);

  useEffect(() => {
    if (user && !hasTriedToday) {
      generateReport();
    }
  }, [user]);

  const generateReport = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    setHasTriedToday(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-daily-report", {});
      if (error) throw error;
      if (data?.ai_data) {
        setAiData(data.ai_data);
      } else if (data?.report) {
        // Cached report — reconstruct ai_data from saved fields
        const r = data.report;
        setAiData({
          greeting: `Olá! Seu relatório de hoje já foi gerado.`,
          journey_summary: r.journey_summary?.text || "",
          nutrition_summary: r.nutrition_summary?.text || "",
          exercise_summary: r.exercise_summary?.text || "",
          routine_summary: r.routine_summary?.text || "",
          risk_alert: r.risk_assessment?.alert || null,
          daily_tip: "",
          motivation_quote: "",
          overall_mood: r.risk_assessment?.mood || "neutro",
          priority_actions: r.ai_recommendations || [],
          score: r.overall_score || 0,
        });
      }
    } catch (e) {
      console.error("Daily report error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isDismissed) return null;

  if (isLoading) {
    return (
      <Card className="card-premium overflow-hidden mb-6">
        <div className="h-1 bg-primary animate-pulse" />
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Lia está preparando seu relatório diário...</p>
        </CardContent>
      </Card>
    );
  }

  if (!aiData) return null;

  const mood = getMoodConfig(aiData.overall_mood);

  return (
    <Card className="card-premium overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className={`h-1.5 ${mood.color}`} />
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Relatório Diário da Lia</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs flex items-center gap-1"><mood.Icon className="h-3 w-3" /> {aiData.score}/100</Badge>
            <button onClick={() => setIsDismissed(true)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <p className="text-sm font-medium text-foreground">{aiData.greeting}</p>

        {/* Risk Alert */}
        {aiData.risk_alert && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{aiData.risk_alert}</p>
          </div>
        )}

        {/* Priority Actions */}
        {aiData.priority_actions?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" /> Prioridades de Hoje
            </p>
            {aiData.priority_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold text-xs mt-0.5">{i + 1}</span>
                <span className="text-foreground">{action}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-in fade-in duration-300">
            {aiData.journey_summary && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5 flex items-center gap-1"><Compass className="h-3 w-3" /> Jornada</p>
                <p className="text-sm text-foreground">{aiData.journey_summary}</p>
              </div>
            )}
            {aiData.routine_summary && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5 flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Rotina</p>
                <p className="text-sm text-foreground">{aiData.routine_summary}</p>
              </div>
            )}
            {aiData.nutrition_summary && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5 flex items-center gap-1"><Apple className="h-3 w-3" /> Nutrição</p>
                <p className="text-sm text-foreground">{aiData.nutrition_summary}</p>
              </div>
            )}
            {aiData.exercise_summary && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5 flex items-center gap-1"><Dumbbell className="h-3 w-3" /> Exercícios</p>
                <p className="text-sm text-foreground">{aiData.exercise_summary}</p>
              </div>
            )}
            {aiData.daily_tip && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{aiData.daily_tip}</p>
              </div>
            )}
            {aiData.motivation_quote && (
              <p className="text-sm italic text-muted-foreground text-center">"{aiData.motivation_quote}"</p>
            )}
          </div>
        )}

        {/* Expand Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <><ChevronUp className="h-3 w-3 mr-1" /> Menos detalhes</>
          ) : (
            <><ChevronDown className="h-3 w-3 mr-1" /> Ver detalhes completos</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
