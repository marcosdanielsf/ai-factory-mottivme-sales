# Mapa de Tabelas FUU - Follow Up Universal

> Como as tabelas se conectam para o sistema de follow-up funcionar

---

## Visao Geral

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           SISTEMA FUU COMPLETO                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    CONFIGURACAO (O QUE)                              │  │
│   │                                                                      │  │
│   │   fuu_agent_configs              fuu_templates                       │  │
│   │   ├── DNA da marca/vertical      ├── Templates fixos de mensagem    │  │
│   │   ├── Tom de comunicacao         ├── Por tipo de follow-up          │  │
│   │   ├── Exemplos de mensagens      └── Fallback se IA falhar          │  │
│   │   └── Regras customizadas                                            │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                               │                                             │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    CADENCIA (QUANDO)                                 │  │
│   │                                                                      │  │
│   │   fuu_cadences                   fuu_follow_up_types                 │  │
│   │   ├── Intervalo por tentativa    ├── Tipos disponiveis              │  │
│   │   ├── Max tentativas             │   (sdr_inbound, clinic_reminder)  │  │
│   │   └── Por location + tipo        └── Categoria (sales, clinic, etc)  │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                               │                                             │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      EXECUCAO (FILA)                                 │  │
│   │                                                                      │  │
│   │   fuu_queue                      fuu_execution_log                   │  │
│   │   ├── Leads aguardando FUP       ├── Historico de execucoes         │  │
│   │   ├── Tentativa atual            ├── Mensagem enviada               │  │
│   │   ├── Proximo horario            └── Status (sent, failed, etc)     │  │
│   │   └── Contexto da conversa                                           │  │
│   │                                                                      │  │
│   │   fuu_contact_dates              fuu_next_followups (VIEW)           │  │
│   │   └── Datas especiais (aniver)   └── Proximos a executar             │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Tabelas por Responsabilidade

### 1. CONFIGURACAO - "O QUE dizer e COMO dizer"

| Tabela | Responsabilidade | Quem configura |
|--------|------------------|----------------|
| `fuu_agent_configs` | DNA da marca, tom, exemplos, regras | Admin (1x por cliente) |
| `fuu_templates` | Mensagens fixas de fallback | Admin |

**fuu_agent_configs** - O cerebro do agente:
```sql
SELECT
  agent_name,           -- "Julia", "Cintia", "Isabella"
  company_name,         -- "Five Rings", "Instituto Amar"
  company_description,  -- O que a empresa faz
  vertical_dna,         -- DNA: autoridade+empatia, transformacao+exclusividade
  tone,                 -- casual, formal, friendly
  use_emoji,            -- true/false
  message_examples,     -- JSON com exemplos por situacao
  custom_rules          -- Regras especificas
FROM fuu_agent_configs
WHERE location_id = 've9EPM428h8vShlRW1KT';
```

### 2. CADENCIA - "QUANDO enviar e QUANTAS vezes"

| Tabela | Responsabilidade | Quem configura |
|--------|------------------|----------------|
| `fuu_cadences` | Intervalos por tentativa | Admin |
| `fuu_follow_up_types` | Tipos disponiveis | Sistema (seed) |

**fuu_cadences** - Timing do follow-up:
```sql
SELECT
  attempt_number,       -- 1, 2, 3, 4, 5
  interval_minutes,     -- 35, 240, 1440, 2880, 4320
  message_template      -- Template opcional por tentativa
FROM fuu_cadences
WHERE location_id = 've9EPM428h8vShlRW1KT'
  AND follow_up_type = 'sdr_inbound'
ORDER BY attempt_number;

-- Resultado esperado:
-- 1 | 35   | null (usa IA)
-- 2 | 240  | null (usa IA)
-- 3 | 1440 | "Oi {{nome}}! Tudo bem por ai?"
-- 4 | 2880 | null (usa IA)
-- 5 | 4320 | "Vou dar uma pausa..."
```

### 3. EXECUCAO - "QUEM esta na fila e O QUE foi enviado"

| Tabela | Responsabilidade | Quem alimenta |
|--------|------------------|---------------|
| `fuu_queue` | Leads aguardando follow-up | Agentes (via webhook) |
| `fuu_execution_log` | Historico de mensagens | Sistema (apos enviar) |
| `fuu_next_followups` | VIEW dos proximos | Sistema (SELECT) |

**fuu_queue** - Fila de execucao:
```sql
SELECT
  contact_id,
  contact_name,
  phone,
  follow_up_type,
  current_attempt,      -- Em qual tentativa esta
  next_scheduled_at,    -- Quando deve executar
  context               -- JSON com contexto da conversa
FROM fuu_queue
WHERE location_id = 've9EPM428h8vShlRW1KT'
  AND status = 'pending'
  AND next_scheduled_at <= NOW();
```

---

## Fluxo de Dados

