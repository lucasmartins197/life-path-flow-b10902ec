import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BackHeader } from "@/components/BackHeader";
import { Loader2 } from "lucide-react";

const ADMIN_ID = "60c8281c-eee0-48f2-9d31-d3002ce4eb14";

export default function AdminCreateUser() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.id !== ADMIN_ID) return <Navigate to="/app" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email, password },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult({ ok: true, message: `Usuário criado com sucesso! ID: ${(data as any).userId}` });
      setEmail("");
      setPassword("");
    } catch (err) {
      setResult({ ok: false, message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="px-4 pt-4">
        <BackHeader label="Voltar" />
        <h1 className="text-2xl font-bold mt-2">Criar Usuário</h1>
      </div>
      <div className="px-4 py-6 max-w-md mx-auto">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar usuário
            </Button>
          </form>
          {result && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                result.ok
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.message}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
