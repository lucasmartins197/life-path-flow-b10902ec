-- =====================================================
-- TABELA: onboarding_clinico
-- Armazena dados clínicos coletados no onboarding
-- =====================================================
CREATE TABLE IF NOT EXISTS public.onboarding_clinico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados do vício
  gambling_duration TEXT,         -- Há quanto tempo joga
  recovery_situation TEXT,        -- Situação atual (quero_parar, em_recaida, etc)
  total_loss_range TEXT,          -- Estimativa de perdas (ate_5k, 5k_20k, etc)
  gambling_types TEXT[],          -- Tipos de jogo (array)
  stop_attempts TEXT,             -- Tentativas de parar
  
  -- Dados clínicos
  family_aware TEXT,              -- Família sabe?
  mental_health_risk TEXT,        -- Saúde mental (bem, ansioso, deprimido, pensamentos_ruins)
  main_motivation TEXT,           -- Principal motivação
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.onboarding_clinico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio dado" ON public.onboarding_clinico
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere próprio dado" ON public.onboarding_clinico
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza próprio dado" ON public.onboarding_clinico
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todos" ON public.onboarding_clinico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- TABELA: prontuarios
-- Prontuário gerado pela IA após onboarding
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prontuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conteúdo do prontuário
  resumo_clinico TEXT,            -- Resumo gerado pela IA
  nivel_risco TEXT DEFAULT 'baixo', -- baixo, medio, alto, critico
  recomendacoes TEXT[],           -- Lista de recomendações
  pontos_atencao TEXT[],          -- Pontos de atenção identificados
  
  -- Metadados
  gerado_por TEXT DEFAULT 'n8n_ia',
  gerado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio prontuário" ON public.prontuarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todos prontuários" ON public.prontuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Serviço insere prontuário" ON public.prontuarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Serviço atualiza prontuário" ON public.prontuarios
  FOR UPDATE USING (true);

-- =====================================================
-- TABELA: alertas_admin
-- Alertas gerados automaticamente para a equipe
-- =====================================================
CREATE TABLE IF NOT EXISTS public.alertas_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tipo TEXT NOT NULL,             -- onboarding_risco, inatividade, recaida, etc
  nivel TEXT DEFAULT 'info',      -- info, atencao, urgente, critico
  mensagem TEXT NOT NULL,
  dados_contexto JSONB,           -- Dados extras do contexto
  
  -- Status
  lido BOOLEAN DEFAULT FALSE,
  lido_por UUID,
  lido_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alertas_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê alertas" ON public.alertas_admin
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Serviço insere alertas" ON public.alertas_admin
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- TABELA: relatorios_ancora
-- Relatórios enviados ao contato âncora
-- =====================================================
CREATE TABLE IF NOT EXISTS public.relatorios_ancora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ancora_id UUID REFERENCES public.anchor_contacts(id),
  
  tipo TEXT NOT NULL,             -- onboarding, semanal, alerta_inatividade, alerta_recaida
  conteudo TEXT NOT NULL,         -- Texto do relatório enviado
  enviado_via TEXT DEFAULT 'email', -- email, whatsapp
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status do envio
  status_envio TEXT DEFAULT 'enviado', -- enviado, falhou, pendente
  erro_envio TEXT
);

ALTER TABLE public.relatorios_ancora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios relatórios" ON public.relatorios_ancora
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todos relatórios" ON public.relatorios_ancora
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Serviço insere relatórios" ON public.relatorios_ancora
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNÇÃO: trigger para updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_onboarding_clinico
  BEFORE UPDATE ON public.onboarding_clinico
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_prontuarios
  BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VIEW: dashboard_admin
-- Visão consolidada para o admin médico
-- =====================================================
CREATE OR REPLACE VIEW public.dashboard_admin AS
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.city,
  p.created_at AS cadastro_em,
  oc.gambling_duration,
  oc.recovery_situation,
  oc.total_loss_range,
  oc.gambling_types,
  oc.stop_attempts,
  oc.family_aware,
  oc.mental_health_risk,
  oc.main_motivation,
  pr.nivel_risco,
  pr.resumo_clinico,
  pr.recomendacoes,
  ac.name AS ancora_nome,
  ac.phone AS ancora_telefone,
  ac.relationship AS ancora_relacao,
  (
    SELECT COUNT(*) FROM public.checkins c WHERE c.user_id = p.user_id
  ) AS total_checkins,
  (
    SELECT MAX(created_at) FROM public.checkins c WHERE c.user_id = p.user_id
  ) AS ultimo_checkin
FROM public.profiles p
LEFT JOIN public.onboarding_clinico oc ON oc.user_id = p.user_id
LEFT JOIN public.prontuarios pr ON pr.user_id = p.user_id
LEFT JOIN public.anchor_contacts ac ON ac.user_id = p.user_id AND ac.is_primary = true;
