
ALTER TABLE public.weekly_class
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Aulão Semanal',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false;

UPDATE public.weekly_class SET video_url = link WHERE video_url IS NULL AND link IS NOT NULL;

ALTER TABLE public.weekly_class DROP COLUMN IF EXISTS link;
ALTER TABLE public.weekly_class DROP COLUMN IF EXISTS created_by;

ALTER TABLE public.weekly_class ALTER COLUMN title DROP DEFAULT;
