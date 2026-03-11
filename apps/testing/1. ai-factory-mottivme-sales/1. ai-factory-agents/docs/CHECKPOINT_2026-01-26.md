# CHECKPOINT - Auditoria de Agentes SDR
**Data:** 2026-01-26 03:00 (horário local)
**Responsável:** Claude + Marcos

---

## RESUMO EXECUTIVO

Sessão de auditoria e correção de 3 agentes SDR com base em feedback de conversas reais.

| Agente | Versão Anterior | Versão Atual | Score Simulação | Status |
|--------|-----------------|--------------|-----------------|--------|
| Dra. Eline Lobo | v2.1.0 | **v3.1.0** | 100/100 | ✅ Corrigido |
| Dr. Alberto Correia | v5.3 | v5.3 | 97.4/100 | ✅ OK |
| Dr. Thauan Santos | v2.0.5 | **v3.0.0** | 83.0/100 | ✅ Corrigido |

---

## AGENTES AUDITADOS

### 1. Dra. Eline Lobo - HormoSafe

| Campo | Valor |
|-------|-------|
| **Location ID** | pFHwENFUxjtiON94jn2k |
| **Versão anterior** | v2.1.0 (5,319 chars) |
| **Versão atual** | v3.1.0 (14,243 chars) |
| **Tipo** | Tipo A (gera link de pagamento) |
| **Score final** | 100/100 |

#### Problemas identificados (PDF real):
1. ❌ "Colega" usado 10+ vezes (forçado)
2. ❌ Perguntas duplas sem esperar resposta
3. ❌ Não pedia email/telefone antes de agendar
4. ❌ Dizia "agendado" sem coletar dados

#### Correções aplicadas:
- v3.0.0: Limite "colega" 1x/conversa, usar nome
- v3.0.0: Regra "esperar resposta antes de nova pergunta"
- v3.0.0: FASE 5 obrigatória de coleta de dados
- v3.1.0 (PATCH): Máximo 1 "?" por mensagem
- v3.1.0 (PATCH): Cenários 10/11 para dados parciais

#### Arquivos criados:
- `prompts/eline_lobo_v3.0.0.md`
- `prompts/eline_lobo_v3.1.0.md`
- `scripts/deploy_eline_v3.0.0.py`
- `scripts/deploy_eline_v3.1.0.py`
- `scripts/simulate_eline_v3.py`

---

### 2. Dr. Alberto Correia - Tricomind

| Campo | Valor |
|-------|-------|
| **Location ID** | GT77iGk2WDneoHwtuq6D |
| **Versão atual** | v5.3 (13,016 chars) |
| **Tipo** | Tipo B (agenda call, não gera link) |
| **Score** | 97.4/100 |

#### Métricas da simulação:
| Métrica | Resultado |
|---------|-----------|
| Agendamentos | 4/5 (80%) |
| Erros 3ª pessoa | 0x ✅ |
| Erros apresentação | 0x ✅ |
| Fechamento OU/OU | 4/5 ✅ |

#### Status: ✅ SEM ALTERAÇÕES NECESSÁRIAS
Prompt v5.3 está performando bem.

#### Arquivos criados:
- `scripts/simulate_alberto_v5.py`

---

### 3. Dr. Thauan Santos - Instituto Abadi Santos (Maya)

| Campo | Valor |
|-------|-------|
| **Location ID** | Rre0WqSlmAPmIrURgiMf |
| **Versão anterior** | v2.0.5 (8,871 chars) |
| **Versão atual** | v3.0.0 (7,830 chars) |
| **Tipo** | Tipo A (gera link de pagamento) |
| **Score** | 83.0/100 |

#### Problemas identificados (PDF real):
1. ❌ Emoji ⭐ e 🔥 (eram de outro agente - Helo)
2. ❌ Só mencionava Novo Hamburgo (faltava Santa Rosa)
3. ❌ Mensagens múltiplas sem esperar resposta
4. ❌ Repetiu informação de preço 2x

#### Correções aplicadas:
- Removidos emojis ⭐🔥 (permitidos apenas 😊💪✅)
- Adicionada Santa Rosa como 2ª unidade
- Regra "1 mensagem = esperar 1 resposta"
- Coleta de preferência de unidade antes do link
- Checklist antes de cada resposta

#### Métricas da simulação:
| Métrica | Resultado |
|---------|-----------|
| Agendamentos | 5/5 (100%) |
| Emojis proibidos | 0x ✅ |
| Mencionou ambas clínicas | 4/4 ✅ |

#### Arquivos criados:
- `prompts/thauan_santos_v3.0.0.md`
- `scripts/deploy_thauan_v3.0.0.py`
- `scripts/simulate_thauan_v3.py`

---

## TODOS OS AGENTES ATIVOS (Supabase)

