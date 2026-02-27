-- migration: 040_agent_versions_archive.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: Implementa sistema de arquivo para agent_versions.
--            Substitui padrao INSERT+DEPRECATE por UPDATE in-place + snapshot em tabela separada.
--            Preserva historico completo sem duplicar rows na tabela principal.

-- ============================================================
-- DEPENDENCIAS
-- ============================================================
-- Requer: public.agent_versions (48 colunas — confirmado 2026-02-27)
-- Requer: extensao uuid-ossp (uuid_generate_v4) — ja ativa no projeto

-- ============================================================
-- SCHEMA REAL agent_versions (48 colunas — fonte de verdade)
-- ============================================================
-- id, client_id, version, system_prompt, tools_config, compliance_rules,
-- personality_config, is_active, created_from_call_id, deployment_notes,
-- created_at, deployed_at, deprecated_at, call_recording_id, contact_id,
-- location_id, agent_name, business_config, qualification_config, status,
-- ghl_custom_object_id, approved_by, approved_at, activated_at,
-- validation_status, validation_result, validation_score, validated_at,
-- hyperpersonalization, updated_at, sub_account_id, test_suite_id,
-- last_test_score, last_test_at, test_report_url, framework_approved,
-- reflection_count, avg_score_overall, avg_score_dimensions, total_test_runs,
-- agent_id, prompts_by_mode, followup_scripts, parent_version_id,
-- diff_summary, evaluation_score, created_by_source, service_type

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- SECAO 1: Tabela agent_versions_archive
-- Snapshot imutavel de cada versao antes de ser sobrescrita.
-- Nunca e alterada pos-insert — e append-only por design.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_versions_archive (

    -- --------------------------------------------------------
    -- Metadados do arquivo (colunas exclusivas desta tabela)
    -- --------------------------------------------------------
    archive_id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_version_id UUID        NOT NULL,   -- FK logica para agent_versions.id
    archived_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archive_reason    TEXT        NOT NULL DEFAULT 'upgrade'
                                  CHECK (archive_reason IN ('upgrade', 'rollback', 'manual', 'cleanup')),
    archived_by       TEXT        NOT NULL DEFAULT 'system',
    archived_version  TEXT,                   -- versao no momento do arquivo (copia de "version")

    -- --------------------------------------------------------
    -- Snapshot completo das 48 colunas de agent_versions
    -- Todos os campos sao nullable aqui — o snapshot preserva
    -- o estado exato, incluindo NULLs existentes na origem.
    -- --------------------------------------------------------

    -- Identificadores
    id                    UUID,
    agent_id              UUID,
    client_id             UUID,
    sub_account_id        UUID,
    location_id           VARCHAR,
    contact_id            VARCHAR,
    ghl_custom_object_id  VARCHAR,

    -- Identidade do agente
    agent_name            VARCHAR,
    service_type          VARCHAR,
    version               TEXT,
    created_by_source     VARCHAR,

    -- Estado e ciclo de vida
    is_active             BOOLEAN,
    status                VARCHAR,
    parent_version_id     UUID,

    -- Conteudo principal
    system_prompt         TEXT,
    prompts_by_mode       JSONB,
    followup_scripts      JSONB,

    -- Configuracoes JSONB (os 7 blocos estruturais)
    tools_config          JSONB,
    personality_config    JSONB,
    business_config       JSONB,
    qualification_config  JSONB,
    compliance_rules      JSONB,
    hyperpersonalization  JSONB,
    avg_score_dimensions  JSONB,
    validation_result     JSONB,

    -- Notas e rastreabilidade
    deployment_notes      TEXT,
    diff_summary          TEXT,

    -- Metricas de qualidade
    evaluation_score      NUMERIC,
    validation_score      NUMERIC,
    validation_status     VARCHAR,
    framework_approved    BOOLEAN,
    reflection_count      INTEGER,
    avg_score_overall     NUMERIC,
    total_test_runs       INTEGER,
    last_test_score       NUMERIC,

    -- Rastreabilidade de testes
    test_suite_id         UUID,
    test_report_url       TEXT,

    -- Referencias externas
    call_recording_id     UUID,
    created_from_call_id  TEXT,

    -- Aprovacao e validacao
    approved_by           VARCHAR,
    approved_at           TIMESTAMP,
    activated_at          TIMESTAMP,
    validated_at          TIMESTAMPTZ,

    -- Timestamps do ciclo de vida
    deployed_at           TIMESTAMPTZ,
    deprecated_at         TIMESTAMPTZ,
    created_at            TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ
);

