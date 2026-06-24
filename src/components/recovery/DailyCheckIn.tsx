import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function DailyCheckIn() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkToday = async () => {
      setLoading(true);
      const hoje = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("gambling_streak")
        .select("id")
        .eq("user_id", user.id)
        .eq("confirmation_date", hoje)
        .maybeSingle();
      setDone(!!data);
      setLoading(false);
    };

    checkToday();
  }, [user?.id]);

  const handleAnswer = async (stayedClean: boolean) => {
    if (!user?.id || saving) return;

    setSaving(true);
    const hoje = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("gambling_streak").upsert(
      {
        user_id: user.id,
        confirmation_date: hoje,
        stayed_clean: stayedClean,
      },
      { onConflict: "user_id,confirmation_date" }
    );
    setSaving(false);

    if (error) {
      toast.error("Não foi possível registrar seu check-in. Tente novamente.");
      return;
    }

    setDone(true);
    if (stayedClean) {
      toast("🔥 Mais um dia de vitória! Continue firme.");
    } else {
      toast("Recaídas fazem parte. O importante é não desistir. Que tal falar com seu âncora? 💚");
    }
  };

  if (!user || loading || done) return null;

  return (
    <section className="bg-card border border-border rounded-2xl p-4 shadow-card">
      <h2 className="text-base font-semibold text-foreground mb-1">
        Como foi seu dia?
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Você ficou longe das apostas hoje?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleAnswer(true)}
          disabled={saving}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-primary-foreground bg-primary active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Sim, fiquei firme 💪
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={saving}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-foreground bg-muted active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Tive uma recaída
        </button>
      </div>
    </section>
  );
}
