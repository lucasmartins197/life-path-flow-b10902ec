ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS meta_paginas integer,
  ADD COLUMN IF NOT EXISTS meta_km numeric(5,2),
  ADD COLUMN IF NOT EXISTS resposta_usuario text,
  ADD COLUMN IF NOT EXISTS metricas_usuario jsonb,
  ADD COLUMN IF NOT EXISTS feedback_ia text;