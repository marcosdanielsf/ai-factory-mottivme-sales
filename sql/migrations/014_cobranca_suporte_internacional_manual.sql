-- =====================================================
-- MIGRATION 014: Suporte a Cobranças Manuais e Internacionais
--
-- Ajusta sistema de cobrança para ser SUPABASE-FIRST
-- Suporta: Asaas (sync), Manual (BR), Internacional (USD/EUR)
--
-- Data: Janeiro 2026
-- =====================================================

-- ============================================
-- 1. ADICIONAR COLUNAS EM cobranca_historico
-- ============================================

-- Origem da cobrança
ALTER TABLE cobranca_historico
ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'manual';

COMMENT ON COLUMN cobranca_historico.origem IS 'Origem: asaas, manual, internacional';

-- Suporte a moedas
ALTER TABLE cobranca_historico
ADD COLUMN IF NOT EXISTS moeda VARCHAR(10) DEFAULT 'BRL';

ALTER TABLE cobranca_historico
ADD COLUMN IF NOT EXISTS valor_moeda_original DECIMAL(12,2);

ALTER TABLE cobranca_historico
ADD COLUMN IF NOT EXISTS cotacao_usada DECIMAL(10,4);

COMMENT ON COLUMN cobranca_historico.moeda IS 'Moeda: BRL, USD, EUR, GBP';
COMMENT ON COLUMN cobranca_historico.valor_moeda_original IS 'Valor na moeda original (antes de converter)';
COMMENT ON COLUMN cobranca_historico.cotacao_usada IS 'Cotação usada para conversão (se aplicável)';

-- Índice para origem
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_origem ON cobranca_historico(origem);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_moeda ON cobranca_historico(moeda);


-- ============================================
-- 2. TABELA: cobrancas_pendentes (FONTE PRINCIPAL)
-- Todas as cobranças a receber, independente de Asaas
-- ============================================

