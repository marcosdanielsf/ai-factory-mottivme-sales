# 🤖 ASSISTENTE IA EXECUTIVA - IMPLEMENTAÇÃO N8N

> **Documento completo para implementação da Assistente AI Executiva usando n8n**
> Criado em: 18/12/2025
> Versão: 1.0
> Status: Pronto para implementação

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Banco de Dados](#banco-de-dados)
4. [Workflows N8N](#workflows-n8n)
5. [Configurações](#configurações)
6. [Checklist de Implementação](#checklist-de-implementação)
7. [Anexos: JSONs dos Workflows](#anexos)

---

## 🎯 VISÃO GERAL

### **O que é?**

Sistema de assistente pessoal com IA que combina **modo ativo (proativo)** e **modo passivo (reativo)** para maximizar a produtividade do CEO Marcos Daniel.

### **Principais Funcionalidades**

#### **MODO ATIVO (Proativo)**

| Horário | Ação | Objetivo |
|---------|------|----------|
| **08:00** | Apresenta tarefas do dia do Monday.com | Forçar escolha de 3 tarefas INEGOCIÁVEIS |
| **12:00** | Check-in de progresso | Lembrar das tarefas críticas |
| **15:00** | Alerta de deadline | Urgência: "Faltam 3h para o fim do dia" |
| **18:00** | Review do dia | Celebrar vitórias ou ajustar para amanhã |

#### **MODO PASSIVO (Reativo)**

Responde a comandos via WhatsApp:
- "Marca tarefa X como concluída"
- "Adiciona tarefa Y"
- "Me lembra por que estou fazendo isso"
- "Qual o status do projeto Z?"
- "Me envia o link do planejamento estratégico"

### **Canais de Comunicação**

- ✅ **WhatsApp** (principal) - via Evolution API
- ✅ **Desktop macOS** (notificações) - via osascript

### **Integrações**

- 🔵 Monday.com (gerenciamento de tarefas)
- 🟣 Claude AI (Anthropic)
- 🟢 PostgreSQL (memória e estado)
- 📱 Evolution API (WhatsApp)

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Diagrama de Fluxo**

```
┌─────────────────────────────────────────────┐
│  WORKFLOW 1: Gatilhos Ativos                │
│  (Cron: 8h, 12h, 15h, 18h)                  │
└──────────────┬──────────────────────────────┘
               │
               ├─► [08:00] Morning Routine
               ├─► [12:00] Noon Check-in
               ├─► [15:00] Afternoon Alert
               └─► [18:00] Evening Review
                          │
                          ▼
┌─────────────────────────────────────────────┐
│  WORKFLOW 2: WhatsApp Inbox                 │
│  (Webhook: recebe mensagens)                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  WORKFLOW 3: Monday Sync                    │
│  (Sincroniza tarefas do Monday)             │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL Database                        │
│  - Tarefas sincronizadas                    │
│  - Histórico de interações                  │
│  - Objetivos e propósito                    │
│  - Estado diário                            │
└─────────────────────────────────────────────┘
```

### **Stack Tecnológico**

| Componente | Tecnologia | Status |
|------------|------------|--------|
| Servidor de automação | n8n (cliente-a1.mentorfy.io) | ✅ Já configurado |
| Banco de dados | PostgreSQL | ✅ Já configurado |
| IA conversacional | Claude 3.5 Sonnet (Anthropic) | 🆕 A configurar |
| WhatsApp | Evolution API | 🆕 A configurar |
| Gerenciamento de tarefas | Monday.com | ✅ API token disponível |
| Notificações Desktop | osascript (macOS) | ✅ Nativo |

---

## 💾 BANCO DE DADOS

### **Schema PostgreSQL**

Execute este SQL no seu banco PostgreSQL (credencial: `WsU3bciJm7aMyAoC`):

```sql
-- =====================================================
-- TABELA 1: Tarefas sincronizadas do Monday
-- =====================================================

CREATE TABLE IF NOT EXISTS assistente_tasks (
  id SERIAL PRIMARY KEY,
  monday_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  is_critical BOOLEAN DEFAULT FALSE, -- Tarefas inegociáveis escolhidas pelo Marcos
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assistente_tasks_status ON assistente_tasks(status);
CREATE INDEX idx_assistente_tasks_critical ON assistente_tasks(is_critical);
CREATE INDEX idx_assistente_tasks_due_date ON assistente_tasks(due_date);

COMMENT ON TABLE assistente_tasks IS 'Tarefas sincronizadas do Monday.com';
COMMENT ON COLUMN assistente_tasks.is_critical IS 'TRUE para as 3 tarefas inegociáveis escolhidas pelo Marcos';

-- =====================================================
-- TABELA 2: Histórico de interações
-- =====================================================

CREATE TABLE IF NOT EXISTS assistente_interactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'proactive' (gatilhos automáticos) ou 'reactive' (resposta a mensagem)
  trigger_type TEXT, -- 'morning', 'noon', 'afternoon', 'evening', 'user_message'
  message_sent TEXT, -- Mensagem enviada pela assistente
  response_received TEXT, -- Resposta do Marcos (se houver)
  action_executed JSONB, -- Ação executada (ex: marcar tarefa como concluída)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assistente_interactions_type ON assistente_interactions(type);
CREATE INDEX idx_assistente_interactions_created ON assistente_interactions(created_at DESC);

COMMENT ON TABLE assistente_interactions IS 'Histórico completo de todas as interações com o Marcos';

-- =====================================================
-- TABELA 3: Objetivos e propósito (memória de longo prazo)
-- =====================================================

CREATE TABLE IF NOT EXISTS assistente_objectives (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL, -- 'meta_90_dias', 'missao', 'valores', 'motivacao'
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- Quanto maior, mais importante
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assistente_objectives_category ON assistente_objectives(category);
CREATE INDEX idx_assistente_objectives_active ON assistente_objectives(active);

COMMENT ON TABLE assistente_objectives IS 'Objetivos, missão e propósito do Marcos - usado para lembretes motivacionais';

-- Inserir objetivos iniciais
INSERT INTO assistente_objectives (category, content, priority, active) VALUES
('meta_90_dias', 'Atingir 100K MRR em 90 dias através do Assembly Line + Socialfy', 10, TRUE),
('missao', 'Construir empresa escalável que dá liberdade financeira e de tempo', 9, TRUE),
('valores', 'Foco, execução, sem desculpas. Resultados acima de ativismo.', 8, TRUE),
('motivacao', 'Dar melhor vida para a família e construir legado duradouro', 10, TRUE);

-- =====================================================
-- TABELA 4: Estado diário (métricas e score)
-- =====================================================

CREATE TABLE IF NOT EXISTS assistente_daily_state (
  date DATE PRIMARY KEY,
  tasks_total INTEGER DEFAULT 0, -- Total de tarefas do dia
  tasks_critical INTEGER DEFAULT 0, -- Quantas tarefas inegociáveis
  tasks_completed INTEGER DEFAULT 0, -- Tarefas completadas
  critical_completed INTEGER DEFAULT 0, -- Inegociáveis completadas
  score INTEGER DEFAULT 0, -- Score do dia (0-100)
  notes TEXT, -- Notas adicionais
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assistente_daily_state_date ON assistente_daily_state(date DESC);

COMMENT ON TABLE assistente_daily_state IS 'Estado e métricas diárias - usado para review do dia';

-- =====================================================
-- TABELA 5: Mensagens agendadas (follow-ups futuros)
-- =====================================================

CREATE TABLE IF NOT EXISTS assistente_scheduled_messages (
  id SERIAL PRIMARY KEY,
  scheduled_for TIMESTAMP NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assistente_scheduled_pending ON assistente_scheduled_messages(scheduled_for)
WHERE status = 'pending';

COMMENT ON TABLE assistente_scheduled_messages IS 'Mensagens agendadas para envio futuro';

-- =====================================================
-- FUNÇÃO: Atualizar score diário automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_daily_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assistente_daily_state
  SET
    tasks_completed = (
      SELECT COUNT(*) FROM assistente_tasks
      WHERE due_date = CURRENT_DATE AND status = 'completed'
    ),
    critical_completed = (
      SELECT COUNT(*) FROM assistente_tasks
      WHERE due_date = CURRENT_DATE AND status = 'completed' AND is_critical = TRUE
    ),
    score = CASE
      WHEN tasks_critical > 0 THEN
        ((critical_completed::float / tasks_critical::float) * 70) +
        ((tasks_completed::float / tasks_total::float) * 30)
      ELSE
        (tasks_completed::float / NULLIF(tasks_total::float, 0)) * 100
    END,
    updated_at = NOW()
  WHERE date = CURRENT_DATE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_daily_score
  AFTER UPDATE ON assistente_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_daily_score();

-- =====================================================
-- ✅ VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename LIKE 'assistente_%'
ORDER BY tablename;

-- Verificar objetivos iniciais
SELECT * FROM assistente_objectives ORDER BY priority DESC;
```

---

## 🔄 WORKFLOWS N8N

### **WORKFLOW 1: Assistente - Gatilhos Ativos**

**Objetivo:** Enviar mensagens proativas em horários específicos

**Triggers:**
- 08:00 - Morning Routine
- 12:00 - Noon Check-in
- 15:00 - Afternoon Alert
- 18:00 - Evening Review

#### **Estrutura Visual do Workflow**

```
[Cron 08:00] ──┐
[Cron 12:00] ──┼──► [Switch: Qual horário?] ──┬──► [Morning]
[Cron 15:00] ──┤                               ├──► [Noon]
[Cron 18:00] ──┘                               ├──► [Afternoon]
                                                └──► [Evening]
                                                        │
                        ┌───────────────────────────────┴────────────────┐
                        │                                                │
              [Get Tasks from DB] ──► [Build Message] ──► [Send WhatsApp]
                        │                                                │
                        └──► [Desktop Notification] ◄────────────────────┘
                                        │
                                        └──► [Log Interaction]
```

#### **Configuração dos Nós**

##### **Nó 1-4: Cron Triggers**

**Morning Trigger (08:00)**
```yaml
Nome: "Morning - 08:00"
Tipo: n8n-nodes-base.scheduleTrigger
Cron Expression: "0 8 * * *"
Timezone: America/Sao_Paulo
```

**Noon Trigger (12:00)**
```yaml
Nome: "Noon - 12:00"
Tipo: n8n-nodes-base.scheduleTrigger
Cron Expression: "0 12 * * *"
Timezone: America/Sao_Paulo
```

**Afternoon Trigger (15:00)**
```yaml
Nome: "Afternoon - 15:00"
Tipo: n8n-nodes-base.scheduleTrigger
Cron Expression: "0 15 * * *"
Timezone: America/Sao_Paulo
```

**Evening Trigger (18:00)**
```yaml
Nome: "Evening - 18:00"
Tipo: n8n-nodes-base.scheduleTrigger
Cron Expression: "0 18 * * *"
Timezone: America/Sao_Paulo
```

##### **Nó 5: Switch (Qual horário?)**

```yaml
Nome: "Switch: Qual horário?"
Tipo: n8n-nodes-base.switch
Modo: Rules

Regras:
  Rule 1 (Morning):
    Condition: {{ $now.format('HH') }} equals "08"
    Output: morning

  Rule 2 (Noon):
    Condition: {{ $now.format('HH') }} equals "12"
    Output: noon

  Rule 3 (Afternoon):
    Condition: {{ $now.format('HH') }} equals "15"
    Output: afternoon

  Rule 4 (Evening):
    Condition: {{ $now.format('HH') }} equals "18"
    Output: evening
```

##### **Nó 6: Get Tasks from DB (Morning)**

```yaml
Nome: "Get Today Tasks"
Tipo: n8n-nodes-base.postgres
Credencial: "postgress - financeiro - mottivme sales" (ID: WsU3bciJm7aMyAoC)
Operação: Execute Query

Query:
```
```sql
SELECT
  id,
  monday_id,
  title,
  status,
  is_critical,
  due_date
FROM assistente_tasks
WHERE due_date = CURRENT_DATE
ORDER BY is_critical DESC, id ASC;
```

##### **Nó 7: Build Morning Message**

```yaml
Nome: "Build Morning Message"
Tipo: n8n-nodes-base.set
Modo: Manual Mapping

Campos:
  message:
    Tipo: String
    Valor: |
      🌅 Bom dia, Marcos!

      Você tem {{ $('Get Today Tasks').all().length }} tarefas hoje.

      **ESCOLHA AGORA 3 TAREFAS INEGOCIÁVEIS** - aquelas que você DEVE completar hoje.

      Responda com os números: Ex: "1, 3, 5"

      {{ $('Get Today Tasks').all().map((t, i) => `${i+1}. ${t.json.title}`).join('\n') }}

  phone:
    Tipo: String
    Valor: "+5511936180422"

  trigger_type:
    Tipo: String
    Valor: "morning"
```

##### **Nó 8: Send WhatsApp**

```yaml
Nome: "Send WhatsApp"
Tipo: n8n-nodes-base.httpRequest
Método: POST
URL: {{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}

Headers:
  apikey: {{ $env.EVOLUTION_API_KEY }}
  Content-Type: application/json

Body (JSON):
```
```json
{
  "number": "{{ $json.phone }}",
  "text": "{{ $json.message }}"
}
```

##### **Nó 9: Desktop Notification**

```yaml
Nome: "Desktop Notification"
Tipo: n8n-nodes-base.executeCommand
Comando: osascript -e 'display notification "{{ $json.message.substring(0, 100) }}..." with title "Assistente Sofia" sound name "Glass"'
```

##### **Nó 10: Log Interaction**

```yaml
Nome: "Log Interaction"
Tipo: n8n-nodes-base.postgres
Credencial: "postgress - financeiro - mottivme sales"
Operação: Execute Query

Query:
```
```sql
INSERT INTO assistente_interactions (type, trigger_type, message_sent)
VALUES ('proactive', '{{ $json.trigger_type }}', '{{ $json.message }}')
RETURNING id;
```

#### **Nós Específicos para Cada Horário**

##### **NOON CHECK-IN (12:00)**

**Nó: Build Noon Message**
```yaml
Nome: "Build Noon Message"
Tipo: n8n-nodes-base.set

Campos:
  message:
    Valor: |
      ⏰ Meio-dia, Marcos!

      📊 Status das suas 3 INEGOCIÁVEIS:
      {{ $('Get Today Tasks').all().filter(t => t.json.is_critical).map(t => `${t.json.status === 'completed' ? '✅' : '❌'} ${t.json.title}`).join('\n') }}

      {{ $('Get Today Tasks').all().filter(t => t.json.is_critical && t.json.status !== 'completed').length === 0
        ? '🎉 Você ZEROU as inegociáveis! Agora pode focar nas outras.'
        : `⚠️ Faltam ${$('Get Today Tasks').all().filter(t => t.json.is_critical && t.json.status !== 'completed').length}. Foco total nelas!`
      }}
```

##### **AFTERNOON ALERT (15:00)**

**Nó: Build Afternoon Message**
```yaml
Nome: "Build Afternoon Message"
Tipo: n8n-nodes-base.set

Campos:
  message:
    Valor: |
      🔥 ATENÇÃO, Marcos!

      São 15h. Faltam 3 HORAS até o deadline das 18h.

      📊 Status:
      Total de tarefas: {{ $('Get Today Tasks').all().length }}
      Concluídas: {{ $('Get Today Tasks').all().filter(t => t.json.status === 'completed').length }}
      Pendentes: {{ $('Get Today Tasks').all().filter(t => t.json.status !== 'completed').length }}

      🎯 INEGOCIÁVEIS:
      {{ $('Get Today Tasks').all().filter(t => t.json.is_critical).map(t => `${t.json.status === 'completed' ? '✅' : '❌'} ${t.json.title}`).join('\n') }}

      CORRE AGORA. Foco nas inegociáveis!
```

##### **EVENING REVIEW (18:00)**

**Nó: Get Daily State**
```yaml
Nome: "Get Daily State"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
SELECT
  date,
  tasks_total,
  tasks_critical,
  tasks_completed,
  critical_completed,
  score
FROM assistente_daily_state
WHERE date = CURRENT_DATE;
```

**Nó: Get Random Objective**
```yaml
Nome: "Get Motivation"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
SELECT content
FROM assistente_objectives
WHERE category IN ('motivacao', 'missao')
  AND active = TRUE
ORDER BY RANDOM()
LIMIT 1;
```

**Nó: Build Evening Message**
```yaml
Nome: "Build Evening Message"
Tipo: n8n-nodes-base.set

Campos:
  message:
    Valor: |
      🌙 Review do dia, Marcos!

      📊 RESULTADO:
      ✅ {{ $('Get Daily State').first().json.critical_completed }} de {{ $('Get Daily State').first().json.tasks_critical }} inegociáveis completas ({{ Math.round(($('Get Daily State').first().json.critical_completed / $('Get Daily State').first().json.tasks_critical) * 100) }}%)
      ✅ {{ $('Get Daily State').first().json.tasks_completed }} de {{ $('Get Daily State').first().json.tasks_total }} tarefas totais completas

      📈 Score do dia: {{ $('Get Daily State').first().json.score }}/100

      💡 LEMBRETE:
      {{ $('Get Motivation').first().json.content }}

      {{ $('Get Daily State').first().json.score >= 70
        ? '🎉 Dia produtivo! Continue assim.'
        : '⚠️ Amanhã você recupera. Descanse bem.'
      }}
```

---

### **WORKFLOW 2: Assistente - WhatsApp Inbox**

**Objetivo:** Receber mensagens do Marcos e responder via Claude AI

#### **Estrutura Visual**

```
[Webhook] ──► [Filter: Only Marcos] ──► [Get Context] ──► [Claude AI]
                                                              │
                        ┌─────────────────────────────────────┘
                        │
                        ├──► [Parse Response]
                        │
                        ├──► [IF: Has Action?] ──┬──► [Execute Action]
                        │                         └──► [Skip]
                        │
                        ├──► [Send Reply]
                        │
                        └──► [Log Interaction]
```

#### **Configuração dos Nós**

##### **Nó 1: Webhook Trigger**

```yaml
Nome: "Webhook - WhatsApp Message"
Tipo: n8n-nodes-base.webhook
HTTP Method: POST
Path: assistente-whatsapp
Response Mode: Last Node
Webhook ID: assistente-sofia-inbox

URL Final: https://cliente-a1.mentorfy.io/webhook/assistente-whatsapp
```

**Configurar no Evolution API:**
- Ir em configurações da instância
- Adicionar webhook: `https://cliente-a1.mentorfy.io/webhook/assistente-whatsapp`
- Eventos: `messages.upsert`

##### **Nó 2: Filter Only Marcos**

```yaml
Nome: "Filter: Only Marcos"
Tipo: n8n-nodes-base.if

Condições:
  - {{ $json.body.key.remoteJid }} equals "5511936180422@s.whatsapp.net"
  - AND {{ $json.body.key.fromMe }} equals false
```

##### **Nó 3: Extract Message Text**

```yaml
Nome: "Extract Message"
Tipo: n8n-nodes-base.set

Campos:
  user_message:
    Valor: {{ $json.body.message.conversation || $json.body.message.extendedTextMessage?.text || '' }}

  phone:
    Valor: {{ $json.body.key.remoteJid.replace('@s.whatsapp.net', '') }}

  message_id:
    Valor: {{ $json.body.key.id }}
```

##### **Nó 4: Get Context from DB**

```yaml
Nome: "Get Context"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
WITH today_tasks AS (
  SELECT json_agg(json_build_object(
    'id', id,
    'title', title,
    'status', status,
    'is_critical', is_critical
  ) ORDER BY is_critical DESC, id ASC) as tasks
  FROM assistente_tasks
  WHERE due_date = CURRENT_DATE
),
objectives AS (
  SELECT json_agg(json_build_object(
    'category', category,
    'content', content
  ) ORDER BY priority DESC) as goals
  FROM assistente_objectives
  WHERE active = TRUE
  LIMIT 5
),
recent_interactions AS (
  SELECT json_agg(json_build_object(
    'type', type,
    'message', message_sent,
    'response', response_received
  ) ORDER BY created_at DESC) as history
  FROM assistente_interactions
  ORDER BY created_at DESC
  LIMIT 10
)
SELECT
  COALESCE((SELECT tasks FROM today_tasks), '[]'::json) as tasks,
  COALESCE((SELECT goals FROM objectives), '[]'::json) as objectives,
  COALESCE((SELECT history FROM recent_interactions), '[]'::json) as recent_history;
```

##### **Nó 5: Claude AI**

```yaml
Nome: "Claude AI"
Tipo: n8n-nodes-base.httpRequest
Método: POST
URL: https://api.anthropic.com/v1/messages

Headers:
  x-api-key: {{ $env.ANTHROPIC_API_KEY }}
  anthropic-version: 2023-06-01
  Content-Type: application/json

Body (JSON):
```
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "system": "Você é Sofia, assistente executiva pessoal do Marcos Daniel, CEO da Mottivme.\n\n## SEU PAPEL:\n- Coach de produtividade firme mas encorajadora\n- Guardiã do tempo e foco do Marcos\n- Lembrança constante do propósito e objetivos\n\n## REGRAS FUNDAMENTAIS:\n1. Seja DIRETA - máximo 3 frases por resposta\n2. Seja FIRME - não aceite desculpas, mas seja empática\n3. Foque RESULTADOS - números, prazos, ações concretas\n4. Lembre o PROPÓSITO quando ele parecer desanimado\n5. Use emojis apenas para ênfase: ✅ ❌ 🎯 ⚠️ 🔥\n\n## AÇÕES DISPONÍVEIS:\nQuando o usuário pedir para marcar tarefa como concluída, identifique o ID da tarefa e retorne:\n[ACTION:COMPLETE_TASK:ID_DA_TAREFA]\n\nQuando o usuário pedir para adicionar tarefa, retorne:\n[ACTION:ADD_TASK:título da tarefa]\n\nQuando o usuário pedir lembretes de propósito, retorne:\n[ACTION:GET_MOTIVATION]\n\n## CONTEXTO ATUAL:\nTarefas do dia:\n{{ $('Get Context').first().json[0].tasks }}\n\nObjetivos principais:\n{{ $('Get Context').first().json[0].objectives }}\n\nHistórico recente:\n{{ $('Get Context').first().json[0].recent_history }}\n\n## TOM DE VOZ:\n✅ BOM: \"Marcos, são 15h. Faltam 3h. Você tem 5 tarefas ainda. As 3 INEGOCIÁVEIS são: [X, Y, Z]. Foque nelas AGORA.\"\n❌ RUIM: \"Oi Marcos! 😊 Tudo bem? Só passando pra lembrar que você tem umas tarefazinhas pendentes...\"\n\nSeja Sofia - direta, firme, focada em resultados.",
  "messages": [
    {
      "role": "user",
      "content": "{{ $('Extract Message').first().json.user_message }}"
    }
  ]
}
```

##### **Nó 6: Parse Response**

```yaml
Nome: "Parse Response"
Tipo: n8n-nodes-base.set

Campos:
  response_text:
    Valor: {{ $json.content[0].text }}

  has_action:
    Valor: {{ $json.content[0].text.includes('[ACTION:') }}

  action_type:
    Valor: {{ $json.content[0].text.match(/\[ACTION:(\w+):/)?.[1] || '' }}

  action_value:
    Valor: {{ $json.content[0].text.match(/\[ACTION:\w+:([^\]]+)\]/)?.[1] || '' }}

  clean_response:
    Valor: {{ $json.content[0].text.replace(/\[ACTION:[^\]]+\]/g, '').trim() }}
```

##### **Nó 7: IF Has Action?**

```yaml
Nome: "IF: Has Action?"
Tipo: n8n-nodes-base.if

Condições:
  - {{ $json.has_action }} is true
```

##### **Nó 8a: Execute Action - Complete Task**

```yaml
Nome: "Execute: Complete Task"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
UPDATE assistente_tasks
SET
  status = 'completed',
  completed_at = NOW(),
  updated_at = NOW()
WHERE id = {{ $json.action_value }}
RETURNING *;
```

##### **Nó 8b: Execute Action - Add Task**

```yaml
Nome: "Execute: Add Task"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
INSERT INTO assistente_tasks (monday_id, title, status, due_date)
VALUES (
  'manual_' || gen_random_uuid()::text,
  '{{ $json.action_value }}',
  'pending',
  CURRENT_DATE
)
RETURNING *;
```

##### **Nó 9: Send WhatsApp Reply**

```yaml
Nome: "Send Reply"
Tipo: n8n-nodes-base.httpRequest
Método: POST
URL: {{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}

Headers:
  apikey: {{ $env.EVOLUTION_API_KEY }}
  Content-Type: application/json

Body (JSON):
```
```json
{
  "number": "5511936180422",
  "text": "{{ $('Parse Response').first().json.clean_response }}"
}
```

##### **Nó 10: Log Interaction**

```yaml
Nome: "Log Interaction"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
INSERT INTO assistente_interactions (
  type,
  trigger_type,
  message_sent,
  response_received,
  action_executed
)
VALUES (
  'reactive',
  'user_message',
  '{{ $('Parse Response').first().json.clean_response }}',
  '{{ $('Extract Message').first().json.user_message }}',
  '{{ $('Parse Response').first().json.has_action ? JSON.stringify({type: $('Parse Response').first().json.action_type, value: $('Parse Response').first().json.action_value}) : null }}'::jsonb
)
RETURNING id;
```

---

### **WORKFLOW 3: Assistente - Monday Sync**

**Objetivo:** Sincronizar tarefas do Monday.com diariamente

#### **Estrutura Visual**

```
[Cron: 07:00] ──► [Monday API] ──► [Parse Tasks] ──► [Upsert to DB] ──► [Update Daily State]
```

#### **Configuração dos Nós**

##### **Nó 1: Cron Daily Sync**

```yaml
Nome: "Daily Sync - 07:00"
Tipo: n8n-nodes-base.scheduleTrigger
Cron Expression: "0 7 * * *"
Timezone: America/Sao_Paulo
```

##### **Nó 2: Monday API - Get Tasks**

```yaml
Nome: "Monday - Get Today Tasks"
Tipo: n8n-nodes-base.httpRequest
Método: POST
URL: https://api.monday.com/v2

Headers:
  Authorization: {{ $env.MONDAY_API_TOKEN }}
  Content-Type: application/json
  API-Version: 2024-04

Body (JSON):
```
```json
{
  "query": "query { boards(ids: [{{ $env.MONDAY_BOARD_ID }}]) { items { id name column_values { id text value } } } }"
}
```

##### **Nó 3: Parse Tasks**

```yaml
Nome: "Parse Tasks"
Tipo: n8n-nodes-base.code
Modo: Run Once for All Items
JavaScript:
```
```javascript
const items = $input.all();
const tasks = items[0].json.data.boards[0].items;

return tasks.map(task => ({
  json: {
    monday_id: task.id,
    title: task.name,
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0]
  }
}));
```

##### **Nó 4: Upsert to DB**

```yaml
Nome: "Upsert Tasks"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
INSERT INTO assistente_tasks (monday_id, title, status, due_date)
VALUES {{ $json.monday_id ? `('${$json.monday_id}', '${$json.title.replace(/'/g, "''")}', '${$json.status}', '${$json.due_date}')` : '' }}
ON CONFLICT (monday_id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();
```

##### **Nó 5: Update Daily State**

```yaml
Nome: "Update Daily State"
Tipo: n8n-nodes-base.postgres
Operação: Execute Query

Query:
```
```sql
INSERT INTO assistente_daily_state (date, tasks_total)
VALUES (
  CURRENT_DATE,
  (SELECT COUNT(*) FROM assistente_tasks WHERE due_date = CURRENT_DATE)
)
ON CONFLICT (date) DO UPDATE SET
  tasks_total = EXCLUDED.tasks_total,
  updated_at = NOW();
```

---

## ⚙️ CONFIGURAÇÕES

### **Variáveis de Ambiente (n8n)**

Adicionar no n8n: Settings > Environment Variables

```env
# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sua_api_key_anthropic_aqui

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_api_key_evolution
EVOLUTION_INSTANCE=mottivme-assistente

# Monday.com
MONDAY_API_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM1MDA3Mzc3NSwiYWFpIjoxMSwidWlkIjozNjMzNzQwNiwiaWFkIjoiMjAyNC0wNC0yMVQwOTo1MjozMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTQwNjE3OTksInJnbiI6InVzZTEifQ.-8-lOl8h6fcG82m_GdzckKnimiRRNTCxx8cHZTEEhXw
MONDAY_BOARD_ID=seu_board_id_aqui
```

### **Credenciais n8n**

Usar credenciais já configuradas:

| Serviço | Credential Name | ID |
|---------|----------------|-----|
| PostgreSQL | postgress - financeiro - mottivme sales | WsU3bciJm7aMyAoC |
| Twilio | Twilio account | pauvhliYHlGqkTOY |

### **Telefone do Marcos**

```
+5511936180422
WhatsApp ID: 5511936180422@s.whatsapp.net
```

### **Arquivos-Guia (Paths)**

```yaml
CHECKLIST: "/Users/marcosdaniels/Desktop/CHECKLIST - O Que Precisa Ser Criado.md"
PLANO_90_DIAS: "/Users/marcosdaniels/Desktop/PLANO 90 DIAS - 100K MRR - Sistema Assembly Line + Socialfy.md"
PLANEJAMENTO: "/Users/marcosdaniels/Library/CloudStorage/GoogleDrive-ceo@marcosdaniels.com/Meu Drive/1. ESTRUTURA GERAL/3. ESTRATÉGICO - OKRs E KPIs - ⚙️/Planejamento-Anual/PLANEJAMENTO ESTRATÉGICO MOTTIVME - Estrutura, Produtos e Precificação.md"
CREDENCIAIS: "/Users/marcosdaniels/Desktop/PASTA MESTRE - GUIA MOTTIVME/CREDENCIAIS-MASTER.md"
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Preparação (30 min)**

- [ ] Obter API Key do Claude (Anthropic)
  - Acessar: https://console.anthropic.com/
  - Criar API Key
  - Adicionar ao n8n como variável de ambiente

- [ ] Configurar Evolution API (WhatsApp)
  - Instalar/configurar Evolution API
  - Criar instância "mottivme-assistente"
  - Obter API Key e URL
  - Adicionar ao n8n como variáveis de ambiente

- [ ] Obter Board ID do Monday.com
  - Acessar Monday.com
  - Abrir board de tarefas diárias
  - Copiar ID da URL (número após /boards/)
  - Adicionar ao n8n como variável de ambiente

- [ ] Criar tabelas no PostgreSQL
  - Rodar SQL completo do schema
  - Verificar criação das tabelas
  - Verificar objetivos iniciais inseridos

### **Fase 2: Workflow 1 - Gatilhos Ativos (2h)**

- [ ] Criar novo workflow "Assistente - Gatilhos Ativos"
- [ ] Adicionar 4 Cron Triggers (8h, 12h, 15h, 18h)
- [ ] Adicionar nó Switch
- [ ] Implementar Morning Routine:
  - [ ] Get Tasks from DB
  - [ ] Build Morning Message
  - [ ] Send WhatsApp
  - [ ] Desktop Notification
  - [ ] Log Interaction
- [ ] Testar Morning Routine manualmente
- [ ] Implementar Noon Check-in
- [ ] Implementar Afternoon Alert
- [ ] Implementar Evening Review
- [ ] Ativar workflow

### **Fase 3: Workflow 2 - WhatsApp Inbox (2h)**

- [ ] Criar novo workflow "Assistente - WhatsApp Inbox"
- [ ] Adicionar Webhook Trigger
- [ ] Adicionar Filter (Only Marcos)
- [ ] Adicionar Extract Message
- [ ] Adicionar Get Context
- [ ] Adicionar Claude AI
- [ ] Adicionar Parse Response
- [ ] Adicionar IF Has Action
- [ ] Adicionar Execute Actions (Complete Task, Add Task)
- [ ] Adicionar Send Reply
- [ ] Adicionar Log Interaction
- [ ] Configurar webhook no Evolution API
- [ ] Testar conversação via WhatsApp
- [ ] Testar ação "marcar como concluída"
- [ ] Ativar workflow

### **Fase 4: Workflow 3 - Monday Sync (1h)**

- [ ] Criar novo workflow "Assistente - Monday Sync"
- [ ] Adicionar Cron Trigger (07:00)
- [ ] Adicionar Monday API call
- [ ] Adicionar Parse Tasks
- [ ] Adicionar Upsert to DB
- [ ] Adicionar Update Daily State
- [ ] Testar sincronização manual
- [ ] Ativar workflow

### **Fase 5: Testes Finais (1h)**

- [ ] Testar fluxo manhã completo
- [ ] Testar conversação via WhatsApp
- [ ] Testar marcar tarefa como concluída
- [ ] Testar adicionar nova tarefa
- [ ] Testar todos os 4 horários de gatilho
- [ ] Verificar logs no banco de dados
- [ ] Ajustar prompts se necessário

### **Fase 6: Monitoramento (Contínuo)**

- [ ] Monitorar execuções por 1 dia
- [ ] Ajustar horários se necessário
- [ ] Refinar prompts do Claude
- [ ] Adicionar mais objetivos/motivações
- [ ] Configurar alertas de erro

---

## 📱 COMO USAR

### **Interação Manhã (08:00)**

1. Sofia envia lista de tarefas
2. Marcos responde: "1, 3, 5"
3. Sofia marca essas 3 como inegociáveis
4. Sofia envia links dos arquivos-guia

### **Comandos via WhatsApp**

```
"Marca tarefa 3 como concluída"
→ Sofia marca e confirma

"Adiciona tarefa: Revisar proposta X"
→ Sofia adiciona e confirma

"Me lembra por que estou fazendo isso"
→ Sofia busca objetivo/motivação do banco

"Qual o status?"
→ Sofia mostra progresso do dia

"Me envia o link do planejamento"
→ Sofia envia links dos arquivos-guia
```

### **Monitoramento**

Acessar PostgreSQL e consultar:

```sql
-- Ver tarefas de hoje
SELECT * FROM assistente_tasks WHERE due_date = CURRENT_DATE;

-- Ver histórico de interações
SELECT * FROM assistente_interactions ORDER BY created_at DESC LIMIT 20;

-- Ver score do dia
SELECT * FROM assistente_daily_state WHERE date = CURRENT_DATE;

-- Ver objetivos ativos
SELECT * FROM assistente_objectives WHERE active = TRUE;
```

---

## 🎯 PRÓXIMOS PASSOS APÓS IMPLEMENTAÇÃO

### **Melhorias Futuras**

1. **Integração Google Drive**
   - Enviar arquivos diretamente via WhatsApp
   - Não apenas links

2. **Analytics Avançado**
   - Dashboard de produtividade semanal/mensal
   - Gráficos de progresso
   - Identificar padrões (dias mais produtivos)

3. **Lembretes Inteligentes**
   - Se Marcos não responde, enviar follow-up
   - Detectar quando está atrasado em alguma tarefa

4. **Integração com Calendário**
   - Sincronizar reuniões do Google Calendar
   - Alertar antes de reuniões importantes

5. **Voice Messages**
   - Responder via áudio (text-to-speech)
   - Processar áudios do Marcos (speech-to-text)

6. **Multi-usuário**
   - Expandir para Isabella (SDR Lead)
   - Assistente para cada membro chave do time

---

## 🔒 SEGURANÇA

### **Boas Práticas**

1. **API Keys**
   - Nunca commitar no git
   - Usar variáveis de ambiente do n8n
   - Rotação trimestral

2. **Banco de Dados**
   - Backup diário
   - Retention: 90 dias de histórico

3. **WhatsApp**
   - Apenas aceitar mensagens do número do Marcos
   - Validar formato das mensagens

4. **Logs**
   - Não logar dados sensíveis
   - Apenas metadados

---

## 📞 SUPORTE

### **Troubleshooting**

**Problema:** WhatsApp não está recebendo mensagens
- Verificar se Evolution API está rodando
- Verificar se webhook está configurado
- Verificar variáveis de ambiente (EVOLUTION_API_URL, EVOLUTION_API_KEY)

**Problema:** Claude não está respondendo
- Verificar API Key válida
- Verificar saldo da conta Anthropic
- Verificar logs do workflow

**Problema:** Tarefas do Monday não sincronizam
- Verificar MONDAY_API_TOKEN válido
- Verificar MONDAY_BOARD_ID correto
- Rodar workflow manualmente para debug

**Problema:** Cron não executa no horário
- Verificar timezone do n8n
- Verificar se workflow está ativo
- Verificar executions history

---

## 📊 MÉTRICAS DE SUCESSO

Após 30 dias, medir:

| Métrica | Meta | Como medir |
|---------|------|------------|
| Taxa de conclusão das inegociáveis | >80% | `SELECT AVG(critical_completed::float / tasks_critical) FROM assistente_daily_state WHERE date >= CURRENT_DATE - 30` |
| Engajamento (respostas do Marcos) | >90% | Contar interações reativas vs proativas |
| Tempo de resposta | <30min | Calcular diferença entre mensagem enviada e resposta |
| Score semanal médio | >75/100 | `SELECT AVG(score) FROM assistente_daily_state WHERE date >= CURRENT_DATE - 7` |

---

*Documento criado em: 18/12/2025*
*Versão: 1.0*
*Autor: Claude (Anthropic)*
*Para: Marcos Daniel - CEO Mottivme*

**🚀 Pronto para implementar! Qualquer dúvida, consulte este documento.**
