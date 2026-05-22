CREATE TABLE public.prontuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resumo_clinico TEXT NOT NULL DEFAULT '',
  nivel_risco TEXT NOT NULL DEFAULT 'baixo',
  recomendacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  gerado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prontuarios" ON public.prontuarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prontuarios" ON public.prontuarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Linked professionals can view patient prontuarios" ON public.prontuarios
  FOR SELECT USING (public.can_access_patient_record(auth.uid(), user_id));

CREATE POLICY "Admins can manage all prontuarios" ON public.prontuarios
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_prontuarios_user_gerado ON public.prontuarios(user_id, gerado_em DESC);