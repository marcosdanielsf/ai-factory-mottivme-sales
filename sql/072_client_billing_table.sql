-- Migration 072: Tabela de billing mensal por cliente
-- Obsessao: Lucro Extraordinario + Caixa Extraordinario
-- Armazena receita mensal por cliente para calculo de unit economics

CREATE TABLE IF NOT EXISTS client_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    month DATE NOT NULL, -- primeiro dia do mes (ex: 2026-01-01)
    revenue_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
    contract_type TEXT DEFAULT 'recurring' CHECK (contract_type IN ('recurring', 'one-time', 'hybrid')),
    is_active BOOLEAN DEFAULT true,
    churn_date DATE, -- data em que churnou (NULL se ativo)
    acquisition_date DATE, -- data de aquisicao do cliente
    acquisition_cost_brl NUMERIC(12,2) DEFAULT 0, -- CAC individual
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(location_id, month)
);

-- Index para queries por mes e cliente
CREATE INDEX IF NOT EXISTS idx_client_billing_month ON client_billing(month DESC);
CREATE INDEX IF NOT EXISTS idx_client_billing_location ON client_billing(location_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_active ON client_billing(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_client_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_billing_updated_at ON client_billing;
CREATE TRIGGER trg_client_billing_updated_at
    BEFORE UPDATE ON client_billing
    FOR EACH ROW
    EXECUTE FUNCTION update_client_billing_updated_at();

-- RLS
ALTER TABLE client_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read client_billing"
    ON client_billing FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert client_billing"
    ON client_billing FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update client_billing"
    ON client_billing FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE client_billing IS 'Receita mensal por cliente para calculo de unit economics (MRR, LTV, margem)';
