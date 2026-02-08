---
---

::: v-pre

# Processo Comercial MOTTIVME - GoHighLevel

**Versao:** 1.1
**Data:** 14/01/2026
**Status:** Em implementacao
**Subconta:** Vertex (ambiente limpo)
**Location ID:** `ehlHgDeJS3sr8rCDcZtA`
**Dominio:** `app.gohighlevel.com`

---

## 1. VISAO GERAL DO FUNIL

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           FUNIL DE VENDAS MOTTIVME                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   TOPO DO FUNIL (TOFU) - ATRACAO                                                        │
│   ├── Inbound: Site, Landing Pages, Redes Sociais, SEO                                  │
│   └── Outbound: Prospeccao Instagram, Email Frio, LinkedIn                              │
│                                        │                                                 │
│                                        ▼                                                 │
│   MEIO DO FUNIL (MOFU) - QUALIFICACAO                                                   │
│   ├── Classificacao IA (Quente/Morno/Frio)                                              │
│   ├── Lead Scoring (0-100)                                                              │
│   └── Qualificacao BANT (Budget, Authority, Need, Timeline)                             │
│                                        │                                                 │
│                                        ▼                                                 │
│   FUNDO DO FUNIL (BOFU) - CONVERSAO                                                     │
│   ├── Reuniao de Diagnostico                                                            │
│   ├── Proposta Comercial                                                                │
│   ├── Negociacao                                                                        │
│   └── Fechamento                                                                        │
│                                        │                                                 │
│                                        ▼                                                 │
│   POS-VENDA                                                                             │
│   ├── Onboarding                                                                        │
│   ├── Acompanhamento                                                                    │
│   └── Upsell/Cross-sell                                                                 │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PIPELINE DE VENDAS

### 2.1 Estrutura dos Estagios

| # | Estagio | Ticket Medio | SLA | Automacao |
|---|---------|--------------|-----|-----------|
| 1 | Novo Lead - Inbound | R$ 3.000 | 1h | IA Ativa |
| 2 | Novo Lead - Outbound | R$ 3.000 | 2h | IA Ativa |
| 3 | Em Qualificacao | R$ 4.000 | 24h | IA + Humano |
| 4 | Qualificado (MQL) | R$ 5.000 | 24h | Transicao Closer |
| 5 | Reuniao Agendada | R$ 6.000 | - | Lembrete |
| 6 | Reuniao Realizada | R$ 7.000 | 24h | Follow-up |
| 7 | Proposta Enviada | R$ 8.000 | 48h | Acompanhamento |
| 8 | Negociacao | R$ 8.500 | 72h | Closer Ativo |
| 9 | Fechado Ganho | R$ 9.000 | - | Onboarding |
| 10 | Fechado Perdido | R$ 0 | - | Reaquecimento |
| 11 | Reaquecimento | R$ 3.000 | 30d | Nurturing |

### 2.2 Criterios de Transicao Entre Estagios

```yaml
# Novo Lead -> Em Qualificacao
criterios:
  - respondeu_primeira_mensagem: true
  - classificacao_ia: ["LEAD_QUENTE", "LEAD_MORNO"]

# Em Qualificacao -> Qualificado (MQL)
criterios:
  - lead_score: ">= 60"
  - budget_identificado: true
  - decisor_confirmado: true
  - necessidade_clara: true

# Qualificado -> Reuniao Agendada
criterios:
  - appointment_created: true
  - calendario_confirmado: true

# Reuniao Realizada -> Proposta Enviada
criterios:
  - reuniao_aconteceu: true
  - fit_confirmado: true
  - proposta_gerada: true

# Proposta Enviada -> Negociacao
criterios:
  - proposta_visualizada: true
  - feedback_recebido: true

# Negociacao -> Fechado Ganho
criterios:
  - contrato_assinado: true
  - pagamento_confirmado: true
```

---

## 3. CAMPOS PERSONALIZADOS

### 3.1 Campos de Qualificacao (Contact)

