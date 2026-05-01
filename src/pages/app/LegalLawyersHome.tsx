import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  Search,
  MapPin,
  Filter,
  Star,
  Clock,
  Shield,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { DebtSimulator } from "@/components/legal/DebtSimulator";
import { LawyerBookingDialog } from "@/components/legal/LawyerBookingDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SPECIALTIES = [
  "Direito do Consumidor",
  "Renegociação de Dívidas",
  "Direito Bancário",
  "Superendividamento",
  "Recuperação Judicial",
];

export default function LegalLawyersHome() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);

  const { data: lawyers = [], isLoading } = useQuery({
    queryKey: ["lawyers", searchTerm, cityFilter, specialtyFilter],
    queryFn: async () => {
      let query = supabase
        .from("professional_profiles")
        .select("*, profiles!inner(full_name, avatar_url, city, phone)")
        .eq("professional_type", "advogado")
        .eq("is_approved", true);

      if (specialtyFilter && specialtyFilter !== "all") {
        query = query.ilike("specialty", `%${specialtyFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        filtered = filtered.filter((l: any) =>
          l.profiles?.full_name?.toLowerCase().includes(t) ||
          l.specialty?.toLowerCase().includes(t)
        );
      }
      if (cityFilter) {
        const c = cityFilter.toLowerCase();
        filtered = filtered.filter((l: any) =>
          l.profiles?.city?.toLowerCase().includes(c)
        );
      }
      return filtered;
    },
  });

  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app/juridico")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-5 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Apoio Jurídico
          </button>
          <h1 className="text-2xl font-bold text-foreground">Encontre um advogado</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Profissionais especializados em dívidas</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        <button
          onClick={() => setShowSimulator((v) => !v)}
          className="w-full card-premium p-4 flex items-center gap-4 text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Calculator className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">Simulador de Renegociação</p>
            <p className="text-xs text-muted-foreground mt-0.5">Calcule prazos e parcelas com IA</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showSimulator ? "rotate-90" : ""}`} />
        </button>

        {showSimulator && <DebtSimulator />}

        <div className="card-premium p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-premium"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Cidade"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="pl-10 input-premium"
              />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="input-premium border-border">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <section>
          <p className="section-title flex items-center gap-2">
            <Scale className="h-3.5 w-3.5" />
            Advogados disponíveis
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : lawyers.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <Scale className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum advogado encontrado.</p>
              <p className="text-xs text-muted-foreground mt-1">Tente remover os filtros.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lawyers.map((lawyer: any) => (
                <div key={lawyer.id} className="card-premium p-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Scale className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {lawyer.profiles?.full_name || "Advogado"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            OAB/{lawyer.council_state} {lawyer.council_number}
                          </p>
                        </div>
                        {lawyer.rating > 0 && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                            <span className="text-sm font-semibold">{Number(lawyer.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wide">
                          {lawyer.specialty}
                        </span>
                        {lawyer.profiles?.city && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {lawyer.profiles.city}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-foreground">
                          R$ {Number(lawyer.hourly_rate).toFixed(0)}
                          <span className="font-normal text-muted-foreground text-xs">/consulta</span>
                        </span>
                        <button
                          onClick={() => setSelectedLawyer(lawyer)}
                          className="btn-cta py-2 px-4 text-xs"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Agendar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-border p-4 flex gap-3">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seus dados são compartilhados com o profissional selecionado apenas mediante seu consentimento explícito, conforme a LGPD.
          </p>
        </div>
      </main>

      {selectedLawyer && (
        <LawyerBookingDialog
          lawyer={selectedLawyer}
          open={!!selectedLawyer}
          onOpenChange={(open) => !open && setSelectedLawyer(null)}
        />
      )}

      <BottomNavigation />
      <AIChatPanel />
    </div>
  );
}
