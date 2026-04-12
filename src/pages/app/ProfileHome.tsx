import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Bell,
  HelpCircle,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PortoSeguroButton } from "@/components/PortoSeguroButton";
import { AIChatPanel } from "@/components/chat/AIChatPanel";

export default function ProfileHome() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    { icon: User, label: "Meus Dados", path: "/app/onboarding" },
    { icon: CreditCard, label: "Minha Assinatura", path: "/app/assinatura" },
    { icon: Shield, label: "Rede de Apoio", path: "/app/ancora" },
    { icon: Bell, label: "Notificações", path: "/app/configuracoes" },
    { icon: Settings, label: "Configurações", path: "/app/configuracoes" },
    { icon: HelpCircle, label: "Ajuda", path: "/app/ajuda" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container px-4 py-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-lg">
                {profile?.full_name ? getInitials(profile.full_name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-display font-bold">
                {profile?.full_name || "Usuário"}
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 -mt-4">
        {/* Stats Card */}
        <Card className="card-premium mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">7 dias na jornada</p>
                <p className="text-sm text-muted-foreground">Continue assim!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="card-premium">
          <CardContent className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full mt-6 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>
      </main>

      <BottomNavigation />
      <PortoSeguroButton />
      <AIChatPanel />
    </div>
  );
}
