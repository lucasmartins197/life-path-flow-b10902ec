
-- Perfil de treino do usuário
CREATE TABLE public.user_fitness_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  modalidade text NOT NULL DEFAULT 'academia',
  nivel text NOT NULL DEFAULT 'iniciante',
  objetivo text NOT NULL DEFAULT 'saude_geral',
  dias_semana jsonb NOT NULL DEFAULT '[]'::jsonb,
  tempo_disponivel integer NOT NULL DEFAULT 45,
  equipamento text NOT NULL DEFAULT 'academia_completa',
  peso_kg numeric,
  altura_cm numeric,
  restricoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, modalidade)
);

ALTER TABLE public.user_fitness_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fitness profile"
ON public.user_fitness_profile FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_fitness_profile_updated_at
BEFORE UPDATE ON public.user_fitness_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Plano semanal de treinos
CREATE TABLE public.weekly_workout_plan (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  modalidade text NOT NULL DEFAULT 'academia',
  week_number integer NOT NULL,
  day_letter text NOT NULL,
  muscle_groups text[] NOT NULL DEFAULT '{}',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, modalidade, week_number, day_letter)
);

ALTER TABLE public.weekly_workout_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout plans"
ON public.weekly_workout_plan FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
