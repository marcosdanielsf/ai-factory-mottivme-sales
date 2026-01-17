-- =====================================================
-- MIGRATION 013: Sistema de Cobranca de Inadimplentes
--
-- Tabelas para controle de cobranca automatizada
-- Integracao: Asaas (faturas) + Supabase (controle) + GHL (mensagens)
--
-- Data: Janeiro 2026
-- =====================================================

-- ============================================
-- 1. TABELA: cobranca_configs
-- Configuracao de cobranca por cliente/location
-- ============================================

CREATE TABLE IF NOT EXISTS cobranca_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  location_id VARCHAR(100) NOT NULL UNIQUE,
  client_name VARCHAR(200),

  -- Cadencia de cobranca (dias de atraso para acionar)
  -- Exemplo: [3, 7, 15, 30] = cobra em 3 dias, 7 dias, 15 dias, 30 dias de atraso
  cadencia_dias INTEGER[] DEFAULT ARRAY[3, 7, 15, 30],

  -- Tom da mensagem por nivel de atraso
  -- Mapeado com cadencia_dias: posicao 1 = tom para cadencia 1, etc
  tom_por_cadencia TEXT[] DEFAULT ARRAY['gentil', 'firme', 'urgente', 'final'],

  -- Canal de envio
  canal_primario VARCHAR(50) DEFAULT 'ghl_whatsapp', -- 'ghl_whatsapp', 'ghl_sms', 'ghl_email'
  canal_fallback VARCHAR(50) DEFAULT 'ghl_sms',

  -- Configuracoes GHL
  ghl_location_id VARCHAR(100), -- ID do location no GHL
  ghl_api_key TEXT, -- API key do GHL (ou usar env var)

  -- Configuracoes Asaas
  asaas_api_key TEXT, -- API key do Asaas (ou usar env var)
  asaas_environment VARCHAR(20) DEFAULT 'production', -- 'sandbox' ou 'production'

  -- Horario de envio
  horario_inicio TIME DEFAULT '09:00:00',
  horario_fim TIME DEFAULT '18:00:00',
  dias_semana INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5], -- 1=seg, 5=sex (nao cobra fim de semana)
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',

  -- Limites
  max_tentativas_por_fatura INTEGER DEFAULT 4, -- maximo de cobranças por fatura
  intervalo_minimo_horas INTEGER DEFAULT 24, -- minimo entre cobranças da mesma fatura
  valor_minimo_cobranca DECIMAL(10,2) DEFAULT 50.00, -- nao cobra abaixo disso

  -- Personalizacao
  nome_agente VARCHAR(100) DEFAULT 'Financeiro',
  assinatura_mensagem TEXT DEFAULT 'Atenciosamente, Equipe Financeira',

  -- Prompt do agente (system prompt para gerar mensagens)
  system_prompt TEXT,

  -- Notificacoes internas
  notificar_gestor BOOLEAN DEFAULT true,
  telefone_gestor VARCHAR(20),
  email_gestor VARCHAR(200),

  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cobranca_configs_location ON cobranca_configs(location_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_configs_active ON cobranca_configs(is_active) WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_cobranca_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cobranca_configs_updated ON cobranca_configs;
CREATE TRIGGER trigger_cobranca_configs_updated
  BEFORE UPDATE ON cobranca_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_cobranca_configs_timestamp();


-- ============================================
-- 2. TABELA: cobranca_historico
-- Registro de todas as cobranças enviadas
-- ============================================

CREATE TABLE IF NOT EXISTS cobranca_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  location_id VARCHAR(100) NOT NULL,

  -- Dados da fatura (Asaas)
  asaas_payment_id VARCHAR(100) NOT NULL, -- ID unico da cobranca no Asaas
  asaas_customer_id VARCHAR(100), -- ID do cliente no Asaas
  asaas_invoice_url TEXT, -- URL do boleto/pix

  -- Dados do cliente
  cliente_nome VARCHAR(200),
  cliente_email VARCHAR(200),
  cliente_telefone VARCHAR(20),
  cliente_cpf_cnpj VARCHAR(20),

  -- Dados da cobranca
  valor DECIMAL(10,2) NOT NULL,
  valor_original DECIMAL(10,2), -- valor sem juros/multa
  juros_multa DECIMAL(10,2) DEFAULT 0,
  data_vencimento DATE NOT NULL,
  dias_atraso INTEGER NOT NULL,
  descricao_fatura TEXT,

  -- Cadencia acionada
  cadencia_acionada INTEGER NOT NULL, -- qual cadencia foi acionada (3, 7, 15, 30...)
  tentativa_numero INTEGER DEFAULT 1, -- numero da tentativa nessa cadencia
  tom_usado VARCHAR(50), -- 'gentil', 'firme', 'urgente', 'final'

  -- Mensagem enviada
  mensagem_enviada TEXT NOT NULL,
  canal_usado VARCHAR(50) NOT NULL, -- 'ghl_whatsapp', 'ghl_sms', 'ghl_email'
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Resposta GHL
  ghl_message_id VARCHAR(100), -- ID da mensagem no GHL
  ghl_conversation_id VARCHAR(100),
  status_envio VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  erro_envio TEXT,

  -- Resposta do cliente
  cliente_respondeu BOOLEAN DEFAULT false,
  resposta_cliente TEXT,
  respondeu_em TIMESTAMP WITH TIME ZONE,
  sentimento_resposta VARCHAR(50), -- 'positivo', 'neutro', 'negativo', 'agressivo'

  -- Resultado
  resultado VARCHAR(50) DEFAULT 'aguardando', -- 'pago', 'prometeu_pagar', 'pediu_desconto', 'reclamou', 'ignorou', 'numero_invalido'
  data_promessa_pagamento DATE, -- se prometeu pagar, quando
  observacoes TEXT,

  -- Pagamento (se foi pago apos cobranca)
  pago BOOLEAN DEFAULT false,
  pago_em TIMESTAMP WITH TIME ZONE,
  valor_pago DECIMAL(10,2),
  forma_pagamento VARCHAR(50), -- 'pix', 'boleto', 'cartao'

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_location ON cobranca_historico(location_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_asaas_payment ON cobranca_historico(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_cliente ON cobranca_historico(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_enviado ON cobranca_historico(enviado_em DESC);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_resultado ON cobranca_historico(resultado);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_cadencia ON cobranca_historico(cadencia_acionada);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_pago ON cobranca_historico(pago) WHERE pago = false;

-- Indice composto para verificar se ja cobrou nessa cadencia
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_payment_cadencia
  ON cobranca_historico(asaas_payment_id, cadencia_acionada);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_cobranca_historico_updated ON cobranca_historico;
CREATE TRIGGER trigger_cobranca_historico_updated
  BEFORE UPDATE ON cobranca_historico
  FOR EACH ROW
  EXECUTE FUNCTION update_cobranca_configs_timestamp();


-- ============================================
-- 3. TABELA: cobranca_templates
-- Templates de mensagem por tom/situacao
-- ============================================

CREATE TABLE IF NOT EXISTS cobranca_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  location_id VARCHAR(100), -- NULL = template global
  template_key VARCHAR(100) NOT NULL, -- 'gentil_primeira', 'firme_segunda', etc

  -- Categoria
  tom VARCHAR(50) NOT NULL, -- 'gentil', 'firme', 'urgente', 'final'
  canal VARCHAR(50) DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email'

  -- Conteudo
  titulo VARCHAR(200), -- para email
  template_texto TEXT NOT NULL, -- com variaveis {{nome}}, {{valor}}, {{dias_atraso}}, etc

  -- Variaveis disponiveis
  variaveis_disponiveis TEXT[] DEFAULT ARRAY[
    '{{nome}}',
    '{{valor}}',
    '{{valor_original}}',
    '{{juros_multa}}',
    '{{dias_atraso}}',
    '{{data_vencimento}}',
    '{{descricao}}',
    '{{link_pagamento}}',
    '{{pix_copia_cola}}',
    '{{nome_empresa}}',
    '{{telefone_contato}}'
  ],

  -- Controle
  is_active BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0, -- quantas vezes foi usado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint unica
  UNIQUE(location_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_cobranca_templates_location ON cobranca_templates(location_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_templates_tom ON cobranca_templates(tom);


-- ============================================
-- 4. TABELA: cobranca_metricas_diarias
-- Metricas agregadas por dia
-- ============================================

CREATE TABLE IF NOT EXISTS cobranca_metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  location_id VARCHAR(100) NOT NULL,
  data DATE NOT NULL,

  -- Metricas de envio
  total_cobranças_enviadas INTEGER DEFAULT 0,
  total_por_cadencia JSONB DEFAULT '{}', -- {"3": 10, "7": 5, "15": 2}

  -- Metricas de resultado
  total_pagos INTEGER DEFAULT 0,
  valor_recuperado DECIMAL(12,2) DEFAULT 0,
  total_prometeram INTEGER DEFAULT 0,
  total_ignoraram INTEGER DEFAULT 0,
  total_reclamaram INTEGER DEFAULT 0,

  -- Metricas de canal
  enviados_whatsapp INTEGER DEFAULT 0,
  enviados_sms INTEGER DEFAULT 0,
  enviados_email INTEGER DEFAULT 0,

  -- Metricas de resposta
  taxa_resposta DECIMAL(5,2) DEFAULT 0, -- percentual que respondeu
  tempo_medio_resposta_horas DECIMAL(10,2), -- tempo medio para responder

  -- Metricas financeiras
  valor_total_em_atraso DECIMAL(12,2) DEFAULT 0, -- total inadimplente no dia
  valor_cobrado DECIMAL(12,2) DEFAULT 0, -- total das faturas cobradas

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(location_id, data)
);

CREATE INDEX IF NOT EXISTS idx_cobranca_metricas_location_data ON cobranca_metricas_diarias(location_id, data DESC);


-- ============================================
-- 5. VIEW: Faturas pendentes de cobranca
-- ============================================

CREATE OR REPLACE VIEW v_faturas_pendentes_cobranca AS
SELECT
  ch.asaas_payment_id,
  ch.location_id,
  ch.cliente_nome,
  ch.cliente_telefone,
  ch.valor,
  ch.data_vencimento,
  ch.dias_atraso,
  ch.cadencia_acionada as ultima_cadencia,
  ch.enviado_em as ultima_cobranca,
  ch.resultado as ultimo_resultado,
  COUNT(*) as total_cobranças
FROM cobranca_historico ch
WHERE ch.pago = false
GROUP BY
  ch.asaas_payment_id,
  ch.location_id,
  ch.cliente_nome,
  ch.cliente_telefone,
  ch.valor,
  ch.data_vencimento,
  ch.dias_atraso,
  ch.cadencia_acionada,
  ch.enviado_em,
  ch.resultado
ORDER BY ch.dias_atraso DESC;


-- ============================================
-- 6. VIEW: Dashboard de cobrancas
-- ============================================

CREATE OR REPLACE VIEW v_cobranca_dashboard AS
SELECT
  location_id,
  COUNT(*) as total_cobranças,
  COUNT(DISTINCT asaas_payment_id) as faturas_unicas,
  SUM(CASE WHEN pago THEN 1 ELSE 0 END) as total_pagos,
  SUM(CASE WHEN pago THEN valor_pago ELSE 0 END) as valor_recuperado,
  SUM(CASE WHEN NOT pago THEN valor ELSE 0 END) as valor_pendente,
  ROUND(
    100.0 * SUM(CASE WHEN pago THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT asaas_payment_id), 0),
    2
  ) as taxa_recuperacao,
  ROUND(
    100.0 * SUM(CASE WHEN cliente_respondeu THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as taxa_resposta,
  COUNT(DISTINCT CASE WHEN resultado = 'prometeu_pagar' THEN asaas_payment_id END) as prometeram_pagar,
  COUNT(DISTINCT CASE WHEN resultado = 'reclamou' THEN asaas_payment_id END) as reclamaram
FROM cobranca_historico
WHERE enviado_em >= NOW() - INTERVAL '30 days'
GROUP BY location_id;


-- ============================================
-- 7. FUNCAO: Verificar se deve cobrar
-- ============================================

CREATE OR REPLACE FUNCTION deve_cobrar_fatura(
  p_asaas_payment_id VARCHAR,
  p_location_id VARCHAR,
  p_dias_atraso INTEGER
)
RETURNS TABLE (
  deve_cobrar BOOLEAN,
  cadencia_a_usar INTEGER,
  tentativa_numero INTEGER,
  motivo TEXT
) AS $$
DECLARE
  v_config cobranca_configs%ROWTYPE;
  v_ultima_cobranca cobranca_historico%ROWTYPE;
  v_cadencia_encontrada INTEGER;
  v_total_cobranças INTEGER;
  v_horas_desde_ultima DECIMAL;
BEGIN
  -- Buscar config do location
  SELECT * INTO v_config FROM cobranca_configs
  WHERE location_id = p_location_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, 'Config nao encontrada para location';
    RETURN;
  END IF;

  -- Verificar valor minimo (precisa do valor da fatura - sera verificado no n8n)

  -- Encontrar cadencia aplicavel
  SELECT unnest INTO v_cadencia_encontrada
  FROM unnest(v_config.cadencia_dias)
  WHERE unnest <= p_dias_atraso
  ORDER BY unnest DESC
  LIMIT 1;

  IF v_cadencia_encontrada IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER,
      'Dias de atraso (' || p_dias_atraso || ') menor que primeira cadencia';
    RETURN;
  END IF;

  -- Verificar se ja cobrou nessa cadencia
  SELECT * INTO v_ultima_cobranca
  FROM cobranca_historico
  WHERE asaas_payment_id = p_asaas_payment_id
    AND cadencia_acionada = v_cadencia_encontrada
  ORDER BY enviado_em DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT false, v_cadencia_encontrada, v_ultima_cobranca.tentativa_numero,
      'Ja cobrou na cadencia ' || v_cadencia_encontrada || ' dias';
    RETURN;
  END IF;

  -- Verificar total de cobranças
  SELECT COUNT(*) INTO v_total_cobranças
  FROM cobranca_historico
  WHERE asaas_payment_id = p_asaas_payment_id;

  IF v_total_cobranças >= v_config.max_tentativas_por_fatura THEN
    RETURN QUERY SELECT false, v_cadencia_encontrada, v_total_cobranças,
      'Atingiu maximo de tentativas (' || v_config.max_tentativas_por_fatura || ')';
    RETURN;
  END IF;

  -- Verificar intervalo minimo desde ultima cobranca (qualquer cadencia)
  SELECT * INTO v_ultima_cobranca
  FROM cobranca_historico
  WHERE asaas_payment_id = p_asaas_payment_id
  ORDER BY enviado_em DESC
  LIMIT 1;

  IF FOUND THEN
    v_horas_desde_ultima := EXTRACT(EPOCH FROM (NOW() - v_ultima_cobranca.enviado_em)) / 3600;
    IF v_horas_desde_ultima < v_config.intervalo_minimo_horas THEN
      RETURN QUERY SELECT false, v_cadencia_encontrada, v_total_cobranças + 1,
        'Intervalo minimo nao atingido (' || ROUND(v_horas_desde_ultima::NUMERIC, 1) || 'h de ' || v_config.intervalo_minimo_horas || 'h)';
      RETURN;
    END IF;
  END IF;

  -- Pode cobrar!
  RETURN QUERY SELECT true, v_cadencia_encontrada, v_total_cobranças + 1, 'OK';
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 8. FUNCAO: Obter tom por cadencia
-- ============================================

CREATE OR REPLACE FUNCTION get_tom_cobranca(
  p_location_id VARCHAR,
  p_cadencia INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
  v_config cobranca_configs%ROWTYPE;
  v_index INTEGER;
BEGIN
  SELECT * INTO v_config FROM cobranca_configs
  WHERE location_id = p_location_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN 'firme'; -- default
  END IF;

  -- Encontrar indice da cadencia
  SELECT array_position(v_config.cadencia_dias, p_cadencia) INTO v_index;

  IF v_index IS NULL OR v_index > array_length(v_config.tom_por_cadencia, 1) THEN
    RETURN 'firme'; -- default
  END IF;

  RETURN v_config.tom_por_cadencia[v_index];
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 9. DADOS INICIAIS: Templates globais
-- ============================================

INSERT INTO cobranca_templates (location_id, template_key, tom, canal, template_texto)
VALUES
-- Templates GENTIL (primeira cobranca)
(NULL, 'gentil_whatsapp', 'gentil', 'whatsapp',
'Ola {{nome}}! Tudo bem?

Passando para lembrar que identificamos uma pendencia no valor de *R$ {{valor}}*, com vencimento em {{data_vencimento}}.

Caso ja tenha efetuado o pagamento, por favor desconsidere esta mensagem.

Se precisar de ajuda ou tiver alguma duvida, estou a disposicao!

{{link_pagamento}}

{{assinatura}}'),

(NULL, 'gentil_sms', 'gentil', 'sms',
'{{nome}}, lembrete: fatura de R$ {{valor}} vencida em {{data_vencimento}}. Pague em: {{link_pagamento}}'),

-- Templates FIRME (segunda cobranca)
(NULL, 'firme_whatsapp', 'firme', 'whatsapp',
'Ola {{nome}},

Verificamos que a fatura no valor de *R$ {{valor}}* continua em aberto, com *{{dias_atraso}} dias de atraso*.

Para evitar encargos adicionais, solicitamos a regularizacao o mais breve possivel.

Acesse o link abaixo para pagamento:
{{link_pagamento}}

Caso tenha alguma dificuldade, entre em contato conosco.

{{assinatura}}'),

(NULL, 'firme_sms', 'firme', 'sms',
'{{nome}}, fatura de R$ {{valor}} em atraso ha {{dias_atraso}} dias. Regularize: {{link_pagamento}}'),

-- Templates URGENTE (terceira cobranca)
(NULL, 'urgente_whatsapp', 'urgente', 'whatsapp',
'{{nome}},

Sua fatura de *R$ {{valor}}* esta com *{{dias_atraso}} dias de atraso*.

Pedimos atencao urgente para evitar:
- Suspensao do servico
- Inclusao em cadastros de inadimplentes
- Encargos adicionais

Regularize agora:
{{link_pagamento}}

Entre em contato se precisar negociar.

{{assinatura}}'),

(NULL, 'urgente_sms', 'urgente', 'sms',
'URGENTE {{nome}}: Fatura R$ {{valor}} com {{dias_atraso}} dias atraso. Evite suspensao: {{link_pagamento}}'),

-- Templates FINAL (ultima cobranca)
(NULL, 'final_whatsapp', 'final', 'whatsapp',
'{{nome}},

Esta e nossa ultima tentativa de contato sobre a fatura de *R$ {{valor}}*, vencida ha *{{dias_atraso}} dias*.

Infelizmente, sem a regularizacao, seremos obrigados a tomar as medidas cabiveis, incluindo negativacao e protesto.

Este e o momento de resolver. Pague agora:
{{link_pagamento}}

Se houver algum problema, este e o ultimo momento para negociarmos.

{{assinatura}}'),

(NULL, 'final_sms', 'final', 'sms',
'AVISO FINAL {{nome}}: Fatura R$ {{valor}} - {{dias_atraso}} dias. Ultima chance antes de medidas legais: {{link_pagamento}}')

ON CONFLICT (location_id, template_key) DO UPDATE SET
  template_texto = EXCLUDED.template_texto,
  updated_at = NOW();


-- ============================================
-- 10. DADOS INICIAIS: Config exemplo (Marcos Pessoal)
-- ============================================

INSERT INTO cobranca_configs (
  location_id,
  client_name,
  cadencia_dias,
  tom_por_cadencia,
  canal_primario,
  canal_fallback,
  horario_inicio,
  horario_fim,
  dias_semana,
  max_tentativas_por_fatura,
  intervalo_minimo_horas,
  valor_minimo_cobranca,
  nome_agente,
  assinatura_mensagem,
  system_prompt,
  notificar_gestor,
  telefone_gestor,
  is_active
)
VALUES (
  'marcos_pessoal',
  'MOTTIVME',
  ARRAY[3, 7, 15, 30],
  ARRAY['gentil', 'firme', 'urgente', 'final'],
  'ghl_whatsapp',
  'ghl_sms',
  '09:00:00',
  '18:00:00',
  ARRAY[1, 2, 3, 4, 5],
  4,
  24,
  50.00,
  'Financeiro MOTTIVME',
  'Atenciosamente, Equipe Financeira MOTTIVME',
  '# PAPEL

Voce e o assistente financeiro da MOTTIVME, responsavel por enviar cobrancas de faturas em atraso de forma profissional e eficaz.

# OBJETIVO

Gerar mensagens de cobranca personalizadas que:
1. Sejam claras e objetivas
2. Mantenham tom adequado ao nivel de atraso
3. Facilitem o pagamento
4. Preservem o relacionamento com o cliente

# TOM POR NIVEL

- GENTIL (3 dias): Lembrete cordial, assume que pode ter esquecido
- FIRME (7 dias): Cobranca direta, menciona encargos
- URGENTE (15 dias): Alerta sobre consequencias, senso de urgencia
- FINAL (30 dias): Ultima chance, menciona medidas legais

# REGRAS

1. SEMPRE inclua o valor e link de pagamento
2. NUNCA seja agressivo ou desrespeitoso
3. Mantenha mensagens curtas (max 500 caracteres para WhatsApp)
4. Use formatacao *negrito* para destacar valores e prazos
5. Adapte o tom conforme indicado
6. Se for SMS, seja ainda mais conciso (max 160 caracteres)',
  true,
  '+5511999999999',
  true
)
ON CONFLICT (location_id) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  cadencia_dias = EXCLUDED.cadencia_dias,
  tom_por_cadencia = EXCLUDED.tom_por_cadencia,
  system_prompt = EXCLUDED.system_prompt,
  updated_at = NOW();


-- ============================================
-- 11. DADOS INICIAIS: Historico exemplo
-- ============================================

-- Exemplo de cobranca enviada (para teste)
INSERT INTO cobranca_historico (
  location_id,
  asaas_payment_id,
  asaas_customer_id,
  cliente_nome,
  cliente_email,
  cliente_telefone,
  valor,
  valor_original,
  data_vencimento,
  dias_atraso,
  descricao_fatura,
  cadencia_acionada,
  tentativa_numero,
  tom_usado,
  mensagem_enviada,
  canal_usado,
  resultado
)
VALUES
-- Exemplo 1: Cobranca gentil enviada, cliente pagou
(
  'marcos_pessoal',
  'pay_exemplo_001',
  'cus_exemplo_001',
  'Joao Silva',
  'joao@email.com',
  '+5511999990001',
  500.00,
  500.00,
  CURRENT_DATE - INTERVAL '5 days',
  5,
  'Consultoria Janeiro/2026',
  3,
  1,
  'gentil',
  'Ola Joao! Passando para lembrar que identificamos uma pendencia no valor de R$ 500,00...',
  'ghl_whatsapp',
  'pago'
),

-- Exemplo 2: Cobranca firme enviada, prometeu pagar
(
  'marcos_pessoal',
  'pay_exemplo_002',
  'cus_exemplo_002',
  'Maria Santos',
  'maria@email.com',
  '+5511999990002',
  1200.00,
  1000.00,
  CURRENT_DATE - INTERVAL '10 days',
  10,
  'Servico Fevereiro/2026',
  7,
  1,
  'firme',
  'Ola Maria, Verificamos que a fatura no valor de R$ 1.200,00 continua em aberto...',
  'ghl_whatsapp',
  'prometeu_pagar'
),

-- Exemplo 3: Cobranca urgente, sem resposta
(
  'marcos_pessoal',
  'pay_exemplo_003',
  'cus_exemplo_003',
  'Carlos Oliveira',
  'carlos@email.com',
  '+5511999990003',
  800.00,
  800.00,
  CURRENT_DATE - INTERVAL '18 days',
  18,
  'Manutencao Q1/2026',
  15,
  1,
  'urgente',
  'Carlos, Sua fatura de R$ 800,00 esta com 18 dias de atraso...',
  'ghl_whatsapp',
  'ignorou'
)
ON CONFLICT DO NOTHING;

-- Atualizar primeiro exemplo como pago
UPDATE cobranca_historico
SET
  pago = true,
  pago_em = NOW() - INTERVAL '2 days',
  valor_pago = 500.00,
  forma_pagamento = 'pix',
  cliente_respondeu = true,
  resposta_cliente = 'Paguei agora, desculpa o atraso!',
  respondeu_em = NOW() - INTERVAL '2 days'
WHERE asaas_payment_id = 'pay_exemplo_001';

-- Atualizar segundo exemplo com promessa
UPDATE cobranca_historico
SET
  cliente_respondeu = true,
  resposta_cliente = 'Vou pagar sexta-feira sem falta',
  respondeu_em = NOW() - INTERVAL '1 day',
  data_promessa_pagamento = CURRENT_DATE + INTERVAL '3 days',
  sentimento_resposta = 'positivo'
WHERE asaas_payment_id = 'pay_exemplo_002';


-- ============================================
-- 12. METRICAS EXEMPLO
-- ============================================

INSERT INTO cobranca_metricas_diarias (
  location_id,
  data,
  total_cobranças_enviadas,
  total_por_cadencia,
  total_pagos,
  valor_recuperado,
  total_prometeram,
  total_ignoraram,
  enviados_whatsapp,
  enviados_sms,
  taxa_resposta,
  valor_total_em_atraso,
  valor_cobrado
)
VALUES
(
  'marcos_pessoal',
  CURRENT_DATE - INTERVAL '1 day',
  3,
  '{"3": 1, "7": 1, "15": 1}'::jsonb,
  1,
  500.00,
  1,
  1,
  3,
  0,
  66.67,
  2500.00,
  2500.00
)
ON CONFLICT (location_id, data) DO NOTHING;


-- ============================================
-- 13. RLS (Row Level Security)
-- ============================================

ALTER TABLE cobranca_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_metricas_diarias ENABLE ROW LEVEL SECURITY;

-- Policies permissivas (ajustar conforme necessidade)
CREATE POLICY "Allow all on cobranca_configs" ON cobranca_configs FOR ALL USING (true);
CREATE POLICY "Allow all on cobranca_historico" ON cobranca_historico FOR ALL USING (true);
CREATE POLICY "Allow all on cobranca_templates" ON cobranca_templates FOR ALL USING (true);
CREATE POLICY "Allow all on cobranca_metricas_diarias" ON cobranca_metricas_diarias FOR ALL USING (true);


-- ============================================
-- 14. COMENTARIOS
-- ============================================

COMMENT ON TABLE cobranca_configs IS 'Configuracao de cobranca automatizada por cliente/location';
COMMENT ON TABLE cobranca_historico IS 'Historico de todas as cobrancas enviadas';
COMMENT ON TABLE cobranca_templates IS 'Templates de mensagem de cobranca por tom';
COMMENT ON TABLE cobranca_metricas_diarias IS 'Metricas agregadas de cobranca por dia';

COMMENT ON FUNCTION deve_cobrar_fatura IS 'Verifica se uma fatura deve ser cobrada baseado na cadencia e historico';
COMMENT ON FUNCTION get_tom_cobranca IS 'Retorna o tom adequado para uma cadencia especifica';


-- ============================================
-- VERIFICACAO POS-MIGRATION
-- ============================================

-- SELECT * FROM cobranca_configs;
-- SELECT * FROM cobranca_historico;
-- SELECT * FROM cobranca_templates;
-- SELECT * FROM v_cobranca_dashboard;
-- SELECT * FROM deve_cobrar_fatura('pay_teste', 'marcos_pessoal', 10);
-- SELECT get_tom_cobranca('marcos_pessoal', 7);


-- =====================================================
-- FIM DA MIGRATION 013
-- =====================================================
