-- =====================================================
-- UPDATE SPRINT 3 - Isabella Amare v7.0.7
-- =====================================================
-- Data: 2026-01-24
-- Correcoes: 4 itens (11-14)
-- Tecnica: jsonb_set() aninhado para merge profundo
-- Referencia: Sprint 3 PRD
-- =====================================================

BEGIN;

-- =====================================================
-- SPRINT 3: ITEMS 11-14
-- =====================================================
-- 11. Clarificar valores parcelados em business_config.precos
-- 12. Atualizar versao nos metadados (v7.0.4/v7.0.6 -> v7.0.7)
-- 13. Adicionar fases de venda em qualification_config
-- 14. Criar mapeamento de objecoes em compliance_rules
-- =====================================================

UPDATE agent_versions
SET agent_config =
  -- Nivel 4: compliance_rules.objecoes_mapeadas (Item 14)
  jsonb_set(
    -- Nivel 3: qualification_config.fases_venda (Item 13)
    jsonb_set(
      -- Nivel 2: business_config.precos (Item 11)
      jsonb_set(
        -- Nivel 1: Atualizar metadata.version (Item 12)
        jsonb_set(
          agent_config,
          '{metadata,version}',
          '"7.0.7"'::jsonb,
          true
        ),
        '{business_config,precos}',
        '{
          "avaliacao": "gratuita",
          "consulta_retorno": "R$ 200",
          "tratamento_base": "R$ 1.500",
          "parcelamento": {
            "max_parcelas": 12,
            "parcela_minima": "R$ 150",
            "exemplo": "12x de R$ 125 sem juros"
          }
        }'::jsonb,
        true
      ),
      '{qualification_config,fases_venda}',
      '{
        "1_primeiro_contato": {
          "objetivo": "Gerar rapport e identificar dor",
          "perguntas_chave": ["O que te trouxe ate aqui?", "Ha quanto tempo pensa nisso?"]
        },
        "2_qualificacao": {
          "objetivo": "Aplicar BANT",
          "perguntas_chave": ["Quando gostaria de resolver?", "Decisao e so sua?"]
        },
        "3_apresentacao": {
          "objetivo": "Mostrar valor antes do preco",
          "perguntas_chave": ["O que seria ideal pra voce?"]
        },
        "4_fechamento": {
          "objetivo": "Agendar avaliacao",
          "perguntas_chave": ["Prefere manha ou tarde?", "Semana que vem funciona?"]
        }
      }'::jsonb,
      true
    ),
    '{compliance_rules,objecoes_mapeadas}',
    '{
      "preco_alto": {
        "variantes": ["caro", "nao tenho dinheiro", "fora do orcamento"],
        "resposta_modelo": "Entendo! Posso te mostrar opcoes que cabem no seu bolso?",
        "tecnica": "parcelamento + valor percebido"
      },
      "preciso_pensar": {
        "variantes": ["vou pensar", "depois decido", "nao sei ainda"],
        "resposta_modelo": "Claro! O que te ajudaria a decidir?",
        "tecnica": "descobrir objecao real"
      },
      "nao_tenho_tempo": {
        "variantes": ["sem tempo", "muito ocupada", "agenda cheia"],
        "resposta_modelo": "Entendo a correria! Temos horarios flexiveis. Qual periodo e menos caotico pra voce?",
        "tecnica": "flexibilidade + empatia"
      },
      "ja_tentei_antes": {
        "variantes": ["ja fiz e nao funcionou", "nao acredito mais"],
        "resposta_modelo": "Puxa, frustrante ne? Me conta o que aconteceu? Nosso metodo e diferente.",
        "tecnica": "validar + diferenciar"
      }
    }'::jsonb,
    true
  ),
  -- Atualizar updated_at
  updated_at = NOW()
WHERE version = '7.0.7'
  AND agent_name ILIKE '%isabella%amare%'
  AND is_active = true;


-- =====================================================
-- VERIFICACAO SPRINT 3
-- =====================================================

SELECT
  agent_name,
  version,
  updated_at,

  -- Item 11: Precos com parcelamento
  CASE
    WHEN agent_config->'business_config'->'precos'->'parcelamento' ? 'max_parcelas'
    THEN '11. Precos: OK'
    ELSE '11. Precos: FALTANDO'
  END as check_precos,

  -- Item 12: Versao nos metadados
  CASE
    WHEN agent_config->'metadata'->>'version' = '7.0.7'
    THEN '12. Metadata version: OK'
    ELSE '12. Metadata version: FALTANDO'
  END as check_metadata,

  -- Item 13: Fases de venda
  CASE
    WHEN agent_config->'qualification_config'->'fases_venda' ? '1_primeiro_contato'
    THEN '13. Fases venda: OK'
    ELSE '13. Fases venda: FALTANDO'
  END as check_fases,

  -- Item 14: Objecoes mapeadas
  CASE
    WHEN agent_config->'compliance_rules'->'objecoes_mapeadas' ? 'preco_alto'
    THEN '14. Objecoes: OK'
    ELSE '14. Objecoes: FALTANDO'
  END as check_objecoes,

  -- Preview dos dados inseridos
  agent_config->'business_config'->'precos'->'parcelamento' as parcelamento_preview,
  jsonb_object_keys(agent_config->'qualification_config'->'fases_venda') as fases_preview

FROM agent_versions
WHERE agent_name ILIKE '%isabella%amare%'
  AND version = '7.0.7'
ORDER BY updated_at DESC
LIMIT 1;


-- =====================================================
-- CONSULTA DE DEBUG (opcional)
-- =====================================================

-- Visualizar estrutura completa dos novos campos
/*
SELECT
  agent_config->'business_config'->'precos' as precos_completo,
  agent_config->'qualification_config'->'fases_venda' as fases_completo,
  agent_config->'compliance_rules'->'objecoes_mapeadas' as objecoes_completo,
  agent_config->'metadata' as metadata_completo
FROM agent_versions
WHERE version = '7.0.7'
  AND agent_name ILIKE '%isabella%amare%';
*/

COMMIT;

-- =====================================================
-- RESUMO SPRINT 3
-- =====================================================
/*
| # | Item                           | Tecnica Usada                    |
|---|--------------------------------|----------------------------------|
| 11| Precos com parcelamento        | jsonb_set business_config.precos |
| 12| Versao nos metadados           | jsonb_set metadata.version       |
| 13| Fases de venda                 | jsonb_set qualification_config   |
| 14| Objecoes mapeadas              | jsonb_set compliance_rules       |

Estrutura JSON final:

business_config:
  precos:
    avaliacao: "gratuita"
    consulta_retorno: "R$ 200"
    tratamento_base: "R$ 1.500"
    parcelamento:
      max_parcelas: 12
      parcela_minima: "R$ 150"
      exemplo: "12x de R$ 125 sem juros"

qualification_config:
  fases_venda:
    1_primeiro_contato: { objetivo, perguntas_chave }
    2_qualificacao: { objetivo, perguntas_chave }
    3_apresentacao: { objetivo, perguntas_chave }
    4_fechamento: { objetivo, perguntas_chave }

compliance_rules:
  objecoes_mapeadas:
    preco_alto: { variantes, resposta_modelo, tecnica }
    preciso_pensar: { variantes, resposta_modelo, tecnica }
    nao_tenho_tempo: { variantes, resposta_modelo, tecnica }
    ja_tentei_antes: { variantes, resposta_modelo, tecnica }

metadata:
  version: "7.0.7"

Versao: 7.0.7 (mantida)
Sprint: 3 de 5
*/
-- =====================================================
