
CREATE TABLE public.journey_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  step_number integer NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  checklist_items jsonb DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '{}'::jsonb,
  ai_conversation jsonb DEFAULT '[]'::jsonb,
  current_section integer DEFAULT 1,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_number)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey progress"
ON public.journey_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey progress"
ON public.journey_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey progress"
ON public.journey_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_journey_progress_updated_at
BEFORE UPDATE ON public.journey_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
