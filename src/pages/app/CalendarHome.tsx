import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "@/hooks/useCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
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
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Trash2,
  Users,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const eventTypes = [
  { id: "personal", label: "Pessoal", color: "bg-blue-500" },
  { id: "session", label: "Sessão", color: "bg-primary" },
  { id: "group_class", label: "Aula em Grupo", color: "bg-purple-500" },
  { id: "reminder", label: "Lembrete", color: "bg-yellow-500" },
];

export default function CalendarHome() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const { events, getEventsForDate, addEvent, deleteEvent, isLoading } =
    useCalendar(currentMonth);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "personal",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration: "60",
    location: "",
    meeting_url: "",
  });

  const selectedDateEvents = getEventsForDate(selectedDate);

  const handleAddEvent = async () => {
    if (!newEvent.title) return;

    const startTime = new Date(`${newEvent.date}T${newEvent.time}`);
    const endTime = new Date(
      startTime.getTime() + parseInt(newEvent.duration) * 60000
    );

    const success = await addEvent({
      title: newEvent.title,
      description: newEvent.description || undefined,
      event_type: newEvent.event_type,
      start_time: startTime,
      end_time: endTime,
      location: newEvent.location || undefined,
      meeting_url: newEvent.meeting_url || undefined,
    });

    if (success) {
      setIsDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        event_type: "personal",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        duration: "60",
        location: "",
        meeting_url: "",
      });
    }
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find((t) => t.id === type) || eventTypes[0];
  };

  // Highlight dates with events
  const datesWithEvents = events.map((e) => parseISO(e.start_time));
  const modifiers = {
    hasEvent: (date: Date) =>
      datesWithEvents.some((eventDate) => isSameDay(date, eventDate)),
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-display font-semibold">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Título do evento"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />

                <Select
                  value={newEvent.event_type}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, event_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data</label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário</label>
                    <Input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Duração (minutos)</label>
                  <Select
                    value={newEvent.duration}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  placeholder="Local (opcional)"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                />

                <Input
                  placeholder="Link da reunião (opcional)"
                  value={newEvent.meeting_url}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, meeting_url: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Descrição (opcional)"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  rows={2}
                />

                <Button className="w-full" onClick={handleAddEvent}>
                  Criar Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Calendar */}
        <Card className="card-premium">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  textDecorationColor: "hsl(var(--primary))",
                },
              }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum evento agendado
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => {
                  const typeInfo = getEventTypeInfo(event.event_type);
                  return (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div
                            className={`w-1 rounded-full ${typeInfo.color}`}
                          />
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(event.start_time), "HH:mm")}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                              {event.meeting_url && (
                                <a
                                  href={event.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Video className="h-3 w-3" />
                                  Entrar
                                </a>
                              )}
                              {event.is_global && (
                                <span className="flex items-center gap-1 text-purple-500">
                                  <Users className="h-3 w-3" />
                                  Aula
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {!event.is_global && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