COMMENT ON TABLE public.agent_versions_archive IS
    'Snapshots imutaveis de agent_versions antes de cada upgrade ou rollback. '
    'Append-only — nunca alterar rows existentes.';

COMMENT ON COLUMN public.agent_versions_archive.archive_id IS
    'PK unica deste arquivo — diferente de id (que e o id original na agent_versions).';
COMMENT ON COLUMN public.agent_versions_archive.source_version_id IS
    'ID da row em agent_versions que originou este snapshot.';
COMMENT ON COLUMN public.agent_versions_archive.archive_reason IS
    'Motivo: upgrade (novo deploy), rollback (reversao), manual (admin), cleanup (retencao).';
COMMENT ON COLUMN public.agent_versions_archive.archived_version IS
    'Copia do campo version no momento do arquivo — permite busca sem JOIN.';

-- Indices para consultas comuns
CREATE INDEX IF NOT EXISTS idx_ava_source_version_id
    ON public.agent_versions_archive(source_version_id);

CREATE INDEX IF NOT EXISTS idx_ava_location_id
    ON public.agent_versions_archive(location_id);

CREATE INDEX IF NOT EXISTS idx_ava_agent_name
    ON public.agent_versions_archive(agent_name);

CREATE INDEX IF NOT EXISTS idx_ava_archived_at
    ON public.agent_versions_archive(archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_ava_source_archived_at
    ON public.agent_versions_archive(source_version_id, archived_at DESC);

-- RLS
ALTER TABLE public.agent_versions_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view own location archives"
    ON public.agent_versions_archive
    FOR SELECT
    TO authenticated
    USING (
        location_id IN (
            SELECT ul.location_id FROM user_locations ul
            WHERE ul.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access on archive"
    ON public.agent_versions_archive
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------
-- SECAO 2: Funcao upgrade_agent_version()
--
-- Fluxo:
--   1. Lock da row de origem (FOR UPDATE)
--   2. Valida existencia e is_active
--   3. INSERT snapshot em agent_versions_archive
--   4. UPDATE agent_versions: apenas campos presentes em p_changes
--      + campos obrigatorios de controle (version, notes, etc.)
--   5. Retorna JSONB com resultado
--
-- Uso tipico (n8n ou API):
--   SELECT upgrade_agent_version(
--     'uuid-da-row',
--     '{"system_prompt": "novo prompt", "tools_config": {...}}',
--     'v10.5.0',
--     'Ajuste no script de objeccoes',
--     'diff: system_prompt mudou 3 linhas',
--     'n8n',
--     'marcos@mottivme.com.br'
--   );
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upgrade_agent_version(
    p_version_id   UUID,
    p_changes      JSONB,
    p_new_version  TEXT,
    p_notes        TEXT    DEFAULT NULL,
    p_diff         TEXT    DEFAULT NULL,
    p_source       TEXT    DEFAULT 'manual',
    p_archived_by  TEXT    DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current         agent_versions%ROWTYPE;
    v_archive_id      UUID;
    v_old_version     TEXT;
BEGIN
    -- 1. Lock otimista: busca e trava a row
    SELECT * INTO v_current
    FROM agent_versions
    WHERE id = p_version_id
    FOR UPDATE;

    -- 2. Validacoes basicas
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Row nao encontrada',
            'version_id', p_version_id
        );
    END IF;

    IF v_current.is_active IS DISTINCT FROM true THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Row nao esta ativa (is_active = false). Use rollback_agent_version para restaurar.',
            'version_id', p_version_id,
            'current_status', v_current.status
        );
    END IF;

    v_old_version := v_current.version;
    v_archive_id  := uuid_generate_v4();

    -- 3. Snapshot do estado atual em agent_versions_archive
    INSERT INTO agent_versions_archive (
        archive_id,
        source_version_id,
        archived_at,
        archive_reason,
        archived_by,
        archived_version,
        -- snapshot das 48 colunas
        id, agent_id, client_id, sub_account_id, location_id, contact_id,
        ghl_custom_object_id, agent_name, service_type, version,
        created_by_source, is_active, status, parent_version_id,
        system_prompt, prompts_by_mode, followup_scripts,
        tools_config, personality_config, business_config,
        qualification_config, compliance_rules, hyperpersonalization,
        avg_score_dimensions, validation_result,
        deployment_notes, diff_summary,
        evaluation_score, validation_score, validation_status,
        framework_approved, reflection_count, avg_score_overall,
        total_test_runs, last_test_score, test_suite_id, test_report_url,
        call_recording_id, created_from_call_id,
        approved_by, approved_at, activated_at, validated_at,
        deployed_at, deprecated_at, created_at, updated_at
    ) VALUES (
        v_archive_id,
        p_version_id,
        NOW(),
        'upgrade',
        p_archived_by,
        v_current.version,
        -- snapshot values
        v_current.id, v_current.agent_id, v_current.client_id,
        v_current.sub_account_id, v_current.location_id, v_current.contact_id,
        v_current.ghl_custom_object_id, v_current.agent_name, v_current.service_type,
        v_current.version, v_current.created_by_source, v_current.is_active,
        v_current.status, v_current.parent_version_id,
        v_current.system_prompt, v_current.prompts_by_mode, v_current.followup_scripts,
        v_current.tools_config, v_current.personality_config, v_current.business_config,
        v_current.qualification_config, v_current.compliance_rules, v_current.hyperpersonalization,
        v_current.avg_score_dimensions, v_current.validation_result,
        v_current.deployment_notes, v_current.diff_summary,
        v_current.evaluation_score, v_current.validation_score, v_current.validation_status,
        v_current.framework_approved, v_current.reflection_count, v_current.avg_score_overall,
        v_current.total_test_runs, v_current.last_test_score, v_current.test_suite_id,
        v_current.test_report_url, v_current.call_recording_id, v_current.created_from_call_id,
        v_current.approved_by, v_current.approved_at, v_current.activated_at,
        v_current.validated_at, v_current.deployed_at, v_current.deprecated_at,
        v_current.created_at, v_current.updated_at
    );

    -- 4. UPDATE in-place: aplica apenas os campos presentes em p_changes
    --    Padrao COALESCE: se chave existe no JSONB p_changes, usa novo valor;
    --    caso contrario, mantem o valor atual da row.
    --
    --    Campos de controle (version, notes, diff, source, parent_version_id,
    --    updated_at) sao sempre atualizados com os parametros da funcao.
    UPDATE agent_versions SET
        -- Controle (sempre atualizado)
        version           = p_new_version,
        parent_version_id = p_version_id,
        created_by_source = p_source,
        updated_at        = NOW(),
        deployment_notes  = COALESCE(p_notes, deployment_notes),
        diff_summary      = COALESCE(p_diff, diff_summary),

        -- Conteudo principal (atualiza SOMENTE se presente em p_changes)
        system_prompt     = CASE
                                WHEN p_changes ? 'system_prompt'
                                THEN p_changes->>'system_prompt'
                                ELSE system_prompt
                            END,

        prompts_by_mode   = CASE
                                WHEN p_changes ? 'prompts_by_mode'
                                THEN (p_changes->'prompts_by_mode')
                                ELSE prompts_by_mode
                            END,

        tools_config      = CASE
                                WHEN p_changes ? 'tools_config'
                                THEN (p_changes->'tools_config')
                                ELSE tools_config
                            END,

        personality_config = CASE
                                WHEN p_changes ? 'personality_config'
                                THEN (p_changes->'personality_config')
                                ELSE personality_config
                            END,

        business_config   = CASE
                                WHEN p_changes ? 'business_config'
                                THEN (p_changes->'business_config')
                                ELSE business_config
                            END,

        qualification_config = CASE
                                WHEN p_changes ? 'qualification_config'
                                THEN (p_changes->'qualification_config')
                                ELSE qualification_config
                            END,

        compliance_rules  = CASE
                                WHEN p_changes ? 'compliance_rules'
                                THEN (p_changes->'compliance_rules')
                                ELSE compliance_rules
                            END,

        hyperpersonalization = CASE
                                WHEN p_changes ? 'hyperpersonalization'
                                THEN (p_changes->'hyperpersonalization')
                                ELSE hyperpersonalization
                            END,

        followup_scripts  = CASE
                                WHEN p_changes ? 'followup_scripts'
                                THEN (p_changes->'followup_scripts')
                                ELSE followup_scripts
                            END,

        -- Campos de identidade (atualizaveis via p_changes)
        service_type      = CASE
                                WHEN p_changes ? 'service_type'
                                THEN p_changes->>'service_type'
                                ELSE service_type
                            END,

        agent_name        = CASE
                                WHEN p_changes ? 'agent_name'
                                THEN p_changes->>'agent_name'
                                ELSE agent_name
                            END

    WHERE id = p_version_id;

    -- 5. Retorna resultado
    RETURN jsonb_build_object(
        'success',      true,
        'archive_id',   v_archive_id,
        'version_id',   p_version_id,
        'old_version',  v_old_version,
        'new_version',  p_new_version,
        'archived_at',  NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success',    false,
        'error',      SQLERRM,
        'sqlstate',   SQLSTATE,
        'version_id', p_version_id
    );
END;
$$;

COMMENT ON FUNCTION public.upgrade_agent_version IS
    'Arquiva o estado atual de uma row em agent_versions e aplica upgrade in-place. '
    'Apenas os campos presentes em p_changes sao sobrescritos — demais permanecem intactos. '
    'O ID da row e preservado (sem novo INSERT). Requer is_active = true.';

-- ------------------------------------------------------------
-- SECAO 3: Funcao rollback_agent_version()
--
-- Restaura o conteudo de um snapshot arquivado para a row
-- ativa em agent_versions. Antes de restaurar, arquiva o
-- estado atual (pre-rollback) com reason='rollback'.
--
-- Uso tipico:
--   SELECT rollback_agent_version(
--     'uuid-da-row-ativa',
--     'uuid-do-archive-para-restaurar',
--     'Regressao detectada em producao — voltando para v9.2.0'
--   );
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rollback_agent_version(
    p_version_id UUID,
    p_archive_id UUID,
    p_reason     TEXT DEFAULT 'manual rollback'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current     agent_versions%ROWTYPE;
    v_snapshot    agent_versions_archive%ROWTYPE;
    v_pre_archive UUID;
BEGIN
    -- 1. Busca e trava a row atual
    SELECT * INTO v_current
    FROM agent_versions
    WHERE id = p_version_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error',   'Row nao encontrada em agent_versions',
            'version_id', p_version_id
        );
    END IF;

    -- 2. Busca o snapshot a restaurar
    SELECT * INTO v_snapshot
    FROM agent_versions_archive
    WHERE archive_id = p_archive_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error',   'Snapshot nao encontrado em agent_versions_archive',
            'archive_id', p_archive_id
        );
    END IF;

    -- Valida que o snapshot pertence a mesma row
    IF v_snapshot.source_version_id <> p_version_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error',   'Snapshot nao pertence a version_id informada',
            'archive_id', p_archive_id,
            'snapshot_source_version_id', v_snapshot.source_version_id
        );
    END IF;

    -- 3. Arquiva o estado atual (pre-rollback) para possivel re-rollback
    v_pre_archive := uuid_generate_v4();

    INSERT INTO agent_versions_archive (
        archive_id,
        source_version_id,
        archived_at,
        archive_reason,
        archived_by,
        archived_version,
        id, agent_id, client_id, sub_account_id, location_id, contact_id,
        ghl_custom_object_id, agent_name, service_type, version,
        created_by_source, is_active, status, parent_version_id,
        system_prompt, prompts_by_mode, followup_scripts,
        tools_config, personality_config, business_config,
        qualification_config, compliance_rules, hyperpersonalization,
        avg_score_dimensions, validation_result,
        deployment_notes, diff_summary,
        evaluation_score, validation_score, validation_status,
        framework_approved, reflection_count, avg_score_overall,
        total_test_runs, last_test_score, test_suite_id, test_report_url,
        call_recording_id, created_from_call_id,
        approved_by, approved_at, activated_at, validated_at,
        deployed_at, deprecated_at, created_at, updated_at
    ) VALUES (
        v_pre_archive,
        p_version_id,
        NOW(),
        'rollback',
        'system',
        v_current.version,
        v_current.id, v_current.agent_id, v_current.client_id,
        v_current.sub_account_id, v_current.location_id, v_current.contact_id,
        v_current.ghl_custom_object_id, v_current.agent_name, v_current.service_type,
        v_current.version, v_current.created_by_source, v_current.is_active,
        v_current.status, v_current.parent_version_id,
        v_current.system_prompt, v_current.prompts_by_mode, v_current.followup_scripts,
        v_current.tools_config, v_current.personality_config, v_current.business_config,
        v_current.qualification_config, v_current.compliance_rules, v_current.hyperpersonalization,
        v_current.avg_score_dimensions, v_current.validation_result,
        v_current.deployment_notes, v_current.diff_summary,
        v_current.evaluation_score, v_current.validation_score, v_current.validation_status,
        v_current.framework_approved, v_current.reflection_count, v_current.avg_score_overall,
        v_current.total_test_runs, v_current.last_test_score, v_current.test_suite_id,
        v_current.test_report_url, v_current.call_recording_id, v_current.created_from_call_id,
        v_current.approved_by, v_current.approved_at, v_current.activated_at,
        v_current.validated_at, v_current.deployed_at, v_current.deprecated_at,
        v_current.created_at, v_current.updated_at
    );

    -- 4. Restaura conteudo do snapshot na row ativa
    --    Preserva: id, client_id, is_active, status, created_at, agent_id
    --    Restaura: todos os campos de conteudo e configuracao
    UPDATE agent_versions SET
        version               = v_snapshot.version,
        system_prompt         = v_snapshot.system_prompt,
        prompts_by_mode       = v_snapshot.prompts_by_mode,
        followup_scripts      = v_snapshot.followup_scripts,
        tools_config          = v_snapshot.tools_config,
        personality_config    = v_snapshot.personality_config,
        business_config       = v_snapshot.business_config,
        qualification_config  = v_snapshot.qualification_config,
        compliance_rules      = v_snapshot.compliance_rules,
        hyperpersonalization  = v_snapshot.hyperpersonalization,
        avg_score_dimensions  = v_snapshot.avg_score_dimensions,
        validation_result     = v_snapshot.validation_result,
        diff_summary          = v_snapshot.diff_summary,
        evaluation_score      = v_snapshot.evaluation_score,
        validation_score      = v_snapshot.validation_score,
        validation_status     = v_snapshot.validation_status,
        framework_approved    = v_snapshot.framework_approved,
        reflection_count      = v_snapshot.reflection_count,
        avg_score_overall     = v_snapshot.avg_score_overall,
        total_test_runs       = v_snapshot.total_test_runs,
        last_test_score       = v_snapshot.last_test_score,
        test_suite_id         = v_snapshot.test_suite_id,
        test_report_url       = v_snapshot.test_report_url,
        agent_name            = v_snapshot.agent_name,
        service_type          = v_snapshot.service_type,
        parent_version_id     = v_snapshot.parent_version_id,
        created_by_source     = 'rollback',
        -- Registra o rollback como nota
        deployment_notes      = CONCAT(
                                    '[ROLLBACK para ', v_snapshot.version, '] ',
                                    p_reason,
                                    CASE WHEN v_snapshot.deployment_notes IS NOT NULL
                                         THEN E'\n\nNotas originais: ' || v_snapshot.deployment_notes
                                         ELSE '' END
                                ),
        updated_at            = NOW()
    WHERE id = p_version_id;

    -- 5. Retorna resultado
    RETURN jsonb_build_object(
        'success',             true,
        'version_id',          p_version_id,
        'pre_rollback_archive', v_pre_archive,
        'restored_from_archive', p_archive_id,
        'restored_version',    v_snapshot.version,
        'rolled_back_from',    v_current.version,
        'rolled_back_at',      NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success',    false,
        'error',      SQLERRM,
        'sqlstate',   SQLSTATE,
        'version_id', p_version_id,
        'archive_id', p_archive_id
    );
