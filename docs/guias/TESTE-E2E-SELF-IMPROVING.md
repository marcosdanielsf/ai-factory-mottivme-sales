# GUIA DE TESTE END-TO-END - SELF-IMPROVING AI SYSTEM

**Data:** 2026-01-01
**Status:** PRONTO PARA TESTE

---

## ARQUITETURA DO SISTEMA

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  11-Reflection  │────►│  12-AI-as-Judge │────►│  13-Prompt      │
│  Loop           │     │                 │     │  Updater        │
│  (Schedule 6h)  │     │  (Webhook)      │     │  (Webhook)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─────────┐              ┌─────────┐              ┌─────────┐
   │Supabase │              │Supabase │              │Supabase │
   │ - agent_versions       │ - ai_judge_evaluations │ - system_prompts
   │ - agent_conversations  │                        │ - improvement_suggestions
   │ - reflection_logs      │                        │ - self_improving_settings
   └─────────┘              └─────────┘              └─────────┘
```

---

## PRE-REQUISITOS

### 1. Verificar Credenciais no n8n

- [ ] **Postgres Marcos Daniels** - Conexão com Supabase
- [ ] **Anthropic API** - Para Claude nos workflows
- [ ] **Groq API** - Para Llama 3.3 no AI-as-Judge

### 2. Ativar Workflows no n8n

- [ ] 11-Reflection Loop → Status: **Ativo**
- [ ] 12-AI-as-Judge → Status: **Ativo**
- [ ] 13-Prompt-Updater → Status: **Ativo**

### 3. Verificar Webhooks

```
Workflow 12: /webhook/ai-as-judge-evaluate
Workflow 13: /webhook/prompt-updater
```

---

## TESTE 1: VERIFICAR DADOS NO SUPABASE

Execute estas queries no Supabase SQL Editor:

```sql
-- 1. Verificar agentes ativos
SELECT
  av.id,
  av.agent_name,
  av.is_active,
  av.status,
  c.nome as cliente
FROM agent_versions av
JOIN clients c ON av.client_id = c.id
WHERE av.is_active = TRUE;

-- 2. Verificar conversas existentes
SELECT
  ac.id,
  ac.agent_version_id,
  ac.outcome,
  ac.mensagens_total,
  ac.qa_score,
  ac.started_at
FROM agent_conversations ac
WHERE ac.started_at >= NOW() - INTERVAL '30 days'
ORDER BY ac.started_at DESC
LIMIT 10;

-- 3. Verificar mensagens
SELECT COUNT(*) as total_mensagens
FROM agent_conversation_messages;

-- 4. Verificar settings de self-improving
SELECT * FROM self_improving_settings;

-- 5. Verificar system_prompts
SELECT
  id,
  agent_version_id,
  version_number,
  is_active,
  created_at
FROM system_prompts
ORDER BY created_at DESC
LIMIT 5;
```

---

## TESTE 2: REFLECTION LOOP (Workflow 11)

### Opção A: Executar Manualmente no n8n

1. Abrir workflow **11-Reflection Loop**
2. Clicar em **Execute Workflow**
3. Observar a execução nó por nó
4. Verificar se:
   - Encontrou agentes ativos
   - Buscou conversas
   - Gerou análise de reflection
   - Salvou no banco

### Opção B: Verificar Execução Agendada

O workflow roda automaticamente a cada 6 horas. Verificar execuções recentes.

### Validação

```sql
-- Verificar reflection_logs criados
SELECT
  id,
  agent_version_id,
  overall_score,
  action_taken,
  created_at
FROM reflection_logs
ORDER BY created_at DESC
LIMIT 5;
```

---

## TESTE 3: AI-AS-JUDGE (Workflow 12)

### Testar via cURL

```bash
# Substitua YOUR_N8N_URL pela URL do seu n8n
# Substitua AGENT_UUID pelo ID real de um agente

curl -X POST "https://YOUR_N8N_URL/webhook/ai-as-judge-evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "AGENT_UUID",
    "conversations": [
      {
        "id": "conv_test_1",
        "resultado": "agendado",
        "messages": [
          {
            "is_from_lead": true,
            "message_text": "Oi, gostaria de saber mais sobre o tratamento",
            "timestamp": "2025-12-30T10:00:00Z"
          },
          {
            "is_from_lead": false,
            "message_text": "Olá! Fico feliz com seu interesse. Posso te explicar melhor. Qual horário seria bom para uma consulta?",
            "timestamp": "2025-12-30T10:01:00Z"
          },
          {
            "is_from_lead": true,
            "message_text": "Terça às 14h seria ótimo",
            "timestamp": "2025-12-30T10:02:00Z"
          },
          {
            "is_from_lead": false,
            "message_text": "Perfeito! Agendado para terça às 14h. Vou te enviar a confirmação por WhatsApp. Qualquer dúvida, estou aqui!",
            "timestamp": "2025-12-30T10:03:00Z"
          }
        ]
      }
    ],
    "evaluation_mode": "standard"
  }'
