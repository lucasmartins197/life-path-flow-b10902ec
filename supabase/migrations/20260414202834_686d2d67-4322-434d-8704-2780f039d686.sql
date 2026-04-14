
-- Add missing columns to professional_profiles
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS approach jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specialties jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS gambling_specialist boolean DEFAULT false;

-- Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 45,
  status text NOT NULL DEFAULT 'scheduled',
  meeting_link text,
  payment_id uuid REFERENCES public.payments(id),
  rating integer,
  review_comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Professionals can view their appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.professional_profiles WHERE id = professional_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create session_credits table
CREATE TABLE public.session_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  credits_remaining integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.session_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.session_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON public.session_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.session_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all credits" ON public.session_credits FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create professional_reviews table
CREATE TABLE public.professional_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, professional_id)
);

ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reviews" ON public.professional_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own reviews" ON public.professional_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.professional_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews" ON public.professional_reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
