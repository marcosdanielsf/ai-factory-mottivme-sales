# CLAUDE.md - Vertical Médico (MedFlow)

> Sistema de CRM para clínicas médicas baseado em GoHighLevel
> Foco: Captação, Agendamento, Comunicação e Fidelização de Pacientes

---

## ESCOPO DO PROJETO

### O que FAZEMOS:
- Captação de leads (landing pages, formulários, ads)
- Agendamento online (calendários, booking)
- Comunicação omnichannel (WhatsApp, SMS, Email)
- Automações de confirmação e lembrete
- Fidelização e reativação de pacientes
- Pesquisa de satisfação (NPS)

### O que NÃO fazemos:
- Prontuário eletrônico (regulação CFM)
- Telemedicina certificada
- Gestão financeira/faturamento
- Controle de estoque
- Prescrição digital

---

## SISTEMA DE MEMÓRIA ESTENDIDA

Este projeto usa 3 arquivos para manter contexto entre sessões:

### 1. context.md
**Propósito:** Lembrar o objetivo atual
**Quando ler:** No início de cada sessão
**Quando atualizar:** Quando o objetivo mudar

### 2. todos.md
**Propósito:** Rastrear progresso de tarefas
**Quando ler:** Após qualquer compactação de memória
**Quando atualizar:** ANTES de cada pausa ou mudança de tarefa

### 3. insights.md
**Propósito:** Armazenar descobertas e decisões
**Quando ler:** Quando precisar de contexto histórico
**Quando atualizar:** Após cada descoberta relevante

### REGRA CRÍTICA:
```
Antes de pausar ou mudar de tarefa:
1. Atualizar todos.md com progresso atual
2. Salvar insights relevantes em insights.md
3. Atualizar context.md se objetivo mudou

Ao retomar:
1. Ler context.md para lembrar objetivo
2. Ler todos.md para saber onde parou
3. Consultar insights.md se precisar de contexto
```

---

## ARQUIVOS IMPORTANTES

| Arquivo | Descrição |
|---------|-----------|
| `research/competitors.json` | Análise estruturada dos concorrentes |
| `research/gaps.md` | Oportunidades de mercado identificadas |
| `snapshots/ghl-snapshot-crm-medico.js` | Script de setup do GHL |
| `docs/PROPOSTA-CRM-MEDICO.md` | Proposta comercial completa |

---

## CONCORRENTES MAPEADOS

| Sistema | Status | Arquivo |
|---------|--------|---------|
| MEDX | Pendente análise | `research/medx-analysis.md` |
| iClinic | Pendente análise | `research/iclinic-analysis.md` |
| Doctoralia | Pendente análise | `research/doctoralia-analysis.md` |
| Shosp | Pendente análise | `research/shosp-analysis.md` |
| Feegow | Pendente análise | `research/feegow-analysis.md` |

---

## STACK TÉCNICO

- **CRM Base:** GoHighLevel (SaaS Mode)
- **Automações:** n8n + GHL Workflows
- **WhatsApp:** Business API (via GHL ou Evolution)
- **Landing Pages:** GHL Funnels
- **Dados:** Supabase (se necessário extensão)

---

## NOMENCLATURA

### Tags (prefixo:valor)
- `origem:` - Fonte do lead
- `esp:` - Especialidade médica
- `tipo:` - Tipo de paciente/consulta
- `conv:` - Convênio
- `status:` - Status do paciente
- `auto:` - Tags de automação

### Custom Fields
- Sempre em português
- Nomes descritivos sem abreviações
- Tipos corretos (DATE, PHONE, etc)

### Pipelines
- Usar emojis para visualização rápida
- Stages em ordem lógica de jornada

---

## COMANDOS ÚTEIS

```bash
# Aplicar snapshot em nova location
GHL_AGENCY_KEY="sua-key" node snapshots/ghl-snapshot-crm-medico.js <locationId>

# Estrutura da vertical
tree -L 2 ~/Projects/mottivme/growthOS/verticals/medico/
```

---

## INTEGRAÇÃO COM GROWTHUS

Esta vertical é um "módulo" do GrowthOS. Compartilha:
- Infra de n8n
- Base de conhecimento
- Padrões de automação
- Templates base

Específico desta vertical:
- Campos customizados médicos
- Workflows de confirmação/retorno
- Templates de mensagem para saúde
- Compliance com LGPD para dados sensíveis

---

## PRÓXIMAS AÇÕES (manter atualizado)

Ver arquivo `todos.md` para lista atual de tarefas.