END;
$$;

COMMENT ON FUNCTION public.rollback_agent_version IS
    'Restaura conteudo de um snapshot arquivado para a row ativa em agent_versions. '
    'Antes de restaurar, arquiva o estado pre-rollback com reason=rollback para possivel re-rollback. '
    'O ID da row permanece inalterado.';

-- ------------------------------------------------------------
-- SECAO 4: Funcao cleanup_archived_versions()
--
-- Retencao: mantém os N arquivos mais recentes por source_version_id.
-- Deleta os mais antigos. Seguro para rodar periodicamente via
-- cron no n8n ou pg_cron.
--
-- Uso:
--   -- Limpar todos os agents, manter 10 ultimas versoes
--   SELECT cleanup_archived_versions();
--
--   -- Limpar apenas location especifica, manter 5 versoes
--   SELECT cleanup_archived_versions('LOC_ID_GHL', 5);
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_archived_versions(
    p_location_id TEXT    DEFAULT NULL,
    p_keep_count  INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_dry_run_count INTEGER := 0;
BEGIN
    -- Validacao: nao permitir keep_count menor que 3 (seguranca minima)
    IF p_keep_count < 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error',   'p_keep_count deve ser >= 3 para seguranca minima'
        );
    END IF;

    -- Conta quantos seriam deletados (para retornar no resultado)
    SELECT COUNT(*) INTO v_dry_run_count
    FROM agent_versions_archive a
    WHERE (p_location_id IS NULL OR a.location_id = p_location_id)
      AND a.archive_id NOT IN (
          SELECT archive_id
          FROM (
              SELECT archive_id,
                     ROW_NUMBER() OVER (
                         PARTITION BY source_version_id
                         ORDER BY archived_at DESC
                     ) AS rn
              FROM agent_versions_archive
              WHERE (p_location_id IS NULL OR location_id = p_location_id)
          ) ranked
          WHERE rn <= p_keep_count
      );

    -- Deleta archives alem do limite de retencao
    WITH ranked AS (
        SELECT archive_id,
               ROW_NUMBER() OVER (
                   PARTITION BY source_version_id
                   ORDER BY archived_at DESC
               ) AS rn
        FROM agent_versions_archive
        WHERE (p_location_id IS NULL OR location_id = p_location_id)
    ),
    to_delete AS (
        SELECT archive_id FROM ranked WHERE rn > p_keep_count
    )
    DELETE FROM agent_versions_archive
    WHERE archive_id IN (SELECT archive_id FROM to_delete);

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success',      true,
        'deleted',      v_deleted_count,
        'keep_count',   p_keep_count,
        'location_id',  COALESCE(p_location_id, 'all'),
        'cleaned_at',   NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success',   false,
        'error',     SQLERRM,
        'sqlstate',  SQLSTATE
    );