| Campo | Tipo | Opcoes/Formato | Descricao |
|-------|------|----------------|-----------|
| `lead_score` | Numerical | 0-100 | Score de qualificacao |
| `classificacao_ia` | Single Option | QUENTE, MORNO, FRIO | Temperatura do lead |
| `origem_lead` | Single Option | inbound_site, inbound_social, outbound_instagram, outbound_email, indicacao | Fonte de aquisicao |
| `utm_source` | Text | - | Parametro UTM |
| `utm_medium` | Text | - | Parametro UTM |
| `utm_campaign` | Text | - | Parametro UTM |
| `utm_content` | Text | - | Parametro UTM |
| `primeira_mensagem` | Large Text | - | Mensagem inicial do lead |
| `data_primeira_interacao` | Date | ISO | Quando entrou no funil |

### 3.2 Campos BANT (Contact)

| Campo | Tipo | Opcoes/Formato | Descricao |
|-------|------|----------------|-----------|
| `budget_range` | Single Option | ate_5k, 5k_15k, 15k_30k, acima_30k, nao_definido | Faixa de orcamento |
| `authority_nivel` | Single Option | decisor, influenciador, usuario, desconhecido | Poder de decisao |
| `need_principal` | Single Option | marketing_digital, automacao, ia, crm, consultoria | Necessidade principal |
| `timeline_urgencia` | Single Option | imediato, 30_dias, 60_dias, 90_dias, sem_prazo | Urgencia |
| `competitor_atual` | Text | - | Concorrente ou solucao atual |
| `pain_point` | Large Text | - | Dor principal do cliente |

### 3.3 Campos de Operacao (Contact)

| Campo | Tipo | Opcoes/Formato | Descricao |
|-------|------|----------------|-----------|
| `ativar_ia` | Single Option | sim, nao | Se agente IA responde |
| `agente_ia` | Single Option | SDR_Prospeccao, SDR_Inbound, Closer, Suporte | Perfil do agente |
| `closer_responsavel` | User | - | Closer designado |
| `data_ativacao_ia` | Date | ISO | Quando IA foi ativada |
| `ultimo_contato` | Date | ISO | Data ultima interacao |
| `motivo_perda` | Single Option | sem_budget, sem_fit, timing, concorrente, nao_respondeu, outro | Se perdido |
| `reaquecimento_data` | Date | ISO | Quando reaquecer |

### 3.4 Campos de Negocio (Opportunity)

| Campo | Tipo | Opcoes/Formato | Descricao |
|-------|------|----------------|-----------|
| `produto_interesse` | Single Option | pack_starter, pack_growth, pack_scale, custom | Produto de interesse |
| `recorrencia` | Single Option | mensal, trimestral, anual | Modelo de contrato |
| `ticket_final` | Monetary | R$ | Valor fechado |
| `desconto_aplicado` | Percentage | 0-100 | Desconto concedido |
| `data_fechamento_prevista` | Date | ISO | Previsao de fechamento |
| `probabilidade_fechamento` | Percentage | 0-100 | Probabilidade |

---

## 4. SISTEMA DE TAGS

### 4.1 Tags de Origem

| Tag | Descricao | Automacao |
|-----|-----------|-----------|
| `origem-inbound-site` | Veio pelo site | - |
| `origem-inbound-social` | Veio por redes sociais | - |
| `origem-outbound-instagram` | Prospeccao Instagram | - |
| `origem-outbound-email` | Campanha email frio | - |
| `origem-indicacao` | Indicacao de cliente | - |

### 4.2 Tags de Qualificacao

| Tag | Descricao | Automacao |
|-----|-----------|-----------|
| `lead-prospectado-ia` | Veio da prospeccao ativa | ativar_ia=sim |
| `lead-classificado-ia` | Classificado pela IA | ativar_ia=sim |
| `mql` | Marketing Qualified Lead | Transicao para Closer |
| `sql` | Sales Qualified Lead | Pipeline ativo |
| `perdido` | Lead perdido | ativar_ia=nao |

### 4.3 Tags de Temperatura

| Tag | Descricao | Lead Score |
|-----|-----------|------------|
| `temperatura-quente` | Alta probabilidade | >= 70 |
| `temperatura-morna` | Media probabilidade | 40-69 |
| `temperatura-fria` | Baixa probabilidade | < 40 |

### 4.4 Tags de Interesse (Produto)

| Tag | Descricao |
|-----|-----------|
| `interesse-marketing-digital` | Marketing e performance |
| `interesse-automacao` | Automacao de processos |
| `interesse-ia` | Inteligencia artificial |
| `interesse-crm` | CRM e vendas |
| `interesse-consultoria` | Consultoria estrategica |

