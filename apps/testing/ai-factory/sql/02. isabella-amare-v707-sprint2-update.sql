-- =====================================================
-- UPDATE SPRINT 2 - Isabella Amare v7.0.7
-- =====================================================
-- Gerado por: Orquestração de Subagentes
-- Data: 2026-01-24
-- Itens: 8, 9, 10 (6 e 7 já cobertos no Sprint 1)
-- Score esperado: 150 → 170 (75% → 85%)
-- =====================================================

BEGIN;

UPDATE agent_versions
SET agent_config =
  -- Camada 3: compliance_rules.anti_alucinacao
  jsonb_set(
    -- Camada 2: hyperpersonalization
    jsonb_set(
      -- Camada 1: prompts_by_mode
      jsonb_set(
        agent_config,
        '{prompts_by_mode}',
        COALESCE(agent_config->'prompts_by_mode', '{}'::jsonb) || '{
          "objection_handler": "Você é especialista em tratamento de objeções para clínicas de estética.\n\nAo receber objeção:\n1. RECONHEÇA a preocupação com empatia\n2. REFORMULE como pergunta para entender a raiz\n3. APRESENTE prova social ou caso similar\n4. OFEREÇA alternativa que endereça a objeção\n5. CONFIRME se faz sentido antes de prosseguir\n\nObjeções comuns:\n- \"Está caro\" → Parcelamento, ROI de autoestima\n- \"Preciso pensar\" → Qual parte gera dúvida?\n- \"Vou pesquisar\" → O que gostaria de comparar?\n- \"Não tenho tempo\" → Atendimento flexível\n- \"Medo de procedimento\" → Técnicas não-invasivas\n\nTom: Consultivo, nunca defensivo.",
          "social_seller": "Você é Isabella, consultora do Instituto Amare via Instagram.\n\nREGRAS INSTAGRAM:\n- Respostas curtas (max 2-3 frases)\n- Emojis com moderação (1-2 por msg)\n- Quebre mensagens longas\n\nFLUXO:\n1. Engajamento genuíno primeiro\n2. Conversa sobre dor, não serviço\n3. Qualificar antes de oferecer\n4. Transicionar para WhatsApp\n\nPROIBIDO:\n- Preço sem qualificar\n- Linguagem formal demais\n- Pitch antes de rapport"
        }'::jsonb,
        true
      ),
      '{hyperpersonalization}',
      COALESCE(agent_config->'hyperpersonalization', '{}'::jsonb) || '{
        "setor": "saude_estetica",
        "tipo_agente": "sdr_inbound",
        "tipo_negocio": "clinica_estetica",
        "localizacao": {
          "cidade_principal": "São Paulo",
          "cidade_secundaria": "Presidente Prudente",
          "estado": "SP"
        },
        "publico_alvo": {
          "genero_predominante": "feminino",
          "faixa_etaria": "25-55",
          "classe_social": "B/A"
        },
        "mudancas_recentes": [
          "v7.0.7 - CRITICS completo",
          "BANT com indicadores",
          "Regras anti-apelidos",
          "Proibições de alucinação"
        ],
        "diferenciais_clinica": [
          "Atendimento humanizado",
          "Tecnologia de ponta",
          "Profissionais especializados"
        ]
      }'::jsonb,
      true
    ),
    '{compliance_rules,anti_alucinacao}',
    '[
      "NUNCA invente dados que não foram fornecidos",
      "NUNCA crie números de telefone, email ou documentos",
      "Se não sabe, pergunte ao lead ou escale para humano"
    ]'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE
  agent_name ILIKE '%isabella%amare%'
  AND version = '7.0.7'
  AND is_active = true;


-- =====================================================
-- VERIFICAÇÃO SPRINT 2
-- =====================================================

SELECT
  agent_name,
  version,
  -- Sprint 2 checks
  CASE WHEN agent_config->'prompts_by_mode'->'objection_handler' IS NOT NULL
       THEN '✅ objection_handler' ELSE '❌ objection_handler' END,
  CASE WHEN agent_config->'prompts_by_mode'->'social_seller' IS NOT NULL
       THEN '✅ social_seller' ELSE '❌ social_seller' END,
  CASE WHEN agent_config->'hyperpersonalization'->'setor' IS NOT NULL
       THEN '✅ hyperpersonalization' ELSE '❌ hyperpersonalization' END,
  CASE WHEN agent_config->'compliance_rules'->'anti_alucinacao' IS NOT NULL
       THEN '✅ anti_alucinacao' ELSE '❌ anti_alucinacao' END
FROM agent_versions
WHERE agent_name ILIKE '%isabella%amare%'
ORDER BY version DESC
LIMIT 1;

COMMIT;

-- =====================================================
-- RESUMO SPRINT 2
-- =====================================================
/*
| # | Item                    | Status        |
|---|-------------------------|---------------|
| 6 | CEPs                    | ✅ Sprint 1   |
| 7 | {{ $now }}              | ✅ Sprint 1   |
| 8 | prompts_by_mode         | ✅ Adicionado |
| 9 | hyperpersonalization    | ✅ Adicionado |
|10 | anti_alucinacao         | ✅ Adicionado |

Score: 150 → 170 (85%)
*/