```
1. AGENTE AGENDA FOLLOW-UP
   │
   │  POST /webhook/fuu-schedule
   │  {contact_id, location_id, follow_up_type, context}
   │
   ▼
2. INSERE NA FILA
   │
   │  INSERT INTO fuu_queue
   │  (busca intervalo da tentativa 1 em fuu_cadences)
   │
   ▼
3. CRON EXECUTA (a cada 15min)
   │
   │  SELECT FROM fuu_next_followups
   │  WHERE next_scheduled_at <= NOW()
   │
   ▼
4. PARA CADA LEAD NA FILA:
   │
   ├──► Busca CONFIG do agente (fuu_agent_configs)
   │    └── DNA, tom, exemplos
   │
   ├──► Busca CADENCIA (fuu_cadences)
   │    └── Intervalo, max tentativas
   │
   ├──► Gera mensagem (IA ou template)
   │
   ├──► Envia via GHL API
   │
   ├──► Registra em fuu_execution_log
   │
   └──► Atualiza fuu_queue
        └── Incrementa current_attempt
        └── Calcula next_scheduled_at

5. LEAD RESPONDE
   │
   │  POST /webhook/fuu-responded
   │
   ▼
6. CANCELA FOLLOW-UPS
   │
   │  UPDATE fuu_queue SET status = 'responded'
   │  WHERE contact_id = X AND status = 'pending'
   │
   ▼
7. VOLTA AO INICIO (novo ciclo de atendimento)
```

---

## Queries Importantes

### Ver proximo follow-up de um lead:
```sql
SELECT * FROM fuu_next_followups
WHERE contact_id = 'abc123';
```

### Ver config do agente para uma location:
```sql
SELECT * FROM fuu_agent_configs
WHERE location_id = 've9EPM428h8vShlRW1KT'
  AND follow_up_type = 'sdr_inbound';
```

### Ver cadencia completa:
```sql
SELECT * FROM fuu_cadences
WHERE location_id = 've9EPM428h8vShlRW1KT'
  AND follow_up_type = 'sdr_inbound'
ORDER BY attempt_number;
```

### Ver historico de follow-ups de um lead:
```sql
SELECT * FROM fuu_execution_log
WHERE contact_id = 'abc123'
ORDER BY executed_at DESC;
```

### Metricas por location:
```sql
SELECT * FROM fuu_metrics_by_location
WHERE location_id = 've9EPM428h8vShlRW1KT';
```

---

## Checklist de Configuracao por Cliente

Para cada novo cliente, configurar:

- [ ] **fuu_agent_configs** - DNA, tom, exemplos (migration 010)
- [ ] **fuu_cadences** - Intervalos por tentativa (migration 008)
- [ ] **fuu_templates** - Templates fixos opcionais

### Exemplo SQL para novo cliente (Vertical Medico):

```sql
-- 1. Config do Agente (DNA)
INSERT INTO fuu_agent_configs (
  location_id, follow_up_type, agent_name, company_name,
  company_description, agent_role, tone, use_emoji,
  custom_prompts, message_examples
) VALUES (
  'NOVA_LOCATION_ID', 'sdr_inbound', 'NOME_AGENTE', 'NOME_CLINICA',
  'DESCRICAO', 'Atendente', 'friendly-professional', true,
  '{"vertical_dna": "AUTORIDADE + EMPATIA..."}',
  '[{"situation": "lead_sumiu", "message": "Oi {{nome}}! Sumiu rs"}]'
);

-- 2. Cadencia (Intervalos)
INSERT INTO fuu_cadences (location_id, follow_up_type, attempt_number, interval_minutes)
VALUES
  ('NOVA_LOCATION_ID', 'sdr_inbound', 1, 35),
  ('NOVA_LOCATION_ID', 'sdr_inbound', 2, 240),
  ('NOVA_LOCATION_ID', 'sdr_inbound', 3, 1440),
  ('NOVA_LOCATION_ID', 'sdr_inbound', 4, 2880),
  ('NOVA_LOCATION_ID', 'sdr_inbound', 5, 4320);
```

---

## Relacionamento Entre Tabelas

```
fuu_follow_up_types (seed)
       │
       │ follow_up_type
       ▼
fuu_agent_configs ◄──────► fuu_cadences
       │                        │
       │ location_id            │ location_id
       │ follow_up_type         │ follow_up_type
       │                        │
       │                        │ attempt_number
       │                        │ interval_minutes
       │                        ▼
       │                  fuu_queue
       │                        │
       │                        │ contact_id
       │                        │ current_attempt
       │                        │ next_scheduled_at
       │                        │ context
       │                        ▼
       │                  fuu_execution_log
       │                        │
       │                        │ message_sent
       │                        │ status
       │                        │ executed_at
       ▼
  (usado pelo n8n para
   montar o prompt da IA)
```

---

*Documento criado em 2026-01-09*
*Projeto: MOTTIVME Sales / FUU*
