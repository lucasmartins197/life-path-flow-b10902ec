import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Search,
  Star,
  ChevronLeft,
  Calendar as CalIcon,
  Clock,
  Video,
  Check,
  CreditCard,
  User,
  Shield,
  X,
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { useTherapy, Professional } from "@/hooks/useTherapy";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Helpers ─────────────────────────────────────────
function Initials({ name }: { name: string }) {
  const parts = name.split(" ");
  return <>{parts[0]?.[0]}{parts[1]?.[0] || ""}</>;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "text-accent fill-accent" : "text-border"}`}
        />
      ))}
      <span className="text-xs font-semibold ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Time slots generator ────────────────────────────
function generateSlots() {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}
const TIME_SLOTS = generateSlots();

// ── Available dates (next 14 days, skip sundays) ────
function getAvailableDates() {
  const dates: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = 1; i <= 14; i++) {
    const d = addDays(today, i);
    if (d.getDay() !== 0) dates.push(d);
  }
  return dates;
}

export default function TherapyHome() {
  const navigate = useNavigate();
  const { professionals, appointments, credits, loading, bookAppointment, cancelAppointment, rateAppointment } = useTherapy();
  const [search, setSearch] = useState("");

  // Booking flow state
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);

  // Rating
  const [ratingAppt, setRatingAppt] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return professionals;
    const q = search.toLowerCase();
    return professionals.filter(
      (p) =>
        p.profile_name?.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q)
    );
  }, [professionals, search]);

  const availableDates = useMemo(() => getAvailableDates(), []);

  const upcomingAppts = appointments.filter((a) => a.status === "scheduled" && !isBefore(new Date(a.scheduled_at), new Date()));
  const pastAppts = appointments.filter((a) => a.status === "completed" || a.status === "cancelled" || (a.status === "scheduled" && isBefore(new Date(a.scheduled_at), new Date())));

  const startBooking = (pro: Professional) => {
    setSelectedPro(pro);
    setShowProfile(false);
    setBookingStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowBooking(true);
  };

  const confirmBooking = async () => {
    if (!selectedPro || !selectedDate || !selectedTime) return;
    const [h, m] = selectedTime.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    const success = await bookAppointment(selectedPro.id, dt, selectedPro.meeting_link);
    if (success) setBookingStep(4);
  };

  const getProfessionalName = (proId: string) => {
    return professionals.find((p) => p.id === proId)?.profile_name || "Profissional";
  };

  // ── RENDER ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background safe-top pb-28">
      {/* ── Header ─────────────────────────────────── */}
      <header className="bg-card border-b border-border/60 px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.5px" }}>
                Terapia
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Especialistas em recuperação de ludopatia
              </p>
            </div>
            <button
              onClick={() => setShowAppointments(true)}
              className="relative p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <CalIcon className="h-5 w-5 text-foreground" />
              {upcomingAppts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {upcomingAppts.length}
                </span>
              )}
            </button>
          </div>

          {/* Credits banner */}
          {credits > 0 ? (
            <div className="mt-4 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {credits} {credits === 1 ? "sessão disponível" : "sessões disponíveis"}
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground">Sessão avulsa por R$ 229,90</span>
              </div>
              <button className="text-xs font-semibold text-accent hover:underline">Adquirir</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 space-y-6">
        {/* ── Vídeo introdutório ───────────────────── */}
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#1B4332" }}>
            Acompanhamento Psicológico
          </h2>
          <div className="w-full rounded-xl overflow-hidden shadow-md bg-black">
            <iframe
              src="https://drive.google.com/file/d/1p4L5F5jkiUCltDejhgrK9x54HYU0ErFN/preview"
              width="100%"
              style={{ aspectRatio: "16 / 9", border: "none" }}
              allow="autoplay"
              allowFullScreen
              title="Acompanhamento Psicológico"
            />
          </div>
        </section>

        {/* ── Search ────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar profissional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-premium"
          />
        </div>

        {/* ── Loading skeleton ──────────────────────── */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-premium p-4 space-y-3">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Professionals list ────────────────────── */}
        {!loading && filtered.length === 0 && professionals.length === 0 && (
          <div className="card-premium p-8 text-center space-y-3">
            <User className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum profissional cadastrado ainda.
            </p>
            <p className="text-xs text-muted-foreground">
              Em breve, especialistas em ludopatia estarão disponíveis aqui.
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && professionals.length > 0 && (
          <div className="card-premium p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum profissional encontrado.</p>
          </div>
        )}

        {!loading && filtered.map((pro) => (
          <div
            key={pro.id}
            className="card-premium p-4 active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {pro.avatar_url ? (
                  <img
                    src={pro.avatar_url}
                    alt={pro.profile_name || ""}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-lg font-bold text-primary">
                    <Initials name={pro.profile_name || "P"} />
                  </div>
                )}
                {pro.is_online && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary border-2 border-card" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground text-sm" style={{ letterSpacing: "-0.3px" }}>
                      {pro.profile_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{pro.specialty}</p>
                    {pro.council_number && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        CRP {pro.council_number}{pro.council_state ? `/${pro.council_state}` : ""}
                      </p>
                    )}
                  </div>
                  <StarRating rating={pro.rating} />
                </div>

                {pro.gambling_specialist && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent uppercase tracking-wide">
                    <Shield className="h-3 w-3" />
                    Especialista em Ludopatia
                  </span>
                )}

                {pro.bio && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2" style={{ lineHeight: "1.6" }}>
                    {pro.bio}
                  </p>
                )}

                {pro.approach.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pro.approach.slice(0, 3).map((a: string) => (
                      <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => {
                  setSelectedPro(pro);
                  setShowProfile(true);
                }}
              >
                Ver perfil
              </Button>
              <Button
                className="flex-1 text-xs gap-1.5"
                onClick={() => startBooking(pro)}
              >
                <CalIcon className="h-3.5 w-3.5" />
                Agendar
              </Button>
            </div>
          </div>
        ))}
      </main>

      {/* ── Profile Dialog ──────────────────────────── */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedPro && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  {selectedPro.avatar_url ? (
                    <img src={selectedPro.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-primary/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
                      <Initials name={selectedPro.profile_name || "P"} />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-lg">{selectedPro.profile_name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedPro.specialty}</p>
                    {selectedPro.council_number && (
                      <p className="text-xs text-muted-foreground">
                        CRP {selectedPro.council_number}{selectedPro.council_state ? `/${selectedPro.council_state}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {selectedPro.gambling_specialist && (
                  <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5">
                    <Shield className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Especialista em Ludopatia</span>
                  </div>
                )}

                <StarRating rating={selectedPro.rating} />

                {selectedPro.bio && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sobre</p>
                    <p className="text-sm text-foreground" style={{ lineHeight: "1.6" }}>{selectedPro.bio}</p>
                  </div>
                )}

                {selectedPro.approach.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Abordagem</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPro.approach.map((a: string) => (
                        <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPro.specialties.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPro.specialties.map((s: string) => (
                        <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">{selectedPro.total_sessions || 0} sessões realizadas</span>
                </div>

                <Button className="w-full gap-2" onClick={() => startBooking(selectedPro)}>
                  <CalIcon className="h-4 w-4" />
                  Agendar sessão
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Booking Drawer ──────────────────────────── */}
      <Drawer open={showBooking} onOpenChange={setShowBooking}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              {bookingStep === 1 && "Escolha data e horário"}
              {bookingStep === 2 && "Confirmar agendamento"}
              {bookingStep === 3 && "Pagamento"}
              {bookingStep === 4 && "Agendamento confirmado"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-20 overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
            {/* Step 1 — Date & Time */}
            {bookingStep === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Selecione o dia</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableDates.map((d) => (
                      <button
                        key={d.toISOString()}
                        onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                        className={`p-2.5 rounded-xl text-center transition-all duration-200 ${
                          selectedDate?.toDateString() === d.toDateString()
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80 text-foreground"
                        }`}
                      >
                        <p className="text-[10px] uppercase">{format(d, "EEE", { locale: ptBR })}</p>
                        <p className="text-lg font-bold">{format(d, "d")}</p>
                        <p className="text-[10px]">{format(d, "MMM", { locale: ptBR })}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Horários disponíveis</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selectedTime === slot
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary hover:bg-secondary/80 text-foreground"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setBookingStep(2)}
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* Step 2 — Confirmation */}
            {bookingStep === 2 && selectedPro && selectedDate && selectedTime && (
              <div className="space-y-5">
                <div className="card-premium p-4">
                  <div className="flex items-center gap-4">
                    {selectedPro.avatar_url ? (
                      <img src={selectedPro.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center font-bold text-primary">
                        <Initials name={selectedPro.profile_name || "P"} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground">{selectedPro.profile_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedPro.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CalIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTime} — 45 minutos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span>Videochamada</span>
                    </div>
                  </div>
                </div>

                {credits > 0 ? (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">1 sessão será debitada do seu saldo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
                    <CreditCard className="h-4 w-4 text-accent" />
                    <span className="text-sm">R$ 229,90 será cobrado agora</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setBookingStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (credits > 0) {
                        confirmBooking();
                      } else {
                        setBookingStep(3);
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Payment */}
            {bookingStep === 3 && (
              <div className="space-y-5">
                <div className="card-premium p-6 text-center space-y-3">
                  <CreditCard className="h-10 w-10 text-accent mx-auto" />
                  <p className="text-2xl font-bold text-foreground">R$ 229,90</p>
                  <p className="text-sm text-muted-foreground">Sessão avulsa de 45 minutos</p>
                </div>

                <Button className="w-full gap-2" onClick={confirmBooking}>
                  Pagar e confirmar
                </Button>

                <Button variant="outline" className="w-full" onClick={() => setBookingStep(2)}>
                  Voltar
                </Button>
              </div>
            )}

            {/* Step 4 — Success */}
            {bookingStep === 4 && selectedPro && selectedDate && selectedTime && (
              <div className="space-y-5 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Sessão agendada</p>
                  <p className="text-sm text-muted-foreground mt-1">Sua consulta foi confirmada com sucesso</p>
                </div>

                <div className="card-premium p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTime} — 45min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPro.profile_name}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setShowBooking(false);
                    setShowAppointments(true);
                  }}
                >
                  Ver meus agendamentos
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Appointments Drawer ─────────────────────── */}
      <Drawer open={showAppointments} onOpenChange={setShowAppointments}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Meus agendamentos</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-20 overflow-y-auto space-y-6" style={{ maxHeight: "calc(90vh - 80px)" }}>
            {/* Upcoming */}
            {upcomingAppts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Próximas consultas</p>
                <div className="space-y-3">
                  {upcomingAppts.map((appt) => {
                    const apptDate = new Date(appt.scheduled_at);
                    const now = new Date();
                    const diffMin = (apptDate.getTime() - now.getTime()) / 60000;
                    const canJoin = diffMin <= 15 && diffMin >= -45;
                    const canCancel = diffMin > 24 * 60;

                    return (
                      <div key={appt.id} className="card-premium p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-foreground">{getProfessionalName(appt.professional_id)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(apptDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(apptDate, "HH:mm")} — {appt.duration_minutes}min
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase">
                            Agendado
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {canJoin && appt.meeting_link && (
                            <Button
                              size="sm"
                              className="flex-1 gap-1.5 text-xs"
                              onClick={() => window.open(appt.meeting_link!, "_blank")}
                            >
                              <Video className="h-3.5 w-3.5" />
                              Entrar na sessão
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-destructive"
                              onClick={() => cancelAppointment(appt.id)}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {pastAppts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Histórico</p>
                <div className="space-y-3">
                  {pastAppts.map((appt) => {
                    const apptDate = new Date(appt.scheduled_at);
                    const needsRating = appt.status !== "cancelled" && !appt.rating;

                    return (
                      <div key={appt.id} className="card-premium p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{getProfessionalName(appt.professional_id)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(apptDate, "d MMM yyyy · HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase ${
                              appt.status === "cancelled"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {appt.status === "cancelled" ? "Cancelado" : "Concluído"}
                          </span>
                        </div>
                        {appt.rating && (
                          <div className="mt-2">
                            <StarRating rating={appt.rating} />
                          </div>
                        )}
                        {needsRating && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 text-xs w-full"
                            onClick={() => {
                              setRatingAppt(appt.id);
                              setRatingValue(0);
                            }}
                          >
                            Avaliar sessão
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {appointments.length === 0 && (
              <div className="text-center py-10">
                <CalIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Rating Dialog ───────────────────────────── */}
      <Dialog open={!!ratingAppt} onOpenChange={(open) => !open && setRatingAppt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Como foi sua sessão?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setRatingValue(v)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${v <= ratingValue ? "text-accent fill-accent" : "text-border"}`}
                  />
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={ratingValue === 0}
              onClick={async () => {
                if (ratingAppt) {
                  await rateAppointment(ratingAppt, ratingValue);
                  setRatingAppt(null);
                }
              }}
            >
              Enviar avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
    </div>
  );
}
