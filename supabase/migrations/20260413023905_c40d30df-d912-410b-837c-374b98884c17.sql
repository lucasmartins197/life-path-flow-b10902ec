
-- User routine preferences
CREATE TABLE public.user_routine (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_routine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own routine" ON public.user_routine FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_routine_updated_at BEFORE UPDATE ON public.user_routine FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Routine activities log
CREATE TABLE public.routine_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL,
  activity_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_minutes integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  ai_feedback text,
  rating integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities" ON public.routine_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily reflections
CREATE TABLE public.daily_reflections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  ai_response text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reflections" ON public.daily_reflections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
