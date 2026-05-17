CREATE TABLE IF NOT EXISTS public.jornada_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  passo_numero INTEGER NOT NULL,
  resposta TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, passo_numero)
);

ALTER TABLE public.jornada_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own jornada respostas"
ON public.jornada_respostas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Linked professionals view jornada respostas"
ON public.jornada_respostas FOR SELECT
USING (can_access_patient_record(auth.uid(), user_id));

CREATE TRIGGER update_jornada_respostas_updated_at
BEFORE UPDATE ON public.jornada_respostas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();