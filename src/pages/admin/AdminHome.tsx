import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, 
  UserCheck, 
  Video, 
  FileText, 
  DollarSign, 
  LogOut,
  Settings,
  BarChart3,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Download,
  RefreshCw,
  UserPlus,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminHome() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { metrics, recentUsers, recentPayments, isLoading, refetch, downloadCSV } = useAdminDashboard();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const metricsData = [
    { 
      label: "Total de Usuários", 
      value: metrics.totalUsers.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-primary"
    },
    { 
      label: "Receita Total", 
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: "text-success"
    },
    { 
      label: "Consultas Realizadas", 
      value: metrics.totalConsultations.toLocaleString("pt-BR"),
      icon: Video,
      color: "text-info"
    },
    { 
      label: "Profissionais Ativos", 
      value: metrics.activeProfessionals.toLocaleString("pt-BR"),
      icon: UserCheck,
      color: "text-primary"
    },
  ];

  const adminModules = [
    { 
      title: "Aprovar Profissionais", 
      description: "Revisar e aprovar novos profissionais",
      icon: UserCheck,
      path: "/admin/profissionais",
      available: true,
    },
    { 
      title: "Conteúdo da Jornada", 
      description: "Editar passos e conteúdos",
      icon: FileText,
      path: "/admin/conteudo",
      available: false,
    },
    { 
      title: "Gerenciar Vídeos", 
      description: "Upload e gestão de vídeos",
      icon: Video,
      path: "/admin/videos",
      available: false,
    },
    { 
      title: "Planos e Assinaturas", 
      description: "Configurar planos Stripe",
      icon: DollarSign,
      path: "/admin/planos",
      available: false,
    },
    { 
      title: "Relatórios", 
      description: "Análises e métricas",
      icon: BarChart3,
      path: "/admin/relatorios",
      available: false,
    },
    { 
      title: "Auditoria", 
      description: "Logs e segurança",
      icon: Shield,
      path: "/admin/auditoria",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/app")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-primary-foreground/70">Painel Master</p>
              <h1 className="text-lg font-display font-semibold">
                {profile?.full_name || "Administrador"}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={refetch}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricsData.map((metric, index) => (
            <Card key={index} className="metric-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-20 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <p className="metric-value">{metric.value}</p>
                  <p className="metric-label">{metric.label}</p>
                </>
              )}
            </Card>
          ))}
        </section>

        {/* Data Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Users */}
          <Card className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Últimos Cadastros
                </CardTitle>
                <CardDescription>Novos membros do Movimento</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              ) : recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum cadastro encontrado
                </p>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.full_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-success">
                      <ArrowUpRight className="h-3 w-3" />
                      Novo
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Transações Recentes
              </CardTitle>
              <CardDescription>Últimos pagamentos registrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento encontrado
                </p>
              ) : (
                recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-success/10">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {payment.payment_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(payment.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-success">
                      {formatCurrency(Number(payment.amount))}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* Export Section */}
        <section className="mb-8">
          <Card className="card-premium border-dashed border-2 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Prontuário Consolidado</h3>
                    <p className="text-sm text-muted-foreground">
                      Exporte a evolução completa de todos os pacientes
                    </p>
                  </div>
                </div>
                <Button onClick={downloadCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Admin Modules */}
        <section>
          <h2 className="text-xl font-display font-semibold mb-4">
            Gerenciamento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map((module, index) => (
              <Card 
                key={index} 
                className="card-premium cursor-pointer"
                onClick={() => {
                  if (module.available) {
                    navigate(module.path);
                  } else {
                    toast("Em breve");
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <module.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-1">{module.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