| # | Agente | Versão | Location ID | Atualizado |
|---|--------|--------|-------------|------------|
| 1 | Maya - Dr. Thauan Santos | **v3.0.0** | Rre0WqSlmAPmIrURgiMf | 2026-01-26 ✨ |
| 2 | Dra. Eline Lobo - HormoSafe | **v3.1.0** | pFHwENFUxjtiON94jn2k | 2026-01-26 ✨ |
| 3 | Isabella Amare | v8.0.0 | sNwLyynZWP6jEtBy1ubf | 2026-01-26 |
| 4 | Dra. Gabriella Rossmann | v1.4.2 | I0LCuaH8lRKFMfvfxpDe | 2026-01-26 |
| 5 | Dr. Alberto Correia | v5.3 | GT77iGk2WDneoHwtuq6D | 2026-01-21 |
| 6 | Fernanda Leal | v1.0.0 | 3Ilk6A1LdnaP8POy0JWo | 2026-01-21 |
| 7 | Marcos Social Business | v2.3.0 | XNjmi1DpvqoF09y1mip9 | 2026-01-20 |
| 8 | Clara - Dra. Lívia ORL | v1.1.0 | cd1uyzpJox6XPt4Vct8Y | 2026-01-19 |
| 9 | Dra. Gabriella Rossmann - Mentoria | v1.1.0 | xliub5H5pQ4QcDeKHc6F | 2026-01-19 |
| 10 | Dra. Heloise - BPOSS | v1.1.0 | uSwkCg4V1rfpvk4tG6zP | 2026-01-19 |
| 11 | QA Agent Tester | v1.0.0 | cd1uyzpJox6XPt4Vct8Y | 2026-01-25 |
| 12 | Nina (Flávia Leal) | v1.0.0 | flavia-leal-beauty-school-test | 2026-01-25 |
| 13 | Carla (Flávia Leal) | v1.0.0 | flavia-leal-beauty-school-test | 2026-01-25 |
| 14 | Sofia (Flávia Leal) | v1.0.0 | flavia-leal-beauty-school-test | 2026-01-25 |
| 15 | Victor (Flávia Leal) | v1.0.0 | flavia-leal-beauty-school-test | 2026-01-25 |
| 16 | Diana (Flávia Leal) | v1.0.0 | flavia-leal-beauty-school-test | 2026-01-25 |

---

## PADRÕES DE PROBLEMAS IDENTIFICADOS

### Problemas comuns entre agentes:

| Problema | Eline | Thauan | Frequência |
|----------|-------|--------|------------|
| Perguntas duplas | ✅ Tinha | ✅ Tinha | Alta |
| Não coleta dados | ✅ Tinha | ✅ Tinha | Alta |
| Emojis de outro agente | ❌ | ✅ Tinha | Média |
| Múltiplas mensagens | ✅ Tinha | ✅ Tinha | Alta |
| Palavra repetida ("colega") | ✅ Tinha | ❌ | Baixa |
| Informação incompleta (clínicas) | ❌ | ✅ Tinha | Baixa |

### Regras que devem estar em TODOS os prompts:

```markdown
## REGRAS UNIVERSAIS

1. **Uma pergunta por mensagem** - Máximo 1 "?" por mensagem
2. **Esperar resposta** - NUNCA enviar múltiplas mensagens seguidas
3. **Coleta obrigatória** - SEMPRE coletar nome, email, telefone antes de gerar link
4. **Emojis moderados** - Máximo 1 emoji a cada 3-4 mensagens
5. **Não repetir palavras** - Variar expressões (não usar "colega" 10x)
6. **Informação completa** - Mencionar TODAS as opções (locais, formatos)
```

---

## PRÓXIMOS PASSOS SUGERIDOS

### Prioridade Alta (auditar com PDF real):
- [ ] Dra. Gabriella Rossmann (v1.4.2)
- [ ] Dra. Heloise - BPOSS (v1.1.0)
- [ ] Clara - Dra. Lívia ORL (v1.1.0)

### Prioridade Média (versões antigas):
- [ ] Fernanda Leal (v1.0.0)
- [ ] Marcos Social Business (v2.3.0)

### Testes/Simulação:
- [ ] Flávia Leal Beauty School (Nina, Carla, Sofia, Victor, Diana)

---

## MÉTRICAS DE SUCESSO

| Agente | Antes | Depois | Melhoria |
|--------|-------|--------|----------|
| Eline | Perguntas duplas frequentes | 0 perguntas duplas | +100% |
| Eline | Não coletava dados | 5/5 coleta | +100% |
| Thauan | Emojis errados | 0 emojis proibidos | +100% |
| Thauan | Só 1 clínica | 2 clínicas + online | +100% |

---

## ARQUIVOS DA SESSÃO

```
prompts/
├── eline_lobo_v3.0.0.md
├── eline_lobo_v3.1.0.md
└── thauan_santos_v3.0.0.md

scripts/
├── deploy_eline_v3.0.0.py
├── deploy_eline_v3.1.0.py
├── deploy_thauan_v3.0.0.py
├── simulate_eline_v3.py
├── simulate_alberto_v5.py
└── simulate_thauan_v3.py

Simulações (JSON):
├── simulation_eline_*.json
├── simulation_alberto_*.json
└── simulation_thauan_*.json
```

---

*Checkpoint gerado em 2026-01-26 03:00*
*Próxima auditoria sugerida: Dra. Gabriella Rossmann*