END;
$$;

COMMENT ON FUNCTION public.cleanup_archived_versions IS
    'Aplica politica de retencao: mantem os p_keep_count snapshots mais recentes '
    'por source_version_id e deleta os mais antigos. '
    'Opcionalmente filtra por location_id. Minimo obrigatorio: 3 snapshots.';

-- ------------------------------------------------------------
-- SECAO 5: View agent_version_history
--
-- Visao unificada do historico completo de um agente:
-- - Estado atual (current) da tabela principal
-- - Todos os snapshots arquivados (archived)
--
-- Util para:
--   - Timeline de upgrades no dashboard
--   - Diff entre versoes
--   - Auditoria de mudancas
--
-- Uso:
--   SELECT * FROM agent_version_history
--   WHERE source_version_id = 'uuid-da-row'
--   ORDER BY history_sequence DESC;
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW public.agent_version_history AS

    -- Estado atual: sempre o mais recente da timeline
    SELECT
        av.id                   AS source_version_id,
        NULL::UUID              AS archive_id,
        'current'               AS history_type,
        av.version              AS version_label,
        av.updated_at           AS version_timestamp,
        NULL::TEXT              AS archive_reason,
        NULL::TEXT              AS archived_by,
        av.agent_name,
        av.location_id,
        av.client_id,
        av.service_type,
        av.is_active,
        av.status,
        av.deployment_notes,
        av.diff_summary,
        av.created_by_source,
        av.system_prompt,
        av.prompts_by_mode,
        av.tools_config,
        av.personality_config,
        av.business_config,
        av.qualification_config,
        av.compliance_rules,
        av.hyperpersonalization,
        av.followup_scripts,
        av.evaluation_score,
        av.avg_score_overall,
        av.framework_approved,
        av.created_at,
        av.updated_at
    FROM public.agent_versions av

