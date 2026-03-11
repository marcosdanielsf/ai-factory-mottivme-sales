# Guia de Integração Direta - Self-Improving AI

## Objetivo
Modificar o fluxo principal (`GHL - Mottivme - EUA Versionado.json`) para inserir diretamente nas tabelas do Self-Improving AI, eliminando a necessidade de VIEWs e triggers.

---

## Passo 1: Adicionar Nó de Upsert da Conversa

### Quando executar
Logo após o nó **"Info"** ser processado (início do fluxo)

### Nó: Postgres - Upsert Conversation
```sql
-- Criar ou atualizar conversa para o Self-Improving AI
WITH agent AS (
  SELECT id
  FROM agent_versions
  WHERE location_id = '{{ $('Info').first().json.location_id }}'
    AND is_active = true
  LIMIT 1
)
INSERT INTO agent_conversations (
  agent_version_id,
  contact_id,
  conversation_id,
  session_id,
  contact_name,
  channel,
  source,
  location_id,
  status,
  mensagens_total,
  started_at,
  last_message_at
)
SELECT
  agent.id,
  '{{ $('Info').first().json.lead_id }}',
  '{{ $('Info').first().json.lead_id }}',
  '{{ $('Info').first().json.lead_id }}',
  '{{ $('Info').first().json.full_name }}',
  '{{ $('Info').first().json.source }}',
  '{{ $('Info').first().json.utm_content || 'organic' }}',
  '{{ $('Info').first().json.location_id }}',
  'in_progress',
  1,
  NOW(),
  NOW()
FROM agent
ON CONFLICT (contact_id) DO UPDATE SET
  mensagens_total = agent_conversations.mensagens_total + 1,
  last_message_at = NOW(),
  updated_at = NOW();
```

---

## Passo 2: Adicionar Nó de Insert Mensagem do Lead

### Quando executar
Após o nó **"historico_mensagens_leads"** (em paralelo)

### Nó: Postgres - Insert Lead Message
```sql
-- Inserir mensagem do LEAD na tabela do Self-Improving AI
INSERT INTO agent_conversation_messages (
  conversation_id,
  message_text,
  message_type,
  is_from_lead,
  sender_name,
  original_source,
  created_at
)
SELECT
  ac.id,
  '{{ $json.mensagem }}',
  '{{ $('Info').first().json.tipo_mensagem_original }}',
  true,
  '{{ $('Info').first().json.full_name }}',
  'crm_historico',
  NOW()
FROM agent_conversations ac
WHERE ac.contact_id = '{{ $('Info').first().json.lead_id }}'
LIMIT 1
ON CONFLICT DO NOTHING;
```

---

## Passo 3: Adicionar Nó de Insert Mensagem da IA

### Quando executar
Após o nó **"Memoria IA"** que salva a resposta do agente (em paralelo)

### Nó: Postgres - Insert AI Message
```sql
-- Inserir resposta da IA na tabela do Self-Improving AI
INSERT INTO agent_conversation_messages (
  conversation_id,
  message_text,
  message_type,
  is_from_lead,
  sender_name,
  original_source,
  created_at
)
SELECT
  ac.id,
  '{{ $('Parser  Chain').first().json.output.messages.join("") }}',
  'text',
  false,
  'AI Agent',
  'n8n_historico',
  NOW()
FROM agent_conversations ac
WHERE ac.contact_id = '{{ $('Info').first().json.lead_id }}'
LIMIT 1
ON CONFLICT DO NOTHING;
```

---

## Passo 4: Atualizar Outcome (Opcional - Quando Muda Etapa do Funil)

### Quando executar
Quando a etapa do funil muda (após atualização de campo no GHL)

### Nó: Postgres - Update Outcome
```sql
-- Atualizar outcome baseado na etapa do funil
UPDATE agent_conversations
SET
  outcome = CASE
    WHEN '{{ $json.etapa_funil }}' IN ('Agendamento Marcado', 'Reagendado') THEN 'scheduled'
    WHEN '{{ $json.etapa_funil }}' IN ('Perdido', 'No-Show') THEN 'lost'
    WHEN '{{ $json.etapa_funil }}' IN ('Cliente Ativo', 'Reunião Realizada', 'Proposta Enviada') THEN 'converted'
    WHEN '{{ $json.etapa_funil }}' IN ('Qualificado', 'Em Follow-Up') THEN 'warmed'
    ELSE 'in_progress'
  END,
  status = CASE
    WHEN '{{ $json.etapa_funil }}' IN ('Cliente Ativo', 'Perdido') THEN 'completed'
    ELSE 'in_progress'
  END,
  ended_at = CASE
    WHEN '{{ $json.etapa_funil }}' IN ('Cliente Ativo', 'Perdido') THEN NOW()
    ELSE ended_at
  END,
  updated_at = NOW()
WHERE contact_id = '{{ $('Info').first().json.lead_id }}';
```

---

## Diagrama de Fluxo

```
[Mensagem recebida]
       |
       v
    [Info]
       |
       +---> [Upsert Conversation] (NOVO - paralelo)
       |
       v
[historico_mensagens_leads]
       |
       +---> [Insert Lead Message] (NOVO - paralelo)
       |
       v
    [IA processa...]
       |
       v
  [Parser Chain]
       |
       v
   [Memoria IA]
       |
       +---> [Insert AI Message] (NOVO - paralelo)
       |
       v
   [Enviar mensagem]
```

---

## Mapeamento de Campos

| Tabela Original | Campo | Tabela Destino | Campo |
|-----------------|-------|----------------|-------|
| crm_historico_mensagens | lead_id | agent_conversations | contact_id |
| crm_historico_mensagens | mensagem | agent_conversation_messages | message_text |
| crm_historico_mensagens | source | agent_conversations | channel |
| crm_historico_mensagens | full_name | agent_conversations | contact_name |
| n8n_historico_mensagens | session_id | agent_conversations | session_id |
| n8n_historico_mensagens | message.content | agent_conversation_messages | message_text |

---

## Vantagens desta Abordagem

1. **Performance**: Insert direto é mais rápido que triggers
2. **Controle**: Você decide exatamente quando e o que inserir
3. **Debugging**: Mais fácil identificar problemas
4. **Sem dependências**: Não precisa de VIEWs nem triggers
5. **Dados limpos**: Estrutura otimizada para o Reflection Loop

---

## Verificação Pós-Implementação

```sql
-- Verificar se conversas estão sendo criadas
SELECT
  ac.contact_id,
  ac.contact_name,
  ac.mensagens_total,
  ac.status,
  ac.outcome,
  COUNT(acm.id) as mensagens_reais
FROM agent_conversations ac
LEFT JOIN agent_conversation_messages acm ON acm.conversation_id = ac.id
WHERE ac.created_at > NOW() - INTERVAL '1 day'
GROUP BY ac.id
ORDER BY ac.created_at DESC
LIMIT 10;

-- Verificar mensagens de uma conversa
SELECT
  acm.message_text,
  acm.is_from_lead,
  acm.message_type,
  acm.created_at
FROM agent_conversation_messages acm
JOIN agent_conversations ac ON ac.id = acm.conversation_id
WHERE ac.contact_id = 'SEU_LEAD_ID_AQUI'
ORDER BY acm.created_at;
```

---

## Próximos Passos

1. Adicionar os nós no n8n seguindo este guia
2. Testar com uma conversa real
3. Verificar se os dados aparecem nas tabelas
4. Executar o Reflection Loop (11-Reflection-Loop.json)
5. Confirmar que a análise funciona