```

### Resposta Esperada

```json
{
  "success": true,
  "evaluation_id": "eval_xxx",
  "scores": {
    "completeness": 4.5,
    "depth": 4.0,
    "tone": 5.0,
    "scope": 4.5,
    "missed_opportunities": 4.0,
    "overall": 4.35,
    "percentage": 87.0
  },
  "rating": "STRONG",
  "summary": "..."
}
```

### Validação

```sql
-- Verificar avaliações criadas
SELECT
  id,
  agent_version_id,
  overall_score,
  rating,
  created_at
FROM ai_judge_evaluations
ORDER BY created_at DESC
LIMIT 5;
```

---

## TESTE 4: PROMPT UPDATER (Workflow 13)

### Testar via cURL

```bash
curl -X POST "https://YOUR_N8N_URL/webhook/prompt-updater" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "AGENT_UUID",
    "reflection_log_id": "REFLECTION_LOG_UUID",
    "action_type": "suggestion",
    "weaknesses": [
      {
        "dimensao": "clareza_conducao",
        "nota": 6.5,
        "problema": "Lead ficou confuso sobre próximos passos",
        "impacto": "ALTO",
        "exemplos": ["Lead perguntou 3x o que deveria fazer"]
      },
      {
        "dimensao": "tratamento_objecoes",
        "nota": 7.0,
        "problema": "Objeção de preço não foi bem tratada",
        "impacto": "MEDIO",
        "exemplos": ["Lead disse que achou caro e agente não contra-argumentou"]
      }
    ],
    "context": {
      "total_conversas": 15,
      "media_notas": 7.2,
      "red_flags_recorrentes": ["loop_perguntas", "resposta_generica"],
      "padroes": "Agente repete instruções sem adaptar"
    }
  }'
```

### Validação

```sql
-- Verificar sugestões criadas
SELECT
  id,
  agent_version_id,
  confidence_score,
  status,
  created_at
FROM improvement_suggestions
ORDER BY created_at DESC
LIMIT 5;

-- Verificar novas versões de prompt
SELECT
  id,
  agent_version_id,
  version_number,
  is_active,
  created_by,
  created_at