CREATE TABLE IF NOT EXISTS cobrancas_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,

  -- Referência externa (opcional)
  asaas_payment_id VARCHAR(100),        -- NULL se não estiver no Asaas
  asaas_customer_id VARCHAR(100),
  referencia_externa VARCHAR(100),       -- Outro sistema, contrato, etc

  -- Dados do cliente
  cliente_nome VARCHAR(200) NOT NULL,
  cliente_email VARCHAR(200),
  cliente_telefone VARCHAR(20),
  cliente_cpf_cnpj VARCHAR(20),
  cliente_pais VARCHAR(50) DEFAULT 'Brasil',

  -- Dados da cobrança
  descricao TEXT NOT NULL,               -- "BPOSS Janeiro/2026", "Gestão de Tráfego", etc
  categoria VARCHAR(100),                -- "consultoria", "servico", "produto", "mensalidade"

  -- Valores
  valor DECIMAL(12,2) NOT NULL,          -- Valor em BRL (ou convertido)
  moeda VARCHAR(10) DEFAULT 'BRL',       -- BRL, USD, EUR, GBP
  valor_moeda_original DECIMAL(12,2),    -- Valor original se moeda != BRL
  cotacao DECIMAL(10,4),                 -- Cotação usada na conversão

  -- Juros/Multa (calculados)
  juros_dia DECIMAL(5,4) DEFAULT 0.033,  -- 0.033% ao dia = 1% ao mês
  multa_atraso DECIMAL(5,2) DEFAULT 2.0, -- 2% de multa
  valor_atualizado DECIMAL(12,2),        -- Valor + juros + multa (calculado)

  -- Datas
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,                   -- NULL se não pago

  -- Status
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, pago, parcial, cancelado, negociando
  pago BOOLEAN DEFAULT false,
  valor_pago DECIMAL(12,2),
  forma_pagamento VARCHAR(50),           -- pix, boleto, transferencia, wise, paypal, cartao

  -- Cobrança automática
  cobranca_automatica BOOLEAN DEFAULT true,  -- Se deve entrar no agente de cobrança
  ultima_cobranca_em TIMESTAMP WITH TIME ZONE,
  total_cobranças INTEGER DEFAULT 0,
  proxima_cobranca DATE,

  -- Origem
  origem VARCHAR(50) DEFAULT 'manual',   -- manual, asaas_sync, importacao

  -- Observações
  observacoes TEXT,
  tags TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_location ON cobrancas_pendentes(location_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_cliente ON cobrancas_pendentes(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_vencimento ON cobrancas_pendentes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_status ON cobrancas_pendentes(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_pago ON cobrancas_pendentes(pago) WHERE pago = false;
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_asaas ON cobrancas_pendentes(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cobrancas_pendentes_cobranca_auto ON cobrancas_pendentes(cobranca_automatica, pago) WHERE cobranca_automatica = true AND pago = false;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_cobrancas_pendentes_updated ON cobrancas_pendentes;
CREATE TRIGGER trigger_cobrancas_pendentes_updated
  BEFORE UPDATE ON cobrancas_pendentes
  FOR EACH ROW
  EXECUTE FUNCTION update_cobranca_configs_timestamp();


-- ============================================
-- 3. FUNÇÃO: Calcular valor atualizado com juros/multa
-- ============================================

CREATE OR REPLACE FUNCTION calcular_valor_atualizado(
  p_valor DECIMAL,
  p_data_vencimento DATE,
  p_juros_dia DECIMAL DEFAULT 0.033,
  p_multa_atraso DECIMAL DEFAULT 2.0
)
RETURNS DECIMAL AS $$
DECLARE
  v_dias_atraso INTEGER;
  v_juros DECIMAL;
  v_multa DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Calcular dias de atraso
  v_dias_atraso := GREATEST(0, CURRENT_DATE - p_data_vencimento);

  IF v_dias_atraso = 0 THEN
    RETURN p_valor;
  END IF;

  -- Calcular juros (% ao dia * dias)
  v_juros := p_valor * (p_juros_dia / 100) * v_dias_atraso;

  -- Multa fixa (aplica só uma vez)
  v_multa := p_valor * (p_multa_atraso / 100);

  v_total := p_valor + v_juros + v_multa;

  RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 4. VIEW: Cobranças vencidas para o Agente
-- ============================================

CREATE OR REPLACE VIEW v_cobrancas_para_agente AS
SELECT
  cp.id,
  cp.location_id,
  cp.asaas_payment_id,
  cp.cliente_nome,
  cp.cliente_email,
  cp.cliente_telefone,
  cp.cliente_pais,
  cp.descricao,
  cp.categoria,
  cp.valor,
  cp.moeda,
  cp.valor_moeda_original,
  cp.cotacao,
  calcular_valor_atualizado(cp.valor, cp.data_vencimento, cp.juros_dia, cp.multa_atraso) as valor_atualizado,
  cp.data_vencimento,
  CURRENT_DATE - cp.data_vencimento as dias_atraso,
  cp.ultima_cobranca_em,
  cp.total_cobranças,
  cp.origem,
  cp.tags,
  cp.observacoes,
  -- Buscar config
  cc.cadencia_dias,
  cc.canal_primario,
  cc.max_tentativas_por_fatura
FROM cobrancas_pendentes cp
LEFT JOIN cobranca_configs cc ON cc.location_id = cp.location_id AND cc.is_active = true
WHERE cp.pago = false
  AND cp.cobranca_automatica = true
  AND cp.status IN ('pendente', 'negociando')
  AND cp.data_vencimento < CURRENT_DATE  -- Só vencidas
ORDER BY (CURRENT_DATE - cp.data_vencimento) DESC;


-- ============================================
-- 5. FUNÇÃO: Verificar se deve cobrar (V2 - usa cobrancas_pendentes)
-- ============================================

CREATE OR REPLACE FUNCTION deve_cobrar_cobranca(
  p_cobranca_id UUID
)
RETURNS TABLE (
  deve_cobrar BOOLEAN,
  cadencia_a_usar INTEGER,
  tentativa_numero INTEGER,
  motivo TEXT,
  valor_atualizado DECIMAL,
  dias_atraso INTEGER
) AS $$
DECLARE
  v_cobranca cobrancas_pendentes%ROWTYPE;
  v_config cobranca_configs%ROWTYPE;
  v_dias_atraso INTEGER;
  v_cadencia_encontrada INTEGER;
  v_horas_desde_ultima DECIMAL;
  v_valor_calc DECIMAL;
BEGIN
  -- Buscar cobrança
  SELECT * INTO v_cobranca FROM cobrancas_pendentes WHERE id = p_cobranca_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, 'Cobranca nao encontrada'::TEXT, NULL::DECIMAL, NULL::INTEGER;
    RETURN;
  END IF;

  -- Verificar se já está paga
  IF v_cobranca.pago THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, 'Cobranca ja paga'::TEXT, NULL::DECIMAL, NULL::INTEGER;
    RETURN;
  END IF;

  -- Calcular dias de atraso
  v_dias_atraso := CURRENT_DATE - v_cobranca.data_vencimento;

  IF v_dias_atraso <= 0 THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, 'Cobranca ainda nao venceu'::TEXT, NULL::DECIMAL, v_dias_atraso;
    RETURN;
  END IF;

  -- Buscar config
  SELECT * INTO v_config FROM cobranca_configs
  WHERE location_id = v_cobranca.location_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, 'Config nao encontrada para location'::TEXT, NULL::DECIMAL, v_dias_atraso;
    RETURN;
  END IF;

  -- Verificar valor mínimo
  IF v_cobranca.valor < v_config.valor_minimo_cobranca THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER,
      'Valor abaixo do minimo (R$ ' || v_cobranca.valor || ' < R$ ' || v_config.valor_minimo_cobranca || ')'::TEXT,
      NULL::DECIMAL, v_dias_atraso;
    RETURN;
  END IF;

  -- Encontrar cadência aplicável
  SELECT unnest INTO v_cadencia_encontrada
  FROM unnest(v_config.cadencia_dias)
  WHERE unnest <= v_dias_atraso
  ORDER BY unnest DESC
  LIMIT 1;

  IF v_cadencia_encontrada IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER,
      'Dias de atraso (' || v_dias_atraso || ') menor que primeira cadencia'::TEXT,
      NULL::DECIMAL, v_dias_atraso;
    RETURN;
  END IF;

  -- Verificar se já cobrou nessa cadência
  IF EXISTS (
    SELECT 1 FROM cobranca_historico
    WHERE (asaas_payment_id = v_cobranca.asaas_payment_id AND v_cobranca.asaas_payment_id IS NOT NULL)
       OR (asaas_payment_id IS NULL AND cliente_telefone = v_cobranca.cliente_telefone
           AND valor = v_cobranca.valor AND data_vencimento = v_cobranca.data_vencimento)
    AND cadencia_acionada = v_cadencia_encontrada
  ) THEN
    RETURN QUERY SELECT false, v_cadencia_encontrada, v_cobranca.total_cobranças,
      'Ja cobrou na cadencia ' || v_cadencia_encontrada || ' dias'::TEXT,
      NULL::DECIMAL, v_dias_atraso;
    RETURN;
  END IF;

  -- Verificar máximo de tentativas
  IF v_cobranca.total_cobranças >= v_config.max_tentativas_por_fatura THEN
    RETURN QUERY SELECT false, v_cadencia_encontrada, v_cobranca.total_cobranças,
      'Atingiu maximo de tentativas (' || v_config.max_tentativas_por_fatura || ')'::TEXT,
      NULL::DECIMAL, v_dias_atraso;
    RETURN;
  END IF;

  -- Verificar intervalo mínimo
  IF v_cobranca.ultima_cobranca_em IS NOT NULL THEN
    v_horas_desde_ultima := EXTRACT(EPOCH FROM (NOW() - v_cobranca.ultima_cobranca_em)) / 3600;
    IF v_horas_desde_ultima < v_config.intervalo_minimo_horas THEN
      RETURN QUERY SELECT false, v_cadencia_encontrada, v_cobranca.total_cobranças + 1,
        'Intervalo minimo nao atingido (' || ROUND(v_horas_desde_ultima::NUMERIC, 1) || 'h de ' || v_config.intervalo_minimo_horas || 'h)'::TEXT,
        NULL::DECIMAL, v_dias_atraso;
      RETURN;
    END IF;
  END IF;

  -- Calcular valor atualizado
  v_valor_calc := calcular_valor_atualizado(v_cobranca.valor, v_cobranca.data_vencimento, v_cobranca.juros_dia, v_cobranca.multa_atraso);

  -- Pode cobrar!
  RETURN QUERY SELECT true, v_cadencia_encontrada, v_cobranca.total_cobranças + 1, 'OK'::TEXT, v_valor_calc, v_dias_atraso;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 6. FUNÇÃO: Registrar cobrança enviada
-- ============================================

CREATE OR REPLACE FUNCTION registrar_cobranca_enviada(
  p_cobranca_id UUID,
  p_cadencia INTEGER,
  p_tom VARCHAR,
  p_mensagem TEXT,
  p_canal VARCHAR,
  p_ghl_message_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_cobranca cobrancas_pendentes%ROWTYPE;
  v_historico_id UUID;
  v_dias_atraso INTEGER;
  v_valor_atualizado DECIMAL;
BEGIN
  -- Buscar cobrança
  SELECT * INTO v_cobranca FROM cobrancas_pendentes WHERE id = p_cobranca_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobranca nao encontrada: %', p_cobranca_id;
  END IF;

  v_dias_atraso := CURRENT_DATE - v_cobranca.data_vencimento;
  v_valor_atualizado := calcular_valor_atualizado(v_cobranca.valor, v_cobranca.data_vencimento, v_cobranca.juros_dia, v_cobranca.multa_atraso);

  -- Inserir no histórico
  INSERT INTO cobranca_historico (
    location_id,
    asaas_payment_id,
    asaas_customer_id,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    valor,
    valor_original,
    juros_multa,
    data_vencimento,
    dias_atraso,
    descricao_fatura,
    cadencia_acionada,
    tentativa_numero,
    tom_usado,
    mensagem_enviada,
    canal_usado,
    ghl_message_id,
    origem,
    moeda,
    valor_moeda_original,
    cotacao_usada
  ) VALUES (
    v_cobranca.location_id,
    v_cobranca.asaas_payment_id,
    v_cobranca.asaas_customer_id,
    v_cobranca.cliente_nome,
    v_cobranca.cliente_email,
    v_cobranca.cliente_telefone,
    v_valor_atualizado,
    v_cobranca.valor,
    v_valor_atualizado - v_cobranca.valor,
    v_cobranca.data_vencimento,
    v_dias_atraso,
    v_cobranca.descricao,
    p_cadencia,
    v_cobranca.total_cobranças + 1,
    p_tom,
    p_mensagem,
    p_canal,
    p_ghl_message_id,
    v_cobranca.origem,
    v_cobranca.moeda,
    v_cobranca.valor_moeda_original,
    v_cobranca.cotacao
  )
  RETURNING id INTO v_historico_id;

  -- Atualizar cobrança pendente
  UPDATE cobrancas_pendentes
  SET
    ultima_cobranca_em = NOW(),
    total_cobranças = total_cobranças + 1,
    updated_at = NOW()
  WHERE id = p_cobranca_id;

  RETURN v_historico_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 7. FUNÇÃO: Marcar cobrança como paga
-- ============================================

CREATE OR REPLACE FUNCTION marcar_cobranca_paga(
  p_cobranca_id UUID,
  p_valor_pago DECIMAL,
  p_forma_pagamento VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Atualizar cobrança pendente
  UPDATE cobrancas_pendentes
  SET
    pago = true,
    status = 'pago',
    valor_pago = p_valor_pago,
    forma_pagamento = p_forma_pagamento,
    data_pagamento = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_cobranca_id;

  -- Atualizar histórico (último registro dessa cobrança)
  UPDATE cobranca_historico
  SET
    pago = true,
    pago_em = NOW(),
    valor_pago = p_valor_pago,
    forma_pagamento = p_forma_pagamento,
    resultado = 'pago',
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM cobranca_historico
    WHERE (asaas_payment_id = (SELECT asaas_payment_id FROM cobrancas_pendentes WHERE id = p_cobranca_id))
       OR (cliente_telefone = (SELECT cliente_telefone FROM cobrancas_pendentes WHERE id = p_cobranca_id)
           AND valor = (SELECT valor FROM cobrancas_pendentes WHERE id = p_cobranca_id))
    ORDER BY enviado_em DESC
    LIMIT 1
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 8. DADOS EXEMPLO: Cobranças Dr. Luiz
-- ============================================

INSERT INTO cobrancas_pendentes (
  location_id,
  cliente_nome,
  cliente_email,
  cliente_telefone,
  descricao,
  categoria,
  valor,
  moeda,
  data_vencimento,
  origem,
  tags,
  observacoes
)
VALUES
-- BPOSS Dr. Luiz
(
  'marcos_pessoal',
  'Dr. Luiz',
  'drluiz@clinica.com',
  '+5511999998888',
  'BPOSS Janeiro/2026',
  'consultoria',
  3500.00,
  'BRL',
  CURRENT_DATE - INTERVAL '5 days',
  'manual',
  ARRAY['bposs', 'consultoria', 'dr_luiz'],
  'Consultoria BPOSS - pagamento mensal'
),
-- Gestão de Tráfego Dr. Luiz
(
  'marcos_pessoal',
  'Dr. Luiz',
  'drluiz@clinica.com',
  '+5511999998888',
  'Gestao de Trafego Janeiro/2026',
  'servico',
  1500.00,
  'BRL',
  CURRENT_DATE - INTERVAL '5 days',
  'manual',
  ARRAY['trafego', 'ads', 'dr_luiz'],
  'Gestão de tráfego pago - Google/Meta Ads'
),
-- Exemplo internacional (USD)
(
  'marcos_pessoal',
  'John Smith',
  'john@company.com',
  '+14155551234',
  'Consulting Services January/2026',
  'consultoria',
  500.00,
  'USD',
  CURRENT_DATE - INTERVAL '10 days',
  'internacional',
  ARRAY['internacional', 'usd', 'consulting'],
  'International client - payment via Wise'
)
ON CONFLICT DO NOTHING;

-- Atualizar valor em BRL para cobrança internacional
UPDATE cobrancas_pendentes
SET
  valor_moeda_original = 500.00,
  valor = 500.00 * 6.05,  -- Cotação exemplo
  cotacao = 6.05
WHERE moeda = 'USD' AND cliente_nome = 'John Smith';


-- ============================================
-- 9. VIEW: Dashboard atualizado
-- ============================================

CREATE OR REPLACE VIEW v_cobranca_dashboard_v2 AS
SELECT
  cp.location_id,
  -- Métricas de pendências
  COUNT(*) FILTER (WHERE NOT cp.pago) as total_pendentes,
  SUM(cp.valor) FILTER (WHERE NOT cp.pago) as valor_total_pendente,
  COUNT(*) FILTER (WHERE NOT cp.pago AND cp.moeda = 'BRL') as pendentes_brl,
  COUNT(*) FILTER (WHERE NOT cp.pago AND cp.moeda != 'BRL') as pendentes_internacional,
  -- Por origem
  COUNT(*) FILTER (WHERE NOT cp.pago AND cp.origem = 'manual') as pendentes_manual,
  COUNT(*) FILTER (WHERE NOT cp.pago AND cp.origem = 'asaas_sync') as pendentes_asaas,
  COUNT(*) FILTER (WHERE NOT cp.pago AND cp.origem = 'internacional') as pendentes_internacional_origem,
  -- Métricas de recuperação (últimos 30 dias)
  COUNT(*) FILTER (WHERE cp.pago AND cp.data_pagamento >= CURRENT_DATE - 30) as pagos_30d,
  SUM(cp.valor_pago) FILTER (WHERE cp.pago AND cp.data_pagamento >= CURRENT_DATE - 30) as recuperado_30d,
  -- Por atraso
  COUNT(*) FILTER (WHERE NOT cp.pago AND CURRENT_DATE - cp.data_vencimento BETWEEN 1 AND 7) as atraso_1_7_dias,
  COUNT(*) FILTER (WHERE NOT cp.pago AND CURRENT_DATE - cp.data_vencimento BETWEEN 8 AND 15) as atraso_8_15_dias,
  COUNT(*) FILTER (WHERE NOT cp.pago AND CURRENT_DATE - cp.data_vencimento BETWEEN 16 AND 30) as atraso_16_30_dias,
  COUNT(*) FILTER (WHERE NOT cp.pago AND CURRENT_DATE - cp.data_vencimento > 30) as atraso_mais_30_dias
FROM cobrancas_pendentes cp
GROUP BY cp.location_id;


-- ============================================
-- 10. RLS
-- ============================================

ALTER TABLE cobrancas_pendentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on cobrancas_pendentes" ON cobrancas_pendentes FOR ALL USING (true);


-- ============================================
-- 11. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE cobrancas_pendentes IS 'Tabela principal de cobranças - FONTE ÚNICA DE VERDADE. Suporta Asaas, manual e internacional.';
COMMENT ON FUNCTION calcular_valor_atualizado IS 'Calcula valor com juros e multa baseado nos dias de atraso';
COMMENT ON FUNCTION deve_cobrar_cobranca IS 'Verifica se uma cobrança deve ser cobrada (v2 - usa cobrancas_pendentes)';
COMMENT ON FUNCTION registrar_cobranca_enviada IS 'Registra cobrança no histórico e atualiza contadores';
COMMENT ON FUNCTION marcar_cobranca_paga IS 'Marca cobrança como paga em todas as tabelas';


-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- SELECT * FROM cobrancas_pendentes;
-- SELECT * FROM v_cobrancas_para_agente;
-- SELECT * FROM v_cobranca_dashboard_v2;
-- SELECT * FROM deve_cobrar_cobranca((SELECT id FROM cobrancas_pendentes LIMIT 1));


-- =====================================================
-- FIM DA MIGRATION 014
-- =====================================================