UNION ALL

    -- Snapshots arquivados: historico imutavel
    SELECT
        ava.source_version_id,
        ava.archive_id,
        'archived'              AS history_type,
        ava.version             AS version_label,
        ava.archived_at         AS version_timestamp,
        ava.archive_reason,
        ava.archived_by,
        ava.agent_name,
        ava.location_id,
        ava.client_id,
        ava.service_type,
        ava.is_active,
        ava.status,
        ava.deployment_notes,
        ava.diff_summary,
        ava.created_by_source,
        ava.system_prompt,
        ava.prompts_by_mode,
        ava.tools_config,
        ava.personality_config,
        ava.business_config,
        ava.qualification_config,
        ava.compliance_rules,
        ava.hyperpersonalization,
        ava.followup_scripts,
        ava.evaluation_score,
        ava.avg_score_overall,
        ava.framework_approved,
        ava.created_at,
        ava.updated_at
    FROM public.agent_versions_archive ava;

COMMENT ON VIEW public.agent_version_history IS
    'Timeline unificada de versoes por agente. '
    'history_type=current: estado ativo em agent_versions. '
    'history_type=archived: snapshots em agent_versions_archive. '
    'Ordenar por version_timestamp DESC para ver a mais recente primeiro.';

-- ------------------------------------------------------------
-- SECAO 6: Migration de rows deprecated existentes
--
-- Move o historico de rows com status IN ('deprecated',
-- 'superseded', 'archived', 'rolled_back') para a nova tabela
-- agent_versions_archive.
--
-- STATUS EXISTENTES NA TABELA (2026-02-27):
--   deprecated    134 rows  <- prioridade
--   superseded     61 rows  <- tambem migramos
--   pending_approval 52 rows <- manter (aguardando review)
--   active         20 rows  <- manter
--   inactive       18 rows  <- manter
--   purged          9 rows  <- manter (estado terminal, sem conteudo util)
--   archived        5 rows  <- tambem migramos
--   draft           1 row   <- manter
--   rolled_back     1 row   <- tambem migramos
--
-- Estrategia:
--   1. INSERT INTO archive os rows nao-ativos com historico util
--   2. Atualiza status para 'migrated_to_archive' (NAO DELETE ainda)
--   3. Aguardar 14 dias antes de aplicar DELETE (instrucao no final)
-- ------------------------------------------------------------

