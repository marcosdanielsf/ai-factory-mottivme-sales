-- ============================================================================
-- MIGRATION 021: Versioning Improvements
-- Melhoria do sistema de versionamento de agentes
-- Data: 2026-02-02
-- ============================================================================

-- ===========================================
-- 1. NOVAS COLUNAS em agent_versions
-- ===========================================

-- Parent version (de qual version foi criada)
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES agent_versions(id);

-- Resumo do que mudou (gerado pela IA)
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS diff_summary TEXT;

-- Score que essa version teve na avaliacao
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS evaluation_score NUMERIC(5,2);

-- Motivo da criacao (manual, improver, reflection, factory)
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS created_by_source VARCHAR(30) DEFAULT 'manual'
    CHECK (created_by_source IN ('manual', 'improver', 'reflection', 'factory', 'rollback'));

-- ===========================================
-- 2. INDEX para consultas frequentes
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_agent_versions_parent
  ON agent_versions(parent_version_id);

CREATE INDEX IF NOT EXISTS idx_agent_versions_location_active
  ON agent_versions(location_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_agent_versions_status
  ON agent_versions(status);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent_name_status
  ON agent_versions(agent_name, status);

-- ===========================================
-- 3. FUNCAO: auto_approve_version
-- Aprova automaticamente se score > 85 E melhoria > 5%
-- ===========================================

CREATE OR REPLACE FUNCTION auto_approve_version(
  p_version_id UUID,
  p_new_score NUMERIC,
  p_old_score NUMERIC DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_improvement NUMERIC;
  v_approved BOOLEAN := false;
  v_reason TEXT;
  v_current_active_id UUID;
  v_location_id UUID;
  v_agent_name TEXT;
BEGIN
  -- Buscar dados da version
  SELECT location_id, agent_name INTO v_location_id, v_agent_name
  FROM agent_versions WHERE id = p_version_id;

  -- Calcular melhoria
  IF p_old_score IS NOT NULL AND p_old_score > 0 THEN
    v_improvement := ((p_new_score - p_old_score) / p_old_score) * 100;
  ELSE
    v_improvement := 0;
  END IF;

  -- Regra: score > 85 E melhoria > 5%
  IF p_new_score > 85 AND v_improvement > 5 THEN
    v_approved := true;
    v_reason := format('Auto-approved: score %.1f > 85, improvement %.1f%% > 5%%', p_new_score, v_improvement);

    -- Desativar version ativa atual
    SELECT id INTO v_current_active_id
    FROM agent_versions
    WHERE location_id = v_location_id
      AND agent_name = v_agent_name
      AND is_active = true
      AND id != p_version_id
    LIMIT 1;

    IF v_current_active_id IS NOT NULL THEN
      UPDATE agent_versions
      SET is_active = false, status = 'archived', deprecated_at = NOW(), updated_at = NOW()
      WHERE id = v_current_active_id;
    END IF;

    -- Ativar nova version
    UPDATE agent_versions
    SET status = 'active',
        is_active = true,
        approved_by = 'auto',
        approved_at = NOW(),
        activated_at = NOW(),
        evaluation_score = p_new_score,
        updated_at = NOW()
    WHERE id = p_version_id;

  ELSE
    v_reason := format('Not auto-approved: score=%.1f (need >85), improvement=%.1f%% (need >5%%)', p_new_score, v_improvement);

    -- Manter como pending
    UPDATE agent_versions
    SET evaluation_score = p_new_score,
        updated_at = NOW()
    WHERE id = p_version_id;
  END IF;

  RETURN jsonb_build_object(
    'approved', v_approved,
    'reason', v_reason,
    'new_score', p_new_score,
    'old_score', p_old_score,
    'improvement_pct', v_improvement,
    'version_id', p_version_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 4. FUNCAO: cleanup_old_versions
-- Manter apenas ultimas 5 versions por agente
-- ===========================================

CREATE OR REPLACE FUNCTION cleanup_old_versions(
  p_location_id UUID,
  p_agent_name TEXT,
  p_keep_count INT DEFAULT 5
) RETURNS INT AS $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Soft-delete: marca como 'purged' (nao deleta fisicamente)
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM agent_versions
    WHERE location_id = p_location_id
      AND agent_name = p_agent_name
      AND status != 'active'
  )
  UPDATE agent_versions
  SET status = 'purged', deprecated_at = NOW(), updated_at = NOW()
  WHERE id IN (
    SELECT id FROM ranked WHERE rn > p_keep_count
  )
  AND status != 'purged';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 5. FUNCAO: rollback_version
-- Reverter para version anterior
-- ===========================================

CREATE OR REPLACE FUNCTION rollback_version(
  p_target_version_id UUID,
  p_reason TEXT DEFAULT 'Manual rollback'
) RETURNS JSONB AS $$
DECLARE
  v_location_id UUID;
  v_agent_name TEXT;
  v_current_active_id UUID;
BEGIN
  -- Buscar dados do target
  SELECT location_id, agent_name INTO v_location_id, v_agent_name
  FROM agent_versions WHERE id = p_target_version_id;

  IF v_location_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Version not found');
  END IF;

  -- Desativar atual
  UPDATE agent_versions
  SET is_active = false, status = 'archived', deprecated_at = NOW(), updated_at = NOW()
  WHERE location_id = v_location_id
    AND agent_name = v_agent_name
    AND is_active = true
  RETURNING id INTO v_current_active_id;

  -- Ativar target
  UPDATE agent_versions
  SET is_active = true,
      status = 'active',
      approved_by = 'rollback',
      approved_at = NOW(),
      activated_at = NOW(),
      deployment_notes = COALESCE(deployment_notes, '') || E'\n[ROLLBACK] ' || p_reason,
      updated_at = NOW()
  WHERE id = p_target_version_id;

  RETURN jsonb_build_object(
    'success', true,
    'rolled_back_from', v_current_active_id,
    'rolled_back_to', p_target_version_id,
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 6. FUNCAO: get_version_history
-- Historico de versions de um agente
-- ===========================================

CREATE OR REPLACE FUNCTION get_version_history(
  p_location_id UUID,
  p_agent_name TEXT,
  p_limit INT DEFAULT 10
) RETURNS TABLE (
  id UUID,
  version TEXT,
  status TEXT,
  is_active BOOLEAN,
  evaluation_score NUMERIC,
  created_by_source VARCHAR,
  approved_by TEXT,
  diff_summary TEXT,
  parent_version_id UUID,
  created_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    av.id,
    av.version,
    av.status,
    av.is_active,
    av.evaluation_score,
    av.created_by_source,
    av.approved_by,
    av.diff_summary,
    av.parent_version_id,
    av.created_at,
    av.activated_at,
    av.deprecated_at
  FROM agent_versions av
  WHERE av.location_id = p_location_id
    AND av.agent_name = p_agent_name
    AND av.status != 'purged'
  ORDER BY av.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 7. CLEANUP: Limpar duplicatas pending_approval
-- ===========================================

-- Manter apenas a MAIS RECENTE pending_approval por agente
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY location_id, agent_name
           ORDER BY created_at DESC
         ) as rn
  FROM agent_versions
  WHERE status = 'pending_approval'
)
UPDATE agent_versions
SET status = 'purged', deprecated_at = NOW(), updated_at = NOW()
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- ===========================================
-- 8. Adicionar colunas faltantes em improvement_logs
-- ===========================================

ALTER TABLE agent_improvement_logs
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

ALTER TABLE agent_improvement_logs
  ADD COLUMN IF NOT EXISTS approval_method VARCHAR(20)
    CHECK (approval_method IN ('auto', 'manual', 'rejected', NULL));

ALTER TABLE agent_improvement_logs
  ADD COLUMN IF NOT EXISTS new_version_id UUID REFERENCES agent_versions(id);

-- ===========================================
-- DONE
-- ===========================================
