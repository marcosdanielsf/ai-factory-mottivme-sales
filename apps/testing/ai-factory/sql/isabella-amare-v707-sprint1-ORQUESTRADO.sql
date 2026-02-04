-- =====================================================
-- UPDATE SPRINT 1 - Isabella Amare v7.0.6 → v7.0.7
-- =====================================================
-- Gerado por: Orquestração de Subagentes
-- Data: 2026-01-24
-- Método: 2 subagentes especializados + consolidação
-- Score esperado: 130 → 150 (65% → 75%)
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: ATUALIZAR SYSTEM_PROMPT (Subagente 1)
-- Adiciona: <Constraints>, <Conclusions>, <Solutions>
-- Técnica: CASE WHEN para evitar duplicação
-- =====================================================

UPDATE agent_versions
SET system_prompt = (
  -- Mantém prompt existente
  system_prompt
  ||
  -- Adiciona <Constraints> APENAS se não existe
  CASE WHEN system_prompt NOT LIKE '%<Constraints>%' THEN '

<Constraints>
## REGRAS INVIOLAVEIS

### Dados Cadastrais
- CNPJ oficial: 39.906.056/0001-45
- NUNCA invente CNPJ, endereco ou dados cadastrais
- Data atual: {{ $now }}

### Comunicacao
- NUNCA envie links sem contexto
- NUNCA prometa o que nao pode cumprir
- NUNCA fale de concorrentes
- SEMPRE mantenha tom profissional e acolhedor
- Maximo 3 mensagens sem resposta = encerrar tentativa

### Limites Operacionais
- Maximo 2 reagendamentos por lead
- Desconto maximo: 10% (apenas para fechar)
- Horario de atendimento: 08h-20h (fora disso, avisar retorno)
- Timeout de resposta: aguardar ate 24h antes de follow-up
</Constraints>'
  ELSE '' END
  ||
  -- Adiciona <Conclusions> APENAS se não existe
  CASE WHEN system_prompt NOT LIKE '%<Conclusions>%' THEN '

<Conclusions>
## FORMATO DE ENCERRAMENTO

Ao finalizar conversa, registre:

### Campos Obrigatórios
- **status**: qualified | disqualified | nurture | scheduled | no_show
- **bant_score**: B(0-25) + A(0-25) + N(0-25) + T(0-25) = 0-100
- **objecoes**: levantadas vs tratadas
- **proximo_passo**: agendar_call | enviar_material | follow_up_Xd | descartar
- **temperatura**: hot | warm | cold

### Exemplo Concreto
Lead Maria, dona de clínica, precisa em 30 dias, orçamento limitado:
```
Status: qualified
BANT: B:15 A:25 N:20 T:20 = 80/100
Objeções: preço (tratada com parcelamento)
Próximo: agendar_call
Temp: warm
Nota: Sensível a preço, oferecer parcelamento na call
```
</Conclusions>'
  ELSE '' END
  ||
  -- Adiciona <Solutions> APENAS se não existe
  CASE WHEN system_prompt NOT LIKE '%<Solutions>%' THEN '

<Solutions>
## TABELA DE ERROS E ACOES

| Cenário | Erro Comum | Ação Correta |
|---------|------------|--------------|
| Lead pergunta preço | Dar valor direto | "Depende do seu caso. Posso entender melhor?" |
| Lead diz "não tenho tempo" | Insistir | "Qual melhor horário? Temos opções de 15min." |
| Lead diz "vou pensar" | Aceitar e encerrar | "Posso enviar material? Retorno quinta?" |
| Lead sumiu 24h | Enviar 5 msgs | UMA mensagem de follow-up, aguardar +24h |
| Lead pede desconto | Dar imediato | "Antes de valores, faz sentido pra você?" |
| Não entendi pergunta | Inventar | "Pode reformular? Quero entender direito" |

### Fallbacks Obrigatórios
NUNCA diga apenas "não sei" - sempre adicione próximo passo:
- "Não tenho esse dado, mas verifico com o time em 1h"
- "Passo pro especialista. Posso agendar call rápida?"
</Solutions>'
  ELSE '' END
),
updated_at = NOW()
WHERE
  agent_name ILIKE '%isabella%amare%'
  AND version = '7.0.6'
  AND is_active = true;


-- =====================================================
-- PARTE 2: ATUALIZAR AGENT_CONFIG (Subagente 2)
-- Técnica: jsonb_set() aninhado para merge profundo
-- =====================================================

