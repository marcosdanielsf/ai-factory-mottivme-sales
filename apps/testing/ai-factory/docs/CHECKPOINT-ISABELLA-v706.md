# CHECKPOINT - Auditoria Isabella Amare v7.0.6

> **Data:** 2026-01-24
> **Status:** Aguardando correções Sprint 1
> **Score Atual:** 130/200 (65%) - REPROVADO

---

## SCORECARD COMPLETO

| Campo | Score | Max | Status |
|-------|-------|-----|--------|
| system_prompt | 17 | 25 | Falta Conclusions, Solutions, CNPJ |
| tools_config | 24 | 25 | Excelente |
| compliance_rules | 18 | 25 | Faltam regras anti-alucinacao |
| personality_config | 12 | 25 | Contradicoes graves, sem modos |
| business_config | 20 | 25 | CNPJ ausente, CEPs faltando |
| qualification_config | 8 | 25 | BANT incompleto, sem indicadores |
| prompts_by_mode | 20 | 25 | 2 modos faltando |
| hyperpersonalization | 11 | 25 | 4 campos obrigatorios ausentes |

**SCORE FINAL: 130/200 (65%)**
**VEREDICTO: REPROVADO PARA v7.1 (score < 70%)**

---

## PROBLEMAS CRITICOS (Bloqueadores)

### 1. CNPJ NAO EXISTE EM NENHUM LUGAR
- **Campos afetados:** system_prompt, business_config, compliance_rules
- **Impacto:** Agente ALUCINOU CNPJ falso em producao
- **Correcao:** Adicionar `39.906.056.0001-45` em:
  - `<Constraints>` do system_prompt
  - `business_config.cnpj`
  - `compliance_rules.proibicoes` ("NUNCA invente CNPJ")

### 2. QUALIFICATION_CONFIG QUEBRADO (8/25)
- **Problema:** BANT tem apenas pesos, sem indicadores
- **Impacto:** Agente nao sabe O QUE perguntar para qualificar
- **Correcao:** Adicionar `indicadores_positivos` e `indicadores_negativos` para cada dimensao

### 3. PERSONALITY_CONFIG COM CONTRADICOES (12/25)
- **Problema:** Regras dizem "NUNCA use querida" mas tambem "use querida max 2x"
- **Impacto:** Agente pode usar ou nao, inconsistente
- **Correcao:** Definir regra unica: para high-ticket = NUNCA apelidos

### 4. SECOES CRITICS AUSENTES
- **Faltando:** `<Conclusions>` e `<Solutions>` no system_prompt
- **Impacto:** Formato de saida indefinido, erros nao tratados
- **Correcao:** Adicionar as 2 secoes conforme framework

---

## PROBLEMAS IMPORTANTES

| # | Problema | Campo | Correcao |
|---|----------|-------|----------|
| 5 | CEPs ausentes | business_config | Adicionar 04080-917 (SP), 19015-140 (Prudente) |
| 6 | {{ $now }} ausente | system_prompt | Adicionar em Constraints |
| 7 | Modos faltando | prompts_by_mode | Criar objection_handler, social_seller |
| 8 | Metadados vazios | hyperpersonalization | Adicionar setor, agente, negocio, mudancas |
| 9 | Valores parcelados | business_config | Clarificar: 3x500 ou 3x600? |
| 10 | Regras anti-loop | compliance_rules | Adicionar "NUNCA invente dados cadastrais" |

---

## O QUE ESTA BOM

| Campo | Destaque |
|-------|----------|
| tools_config (24/25) | Limites anti-loop, incluir_link_na_resposta |
| system_prompt | Inputs workflow-aware excelentes |
| prompts_by_mode | Tom high-ticket consistente, sem apelidos |
| compliance_rules | 19 proibicoes, 9 gatilhos escalacao |

---

## PLANO DE CORRECAO

### SPRINT 1 - Critico (Bloqueadores)
- [ ] 1. Adicionar CNPJ 39.906.056.0001-45 em 3 lugares
- [ ] 2. Criar `<Conclusions>` no system_prompt
- [ ] 3. Criar `<Solutions>` no system_prompt
- [ ] 4. Adicionar indicadores BANT em qualification_config
- [ ] 5. Resolver contradicao de apelidos em personality_config

### SPRINT 2 - Importante
- [ ] 6. Adicionar CEPs em business_config
- [ ] 7. Adicionar {{ $now }} em Constraints
- [ ] 8. Criar prompts objection_handler e social_seller
- [ ] 9. Preencher metadados em hyperpersonalization
- [ ] 10. Adicionar regras anti-alucinacao em compliance_rules

### SPRINT 3 - Melhorias
- [ ] 11. Clarificar valores parcelados (3x500 vs 3x600)
- [ ] 12. Atualizar versoes nos cabecalhos (v7.0.4 -> v7.0.6)
- [ ] 13. Adicionar fases de venda em qualification_config
- [ ] 14. Criar mapeamento de objecoes comuns

---

## PROJECAO DE SCORE

| Apos correcoes | Score Esperado |
|----------------|----------------|
| Sprint 1 apenas | 150/200 (75%) |
| Sprint 1 + 2 | 170/200 (85%) |
| Completo | 185/200 (92%) |

---

## REFERENCIAS

- **SQL Base Template:** `~/Projects/mottivme/ai-factory-mottivme-sales/skills/dr-luiz-social-selling/create-dr-luiz-agent.sql`
- **Tabela:** `agent_versions`
- **Agente:** Isabella Amare v7.0.6
- **Cliente:** Instituto Amare

---

## COMO CONTINUAR

Em nova conversa, usar:
```
Leia ~/Projects/ai-factory/docs/CHECKPOINT-ISABELLA-v706.md e gere o SQL UPDATE para o Sprint 1
```

Ou:
```
Preciso corrigir Isabella v7.0.6. Problemas criticos:
1. CNPJ 39.906.056.0001-45 ausente
2. BANT sem indicadores
3. Contradicao apelidos
4. Secoes Conclusions/Solutions faltando

Gere SQL UPDATE Sprint 1.
```
