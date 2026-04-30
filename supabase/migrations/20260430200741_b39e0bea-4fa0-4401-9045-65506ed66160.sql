CREATE TABLE public.recovery_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  signature_name TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocking_configured BOOLEAN NOT NULL DEFAULT false,
  blocking_configured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recovery_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commitment"
ON public.recovery_commitments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitment"
ON public.recovery_commitments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitment"
ON public.recovery_commitments FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_recovery_commitments_updated_at
BEFORE UPDATE ON public.recovery_commitments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();