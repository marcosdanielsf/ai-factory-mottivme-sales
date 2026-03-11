# Skill: Supabase Schema Analyzer

## Descricao
Skill especializado para analisar e documentar o schema completo do Supabase antes de qualquer implementacao.
OBRIGATORIO executar este skill ANTES de fazer qualquer mudanca no frontend ou backend.

## Quando Usar
- Antes de criar novos componentes no frontend
- Antes de adicionar novas queries ao Supabase
- Antes de criar novas migrations
- Quando houver duvidas sobre estrutura de dados
- Para validar se o frontend esta usando as colunas corretas

## Arquivos de Referencia (SEMPRE CONSULTAR)

### Migrations SQL (Schema do Banco)
```
migrations/001_self_improving_system.sql       # Tabelas principais do Self-Improving
migrations/005_integrate_conversations_for_reflection.sql  # Conversas e mensagens
migrations/007_integrate_agentios_personas.sql # Personas multi-tenant
migrations/008_workflow_versioning_and_separation.sql # Versionamento de workflows
```

### Frontend Types (O que o frontend espera)
```
/Users/marcosdaniels/Documents/Projetos/front-factorai-mottivme-sales/types.ts
```

## Tabelas Principais do Self-Improving System

### 1. system_prompts
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| agent_version_id | UUID | FK para agent_versions |
| version | INTEGER | Numero da versao |
| parent_id | UUID | Auto-referencia para historico |
| is_active | BOOLEAN | Se e o prompt ativo |
| prompt_content | TEXT | Conteudo do prompt |
| prompt_name | VARCHAR(255) | Nome do prompt |
| prompt_description | TEXT | Descricao |
| model_config | JSONB | Config do modelo (temperature, etc) |
| performance_score | DECIMAL(3,2) | Score medio 0-5 |
| total_evaluations | INTEGER | Total de avaliacoes |
| total_conversations | INTEGER | Total conversas |
| change_reason | TEXT | auto_improvement, manual_edit, rollback, initial |
| change_summary | TEXT | Resumo das alteracoes |
| created_at | TIMESTAMPTZ | Data criacao |
| updated_at | TIMESTAMPTZ | Data atualizacao |
| activated_at | TIMESTAMPTZ | Quando foi ativado |
| deactivated_at | TIMESTAMPTZ | Quando foi desativado |

### 2. reflection_logs
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| agent_version_id | UUID | FK para agent_versions |
| system_prompt_id | UUID | FK para system_prompts |
| period_start | TIMESTAMPTZ | Inicio do periodo analisado |
| period_end | TIMESTAMPTZ | Fim do periodo analisado |
| conversations_analyzed | INTEGER | Conversas analisadas |
| messages_analyzed | INTEGER | Mensagens analisadas |
| score_completeness | DECIMAL(3,2) | Score completude (0-5) |
| score_depth | DECIMAL(3,2) | Score profundidade (0-5) |
| score_tone | DECIMAL(3,2) | Score tom (0-5) |
| score_scope | DECIMAL(3,2) | Score escopo (0-5) |
| score_missed_opportunities | DECIMAL(3,2) | Score oportunidades perdidas (0-5) |
| overall_score | DECIMAL(3,2) | Score geral (media ponderada) |
| score_breakdown | JSONB | Detalhamento dos scores |
| strengths | TEXT[] | Array de pontos fortes |
| weaknesses | TEXT[] | Array de pontos fracos |
| patterns_identified | TEXT[] | Array de padroes detectados |
| action_taken | VARCHAR(50) | none, suggestion, auto_update, escalate |
| action_reason | TEXT | Justificativa da decisao |
| suggestion_id | UUID | FK se gerou sugestao |
| cooldown_respected | BOOLEAN | Se respeitou cooldown |
| previous_reflection_id | UUID | FK para reflexao anterior |
| hours_since_last_reflection | DECIMAL(10,2) | Horas desde ultima reflexao |
| status | VARCHAR(50) | running, completed, failed, cancelled |
| error_message | TEXT | Mensagem de erro se falhou |
| execution_time_ms | INTEGER | Tempo de execucao |
| evaluator_model | VARCHAR(100) | Modelo usado na avaliacao |
| created_at | TIMESTAMPTZ | Data criacao |
| completed_at | TIMESTAMPTZ | Data conclusao |

