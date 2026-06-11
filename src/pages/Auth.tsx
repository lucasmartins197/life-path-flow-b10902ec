import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Leaf, Shield, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signIn, signUp, user, roles, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in — only after auth is fully resolved
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

    if (from) {
      navigate(from, { replace: true });
    } else if (roles.includes("admin")) {
      navigate("/admin", { replace: true });
    } else if (roles.includes("professional")) {
      navigate("/pro", { replace: true });
    } else {
      navigate("/app", { replace: true });
    }
  }, [user, roles, authLoading, navigate, location.state]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        const msg = error.message?.toLowerCase() || "";
        const description =
          msg.includes("invalid login credentials") || msg.includes("invalid_credentials")
            ? "Senha incorreta. Verifique e tente novamente."
            : msg.includes("email not confirmed")
              ? "Confirme seu email antes de entrar."
              : error.message;
        toast({
          variant: "destructive",
          title: "Erro no login",
          description,
        });
      } else {
        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (signupPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem.",
      });
      return;
    }

    if (signupPassword.length < 8 || !/\d/.test(signupPassword) || !/[a-zA-Z]/.test(signupPassword)) {
      toast({
        variant: "destructive",
        title: "Senha fraca",
        description: "Sua senha é muito fraca. Use pelo menos 8 caracteres, incluindo letras e números.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, signupName);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message,
        });
        return;
      }

      // Enviar dados para o webhook do n8n
      try {
        await fetch("https://apostandonavida.app.n8n.cloud/webhook/validate-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: signupName,
            email: signupEmail,
          }),
        });

        // signup redirect handled by useEffect when user state updates
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError);
      }

      toast({
        title: "Conta criada!",
        description: "Verifique seu email para confirmar o cadastro.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - Branding */}
      <div className="lg:flex-1 bg-gradient-to-br from-primary to-primary/80 p-8 lg:p-12 flex flex-col justify-center text-white">
        <div className="max-w-md mx-auto lg:mx-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Heart className="h-6 w-6" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Saindo do Jogo</h1>
          </div>

          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-6">Sua jornada de transformação começa aqui</h2>

          <p className="text-lg text-white/80 mb-8">
            Um programa completo de terapia digital para apoiar sua recuperação com profissionais qualificados e
            ferramentas personalizadas.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Jornada dos 12 Passos</h3>
                <p className="text-sm text-white/70">Trilha guiada de recuperação</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Terapia Online</h3>
                <p className="text-sm text-white/70">Profissionais especializados</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Seguro e Confidencial</h3>
                <p className="text-sm text-white/70">Seus dados protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display">Acesse sua conta</CardTitle>
            <CardDescription>Entre ou crie uma conta para continuar</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                        Esqueceu a senha?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="input-premium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-premium-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4 px-2 border-t pt-4">
                    ⚠️ Este aplicativo tem caráter educativo e de apoio à recuperação. Não é um dispositivo médico e não diagnostica, trata, cura ou previne nenhuma condição médica. Consulte sempre um profissional de saúde para aconselhamento médico, diagnóstico ou tratamento.
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres, com letras e números"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="input-premium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="input-premium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-premium-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4 px-2 border-t pt-4">
                    ⚠️ Este aplicativo tem caráter educativo e de apoio à recuperação. Não é um dispositivo médico e não diagnostica, trata, cura ou previne nenhuma condição médica. Consulte sempre um profissional de saúde para aconselhamento médico, diagnóstico ou tratamento.
                  </p>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao criar uma conta, você concorda com nossos{" "}
                    <a href="#" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{" "}
                    e{" "}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                    .
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
