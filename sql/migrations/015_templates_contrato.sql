-- =====================================================
-- MIGRATION 015: Tabela templates_contrato
--
-- Armazena templates de contrato por produto/país/nicho
-- Permite que o Workflow 9 encontre o template correto
--
-- Data: Janeiro 2026
-- =====================================================

-- ============================================
-- 1. CRIAR TABELA templates_contrato
-- ============================================

CREATE TABLE IF NOT EXISTS templates_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação do template
  produto VARCHAR(100) NOT NULL,  -- BPOSS, BPOSS Evolution, BPOLG, Trafego, etc
  pais VARCHAR(50) NOT NULL DEFAULT 'Brasil',  -- Brasil, EUA
  nicho VARCHAR(100),  -- Clinicas, Advocacia, etc (NULL = qualquer)

  -- Google Docs
  google_doc_id VARCHAR(200) NOT NULL,  -- ID do template no Google Docs
  google_folder_id VARCHAR(200),  -- Pasta destino para contratos gerados

  -- Conteúdo padrão
  entregas_padrao TEXT,  -- Lista de entregas do produto
  nao_incluso_padrao TEXT,  -- O que não está incluso
  dias_onboarding_padrao INTEGER DEFAULT 15,

  -- Configuração
  idioma VARCHAR(10) DEFAULT 'pt-BR',  -- pt-BR, en-US
  moeda_padrao VARCHAR(10) DEFAULT 'BRL',  -- BRL, USD

  -- Controle
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint única: só um template ativo por combinação
  CONSTRAINT uq_template_produto_pais_nicho UNIQUE (produto, pais, nicho)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_templates_contrato_lookup
  ON templates_contrato(produto, pais, ativo)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_templates_contrato_pais
  ON templates_contrato(pais);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_templates_contrato_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_templates_contrato_updated ON templates_contrato;
CREATE TRIGGER trigger_templates_contrato_updated
  BEFORE UPDATE ON templates_contrato
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_contrato_timestamp();


-- ============================================
-- 2. INSERIR TEMPLATES
-- ============================================

-- Template BPOSS Brasil (você precisa colocar o ID correto)
INSERT INTO templates_contrato (
  produto, pais, nicho, google_doc_id, google_folder_id,
  entregas_padrao, nao_incluso_padrao, dias_onboarding_padrao,
  idioma, moeda_padrao
) VALUES (
  'BPOSS',
  'Brasil',
  NULL,
  'INSERIR_ID_DO_TEMPLATE_BRASIL',  -- TODO: Colocar ID real
  NULL,
  '• Implementação do CRM completo
• Configuração de funis de vendas
• Treinamento da equipe
• Suporte por 12 meses
• Automações de WhatsApp
• Dashboard de métricas',
  '• Investimento em tráfego pago
• Criação de conteúdo
• Gestão de redes sociais',
  15,
  'pt-BR',
  'BRL'
);

-- Template BPOSS EUA (documento que você passou)
INSERT INTO templates_contrato (
  produto, pais, nicho, google_doc_id, google_folder_id,
  entregas_padrao, nao_incluso_padrao, dias_onboarding_padrao,
  idioma, moeda_padrao
) VALUES (
  'BPOSS',
  'EUA',
  NULL,
  '1-f6GTcyGGBeGQNnV9ArwXte4vqU5HqDObUBAJYVQkH0',  -- Template EUA
  NULL,
  '• Full CRM Implementation
• Sales funnel configuration
• Team training
• 12-month support
• WhatsApp automations
• Metrics dashboard',
  '• Paid traffic investment
• Content creation
• Social media management',
  15,
  'en-US',
  'USD'
);


-- ============================================
-- 3. VIEW PARA CONSULTA
-- ============================================

CREATE OR REPLACE VIEW v_templates_contrato AS
SELECT
  id,
  produto,
  pais,
  nicho,
  google_doc_id,
  idioma,
  moeda_padrao,
  CASE
    WHEN pais = 'Brasil' THEN '🇧🇷'
    WHEN pais = 'EUA' THEN '🇺🇸'
    ELSE '🌍'
  END as bandeira,
  ativo,
  created_at
FROM templates_contrato
WHERE ativo = true
ORDER BY produto, pais;


-- ============================================
-- 4. FUNÇÃO PARA BUSCAR TEMPLATE
-- ============================================

CREATE OR REPLACE FUNCTION buscar_template_contrato(
  p_produto VARCHAR,
  p_pais VARCHAR,
  p_nicho VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  template_id UUID,
  google_doc_id VARCHAR,
  google_folder_id VARCHAR,
  entregas_padrao TEXT,
  nao_incluso_padrao TEXT,
  dias_onboarding_padrao INTEGER,
  idioma VARCHAR,
  moeda_padrao VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.google_doc_id,
    tc.google_folder_id,
    tc.entregas_padrao,
    tc.nao_incluso_padrao,
    tc.dias_onboarding_padrao,
    tc.idioma,
    tc.moeda_padrao
  FROM templates_contrato tc
  WHERE tc.produto = p_produto
    AND tc.pais = p_pais
    AND (tc.nicho = p_nicho OR tc.nicho IS NULL OR p_nicho IS NULL)
    AND tc.ativo = true
  ORDER BY
    -- Prioriza match exato de nicho
    CASE WHEN tc.nicho = p_nicho THEN 0 ELSE 1 END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Rodar após a migration:
-- SELECT * FROM v_templates_contrato;
-- SELECT * FROM buscar_template_contrato('BPOSS', 'EUA', NULL);


-- =====================================================
-- FIM DA MIGRATION 015
-- =====================================================
