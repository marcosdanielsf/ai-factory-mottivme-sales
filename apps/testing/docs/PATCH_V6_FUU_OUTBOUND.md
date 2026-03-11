# Patch V6: Integração FUU Outbound Instagram

## Mudanças Necessárias no Workflow V6

### 1. Query "Buscar Config Agente" (ANTES)
```sql
WHERE follow_up_type = 'sdr_inbound'
```

### 1. Query "Buscar Config Agente" (DEPOIS)
```sql
WHERE follow_up_type = COALESCE(
    '{{ $json.follow_up_type }}',
    CASE
        WHEN LOWER('{{ $json.source }}') = 'instagram' THEN 'sdr_outbound_instagram'
        ELSE 'sdr_inbound'
    END
)
```

### 2. Query "Buscar Cadência Action Type" (ANTES)
```sql
WHERE (location_id = '...' OR location_id = 'default')
  AND channel = LOWER('...')
  AND attempt_number = ...
```

### 2. Query "Buscar Cadência Action Type" (DEPOIS)
```sql
WHERE (location_id = '...' OR location_id = 'default')
  AND channel = LOWER('...')
  AND follow_up_type = COALESCE(
      '{{ $json.follow_up_type }}',
      CASE
          WHEN LOWER('{{ $json.source }}') = 'instagram' THEN 'sdr_outbound_instagram'
          ELSE 'sdr_inbound'
      END
  )
  AND attempt_number = ...
```

---

## Novo Node: "Buscar Pendentes FUU Outbound" (Postgres)

**Nome:** `Buscar Pendentes FUU Outbound`
**Tipo:** `n8n-nodes-base.postgres`
**Posição:** Antes do "Loop Over Items"

### Query:
```sql
SELECT
    id as queue_id,
    contact_id,
    location_id,
    follow_up_type,
    phone,
    email,
    contact_name,
    context,
    current_attempt,
    max_attempts,
    scheduled_at
FROM fuu_get_pending(
    p_location_id := NULL,
    p_follow_up_type := 'sdr_outbound_instagram',
    p_limit := 20
);
```

---

## Novo Node: "Avançar Tentativa FUU" (Postgres)

**Nome:** `Avançar Tentativa FUU`
**Tipo:** `n8n-nodes-base.postgres`
**Posição:** Após enviar mensagem

### Query:
```sql
SELECT fuu_advance_attempt(
    p_queue_id := '{{ $json.queue_id }}'::uuid,
    p_result := 'sent'
);
```

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Trigger Diário]                                               │
│        │                                                        │
│        ▼                                                        │
│  [Buscar Pendentes FUU Outbound] ◄─── fuu_get_pending()        │
│        │                                                        │
│        ▼                                                        │
│  [Loop Over Items]                                              │
│        │                                                        │
│        ▼                                                        │
│  [Buscar Config Agente] ◄─── follow_up_type dinâmico           │
│        │                                                        │
│        ▼                                                        │
│  [Assistente Gemini] ──► Gerar mensagem                        │
│        │                                                        │
│        ▼                                                        │
│  [Enviar DM Instagram]                                          │
│        │                                                        │
│        ▼                                                        │
│  [Avançar Tentativa FUU] ◄─── fuu_advance_attempt()            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Queries de Teste

### Verificar configs ativos:
```sql
SELECT follow_up_type, agent_name, location_id
FROM fuu_agent_configs
WHERE is_active = true;
```

### Verificar cadências:
```sql
SELECT follow_up_type, channel, attempt_number, interval_minutes, action_type
FROM fuu_cadences
WHERE follow_up_type LIKE 'sdr_outbound%'
ORDER BY follow_up_type, attempt_number;
```

### Verificar fila:
```sql
SELECT * FROM fuu_get_pending('sdr_outbound_instagram', 10);
```

### Simular agendamento:
```sql
SELECT fuu_schedule_followup(
    p_contact_id := 'test_contact_123',
    p_location_id := 've9EPM428h8vShlRW1KT',
    p_follow_up_type := 'sdr_outbound_instagram',
    p_phone := '+5511999999999',
    p_contact_name := 'Teste',
    p_context := '{"source": "instagram", "username": "@teste"}'::jsonb
);
```
