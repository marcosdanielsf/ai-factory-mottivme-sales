-- Flow Builder - Database Schema
-- Execute este SQL no Supabase SQL Editor

-- ============================================================================
-- FLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    canvas_data JSONB DEFAULT '{"zoom": 1, "position": {"x": 0, "y": 0}}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar flows por client
CREATE INDEX IF NOT EXISTS idx_flows_client_id ON flows(client_id);

-- ============================================================================
-- FLOW NODES (Cards)
-- ============================================================================

CREATE TABLE IF NOT EXISTS flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mode', 'etapa', 'mensagem', 'script', 'decisao', 'simulacao')),
    data JSONB NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    width FLOAT,
    height FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar nodes por flow
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);

-- ============================================================================
-- FLOW EDGES (Conexoes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS flow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,  -- ID do node de origem
    target_node_id TEXT NOT NULL,  -- ID do node de destino
    source_handle TEXT,
    target_handle TEXT,
    type TEXT DEFAULT 'default' CHECK (type IN ('default', 'conditional', 'fallback')),
    label TEXT,
    condition JSONB,
    animated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar edges por flow
CREATE INDEX IF NOT EXISTS idx_flow_edges_flow_id ON flow_edges(flow_id);

-- ============================================================================
-- SIMULATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id),
    persona JSONB NOT NULL,
    messages JSONB[] DEFAULT '{}',
    current_node_id UUID,
    status TEXT DEFAULT 'running' CHECK (status IN ('idle', 'running', 'paused', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar simulations por flow
CREATE INDEX IF NOT EXISTS idx_simulations_flow_id ON simulations(flow_id);

-- ============================================================================
-- REASONING LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    node_id UUID,
    message_index INT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar logs por simulation
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_simulation_id ON reasoning_logs(simulation_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para flows
DROP TRIGGER IF EXISTS update_flows_updated_at ON flows;
CREATE TRIGGER update_flows_updated_at
    BEFORE UPDATE ON flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTARIOS (Documentação)
-- ============================================================================

COMMENT ON TABLE flows IS 'Flows do Flow Builder - canvas com nodes e edges';
COMMENT ON TABLE flow_nodes IS 'Nodes (cards) do flow - Mode, Etapa, Mensagem, Script, Decisão, Simulação';
COMMENT ON TABLE flow_edges IS 'Edges (conexões) entre nodes - default, conditional, fallback';
COMMENT ON TABLE simulations IS 'Simulações de conversa com leads fictícios';
COMMENT ON TABLE reasoning_logs IS 'Logs de raciocínio da IA durante simulações';

COMMENT ON COLUMN flow_nodes.type IS 'Tipo do node: mode, etapa, mensagem, script, decisao, simulacao';
COMMENT ON COLUMN flow_nodes.data IS 'Dados específicos do tipo do node (JSONB)';
COMMENT ON COLUMN flow_edges.type IS 'Tipo da edge: default (normal), conditional (com condição), fallback (fallback)';
COMMENT ON COLUMN simulations.persona IS 'Persona do lead fictício (nome, características, dores)';
COMMENT ON COLUMN simulations.messages IS 'Array de mensagens da conversa simulada';
COMMENT ON COLUMN reasoning_logs.criteria IS 'Critérios/raciocínio da IA para a resposta';

-- ============================================================================
-- DADOS DE EXEMPLO (Opcional)
-- ============================================================================

-- Flow de exemplo
INSERT INTO flows (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'SDR Inbound Flow', 'Flow padrão para leads que chegam via formulário')
ON CONFLICT (id) DO NOTHING;

-- Nodes de exemplo
INSERT INTO flow_nodes (flow_id, type, position_x, position_y, data) VALUES
    ('00000000-0000-0000-0000-000000000001', 'mode', 100, 100, '{"label": "SDR Inbound", "mode_name": "sdr_inbound", "status": "active", "etapas": ["ativacao", "qualificacao", "pitch", "transicao"]}'),
    ('00000000-0000-0000-0000-000000000001', 'mode', 400, 100, '{"label": "Scheduler", "mode_name": "scheduler", "status": "active", "etapas": ["contexto", "oferta_horarios", "confirmacao"]}'),
    ('00000000-0000-0000-0000-000000000001', 'mode', 700, 100, '{"label": "Concierge", "mode_name": "concierge", "status": "active", "etapas": ["acolhimento", "duvidas", "fechamento"]}'),
    ('00000000-0000-0000-0000-000000000001', 'mode', 400, 300, '{"label": "Objection Handler", "mode_name": "objection_handler", "status": "active", "etapas": ["validar", "explorar", "resolver"]}')
ON CONFLICT DO NOTHING;