-- Migra rows deprecated
INSERT INTO public.agent_versions_archive (
    archive_id,
    source_version_id,
    archived_at,
    archive_reason,
    archived_by,
    archived_version,
    id, agent_id, client_id, sub_account_id, location_id, contact_id,
    ghl_custom_object_id, agent_name, service_type, version,
    created_by_source, is_active, status, parent_version_id,
    system_prompt, prompts_by_mode, followup_scripts,
    tools_config, personality_config, business_config,
    qualification_config, compliance_rules, hyperpersonalization,
    avg_score_dimensions, validation_result,
    deployment_notes, diff_summary,
    evaluation_score, validation_score, validation_status,
    framework_approved, reflection_count, avg_score_overall,
    total_test_runs, last_test_score, test_suite_id, test_report_url,
    call_recording_id, created_from_call_id,
    approved_by, approved_at, activated_at, validated_at,
    deployed_at, deprecated_at, created_at, updated_at
)
SELECT
    uuid_generate_v4(),  -- archive_id
    id,                  -- source_version_id = proprio id (nao ha row ativa para referenciar)
    COALESCE(deprecated_at, updated_at, created_at, NOW()),  -- archived_at
    CASE
        WHEN status = 'rolled_back' THEN 'rollback'
        ELSE 'upgrade'
    END,                 -- archive_reason
    'migration_040',     -- archived_by
    version,             -- archived_version
    -- snapshot das 48 colunas
    id, agent_id, client_id, sub_account_id, location_id, contact_id,
    ghl_custom_object_id, agent_name, service_type, version,
    created_by_source, is_active, status, parent_version_id,
    system_prompt, prompts_by_mode, followup_scripts,
    tools_config, personality_config, business_config,
    qualification_config, compliance_rules, hyperpersonalization,
    avg_score_dimensions, validation_result,
    deployment_notes, diff_summary,
    evaluation_score, validation_score, validation_status,
    framework_approved, reflection_count, avg_score_overall,
    total_test_runs, last_test_score, test_suite_id, test_report_url,
    call_recording_id, created_from_call_id,
    approved_by, approved_at, activated_at, validated_at,
    deployed_at, deprecated_at, created_at, updated_at
