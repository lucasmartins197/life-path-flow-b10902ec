
-- 1. New columns on professional_profiles
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS professional_email TEXT,
  ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepts_plan BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Bucket for professional photos (private — read via signed/public-by-policy SELECT)
INSERT INTO storage.buckets (id, name, public)
VALUES ('professionals', 'professionals', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can view professional photos (they appear in the marketplace)
CREATE POLICY "Authenticated can view professional photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'professionals');

-- Only admins can write
CREATE POLICY "Admins can upload professional photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'professionals' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update professional photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'professionals' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete professional photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'professionals' AND public.has_role(auth.uid(), 'admin'));

-- 3. Grant admin role to the requested user (correct, secure place)
INSERT INTO public.user_roles (user_id, role)
VALUES ('60c8281c-eee0-48f2-9d31-d3002ce4eb14', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
