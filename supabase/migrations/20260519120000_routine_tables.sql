-- Tabela de preferências de rotina (configurada 1x pelo usuário)
CREATE TABLE IF NOT EXISTS public.routine_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leitura_ativo BOOLEAN DEFAULT FALSE,
  leitura_tipo TEXT,
  esporte_ativo BOOLEAN DEFAULT FALSE,
  esporte_tipo TEXT,
  esporte_nivel TEXT,
  esporte_dias TEXT[] DEFAULT '{}',
  esporte_tempo INTEGER DEFAULT 30,
  lazer_ativo BOOLEAN DEFAULT FALSE,
  espiritualidade_ativo BOOLEAN DEFAULT FALSE,
  configurado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.routine_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select" ON public.routine_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rp_insert" ON public.routine_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rp_update" ON public.routine_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Tabela de tarefas diárias geradas pela IA
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo_ia TEXT,
  data DATE NOT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  concluido_em TIMESTAMPTZ,
  progresso TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dt_select" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dt_insert" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dt_update" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dt_service_insert" ON public.daily_tasks FOR INSERT WITH CHECK (true);

-- Tabela de progresso de leitura
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  livro_titulo TEXT NOT NULL,
  livro_autor TEXT,
  total_paginas INTEGER,
  pagina_atual INTEGER DEFAULT 0,
  paginas_por_dia INTEGER,
  tempo_diario_min INTEGER DEFAULT 30,
  iniciado_em DATE DEFAULT CURRENT_DATE,
  concluido BOOLEAN DEFAULT FALSE,
  concluido_em DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rpr_select" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rpr_insert" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rpr_update" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);