### 4.5 Tags Operacionais

| Tag | Descricao | Automacao |
|-----|-----------|-----------|
| `ia-ativada` | IA respondendo | Evita duplicacao |
| `transicao-closer` | Passar para humano | Notifica closer |
| `follow-up-pendente` | Aguardando follow-up | Tarefa criada |
| `reuniao-marcada` | Tem reuniao agendada | - |
| `proposta-enviada` | Proposta foi enviada | - |
| `reaquecimento` | Em fase de reaquecimento | Nurturing |

---

## 5. LEAD SCORING

### 5.1 Matriz de Pontuacao

```
LEAD SCORE = Pontos Demograficos + Pontos Comportamentais + Pontos BANT
```

#### Pontos Demograficos (max 30)

| Criterio | Pontos |
|----------|--------|
| Cargo: CEO/Founder/Diretor | +15 |
| Cargo: Gerente/Coordenador | +10 |
| Cargo: Analista/Assistente | +5 |
| Empresa: 10+ funcionarios | +10 |
| Empresa: 2-10 funcionarios | +5 |
| Segmento: Servicos B2B | +5 |

#### Pontos Comportamentais (max 40)

| Criterio | Pontos |
|----------|--------|
| Respondeu mensagem | +10 |
| Fez pergunta sobre preco | +15 |
| Solicitou reuniao | +20 |
| Visitou site (>3 paginas) | +5 |
| Abriu email (3+ vezes) | +5 |
| Clicou em CTA | +10 |
| Assistiu conteudo | +5 |

#### Pontos BANT (max 30)

| Criterio | Pontos |
|----------|--------|
| Budget confirmado | +10 |
| E decisor | +10 |
| Necessidade clara | +5 |
| Timeline definido | +5 |

### 5.2 Faixas de Score

| Faixa | Score | Classificacao | Acao |
|-------|-------|---------------|------|
| Quente | 70-100 | SQL | Closer assume |
| Morno | 40-69 | MQL | Nurturing ativo |
| Frio | 0-39 | Lead | Nurturing passivo |

---

## 6. AUTOMACOES (WORKFLOWS GHL)

### 6.1 Automacao: Novo Lead Inbound

```yaml
nome: "Novo Lead - Inbound"
trigger:
  type: contact_created
  condition:
    - source: ["form", "chat", "api"]
    - NOT tag: "origem-outbound*"

acoes:
  - adicionar_tag: "origem-inbound-site"
  - atualizar_campo:
      origem_lead: "inbound_site"
      data_primeira_interacao: "{{ now }}"
  - criar_oportunidade:
      pipeline: "Pipeline Principal"
      stage: "Novo Lead - Inbound"
  - delay: 2 minutos
  - webhook_n8n:
      url: "https://cliente-a1.mentorfy.io/webhook/novo-lead-inbound"
      payload: "{{ contact }}"
  - atualizar_campo:
      ativar_ia: "sim"
      agente_ia: "SDR_Inbound"
  - adicionar_tag: "ia-ativada"
```

### 6.2 Automacao: Lead Respondeu (Prospeccao)

```yaml
nome: "Lead Respondeu - Prospeccao"
trigger:
  type: tag_added
  tag: "lead-prospectado-ia"

acoes:
  - atualizar_campo:
      ativar_ia: "sim"
      agente_ia: "SDR_Prospeccao"
      data_ativacao_ia: "{{ now }}"
  - adicionar_tag: "ia-ativada"
  - mover_pipeline:
      stage: "Em Qualificacao"
  - webhook_n8n:
      url: "https://cliente-a1.mentorfy.io/webhook/lead-prospeccao-ativo"
```

### 6.3 Automacao: Lead Qualificado (MQL)

