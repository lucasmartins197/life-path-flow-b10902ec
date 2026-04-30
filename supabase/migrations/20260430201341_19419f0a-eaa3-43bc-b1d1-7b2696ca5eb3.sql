-- Sites bloqueados
CREATE TABLE public.blocked_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, url)
);
ALTER TABLE public.blocked_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blocked sites" ON public.blocked_sites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Guardião digital
CREATE TABLE public.digital_guardian (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  guardian_name TEXT NOT NULL,
  guardian_email TEXT,
  guardian_phone TEXT,
  invite_sent_at TIMESTAMP WITH TIME ZONE,
  notify_on_temptation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.digital_guardian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own guardian" ON public.digital_guardian
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_digital_guardian_updated_at
  BEFORE UPDATE ON public.digital_guardian
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Eventos de tentação
CREATE TABLE public.temptation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  intensity TEXT,
  outcome TEXT,
  notes TEXT,
  guardian_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.temptation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own temptation events" ON public.temptation_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Streak de confirmação diária
CREATE TABLE public.gambling_streak (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  confirmation_date DATE NOT NULL,
  stayed_clean BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, confirmation_date)
);
ALTER TABLE public.gambling_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own gambling streak" ON public.gambling_streak
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_blocked_sites_user ON public.blocked_sites(user_id);
CREATE INDEX idx_temptation_events_user ON public.temptation_events(user_id, triggered_at DESC);
CREATE INDEX idx_gambling_streak_user ON public.gambling_streak(user_id, confirmation_date DESC);