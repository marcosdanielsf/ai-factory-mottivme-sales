-- ═══════════════════════════════════════════════════════════════════════════════
-- TEMPLATE: AGENT VERSION v1.0
-- Use este template para criar novos agentes
-- Substitua todos os {{PLACEHOLDER}} pelos valores do cliente
-- ═══════════════════════════════════════════════════════════════════════════════

-- PASSO 1: DESATIVAR VERSÕES ANTERIORES (opcional - só se já existir agente)
UPDATE agent_versions
SET is_active = false, status = 'deprecated', updated_at = NOW()
WHERE location_id = '{{LOCATION_ID}}'
  AND is_active = true;

-- PASSO 2: INSERIR NOVA VERSÃO
INSERT INTO "public"."agent_versions" (
  "id",
  "client_id",
  "version",
  "system_prompt",
  "tools_config",
  "compliance_rules",
  "personality_config",
  "is_active",
  "created_from_call_id",
  "deployment_notes",
  "created_at",
  "deployed_at",
  "deprecated_at",
  "call_recording_id",
  "contact_id",
  "location_id",
  "agent_name",
  "business_config",
  "qualification_config",
  "status",
  "ghl_custom_object_id",
  "approved_by",
  "approved_at",
  "activated_at",
  "validation_status",
  "validation_result",
  "validation_score",
  "validated_at",
  "hyperpersonalization",
  "updated_at",
  "sub_account_id",
  "test_suite_id",
  "last_test_score",
  "last_test_at",
  "test_report_url",
  "framework_approved",
  "reflection_count",
  "avg_score_overall",
  "avg_score_dimensions",
  "total_test_runs",
  "agent_id",
  "prompts_by_mode",
  "followup_scripts"
) VALUES (
  -- ═══════════════════════════════════════════════════════════════════════════════
  -- IDENTIFICAÇÃO
  -- ═══════════════════════════════════════════════════════════════════════════════
  gen_random_uuid(),                    -- id (auto)
  null,                                 -- client_id
  '{{VERSION}}',                        -- version (ex: '1.0', '2.0')

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- SYSTEM PROMPT (o coração do agente)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{SYSTEM_PROMPT}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- TOOLS CONFIG (ferramentas disponíveis)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{TOOLS_CONFIG}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- COMPLIANCE RULES (regras e proibições)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{COMPLIANCE_RULES}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- PERSONALITY CONFIG (modos e personalidade)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{PERSONALITY_CONFIG}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- FLAGS DE CONTROLE
  -- ═══════════════════════════════════════════════════════════════════════════════
  true,                                 -- is_active
  null,                                 -- created_from_call_id
  '{{DEPLOYMENT_NOTES}}',               -- deployment_notes
  NOW(),                                -- created_at
  NOW(),                                -- deployed_at
  null,                                 -- deprecated_at
  null,                                 -- call_recording_id
  null,                                 -- contact_id
  '{{LOCATION_ID}}',                    -- location_id (GHL)
  '{{AGENT_NAME}}',                     -- agent_name

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- BUSINESS CONFIG (dados do negócio)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{BUSINESS_CONFIG}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- QUALIFICATION CONFIG (perfis de lead)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{QUALIFICATION_CONFIG}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- STATUS E VALIDAÇÃO
  -- ═══════════════════════════════════════════════════════════════════════════════
  'active',                             -- status
  null,                                 -- ghl_custom_object_id
  null,                                 -- approved_by
  null,                                 -- approved_at
  null,                                 -- activated_at
  null,                                 -- validation_status
  null,                                 -- validation_result
  null,                                 -- validation_score
  null,                                 -- validated_at

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- HYPERPERSONALIZATION (personalização por contexto)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{HYPERPERSONALIZATION}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- TIMESTAMPS E MÉTRICAS
  -- ═══════════════════════════════════════════════════════════════════════════════
  NOW(),                                -- updated_at
  null,                                 -- sub_account_id
  null,                                 -- test_suite_id
  null,                                 -- last_test_score
  null,                                 -- last_test_at
  null,                                 -- test_report_url
  false,                                -- framework_approved
  0,                                    -- reflection_count
  0.00,                                 -- avg_score_overall
  '{}',                                 -- avg_score_dimensions
  0,                                    -- total_test_runs
  null,                                 -- agent_id

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- PROMPTS BY MODE (prompts modulares)
  -- ═══════════════════════════════════════════════════════════════════════════════
  '{{PROMPTS_BY_MODE}}',

  -- ═══════════════════════════════════════════════════════════════════════════════
  -- FOLLOWUP SCRIPTS (opcional)
  -- ═══════════════════════════════════════════════════════════════════════════════
  null                                  -- followup_scripts
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  agent_name,
  version,
  location_id,
  is_active,
  status,
  jsonb_object_keys(prompts_by_mode) as modos_disponiveis
FROM agent_versions
WHERE location_id = '{{LOCATION_ID}}'
  AND is_active = true;