### 3. improvement_suggestions
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| agent_version_id | UUID | FK para agent_versions |
| reflection_log_id | UUID | FK para reflection_logs |
| current_prompt_id | UUID | FK para prompt atual |
| suggestion_type | VARCHAR(50) | prompt_update, config_change, escalation |
| current_value | TEXT | Valor atual |
| suggested_value | TEXT | Valor sugerido |
| diff_summary | TEXT | Resumo das diferencas |
| rationale | TEXT | Justificativa |
| expected_improvement | TEXT | Melhoria esperada |
| risk_assessment | TEXT | Avaliacao de risco |
| confidence_score | DECIMAL(3,2) | Confianca 0-1 |
| focus_areas | TEXT[] | Areas de foco |
| status | VARCHAR(50) | pending, approved, rejected, auto_applied, rolled_back |
| reviewed_by | UUID | Quem revisou |
| reviewed_at | TIMESTAMPTZ | Quando revisou |
| review_notes | TEXT | Notas da revisao |
| applied_at | TIMESTAMPTZ | Quando aplicou |
| applied_prompt_id | UUID | Novo prompt criado |
| rolled_back_at | TIMESTAMPTZ | Quando fez rollback |
| rollback_reason | TEXT | Motivo do rollback |
| post_apply_score | DECIMAL(3,2) | Score apos aplicar |
| improvement_delta | DECIMAL(3,2) | Diferenca de score |
| created_at | TIMESTAMPTZ | Data criacao |
| updated_at | TIMESTAMPTZ | Data atualizacao |
| expires_at | TIMESTAMPTZ | Data expiracao |

### 4. self_improving_settings
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| agent_version_id | UUID | FK (unique) |
| location_id | VARCHAR(100) | Location ID GHL |
| reflection_enabled | BOOLEAN | Se reflexao esta ativa |
| reflection_interval_hours | INTEGER | Intervalo minimo (default 6) |
| min_conversations_for_reflection | INTEGER | Minimo conversas (default 10) |
| threshold_none | DECIMAL(3,2) | Score >= 4.0 = nenhuma acao |
| threshold_suggestion | DECIMAL(3,2) | 3.0-3.9 = gerar sugestao |
| threshold_auto_update | DECIMAL(3,2) | 2.0-2.9 = auto-update |
| max_updates_per_day | INTEGER | Limite diario (default 3) |
| cooldown_after_update_hours | INTEGER | Cooldown apos update (default 6) |
| require_approval_below_confidence | DECIMAL(3,2) | Requer aprovacao se < 0.8 |
| auto_apply_enabled | BOOLEAN | Se auto-apply esta ativo |
| auto_apply_min_confidence | DECIMAL(3,2) | Confianca minima para auto |
| auto_apply_max_score_drop | DECIMAL(3,2) | Max queda para rollback |
| notify_on_suggestion | BOOLEAN | Notificar sugestoes |
| notify_on_auto_update | BOOLEAN | Notificar auto-updates |
| notify_on_escalation | BOOLEAN | Notificar escalations |
| notification_emails | TEXT[] | Emails para notificar |
| notification_webhook_url | TEXT | Webhook n8n/GHL |
| evaluator_model | VARCHAR(100) | Modelo avaliador |
| metadata | JSONB | Metadata adicional |
| created_at | TIMESTAMPTZ | Data criacao |
| updated_at | TIMESTAMPTZ | Data atualizacao |

