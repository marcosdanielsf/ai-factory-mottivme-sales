# Roadmap: AI Engineer v3.0

## Overview

AI Engineer v3.0 conecta as 6 camadas existentes do AI Factory V3 em um loop fechado e autonomo. O sistema Self-Improving (Reflection Loop + Prompt Updater) ja roda em producao. Este milestone fecha os gaps entre camadas, adicionando QA automatizado, task management, CS Bot e dashboard de visibilidade.

> **Prerequisito:** Agent Skills System Fases 1-4 completas (migration 067 + 091 no Supabase). Sync v2→v1 pendente correcao de prompts_by_mode nas skills de modo.

---

## Phases

- [ ] **Phase 14: QA → Self-Improving Bridge** - Conectar AI as Judge ao Reflection Loop para que notas baixas disparem analise e melhoria automaticamente
- [ ] **Phase 15: Task Automation** - Workflows de escalate criam tasks em mottivme_tasks (Supabase) para visibilidade no dashboard AI Factory
- [ ] **Phase 16: CS Bot MVP** - Bot nos grupos WhatsApp dos clientes (OpenClaw) que responde duvidas e escala problemas como tasks
- [ ] **Phase 17: Skills-Aware Prompt Updater** - Prompt Updater edita skills isoladas via Agent Skills System em vez de reescrever SP monolitico
- [ ] **Phase 18: Self-Improving Dashboard** - Frontend no AI Factory para visualizar Reflection Logs, scores, improvement suggestions, sync status, audit trail

---

## Phase Details

### Phase 14: QA → Self-Improving Bridge

**Goal**: Quando AI as Judge detecta nota baixa (needs_attention=TRUE), o Reflection Loop e acionado imediatamente (nao espera CRON 3AM), acelerando a correcao de problemas de qualidade
**Depends on**: Nothing (workflows 11 e 12 ja existem)
**Success Criteria**:
1. AI as Judge com score < 2.5 dispara webhook para Reflection Loop em menos de 5 minutos
2. Reflection Loop processa a conversa especifica (nao espera o batch diario)
3. Se auto_update, Prompt Updater aplica correcao e notifica via WhatsApp
4. Se escalate, task criada em mottivme_tasks + WhatsApp pro Marcos

### Phase 15: Task Automation

**Goal**: Todo escalate, sugestao pendente e problema detectado gera task visivel no dashboard AI Factory, eliminando dependencia de WhatsApp como unico canal de alerta
**Depends on**: Phase 14 (para incluir tasks no bridge QA→Self-Improving)
**Success Criteria**:
1. Reflection Loop escalate cria task p1 em mottivme_tasks com agent_name, score, link para reflection_log
2. Prompt Updater suggestion pendente cria task p2 em mottivme_tasks
3. AI as Judge needs_attention cria task p2
4. Tasks aparecem no dashboard AI Factory em /#/projetos com tag "self-improving"

### Phase 16: CS Bot MVP

**Goal**: Clientes no grupo WhatsApp tem suporte automatico 24/7 — duvidas respondidas, problemas detectados e escalados como tasks para o AI Engineer resolver
**Depends on**: Phase 15 (task system funcionando)
**Success Criteria**:
1. CS Bot responde duvidas operacionais basicas no grupo WhatsApp (FAQ: como ver relatorio, como funciona agendamento, etc)
2. Quando cliente reclama de erro ("IA falou besteira", "lead sem resposta"), CS Bot classifica e cria task em mottivme_tasks
3. Task inclui: nome do cliente, descricao do problema, link para conversa no GHL (quando possivel)
4. CS Bot confirma no grupo: "Registrei o problema, estamos verificando"

### Phase 17: Skills-Aware Prompt Updater

**Goal**: Prompt Updater edita skills individuais (2KB) em vez do system_prompt monolitico (60KB), tornando updates mais precisos e com menor risco de regressao
**Depends on**: Agent Skills sync v2→v1 corrigido (incidente prompts_by_mode de 2026-03-20)
**Success Criteria**:
1. Prompt Updater identifica qual skill precisa ser editada com base nos pontos_fracos do Reflection
2. Edita apenas a skill afetada (nao o SP inteiro)
3. sync_agent_versions_from_v2() propaga a mudanca para todos os agentes que usam aquela skill
4. Rollback funciona no nivel da skill (desativar skill especifica, nao rollback do agente inteiro)

### Phase 18: Self-Improving Dashboard

**Goal**: Marcos visualiza todo o sistema Self-Improving no AI Factory — scores, historico, sugestoes, audit trail — sem precisar checar WhatsApp ou Supabase diretamente
**Depends on**: Phases 14-17 (dados existem para mostrar)
**Success Criteria**:
1. Pagina /self-improving no AI Factory mostra: ultimo score por agente, tendencia 30d, acoes tomadas
2. Pagina /agent-skills mostra CRUD de skills com agentes vinculados
3. Pagina /improvement-suggestions mostra sugestoes pendentes com botao aprovar/rejeitar
4. Pagina /agent-sync mostra status do sync v2→v1 com botao manual

---

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 14. QA → Self-Improving Bridge | Pending | — |
| 15. Task Automation | Pending | — |
| 16. CS Bot MVP | Pending | — |
| 17. Skills-Aware Prompt Updater | Pending | — |
| 18. Self-Improving Dashboard | Pending | — |

---

## Existing Infrastructure (already built)

| Component | Status | Workflow/Table |
|-----------|--------|----------------|
| Reflection Loop | RUNNING (CRON 3AM) | PPCUBxwmb83neDet |
| Prompt Updater | RUNNING | Tl8KW0FKq1TeYsMt |
| AI as Judge | RUNNING (webhook) | ffVoE2jKqOAVf4UF |
| upgrade_agent_version() | PRODUCTION | Supabase RPC |
| rollback_agent_version() | PRODUCTION | Supabase RPC |
| Agent Skills System | SCHEMA DONE | migration 067 + 091 |
| resolve_agent_v2() | PRODUCTION | Supabase function |
| sync_agent_versions_from_v2() | CREATED (not scheduled) | Supabase function |
| self_improving_settings | PRODUCTION | Supabase table |
| reflection_logs | PRODUCTION | Supabase table |
| improvement_suggestions | PRODUCTION | Supabase table |
| self_improvement_audit_log | PRODUCTION | Supabase table |
| ai_judge_evaluations | PRODUCTION | Supabase table |
| mottivme_tasks | PRODUCTION | Supabase table |

## Known Issues

- Agent Skills sync v2→v1 overwrites prompts_by_mode with incomplete skill data (incident 2026-03-20, rollback applied)
- AI as Judge does not trigger any action on low scores (needs_attention flag only)
- Workflows 03, 04, 07 use INSERT instead of upgrade_agent_version() RPC
- Duplicate Reflection Loop workflow (PPCUBxwmb83neDet vs VAXa5XhCtKzBWl75)
- 3 versions of Agent-Creator workflow (unclear which is canonical)

_Roadmap created: 2026-03-20_
_Milestone: v3.0 AI Engineer_