FROM system_prompts
ORDER BY created_at DESC
LIMIT 5;
```

---

## TESTE 5: FLUXO COMPLETO END-TO-END

### Cenário de Teste

1. **Inserir dados de teste** (se não existirem)
2. **Executar Reflection Loop** (manual ou aguardar schedule)
3. **Verificar se reflection detectou problemas**
4. **Se score < 4.0**: Verificar se disparou Prompt Updater
5. **Verificar se sugestão foi criada ou prompt foi atualizado**

### Script SQL para Inserir Dados de Teste

```sql
-- 1. Criar cliente de teste (se não existir)
INSERT INTO clients (id, nome, email, created_at)
VALUES (
  'test-client-001',
  'Cliente Teste E2E',
  'teste@mottivme.com',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar agent_version de teste
INSERT INTO agent_versions (
  id,
  client_id,
  agent_name,
  system_prompt,
  is_active,
  status,
  created_at
) VALUES (
  'test-agent-001',
  'test-client-001',
  'Agente Teste E2E',
  'Você é um assistente de vendas. Seu objetivo é agendar consultas. Seja educado e objetivo.',
  TRUE,
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar self_improving_settings
INSERT INTO self_improving_settings (
  agent_version_id,
  enabled,
  auto_apply_enabled,
  min_confidence_threshold,
  max_auto_updates_per_day,
  require_human_approval
) VALUES (
  'test-agent-001',
  TRUE,
  FALSE, -- não auto-aplica
  0.8,
  3,
  TRUE
) ON CONFLICT (agent_version_id) DO NOTHING;

-- 4. Criar system_prompt inicial
INSERT INTO system_prompts (
  agent_version_id,
  prompt_text,
  version_number,
  is_active,
  created_by
) VALUES (
  'test-agent-001',
  'Você é um assistente de vendas. Seu objetivo é agendar consultas. Seja educado e objetivo.',
  1,
  TRUE,
  'manual'
) ON CONFLICT DO NOTHING;

-- 5. Criar conversas de teste
INSERT INTO agent_conversations (
  id,
  agent_version_id,
  contact_id,
  channel,
  status,
  outcome,
  mensagens_total,
  qa_score,
  qa_analyzed,
  started_at
) VALUES
  ('test-conv-001', 'test-agent-001', 'contact-001', 'whatsapp', 'closed', 'scheduled', 5, 8.5, TRUE, NOW() - INTERVAL '1 day'),
  ('test-conv-002', 'test-agent-001', 'contact-002', 'whatsapp', 'closed', 'lost', 8, 5.0, TRUE, NOW() - INTERVAL '2 days'),
  ('test-conv-003', 'test-agent-001', 'contact-003', 'whatsapp', 'closed', 'scheduled', 4, 9.0, TRUE, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 6. Criar mensagens de teste
INSERT INTO agent_conversation_messages (
  conversation_id,
  message_text,
  is_from_lead,
  created_at
) VALUES
  -- Conversa 1 (boa)
  ('test-conv-001', 'Olá, gostaria de agendar uma consulta', TRUE, NOW() - INTERVAL '1 day'),
  ('test-conv-001', 'Olá! Claro, temos horários disponíveis amanhã às 10h ou 15h. Qual prefere?', FALSE, NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),
  ('test-conv-001', 'Amanhã às 15h', TRUE, NOW() - INTERVAL '1 day' + INTERVAL '2 minutes'),
  ('test-conv-001', 'Perfeito! Agendado. Enviarei a confirmação.', FALSE, NOW() - INTERVAL '1 day' + INTERVAL '3 minutes'),

  -- Conversa 2 (ruim - perdida)
  ('test-conv-002', 'Quanto custa a consulta?', TRUE, NOW() - INTERVAL '2 days'),
  ('test-conv-002', 'A consulta custa R$300', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
  ('test-conv-002', 'Muito caro, vou pensar', TRUE, NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
  ('test-conv-002', 'Ok, qualquer coisa estamos aqui', FALSE, NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),
  ('test-conv-002', 'Tchau', TRUE, NOW() - INTERVAL '2 days' + INTERVAL '4 minutes'),

  -- Conversa 3 (boa)
  ('test-conv-003', 'Quero marcar consulta', TRUE, NOW() - INTERVAL '3 days'),
  ('test-conv-003', 'Ótimo! Temos vagas quinta ou sexta. Preferência?', FALSE, NOW() - INTERVAL '3 days' + INTERVAL '1 minute'),
  ('test-conv-003', 'Quinta às 14h', TRUE, NOW() - INTERVAL '3 days' + INTERVAL '2 minutes'),
  ('test-conv-003', 'Agendado! Até quinta!', FALSE, NOW() - INTERVAL '3 days' + INTERVAL '3 minutes')
ON CONFLICT DO NOTHING;
```

---

## CRITÉRIOS DE SUCESSO

| Teste | Critério | Status |
|-------|----------|--------|
| Reflection Loop | Encontra agentes ativos | ⬜ |
| Reflection Loop | Busca conversas dos últimos 30 dias | ⬜ |
| Reflection Loop | Gera análise com 5 critérios | ⬜ |
| Reflection Loop | Salva reflection_log no banco | ⬜ |
| Reflection Loop | Dispara Prompt Updater se score < 4.0 | ⬜ |
| AI-as-Judge | Responde webhook com avaliação | ⬜ |
| AI-as-Judge | Calcula weighted score corretamente | ⬜ |
| AI-as-Judge | Salva ai_judge_evaluations no banco | ⬜ |
| Prompt Updater | Gera prompt melhorado | ⬜ |
| Prompt Updater | Salva como suggestion (se require_approval) | ⬜ |
| Prompt Updater | Auto-aplica (se configurado) | ⬜ |
| End-to-End | Fluxo completo funciona | ⬜ |

---

## TROUBLESHOOTING

### Erro: "No agents found"
- Verificar se existe `agent_versions` com `is_active = TRUE`
- Verificar JOIN com tabela `clients`

### Erro: "No conversations for reflection"
- Verificar se existem `agent_conversations` dos últimos 30 dias
- Verificar se `qa_analyzed = TRUE`

### Erro: "can_run_reflection returns FALSE"
- Verificar função `can_run_reflection()` no banco
- Verificar cooldown period nas settings

### Erro no webhook AI-as-Judge
- Verificar se workflow está ativo
- Verificar URL do webhook
- Verificar se agent_id existe no banco

### Erro no Prompt Updater
- Verificar se existe `system_prompts` ativo para o agente
- Verificar se existe `self_improving_settings`

---

## PRÓXIMOS PASSOS APÓS TESTE

1. ✅ Ativar schedule do Reflection Loop
2. ✅ Monitorar primeiras execuções
3. ✅ Ajustar thresholds conforme necessidade
4. ✅ Configurar notificações (Slack/WhatsApp)
5. ✅ Documentar métricas de melhoria
