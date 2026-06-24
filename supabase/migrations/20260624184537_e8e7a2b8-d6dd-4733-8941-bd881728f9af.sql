
CREATE TABLE public.journey_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  letter_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  sent_to_anchor boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_letters TO authenticated;
GRANT ALL ON public.journey_letters TO service_role;

ALTER TABLE public.journey_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own letters"
  ON public.journey_letters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_journey_letters_updated_at
  BEFORE UPDATE ON public.journey_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
