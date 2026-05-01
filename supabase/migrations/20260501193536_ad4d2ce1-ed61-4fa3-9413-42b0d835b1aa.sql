ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gambling_duration text,
  ADD COLUMN IF NOT EXISTS recovery_situation text;