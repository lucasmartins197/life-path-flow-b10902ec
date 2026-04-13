import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, PlayCircle, CheckCircle, Clock, BookOpen, Award } from "lucide-react";

const STEP_NAMES: Record<number, string> = {
  1: "Reconhecimento", 2: "Esperança", 3: "Entrega", 4: "Inventário",
  5: "Verdade", 6: "Disponibilidade", 7: "Humildade", 8: "Responsabilidade",
  9: "Reparação", 10: "Vigilância", 11: "Conexão Real", 12: "Propósito",
};

interface JourneyStepData {
  id: string;
  step_number: number;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  video_url: string | null;
  exercises: any[] | null;
  reflection_questions: string[] | null;
}

interface ExerciseAnswer {
  [key: string]: any;
}

export default function JourneyStep() {
  const { stepNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<JourneyStepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<ExerciseAnswer>({});
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>([]);
  const [videoWatched, setVideoWatched] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (stepNumber && user) loadStep();
  }, [stepNumber, user]);

  async function loadStep() {
    setIsLoading(true);
    const { data: stepData, error: stepError } = await supabase
      .from("journey_steps")
      .select("*")
      .eq("step_number", parseInt(stepNumber || "1"))
      .single();

    if (stepError || !stepData) {
      toast({ variant: "destructive", title: "Erro", description: "Passo não encontrado." });
      navigate("/app/jornada");
      return;
    }

    const parsedStep: JourneyStepData = {
      id: stepData.id,
      step_number: stepData.step_number,
      title: stepData.title,
      description: stepData.description,
      duration_minutes: stepData.duration_minutes,
      video_url: stepData.video_url,
      exercises: Array.isArray(stepData.exercises) ? stepData.exercises : [],
      reflection_questions: Array.isArray(stepData.reflection_questions) ? stepData.reflection_questions as string[] : [],
    };
    setStep(parsedStep);

    if (user) {
      const { data: progressData } = await supabase
        .from("trail_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("step_id", stepData.id)
        .single();

      if (progressData) {
        setProgress(progressData);
        const ec = progressData.exercises_completed;
        const ra = progressData.reflection_answers;
        setExerciseAnswers(typeof ec === 'object' && ec !== null && !Array.isArray(ec) ? ec as ExerciseAnswer : {});
        setReflectionAnswers(Array.isArray(ra) ? ra as string[] : []);
        setVideoWatched(progressData.video_watched || false);
      } else {
        setReflectionAnswers(new Array(parsedStep.reflection_questions?.length || 0).fill(""));
      }
    }
    setIsLoading(false);
  }

  function updateExerciseAnswer(exerciseId: string, value: any) {
    setExerciseAnswers((prev) => ({ ...prev, [exerciseId]: value }));
  }

  function updateReflectionAnswer(index: number, value: string) {
    setReflectionAnswers((prev) => {
      const n = [...prev];
      n[index] = value;
      return n;
    });
  }

  async function saveProgress(markComplete = false) {
    if (!user || !step) return;
    setIsSaving(true);

    const progressData = {
      user_id: user.id,
      step_id: step.id,
      video_watched: videoWatched,
      exercises_completed: exerciseAnswers,
      reflection_answers: reflectionAnswers,
      is_completed: markComplete,
      completed_at: markComplete ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("trail_progress")
      .upsert(progressData, { onConflict: "user_id,step_id" });

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o progresso." });
    } else if (markComplete) {
      await supabase
        .from("patient_profiles")
        .update({ current_step: step.step_number + 1 })
        .eq("user_id", user.id);

      // Show celebration
      setShowCelebration(true);
      setTimeout(() => {
        navigate("/app/jornada");
      }, 3000);
    } else {
      toast({ title: "Progresso salvo!", description: "Seu progresso foi salvo automaticamente." });
    }

    setIsSaving(false);
  }

  function renderExercise(exercise: any) {
    const value = exerciseAnswers[exercise.id] || "";
    switch (exercise.type) {
      case "text":
        return (
          <div key={exercise.id} className="space-y-2">
            <h4 className="font-medium">{exercise.title}</h4>
            {exercise.description && <p className="text-sm text-muted-foreground">{exercise.description}</p>}
            <Textarea value={value} onChange={(e) => updateExerciseAnswer(exercise.id, e.target.value)} placeholder="Digite sua resposta aqui..." rows={4} className="resize-none" />
          </div>
        );
      case "checklist":
        const checkedItems = Array.isArray(value) ? value : [];
        return (
          <div key={exercise.id} className="space-y-2">
            <h4 className="font-medium">{exercise.title}</h4>
            <div className="space-y-2">
              {exercise.items?.map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox id={`${exercise.id}-${i}`} checked={checkedItems.includes(item)} onCheckedChange={(checked) => { const newItems = checked ? [...checkedItems, item] : checkedItems.filter((x: string) => x !== item); updateExerciseAnswer(exercise.id, newItems); }} />
                  <label htmlFor={`${exercise.id}-${i}`} className="text-sm cursor-pointer">{item}</label>
                </div>
              ))}
            </div>
          </div>
        );
      case "scale":
        const scaleValue = typeof value === "number" ? value : exercise.min || 1;
        return (
          <div key={exercise.id} className="space-y-4">
            <h4 className="font-medium">{exercise.title}</h4>
            <Slider value={[scaleValue]} onValueChange={([v]) => updateExerciseAnswer(exercise.id, v)} min={exercise.min || 1} max={exercise.max || 10} step={1} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{exercise.min || 1}</span>
              <span className="font-medium text-foreground">{scaleValue}</span>
              <span>{exercise.max || 10}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  /* ── Celebration Overlay ── */
  if (showCelebration && step) {
    const medalName = STEP_NAMES[step.step_number] || step.title;
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="text-center animate-scale-in px-6">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A84C, #E8D590)", boxShadow: "0 0 40px rgba(201,168,76,0.5)" }}
          >
            <Award className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Parabéns! 🎉</h1>
          <p className="text-white/80 text-lg mb-1">
            Você conquistou a medalha
          </p>
          <p className="text-xl font-bold" style={{ color: "#E8D590" }}>
            "{medalName}"
          </p>
          <p className="text-white/50 text-sm mt-6">Redirecionando para a Jornada...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="min-h-screen bg-background pb-20 safe-top">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}>
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/jornada")}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/60">Passo {step.step_number} de 12</p>
            <h1 className="text-lg font-bold text-white truncate">{step.title}</h1>
          </div>
          <button
            onClick={() => navigate("/app/jornada")}
            className="text-white/60 hover:text-white text-xs shrink-0"
          >
            ← Voltar para Jornada
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
        {/* Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{step.duration_minutes} min</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{step.exercises?.length || 0} exercícios</span>
            </div>
            <CardDescription className="text-base mt-2">{step.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Video */}
        {step.video_url ? (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5 text-primary" />Vídeo Aula</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg">
                <video src={step.video_url} controls className="w-full h-full rounded-lg" onEnded={() => setVideoWatched(true)} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Checkbox id="videoWatched" checked={videoWatched} onCheckedChange={(checked) => setVideoWatched(!!checked)} />
                <label htmlFor="videoWatched" className="text-sm cursor-pointer">Marquei como assistido</label>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5 text-muted-foreground" />Vídeo Aula</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center"><PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Vídeo será adicionado em breve</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Checkbox id="videoWatched" checked={videoWatched} onCheckedChange={(checked) => setVideoWatched(!!checked)} />
                <label htmlFor="videoWatched" className="text-sm cursor-pointer">Marcar como assistido (conteúdo lido)</label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        {step.exercises && step.exercises.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Exercícios</CardTitle><CardDescription>Complete os exercícios abaixo para continuar</CardDescription></CardHeader>
            <CardContent className="space-y-6">{step.exercises.map((exercise) => renderExercise(exercise))}</CardContent>
          </Card>
        )}

        {/* Reflections */}
        {step.reflection_questions && step.reflection_questions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Reflexões</CardTitle><CardDescription>Responda às perguntas para aprofundar seu aprendizado</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {step.reflection_questions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium">{question}</h4>
                  <Textarea value={reflectionAnswers[index] || ""} onChange={(e) => updateReflectionAnswer(index, e.target.value)} placeholder="Escreva sua reflexão..." rows={3} className="resize-none" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => saveProgress(false)} disabled={isSaving} className="flex-1">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar progresso
          </Button>
          <Button onClick={() => saveProgress(true)} disabled={isSaving} className="flex-1">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Concluir passo
          </Button>
        </div>

        {/* Nav */}
        <div className="flex justify-between">
          {step.step_number > 1 && (
            <Button variant="ghost" onClick={() => navigate(`/app/jornada/${step.step_number - 1}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />Passo anterior
            </Button>
          )}
          {step.step_number < 12 && (
            <Button variant="ghost" onClick={() => navigate(`/app/jornada/${step.step_number + 1}`)} className="ml-auto">
              Próximo passo<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
