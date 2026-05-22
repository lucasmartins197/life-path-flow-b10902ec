
-- routine_preferences
CREATE TABLE public.routine_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  leitura_ativo BOOLEAN NOT NULL DEFAULT false,
  leitura_tipo TEXT NOT NULL DEFAULT '',
  esporte_ativo BOOLEAN NOT NULL DEFAULT false,
  esporte_tipo TEXT NOT NULL DEFAULT '',
  esporte_nivel TEXT NOT NULL DEFAULT '',
  esporte_dias TEXT[] NOT NULL DEFAULT '{}',
  esporte_tempo INTEGER NOT NULL DEFAULT 30,
  lazer_ativo BOOLEAN NOT NULL DEFAULT false,
  espiritualidade_ativo BOOLEAN NOT NULL DEFAULT false,
  configurado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.routine_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own routine prefs" ON public.routine_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_routine_preferences_updated
  BEFORE UPDATE ON public.routine_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- daily_tasks
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  conteudo_ia TEXT NOT NULL DEFAULT '',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  concluido BOOLEAN NOT NULL DEFAULT false,
  concluido_em TIMESTAMPTZ,
  progresso TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily tasks" ON public.daily_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_daily_tasks_user_date ON public.daily_tasks(user_id, data);
CREATE TRIGGER trg_daily_tasks_updated
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- onboarding_clinico
CREATE TABLE public.onboarding_clinico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_loss_range TEXT,
  gambling_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  stop_attempts TEXT,
  family_aware TEXT,
  mental_health_risk TEXT,
  main_motivation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_clinico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding clinico" ON public.onboarding_clinico
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_onboarding_clinico_updated
  BEFORE UPDATE ON public.onboarding_clinico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