UPDATE agent_versions
SET agent_config =
  -- Camada 4: business_config (merge com existente)
  jsonb_set(
    -- Camada 3: compliance_rules.proibicoes_extras (append ao array)
    jsonb_set(
      -- Camada 2: qualification_config.bant (completo)
      jsonb_set(
        -- Camada 1: personality_config.regra_apelidos (novo)
        jsonb_set(
          agent_config,
          '{personality_config,regra_apelidos}',
          '{
            "politica": "NUNCA_USAR",
            "proibidos": ["querida", "amor", "flor", "linda", "meu bem"],
            "motivo": "High-ticket exige profissionalismo"
          }'::jsonb,
          true
        ),
        '{qualification_config,bant}',
        '{
          "budget": {
            "peso": 0.25,
            "indicadores_positivos": [
              "tem orçamento definido",
              "já investiu em tratamentos",
              "prioriza saúde",
              "não questiona valores"
            ],
            "indicadores_negativos": [
              "acha caro",
              "quer desconto",
              "compara com plano de saúde"
            ],
            "perguntas": [
              "Qual valor você reservou para investir no tratamento?",
              "Você já fez investimentos semelhantes na saúde?"
            ]
          },
          "authority": {
            "peso": 0.25,
            "indicadores_positivos": [
              "decide sozinha",
              "responsável pela família",
              "autonomia financeira"
            ],
            "indicadores_negativos": [
              "precisa consultar marido",
              "depende de terceiros"
            ],
            "perguntas": [
              "Além de você, mais alguém participa dessa decisão?"
            ]
          },
          "need": {
            "peso": 0.25,
            "indicadores_positivos": [
              "dor recorrente",
              "impacto na qualidade de vida",
              "já tentou outras soluções"
            ],
            "indicadores_negativos": [
              "curiosidade apenas",
              "pesquisando para o futuro"
            ],
            "perguntas": [
              "Há quanto tempo convive com esse problema?",
              "Como tem impactado seu dia a dia?"
            ]
          },
          "timeline": {
            "peso": 0.25,
            "indicadores_positivos": [
              "quer resolver logo",
              "tem data específica",
              "evento próximo"
            ],
            "indicadores_negativos": [
              "sem pressa",
              "talvez ano que vem"
            ],
            "perguntas": [
              "Até quando gostaria de resolver?",
              "Tem algum evento ou data importante?"
            ]
          }
        }'::jsonb,
        true
      ),
      '{compliance_rules,proibicoes_extras}',
      -- Append ao array existente ou cria novo
      COALESCE(
        agent_config->'compliance_rules'->'proibicoes_extras',
        '[]'::jsonb
      ) || '[
        "NUNCA invente CNPJ ou dados cadastrais",
        "NUNCA alucine endereços ou CEPs"
      ]'::jsonb,
      true
    ),
    '{business_config}',
    -- Merge com business_config existente
    COALESCE(agent_config->'business_config', '{}'::jsonb) || '{
      "cnpj": "39.906.056/0001-45",
      "razao_social": "Instituto Amare LTDA",
      "ceps": ["04080-917", "19015-140"]
    }'::jsonb,
    true
  ),
  -- Atualiza versão
  version = '7.0.7',
  updated_at = NOW()
WHERE
  agent_name ILIKE '%isabella%amare%'
  AND version = '7.0.6'
  AND is_active = true;


-- =====================================================
-- PARTE 3: VERIFICAÇÃO
-- =====================================================

SELECT
  agent_name,
  version,
  updated_at,
  -- Checklist de verificação
  CASE WHEN system_prompt LIKE '%39.906.056%'
       THEN '✅ CNPJ' ELSE '❌ CNPJ' END as check_cnpj,
  CASE WHEN system_prompt LIKE '%<Constraints>%'
       THEN '✅ Constraints' ELSE '❌ Constraints' END as check_constraints,
  CASE WHEN system_prompt LIKE '%<Conclusions>%'
       THEN '✅ Conclusions' ELSE '❌ Conclusions' END as check_conclusions,
  CASE WHEN system_prompt LIKE '%<Solutions>%'
       THEN '✅ Solutions' ELSE '❌ Solutions' END as check_solutions,
  CASE WHEN agent_config->'qualification_config'->'bant'->'budget' ? 'indicadores_positivos'
       THEN '✅ BANT' ELSE '❌ BANT' END as check_bant,
  CASE WHEN agent_config->'personality_config'->'regra_apelidos'->>'politica' = 'NUNCA_USAR'
       THEN '✅ Apelidos' ELSE '❌ Apelidos' END as check_apelidos
FROM agent_versions
WHERE agent_name ILIKE '%isabella%amare%'
ORDER BY version DESC
LIMIT 1;

COMMIT;

-- =====================================================
-- RESUMO SPRINT 1 ORQUESTRADO
-- =====================================================
/*
| # | Correção                | Técnica Usada              |
|---|-------------------------|----------------------------|
| 1 | CNPJ em 3 lugares       | CASE WHEN + jsonb_set      |
| 2 | <Conclusions>           | CASE NOT LIKE              |
| 3 | <Solutions>             | CASE NOT LIKE              |
| 4 | BANT indicadores        | jsonb_set aninhado         |
| 5 | Política apelidos       | jsonb_set create_if_missing|

Melhorias vs versão anterior:
- ✅ Transação BEGIN/COMMIT
- ✅ CASE WHEN evita duplicação
- ✅ jsonb_set preserva dados existentes
- ✅ COALESCE para arrays
- ✅ WHERE mais específico

Versão: 7.0.6 → 7.0.7
Score: 130 → 150 (75%)
*/
-- =====================================================
