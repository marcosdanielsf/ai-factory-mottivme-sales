-- Migration 062: Expert DNA + Auto Agents
-- Autor: supabase-dba agent
-- Data: 2026-03-01
-- Descricao: Perfis DNA de especialistas extraidos dos chunks + agentes auto-gerados

-- Rollback: DROP TABLE auto_agents; DROP TABLE expert_dna;

-- ============================================================
-- UP
-- ============================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TABLE IF NOT EXISTS expert_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  layer TEXT NOT NULL CHECK (layer IN (
    'philosophy', 'mental_models', 'heuristics', 'frameworks', 'methodologies', 'dilemmas'
  )),
  content JSONB NOT NULL,
  source_chunks UUID[] DEFAULT '{}',
  confidence FLOAT DEFAULT 0.0,
  version INTEGER DEFAULT 1,
  extracted_by TEXT DEFAULT 'llm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, layer)
);

CREATE TABLE IF NOT EXISTS auto_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES knowledge_entities(id),
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('expert_clone', 'operational_role', 'advisor')),
  system_prompt TEXT NOT NULL,
  dna_layers_used TEXT[] DEFAULT '{}',
  tools_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  creation_trigger TEXT,
  mention_threshold INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expert_dna_entity ON expert_dna(entity_id);
CREATE INDEX IF NOT EXISTS idx_auto_agents_entity ON auto_agents(entity_id);
CREATE INDEX IF NOT EXISTS idx_auto_agents_active ON auto_agents(is_active);

ALTER TABLE expert_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth CRUD expert_dna" ON expert_dna FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth CRUD auto_agents" ON auto_agents FOR ALL TO authenticated USING (true);

CREATE OR REPLACE TRIGGER set_updated_at_expert_dna
  BEFORE UPDATE ON expert_dna
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS auto_agents;
-- DROP TABLE IF EXISTS expert_dna;
-- COMMIT;
