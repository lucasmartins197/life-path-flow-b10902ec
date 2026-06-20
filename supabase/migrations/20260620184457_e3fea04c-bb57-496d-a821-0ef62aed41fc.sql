ALTER TABLE public.jornada_respostas
  ADD COLUMN IF NOT EXISTS audio_played boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiz_passed boolean NOT NULL DEFAULT false;