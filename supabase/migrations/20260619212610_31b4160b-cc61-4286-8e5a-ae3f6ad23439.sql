ALTER TABLE public.routine_preferences ADD COLUMN IF NOT EXISTS esporte_tipos jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.routine_preferences
SET esporte_tipos = to_jsonb(ARRAY[esporte_tipo])
WHERE (esporte_tipos IS NULL OR esporte_tipos = '[]'::jsonb)
  AND esporte_tipo IS NOT NULL
  AND esporte_tipo <> '';