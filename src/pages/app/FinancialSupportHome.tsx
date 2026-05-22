import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search,
  Star,
  Calendar,
  MessageCircle,
  Calculator,
  BookOpen,
  TrendingUp
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { useState } from "react";

const financialProfessionals = [
  {
    id: "1",
    name: "Carlos Mendes",
    specialty: "Contador - Reorganização Financeira",
    type: "contador" as const,
    rating: 4.9,
    totalSessions: 178,
    hourlyRate: 120,
    isOnline: true,
    bio: "Especialista em reestruturação de dívidas e planejamento financeiro para recuperação."
  },
  {
    id: "2",
    name: "Fernanda Lima",
    specialty: "Educadora Financeira",
    type: "educador_financeiro" as const,
    rating: 4.8,
    totalSessions: 245,
    hourlyRate: 100,
    isOnline: true,
    bio: "Focada em educação financeira para pessoas em recuperação de dependências."
  },
  {
    id: "3",
    name: "Roberto Alves",
    specialty: "Contador - Dívidas e Negociação",
    type: "contador" as const,
    rating: 4.7,
    totalSessions: 132,
    hourlyRate: 140,
    isOnline: false,
    bio: "Experiência em negociação de dívidas e acordos com credores."
  },
];

export default function FinancialSupportHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProfessionals = financialProfessionals.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineProfessionals = financialProfessionals.filter((p) => p.isOnline);

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(145,60%,28%)] to-[hsl(170,50%,35%)] text-white">
        <div className="container px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/app")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">Apoio Financeiro</h1>
              <p className="text-white/70 text-sm">
                Contadores e educadores financeiros
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 pb-24">
        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-3 mb-6">
          <Card className="card-premium cursor-pointer" onClick={() => navigate("/app/financas")}>
            <CardContent className="p-4 text-center">
              <Calculator className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Minhas Finanças</p>
            </CardContent>
          </Card>
          <Card className="card-premium cursor-pointer">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Educação</p>
            </CardContent>
          </Card>
          <Card className="card-premium cursor-pointer">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Meu Plano</p>
            </CardContent>
          </Card>
        </section>

        {/* Search */}
        <section className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar contador ou educador financeiro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-premium"
            />
          </div>
        </section>

        {/* Online Now */}
        {onlineProfessionals.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-lg font-display font-semibold">Online Agora</h2>
              <span className="text-sm text-muted-foreground">({onlineProfessionals.length})</span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {onlineProfessionals.map((pro) => (
                <Card key={pro.id} className="card-premium shrink-0 w-48 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="absolute bottom-0 right-1/2 translate-x-6 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <h3 className="font-semibold text-center truncate">{pro.name}</h3>
                    <p className="text-xs text-muted-foreground text-center truncate">{pro.specialty}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{pro.rating}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Professionals */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-4">Profissionais Financeiros</h2>
          
          <div className="space-y-4">
            {filteredProfessionals.map((pro) => (
              <Card key={pro.id} className="card-premium cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {pro.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      {pro.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{pro.name}</h3>
                          <p className="text-sm text-muted-foreground">{pro.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{pro.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{pro.bio}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-muted-foreground">{pro.totalSessions} sessões</span>
                        <span className="font-semibold text-primary">R$ {pro.hourlyRate}/sessão</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Mensagem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
    </div>
  );
}