```yaml
nome: "Lead Qualificado - MQL"
trigger:
  type: custom_field_updated
  field: "lead_score"
  condition: ">= 60"

acoes:
  - adicionar_tag: "mql"
  - adicionar_tag: "transicao-closer"
  - mover_pipeline:
      stage: "Qualificado (MQL)"
  - atualizar_campo:
      ativar_ia: "nao"  # Closer assume
  - notificacao_interna:
      tipo: "email"
      para: "{{ closer_responsavel }}"
      assunto: "Novo MQL: {{ contact.name }}"
      mensagem: |
        Lead qualificado pronto para abordagem!

        Nome: {{ contact.name }}
        Score: {{ contact.lead_score }}
        Interesse: {{ contact.need_principal }}
        Budget: {{ contact.budget_range }}

        Link: {{ contact.link }}
  - criar_tarefa:
      titulo: "Abordar MQL: {{ contact.name }}"
      descricao: "Lead qualificado - iniciar abordagem comercial"
      data_vencimento: "{{ now + 24h }}"
      assignee: "{{ closer_responsavel }}"
```

### 6.4 Automacao: Reuniao Agendada

```yaml
nome: "Reuniao Agendada"
trigger:
  type: appointment_created
  calendar: "*"

acoes:
  - adicionar_tag: "reuniao-marcada"
  - mover_pipeline:
      stage: "Reuniao Agendada"
  - remover_tag: "follow-up-pendente"
  - enviar_email:
      template: "confirmacao-reuniao"
  - enviar_sms:
      template: "lembrete-reuniao-sms"
  - delay: "{{ appointment_date - 24h }}"
  - enviar_whatsapp:
      template: "lembrete-reuniao-24h"
  - delay: "{{ appointment_date - 1h }}"
  - enviar_whatsapp:
      template: "lembrete-reuniao-1h"
```

### 6.5 Automacao: Follow-up Pos-Reuniao

```yaml
nome: "Follow-up Pos-Reuniao"
trigger:
  type: appointment_completed
  status: "showed"

acoes:
  - mover_pipeline:
      stage: "Reuniao Realizada"
  - remover_tag: "reuniao-marcada"
  - adicionar_tag: "follow-up-pendente"
  - criar_tarefa:
      titulo: "Enviar proposta: {{ contact.name }}"
      descricao: "Reuniao realizada - enviar proposta em ate 24h"
      data_vencimento: "{{ now + 24h }}"
      assignee: "{{ closer_responsavel }}"
  - delay: 24 horas
  - condition:
      if: "tag NOT contains 'proposta-enviada'"
      then:
        - notificacao_interna:
            tipo: "slack"
            mensagem: "ALERTA: Proposta pendente para {{ contact.name }}"
```

### 6.6 Automacao: Proposta Enviada

```yaml
nome: "Proposta Enviada"
trigger:
  type: tag_added
  tag: "proposta-enviada"

acoes:
  - mover_pipeline:
      stage: "Proposta Enviada"
  - remover_tag: "follow-up-pendente"
  - delay: 48 horas
  - condition:
      if: "pipeline_stage == 'Proposta Enviada'"
      then:
        - enviar_whatsapp:
            template: "followup-proposta-48h"
        - criar_tarefa:
            titulo: "Follow-up proposta: {{ contact.name }}"
            data_vencimento: "{{ now + 24h }}"
  - delay: 72 horas
  - condition:
      if: "pipeline_stage == 'Proposta Enviada'"
      then:
        - enviar_email:
            template: "followup-proposta-urgente"
        - adicionar_tag: "follow-up-pendente"
```

### 6.7 Automacao: Lead Perdido

```yaml
nome: "Lead Perdido"
trigger:
  type: pipeline_stage_changed
  stage: "Fechado Perdido"

acoes:
  - adicionar_tag: "perdido"
  - atualizar_campo:
      ativar_ia: "nao"
  - remover_tags:
      - "ia-ativada"
      - "mql"
      - "sql"
      - "follow-up-pendente"
  - condition:
      if: "motivo_perda IN ['timing', 'sem_budget']"
      then:
        - atualizar_campo:
            reaquecimento_data: "{{ now + 90d }}"
        - adicionar_tag: "reaquecimento"
  - webhook_n8n:
      url: "https://cliente-a1.mentorfy.io/webhook/lead-perdido"
      payload:
        contact_id: "{{ contact.id }}"
        motivo: "{{ contact.motivo_perda }}"
```

### 6.8 Automacao: Reaquecimento (Nurturing)

