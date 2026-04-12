
CREATE TABLE public.weekly_class (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_class ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view weekly classes"
  ON public.weekly_class FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage weekly classes"
  ON public.weekly_class FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_weekly_class_updated_at
  BEFORE UPDATE ON public.weekly_class
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
