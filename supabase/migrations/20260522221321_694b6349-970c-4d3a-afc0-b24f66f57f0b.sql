-- Remove duplicados mantendo o mais recente (se houver)
DELETE FROM public.prontuarios a
USING public.prontuarios b
WHERE a.user_id = b.user_id AND a.gerado_em < b.gerado_em;

ALTER TABLE public.prontuarios ADD CONSTRAINT prontuarios_user_id_unique UNIQUE (user_id);