FROM public.agent_versions
WHERE status IN ('deprecated', 'superseded', 'archived', 'rolled_back')
-- IMPORTANTE: esta migration NAO e idempotente — rodar apenas 1 vez.
-- Segunda execucao duplicara os snapshots (archive_id e sempre UUID novo).
;

-- Marca rows migradas na tabela original
-- IMPORTANTE: NAO deletar agora — aguardar 14 dias de validacao
-- Data prevista para DELETE: 2026-03-13
-- Comando de DELETE (rodar manualmente apos validacao):
--
--   DELETE FROM agent_versions
--   WHERE status = 'migrated_to_archive'
--     AND updated_at < NOW() - INTERVAL '14 days';
--
UPDATE public.agent_versions
SET
    status     = 'migrated_to_archive',
    updated_at = NOW()
WHERE status IN ('deprecated', 'superseded', 'archived', 'rolled_back');

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- Para reverter esta migration:
--
-- BEGIN;
--
-- -- 1. Restaurar status original das rows migradas
-- --    (requer mapeamento status_original nos archives)
-- UPDATE public.agent_versions av
-- SET
--     status     = ava.status,
--     updated_at = NOW()
-- FROM public.agent_versions_archive ava
-- WHERE ava.source_version_id = av.id
--   AND ava.archived_by = 'migration_040'
--   AND av.status = 'migrated_to_archive';
--
-- -- 2. Remover dados de archive inseridos por esta migration
-- DELETE FROM public.agent_versions_archive
-- WHERE archived_by = 'migration_040';
--
-- -- 3. Dropar view, funcoes e tabela
-- DROP VIEW IF EXISTS public.agent_version_history;
-- DROP FUNCTION IF EXISTS public.cleanup_archived_versions(TEXT, INTEGER);
-- DROP FUNCTION IF EXISTS public.rollback_agent_version(UUID, UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.upgrade_agent_version(UUID, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT);
-- DROP TABLE IF EXISTS public.agent_versions_archive;
--
-- COMMIT;

-- ============================================================
-- POS-EXECUCAO: Validacoes recomendadas
-- ============================================================
--
-- 1. Contar rows migradas para o archive:
--    SELECT archive_reason, COUNT(*) FROM agent_versions_archive GROUP BY archive_reason;
--
-- 2. Confirmar rows marcadas como migrated_to_archive:
--    SELECT status, COUNT(*) FROM agent_versions GROUP BY status ORDER BY COUNT(*) DESC;
--
-- 3. Testar upgrade_agent_version com row de staging:
--    SELECT upgrade_agent_version(
--      '<uuid-row-ativa>',
--      '{"system_prompt": "Teste de upgrade via funcao"}',
--      'v0.0.1-test',
--      'Teste de validacao da migration 040',
--      NULL, 'test', 'marcos@mottivme.com.br'
--    );
--
-- 4. Verificar view agent_version_history:
--    SELECT history_type, COUNT(*) FROM agent_version_history GROUP BY history_type;
--
-- 5. Checar RLS:
--    SELECT schemaname, tablename, policyname, cmd
--    FROM pg_policies
--    WHERE tablename = 'agent_versions_archive';
