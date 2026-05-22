import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNutrition, NutritionFood } from "@/hooks/useNutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Search,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Apple,
  Trash2,
  Flame,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const mealTypes = [
  { id: "breakfast", label: "Café da Manhã", icon: Coffee },
  { id: "lunch", label: "Almoço", icon: Sun },
  { id: "dinner", label: "Jantar", icon: Moon },
  { id: "snack", label: "Lanche", icon: Apple },
];

export default function NutritionHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);
  const {
    foods,
    logsByMeal,
    dailySummary,
    isLoading,
    searchFoods,
    addLog,
    deleteLog,
  } = useNutrition(selectedDate);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("snack");
  const [selectedFood, setSelectedFood] = useState<NutritionFood | null>(null);
  const [quantity, setQuantity] = useState("1");

  // Daily goals (can be customized later)
  const goals = {
    calories: 2000,
    protein: 60,
    carbs: 250,
    fat: 65,
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchFoods(query);
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    const success = await addLog(
      selectedFood,
      null,
      selectedMeal,
      parseFloat(quantity) || 1
    );

    if (success) {
      setIsDialogOpen(false);
      setSelectedFood(null);
      setSearchQuery("");
      setQuantity("1");
    }
  };

  const getMealIcon = (mealType: string) => {
    const meal = mealTypes.find((m) => m.id === mealType);
    return meal?.icon || Utensils;
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
            <h1 className="text-lg font-display font-semibold">Nutrição</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Daily Summary */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Resumo do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Calorias</span>
                <span>
                  {Math.round(dailySummary.calories)} / {goals.calories} kcal
                </span>
              </div>
              <Progress
                value={(dailySummary.calories / goals.calories) * 100}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Proteína</p>
                <p className="text-lg font-semibold">
                  {Math.round(dailySummary.protein)}g
                </p>
                <p className="text-xs text-muted-foreground">
                  / {goals.protein}g
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Carboidratos</p>
                <p className="text-lg font-semibold">
                  {Math.round(dailySummary.carbohydrates)}g
                </p>
                <p className="text-xs text-muted-foreground">/ {goals.carbs}g</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Gorduras</p>
                <p className="text-lg font-semibold">
                  {Math.round(dailySummary.fat)}g
                </p>
                <p className="text-xs text-muted-foreground">/ {goals.fat}g</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        {mealTypes.map((meal) => {
          const MealIcon = meal.icon;
          const mealLogs = logsByMeal[meal.id as keyof typeof logsByMeal];

          return (
            <Card key={meal.id} className="card-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MealIcon className="h-5 w-5 text-primary" />
                    {meal.label}
                  </CardTitle>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMeal(meal.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Alimento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                          <SelectTrigger>
                            <SelectValue placeholder="Refeição" />
                          </SelectTrigger>
                          <SelectContent>
                            {mealTypes.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar alimento..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {foods.length > 0 && (
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {foods.map((food) => (
                              <button
                                key={food.id}
                                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                                  selectedFood?.id === food.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                }`}
                                onClick={() => setSelectedFood(food)}
                              >
                                <p className="font-medium">{food.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {food.calories} kcal • {food.serving_size}
                                  {food.serving_unit}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}

                        {selectedFood && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium">{selectedFood.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-20"
                                min="0.1"
                                step="0.1"
                              />
                              <span className="text-sm text-muted-foreground">
                                porções ({selectedFood.serving_size}
                                {selectedFood.serving_unit})
                              </span>
                            </div>
                            <p className="text-sm mt-2">
                              Total:{" "}
                              {Math.round(
                                selectedFood.calories * (parseFloat(quantity) || 1)
                              )}{" "}
                              kcal
                            </p>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          onClick={handleAddFood}
                          disabled={!selectedFood}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {mealLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum alimento registrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {log.food?.name || log.custom_food_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.quantity}x • {Math.round(log.calories)} kcal
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
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
          );
        })}
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