```yaml
nome: "Reaquecimento"
trigger:
  type: date_field
  field: "reaquecimento_data"
  when: "on_date"

acoes:
  - mover_pipeline:
      stage: "Reaquecimento"
  - enviar_email:
      template: "reaquecimento-inicial"
  - delay: 7 dias
  - enviar_email:
      template: "reaquecimento-case"
  - delay: 14 dias
  - enviar_whatsapp:
      template: "reaquecimento-oferta"
  - delay: 7 dias
  - condition:
      if: "NOT respondeu"
      then:
        - mover_pipeline:
            stage: "Fechado Perdido"
        - remover_tag: "reaquecimento"
```

---

## 7. SEQUENCIAS DE NURTURING

### 7.1 Sequencia: Lead Frio (Score < 40)

```
DIA 0: Email de boas-vindas + conteudo gratuito
DIA 3: Email com case de sucesso relevante
DIA 7: Email com artigo do blog
DIA 14: Email com convite para webinar/live
DIA 21: Email com oferta especial limitada
DIA 30: Email de "ultima chance" + desconto
```

### 7.2 Sequencia: Lead Morno (Score 40-69)

```
DIA 0: WhatsApp de apresentacao
DIA 1: Email com diagnostico gratuito
DIA 3: WhatsApp com pergunta qualificadora
DIA 5: Email com case similar ao perfil
DIA 7: WhatsApp com convite para reuniao
DIA 10: Email com urgencia + beneficios
DIA 14: Ligacao do Closer
```

### 7.3 Sequencia: Pos-Proposta

```
DIA 0: WhatsApp confirmando recebimento
DIA 2: Email com FAQ sobre proposta
DIA 4: WhatsApp com depoimento de cliente
DIA 6: Ligacao do Closer
DIA 8: Email com ajuste de proposta (se necessario)
DIA 10: WhatsApp final antes de descartar
```

---

## 8. TEMPLATES DE COMUNICACAO

### 8.1 WhatsApp - Primeiro Contato (Inbound)

```
Ola {{ first_name }}!

Aqui e a MOTTIVME. Recebi sua mensagem e fiquei muito feliz com seu interesse.

Para te ajudar da melhor forma, posso fazer uma pergunta rapida?

Qual e o maior desafio que voce enfrenta hoje no seu negocio quando o assunto e [marketing/automacao/vendas]?

Assim consigo direcionar as melhores solucoes pra voce!
```

### 8.2 WhatsApp - Primeiro Contato (Outbound)

```
Oi {{ first_name }}!

Vi seu perfil e achei muito interessante o trabalho que voce faz com [segmento].

Aqui na MOTTIVME ajudamos empresas como a sua a [beneficio principal].

Posso te mostrar como funciona? Sem compromisso!
```

### 8.3 Email - Proposta Enviada

```
Assunto: Sua proposta personalizada - MOTTIVME

Ola {{ first_name }},

Conforme conversamos, segue sua proposta personalizada.

**Resumo:**
- Solucao: {{ produto_interesse }}
- Investimento: {{ ticket_final }}/mes
- Modelo: {{ recorrencia }}

[BOTAO: Ver Proposta Completa]

Estou a disposicao para esclarecer qualquer duvida.

Abracos,
{{ closer_responsavel }}
```

### 8.4 WhatsApp - Lembrete Reuniao (24h)

```
Oi {{ first_name }}!

Passando pra lembrar da nossa reuniao amanha as {{ appointment_time }}.

Link da chamada: {{ meeting_link }}

Alguma duvida antes da nossa conversa?
```

### 8.5 WhatsApp - Follow-up Proposta (48h)

```
Oi {{ first_name }}!

Conseguiu analisar a proposta que enviei?

Fico a disposicao pra gente conversar sobre ela ou ajustar conforme sua necessidade.

O que acha?
```

---

## 9. DASHBOARDS E KPIS

### 9.1 KPIs de Aquisicao

| Metrica | Meta Mensal | Formula |
|---------|-------------|---------|
| Leads Gerados | 200 | Total novos contatos |
| Leads Inbound | 100 | Contatos com origem inbound |
| Leads Outbound | 100 | Contatos com origem outbound |
| Custo por Lead (CPL) | R$ 50 | Investimento / Leads |
| Taxa de Qualificacao | 30% | MQLs / Leads |

### 9.2 KPIs de Conversao