### 5. agent_conversations
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| agent_version_id | UUID | FK para agent_versions |
| contact_id | VARCHAR(255) | ID do contato (unique) |
| conversation_id | VARCHAR(255) | ID conversa GHL |
| session_id | VARCHAR(255) | Session ID n8n |
| contact_name | VARCHAR(255) | Nome do contato |
| contact_phone | VARCHAR(50) | Telefone |
| contact_email | VARCHAR(255) | Email |
| channel | VARCHAR(50) | whatsapp, instagram, etc |
| source | VARCHAR(100) | Fonte (anuncio, organico) |
| location_id | VARCHAR(100) | Location ID |
| status | VARCHAR(50) | in_progress, completed, abandoned |
| outcome | VARCHAR(50) | scheduled, lost, warmed, converted |
| mensagens_total | INTEGER | Total mensagens |
| mensagens_lead | INTEGER | Mensagens do lead |
| mensagens_agente | INTEGER | Mensagens do agente |
| tempo_resposta_medio_ms | INTEGER | Tempo medio resposta |
| duracao_total_minutos | INTEGER | Duracao total |
| qa_analyzed | BOOLEAN | Se foi analisada |
| qa_score | DECIMAL(3,2) | Score QA 0-10 |
| qa_analyzed_at | TIMESTAMPTZ | Quando foi analisada |
| qa_feedback | TEXT | Feedback QA |
| score_completeness | DECIMAL(3,2) | Score completude |
| score_depth | DECIMAL(3,2) | Score profundidade |
| score_tone | DECIMAL(3,2) | Score tom |
| score_scope | DECIMAL(3,2) | Score escopo |
| score_missed_opportunities | DECIMAL(3,2) | Score oportunidades |
| metadata | JSONB | Metadata |
| started_at | TIMESTAMPTZ | Inicio |
| ended_at | TIMESTAMPTZ | Fim |
| last_message_at | TIMESTAMPTZ | Ultima mensagem |
| created_at | TIMESTAMPTZ | Criacao |
| updated_at | TIMESTAMPTZ | Atualizacao |

### 6. agent_conversation_messages
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| conversation_id | UUID | FK para agent_conversations |
| message_text | TEXT | Conteudo da mensagem |
| message_type | VARCHAR(50) | text, image, audio, video |
| is_from_lead | BOOLEAN | Se e do lead |
| sender_name | VARCHAR(255) | Nome do remetente |
| original_message_id | VARCHAR(255) | ID original |
| original_source | VARCHAR(100) | Fonte (n8n, crm, ghl) |
| sentiment | VARCHAR(50) | positive, negative, neutral |
| intent | VARCHAR(100) | question, objection, interest |
| topics | TEXT[] | Topicos identificados |
| metadata | JSONB | Metadata |
| created_at | TIMESTAMPTZ | Criacao |
| processed_at | TIMESTAMPTZ | Quando processada |

## Views Disponiveis

### vw_self_improving_summary
Resume status do sistema por agente - use para Dashboard

### vw_score_evolution
Evolucao de scores ao longo do tempo - use para graficos de tendencia

### vw_pending_suggestions
Sugestoes pendentes - use para tela de Approvals

### vw_conversations_for_reflection
Conversas prontas para analise - use no Reflection Loop

## RPC Functions

### get_self_improving_config(agent_version_id UUID)
Retorna config completa do agente em JSONB

### can_run_reflection(agent_version_id UUID)
Verifica se pode executar reflexao (cooldown, limites)

### get_conversations_for_reflection(agent_version_id, limit, only_unanalyzed)
Retorna conversas com mensagens agregadas para analise

## Checklist de Validacao

Antes de implementar QUALQUER feature:

- [ ] Verifiquei quais tabelas serao usadas
- [ ] Confirmei que todas as colunas existem no schema
- [ ] Verifiquei os tipos de dados (DECIMAL vs INTEGER)
- [ ] Confirmei os valores permitidos em ENUMs/CHECKs
- [ ] Verifiquei se existem Views que simplificam a query
- [ ] Confirmei os indices disponiveis para performance
- [ ] Testei a query diretamente no Supabase antes

## Erros Comuns a Evitar

1. Usar `score` ao inves de `overall_score` em reflection_logs
2. Esquecer que scores sao DECIMAL(3,2) nao INTEGER
3. Nao respeitar os valores do CHECK constraint em action_taken
4. Ignorar que strengths/weaknesses sao TEXT[] (arrays)
5. Nao usar a View correta (vw_pending_suggestions para aprovacoes)
6. Esquecer que is_active so pode ter 1 prompt ativo por agent
