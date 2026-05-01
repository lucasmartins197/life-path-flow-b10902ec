-- anchor_settings
CREATE TABLE IF NOT EXISTS public.anchor_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  notify_inactive boolean NOT NULL DEFAULT true,
  notify_step_complete boolean NOT NULL DEFAULT true,
  notify_relapse boolean NOT NULL DEFAULT true,
  weekly_report boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anchor_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own anchor settings"
ON public.anchor_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_anchor_settings_updated_at
BEFORE UPDATE ON public.anchor_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- anchor_alerts
CREATE TABLE IF NOT EXISTS public.anchor_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contact_id uuid,
  alert_type text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anchor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own anchor alerts"
ON public.anchor_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own anchor alerts"
ON public.anchor_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_anchor_alerts_user_sent ON public.anchor_alerts(user_id, sent_at DESC);