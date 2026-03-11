-- migration: 062_expert_dna.sql
-- autor: mega-brain team
-- data: 2026-03-01
-- descricao: Mega Brain — DNA de experts e auto-agentes

-- ============================================================
-- ROLLBACK PLAN
-- ============================================================
-- DROP TABLE IF EXISTS auto_agents;
-- DROP TABLE IF EXISTS expert_dna;

-- ============================================================
-- UP
-- ============================================================

-- ------------------------------------------------------------
-- Expert DNA — 6 camadas de conhecimento extraido
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expert_dna (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID        NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
  layer           TEXT        NOT NULL CHECK (layer IN (
                                'philosophy', 'mental_models', 'heuristics',
                                'frameworks', 'methodologies', 'dilemmas'
                              )),
  content         JSONB       NOT NULL,
  source_chunks   UUID[]      DEFAULT '{}',
  confidence      FLOAT       DEFAULT 0.0,
  version         INTEGER     DEFAULT 1,
  extracted_by    TEXT        DEFAULT 'llm',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, layer)
);

-- ------------------------------------------------------------
-- Auto-agents criados a partir de DNA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auto_agents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id         UUID        NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
  agent_name        TEXT        NOT NULL,
  agent_type        TEXT        NOT NULL CHECK (agent_type IN (
                                  'expert_clone', 'operational_role', 'advisor'
                                )),
  system_prompt     TEXT        NOT NULL,
  dna_layers_used   TEXT[]      DEFAULT '{}',
  tools_config      JSONB       DEFAULT '{}',
  is_active         BOOLEAN     DEFAULT false,
  approved_by       TEXT,
  approved_at       TIMESTAMPTZ,
  creation_trigger  TEXT,
  mention_threshold INTEGER     DEFAULT 5,
  metadata          JSONB       DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_expert_dna_entity
  ON public.expert_dna(entity_id);

CREATE INDEX IF NOT EXISTS idx_auto_agents_entity
  ON public.auto_agents(entity_id);

CREATE INDEX IF NOT EXISTS idx_auto_agents_active
  ON public.auto_agents(is_active);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.expert_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth CRUD expert_dna"
  ON public.expert_dna FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth CRUD auto_agents"
  ON public.auto_agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_expert_dna
  BEFORE UPDATE ON public.expert_dna
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP TABLE IF EXISTS public.auto_agents;
-- DROP TABLE IF EXISTS public.expert_dna;