| Metrica | Meta Mensal | Formula |
|---------|-------------|---------|
| MQLs Gerados | 60 | Leads com score >= 60 |
| SQLs Gerados | 30 | MQLs aceitos por Closer |
| Reunioes Agendadas | 40 | Appointments criados |
| Reunioes Realizadas | 32 | Appointments com show |
| No-Show Rate | < 20% | No-shows / Agendados |
| Propostas Enviadas | 25 | Tags proposta-enviada |
| Taxa de Fechamento | 40% | Ganhos / Propostas |

### 9.3 KPIs de Receita

| Metrica | Meta Mensal | Formula |
|---------|-------------|---------|
| Novos Clientes | 10 | Fechados Ganhos |
| MRR Novo | R$ 30.000 | Soma tickets fechados |
| Ticket Medio | R$ 3.000 | MRR / Clientes |
| Tempo Medio de Fechamento | 21 dias | Media dias Novo Lead -> Ganho |
| Valor Pipeline | R$ 150.000 | Soma tickets ativos |

### 9.4 KPIs de Performance IA

| Metrica | Meta | Formula |
|---------|------|---------|
| Taxa de Resposta IA | > 95% | Respondidas / Recebidas |
| Precisao Classificacao | > 85% | Acertos / Total |
| Taxa de Transicao Closer | 20% | Transicoes / Conversas IA |
| CSAT IA | > 4.0 | Media avaliacoes |

---

## 10. INTEGRACAO COM N8N

### 10.1 Webhooks Configurados

| Evento | URL n8n | Payload |
|--------|---------|---------|
| Novo Lead Inbound | `/webhook/novo-lead-inbound` | contact completo |
| Lead Respondeu | `/webhook/ghl-mensagem-recebida` | contact + message |
| Lead Qualificado | `/webhook/lead-qualificado-mql` | contact + score |
| Reuniao Agendada | `/webhook/reuniao-agendada` | contact + appointment |
| Proposta Enviada | `/webhook/proposta-enviada` | contact + proposta |
| Lead Perdido | `/webhook/lead-perdido` | contact + motivo |

### 10.2 Workflows n8n Relacionados

| ID | Nome | Funcao |
|----|------|--------|
| R2fVs2qpct1Qr2Y1 | Classificacao Lead Instagram | Classifica e roteia leads |
| (criar) | Lead Scoring Automatico | Calcula score baseado em acoes |
| (criar) | Notificacao Closers | Alerta sobre MQLs |
| (criar) | Relatorio Diario Pipeline | Dashboard automatico |

---

## 11. CHECKLIST DE IMPLEMENTACAO

### Fase 1: Estrutura Base
- [ ] Criar pipeline com estagios
- [ ] Criar campos personalizados (Contact)
- [ ] Criar campos personalizados (Opportunity)
- [ ] Criar todas as tags

### Fase 2: Automacoes Essenciais
- [ ] Automacao: Novo Lead Inbound
- [ ] Automacao: Lead Respondeu (Prospeccao)
- [ ] Automacao: Lead Qualificado (MQL)
- [ ] Automacao: Lead Perdido

### Fase 3: Automacoes de Follow-up
- [ ] Automacao: Reuniao Agendada
- [ ] Automacao: Follow-up Pos-Reuniao
- [ ] Automacao: Proposta Enviada

### Fase 4: Nurturing
- [ ] Sequencia Lead Frio
- [ ] Sequencia Lead Morno
- [ ] Sequencia Pos-Proposta
- [ ] Sequencia Reaquecimento

### Fase 5: Templates
- [ ] Templates WhatsApp (todos)
- [ ] Templates Email (todos)
- [ ] Templates SMS (lembretes)

### Fase 6: Integracao
- [ ] Configurar webhooks no GHL
- [ ] Criar workflows n8n
- [ ] Testar fluxo completo

### Fase 7: Dashboards
- [ ] Dashboard de Aquisicao
- [ ] Dashboard de Conversao
- [ ] Dashboard de Performance IA
- [ ] Relatorio Semanal Automatico

---

## 12. PROXIMOS PASSOS

1. **Validar estrutura** com equipe comercial
2. **Priorizar** implementacao por impacto
3. **Implementar** via script automatizado
4. **Testar** cada automacao isoladamente
5. **Treinar** equipe no novo processo
6. **Monitorar** KPIs semanalmente
7. **Iterar** baseado em resultados

---

*Documento criado para MOTTIVME*
*Versao 1.0 - Janeiro 2026*

:::
