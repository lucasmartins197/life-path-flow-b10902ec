import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useExercise, ExerciseActivity } from "@/hooks/useExercise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import {
  ArrowLeft,
  Plus,
  Dumbbell,
  Flame,
  Clock,
  Camera,
  Upload,
  Trash2,
  TrendingUp,
  Image,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const intensityLabels = {
  light: "Leve",
  moderate: "Moderado",
  intense: "Intenso",
};

export default function ExerciseHome() {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);
  const {
    activities,
    logs,
    evolution,
    dailyStats,
    addLog,
    deleteLog,
    addBodyPhoto,
    uploadBodyPhoto,
    isLoading,
  } = useExercise(selectedDate);

  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ExerciseActivity | null>(
    null
  );
  const [duration, setDuration] = useState("30");
  const [intensity, setIntensity] = useState("moderate");
  const [notes, setNotes] = useState("");
  const [photoType, setPhotoType] = useState("front");
  const [weight, setWeight] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddExercise = async () => {
    if (!selectedActivity) return;

    const success = await addLog(
      selectedActivity,
      null,
      parseInt(duration) || 30,
      intensity,
      notes || undefined
    );

    if (success) {
      setIsExerciseDialogOpen(false);
      setSelectedActivity(null);
      setDuration("30");
      setIntensity("moderate");
      setNotes("");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const photoUrl = await uploadBodyPhoto(file);

    if (photoUrl) {
      await addBodyPhoto(
        photoUrl,
        photoType,
        weight ? parseFloat(weight) : undefined
      );
      setIsPhotoDialogOpen(false);
      setWeight("");
    }
    setIsUploading(false);
  };

  const categorizedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.category]) {
      acc[activity.category] = [];
    }
    acc[activity.category].push(activity);
    return acc;
  }, {} as Record<string, ExerciseActivity[]>);

  const categoryLabels: Record<string, string> = {
    cardio: "Cardio",
    strength: "Força",
    flexibility: "Flexibilidade",
    sports: "Esportes",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(selectedDate), "EEEE, dd 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
            <h1 className="text-lg font-display font-semibold">Exercícios</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Daily Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="card-premium">
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{dailyStats.workouts}</p>
              <p className="text-xs text-muted-foreground">Treinos</p>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{dailyStats.totalMinutes}</p>
              <p className="text-xs text-muted-foreground">Minutos</p>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{dailyStats.totalCalories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Exercise */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Treinos de Hoje
              </span>
              <Dialog
                open={isExerciseDialogOpen}
                onOpenChange={setIsExerciseDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Registrar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Exercício</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {Object.entries(categorizedActivities).map(
                        ([category, acts]) => (
                          <div key={category}>
                            <p className="text-xs text-muted-foreground font-medium mb-1">
                              {categoryLabels[category] || category}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {acts.map((activity) => (
                                <button
                                  key={activity.id}
                                  className={`p-2 text-left rounded-lg border text-sm transition-colors ${
                                    selectedActivity?.id === activity.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:bg-muted/50"
                                  }`}
                                  onClick={() => setSelectedActivity(activity)}
                                >
                                  {activity.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Duração (min)
                        </label>
                        <Input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Intensidade</label>
                        <Select value={intensity} onValueChange={setIntensity}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Leve</SelectItem>
                            <SelectItem value="moderate">Moderado</SelectItem>
                            <SelectItem value="intense">Intenso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Input
                      placeholder="Observações (opcional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />

                    <Button
                      className="w-full"
                      onClick={handleAddExercise}
                      disabled={!selectedActivity}
                    >
                      Registrar Exercício
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum exercício registrado hoje
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {log.activity?.name || log.custom_activity_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.duration_minutes} min •{" "}
                        {intensityLabels[log.intensity as keyof typeof intensityLabels]} •{" "}
                        {log.calories_burned} kcal
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteLog(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Body Evolution */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução Corporal
              </span>
              <Dialog
                open={isPhotoDialogOpen}
                onOpenChange={setIsPhotoDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4 mr-1" />
                    Nova Foto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Evolução</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Select value={photoType} onValueChange={setPhotoType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de foto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front">Frente</SelectItem>
                        <SelectItem value="side">Lateral</SelectItem>
                        <SelectItem value="back">Costas</SelectItem>
                      </SelectContent>
                    </Select>

                    <div>
                      <label className="text-sm font-medium">
                        Peso atual (kg) - opcional
                      </label>
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Ex: 75.5"
                        step="0.1"
                      />
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    <Button
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Enviar Foto
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evolution.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Registre fotos para acompanhar sua evolução
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {evolution.slice(0, 6).map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg bg-muted overflow-hidden relative"
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Evolução ${photo.photo_type}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1">
                      <p className="text-[10px] text-white text-center">
                        {format(new Date(photo.taken_at), "dd/MM")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
