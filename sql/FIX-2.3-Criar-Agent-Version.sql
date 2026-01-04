-- =====================================================
-- QUERY CORRIGIDA - 2.3 Criar Agent Version
-- Agora faz UPSERT (INSERT ou UPDATE se já existir)
-- =====================================================

WITH cliente AS (
  INSERT INTO clients (
    ghl_contact_id,
    nome,
    telefone,
    status,
    metadata,
    updated_at
  ) VALUES (
    '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.contact_id }}',
    '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.nome_lead.replace(/'/g, "''") }}',
    '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.telefone_lead }}',
    'cliente',
    '{"origem": "ai_factory_v3"}'::jsonb,
    NOW()
  )
  ON CONFLICT (ghl_contact_id) DO UPDATE
  SET nome = EXCLUDED.nome,
      status = 'cliente',
      updated_at = NOW()
  RETURNING id
)
INSERT INTO agent_versions (
  client_id,
  call_recording_id,
  contact_id,
  location_id,
  version,
  is_active,
  agent_name,
  system_prompt,
  tools_config,
  compliance_rules,
  personality_config,
  business_config,
  hyperpersonalization,
  status,
  created_at
) VALUES (
  (SELECT id FROM cliente),
  '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.call_recording_id }}'::uuid,
  '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.contact_id }}',
  '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.location_id }}',
  'v3.0-hyperpersonalized',
  false,
  '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.agent_config.personality_config.nome_agente || 'Assistente' }}',
  '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json.system_prompt_master.replace(/'/g, "''") }}',
  '{{ $('2.1 Processar Análise + Hiperpersonalização').item.json._sql_agent_config.replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($('2.1 Processar Análise + Hiperpersonalização').item.json.agent_config.compliance_rules).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($('2.1 Processar Análise + Hiperpersonalização').item.json.agent_config.personality_config).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($('2.1 Processar Análise + Hiperpersonalização').item.json.agent_config.business_context).replace(/'/g, "''") }}'::jsonb,
  '{{ JSON.stringify($('2.1 Processar Análise + Hiperpersonalização').item.json.agent_config.hiperpersonalizacao_config).replace(/'/g, "''") }}'::jsonb,
  'pending_validation',
  NOW()
)
-- ⭐ AQUI ESTÁ A CORREÇÃO - Faz UPDATE se já existir
ON CONFLICT (client_id, version) DO UPDATE
SET
  call_recording_id = EXCLUDED.call_recording_id,
  contact_id = EXCLUDED.contact_id,
  location_id = EXCLUDED.location_id,
  is_active = false,
  agent_name = EXCLUDED.agent_name,
  system_prompt = EXCLUDED.system_prompt,
  tools_config = EXCLUDED.tools_config,
  compliance_rules = EXCLUDED.compliance_rules,
  personality_config = EXCLUDED.personality_config,
  business_config = EXCLUDED.business_config,
  hyperpersonalization = EXCLUDED.hyperpersonalization,
  status = 'pending_validation',
  created_at = NOW(),
  validation_status = NULL,
  validation_result = NULL,
  validation_score = NULL,
  validated_at = NULL
RETURNING id, agent_name, version, status;
