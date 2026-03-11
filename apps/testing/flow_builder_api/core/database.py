"""
Flow Builder API - Database Connection (Supabase)
"""
from supabase import create_client, Client
from .config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get Supabase client (singleton)"""
    global _supabase_client

    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL e SUPABASE_KEY devem estar configurados")

        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
        logger.info("Supabase client initialized")

    return _supabase_client


# ============================================================================
# SQL para criar tabelas (executar no Supabase)
# ============================================================================

CREATE_TABLES_SQL = """
-- Flows
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    canvas_data JSONB DEFAULT '{"zoom": 1, "position": {"x": 0, "y": 0}}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flow Nodes (Cards)
CREATE TABLE IF NOT EXISTS flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mode', 'etapa', 'mensagem', 'script', 'decisao', 'simulacao')),
    data JSONB NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    width FLOAT,
    height FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flow Edges (Conexoes)
CREATE TABLE IF NOT EXISTS flow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    source_handle TEXT,
    target_handle TEXT,
    type TEXT DEFAULT 'default' CHECK (type IN ('default', 'conditional', 'fallback')),
    label TEXT,
    condition JSONB,
    animated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulations
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id),
    persona JSONB NOT NULL,
    messages JSONB[] DEFAULT '{}',
    current_node_id UUID,
    status TEXT DEFAULT 'running' CHECK (status IN ('idle', 'running', 'paused', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reasoning Logs
CREATE TABLE IF NOT EXISTS reasoning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    node_id UUID,
    message_index INT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_edges_flow_id ON flow_edges(flow_id);
CREATE INDEX IF NOT EXISTS idx_simulations_flow_id ON simulations(flow_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_simulation_id ON reasoning_logs(simulation_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_flows_updated_at ON flows;
CREATE TRIGGER update_flows_updated_at
    BEFORE UPDATE ON flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""
