-- =============================================================================
-- MIGRATION: 009_add_followup_scripts_column.sql
-- Descrição: Adiciona coluna followup_scripts na tabela agent_versions
-- Data: 2026-01-09
-- =============================================================================

-- Adicionar coluna para scripts de follow-up (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_versions' AND column_name = 'followup_scripts'
    ) THEN
        ALTER TABLE agent_versions ADD COLUMN followup_scripts JSONB;
        COMMENT ON COLUMN agent_versions.followup_scripts IS 'Scripts de follow-up para áudios/vídeos (ativacao, qualificacao, recuperacao)';
    END IF;
END $$;

-- Estrutura esperada do JSONB:
-- {
--   "ativacao": {
--     "script_type": "audio_followup",
--     "duration_seconds": 22,
--     "script": { "hook": "...", "body": [...], "cta": "..." },
--     "full_script": "...",
--     "emotional_triggers": [...],
--     "delivery_notes": {...},
--     "variations": [...]
--   },
--   "qualificacao": { ... },
--   "recuperacao": { ... }
-- }
