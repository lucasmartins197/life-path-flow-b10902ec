import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecoveryCommitment {
  id: string;
  user_id: string;
  signature_name: string;
  signed_at: string;
  blocking_configured: boolean;
  blocking_configured_at: string | null;
}

export function useRecoveryCommitment() {
  const { user } = useAuth();
  const [commitment, setCommitment] = useState<RecoveryCommitment | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("recovery_commitments")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setCommitment((data as RecoveryCommitment) || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const sign = async (signatureName: string) => {
    if (!user) throw new Error("Não autenticado");
    const { data, error } = await supabase
      .from("recovery_commitments")
      .insert({ user_id: user.id, signature_name: signatureName })
      .select()
      .single();
    if (error) throw error;
    setCommitment(data as RecoveryCommitment);
    return data;
  };

  const confirmBlocking = async () => {
    if (!user || !commitment) return;
    const { data, error } = await supabase
      .from("recovery_commitments")
      .update({
        blocking_configured: true,
        blocking_configured_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw error;
    setCommitment(data as RecoveryCommitment);
  };

  return {
    commitment,
    loading,
    hasSigned: !!commitment,
    blockingConfigured: !!commitment?.blocking_configured,
    sign,
    confirmBlocking,
    refetch,
  };
}
