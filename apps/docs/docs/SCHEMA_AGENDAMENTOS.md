# Schema Supabase - Agendamentos

## Resumo Executivo

Existem **duas tabelas principais** para agendamentos:

1. **`app_dash_principal`** - Tabela principal do GHL (GoHighLevel) com dados de agendamentos consolidados
2. **`n8n_schedule_tracking`** - Rastreamento de conversas/leads com etapas de funil da IA

---

## 1. Tabela: `app_dash_principal`

### Campos Relevantes para Agendamentos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | ID único do lead |
| `contato_principal` | string | Nome do contato |
| `scheduled_at` | timestamp | **Data/hora do agendamento** (quando não é null = tem agendamento) |
| `data_e_hora_do_agendamento_bposs` | timestamp | Data/hora do agendamento no BPOSS |
| `data_que_o_lead_entrou_na_etapa_de_agendamento` | timestamp | Quando entrou na etapa de agendamento |
| `status` | enum | Status do agendamento |
| `fonte_do_lead_bposs` | string | **Origem do lead** - distingue tráfego vs social |
| `funil` | string | Funil de origem |
| `tag` | string | Tags do lead |
| `lead_usuario_responsavel` | string | SDR responsável |
| `tipo_do_agendamento` | string | Tipo (Carreira, Consultoria) |
| `location_id` | string | ID do cliente/location |

### Status de Agendamentos (enum `dashmottivmesales_status_enum`)

| Status | Descrição | Count (amostra) |
|--------|-----------|-----------------|
| `booked` | Agendado | 25 |
| `completed` | Realizado | 75 |
| `no_show` | Não compareceu | 83 |
| `qualifying` | Em qualificação | 2 |
| `new_lead` | Novo lead | 1 |
| `won` | Ganho/Convertido | 3 |
| `lost` | Perdido | - |

### Fonte do Lead (para filtrar Tráfego vs Social Selling)

**🎯 Tráfego Pago:**
- `Tráfego - Lead Direct - Carreira` (93 agendamentos)
- `Tráfego - Lead Direct - Consultoria` (5 agendamentos)

**📱 Social Selling (Visita Sincera):**
- `Prospecção Consultoria - VS` (64 agendamentos)
- `Prospecção Carreira - VS` (17 agendamentos)
- `Gatilho Social - GS` (5 agendamentos)
- `Novo Seguidor - NS` (3 agendamentos)

**Outros:**
- `Contato Pessoal` (2 agendamentos)

### Funis Disponíveis

| Funil | Tipo |
|-------|------|
| `F1 - BPO Social Selling - EUA` | Social Selling |
| `F2 - Funil Tráfego Direto` | Tráfego Pago |
| `F4 - Funil de LP - Carreira` | Landing Page |
| `F6 - CS Consultoria` | Customer Success |

---

## 2. Tabela: `n8n_schedule_tracking`

### Campos Relevantes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | ID único |
| `first_name` | string | Nome do lead |
| `source` | string | Canal (whatsapp, instagram) |
| `source_original` | string | Canal original |
| `etapa_funil` | string | Etapa atual no funil IA |
| `location_id` | string | ID do cliente |
| `location_name` | string | Nome do cliente |
| `objetivo_do_lead` | string | Objetivo (carreira, indefinido) |
| `agente_ia` | string | Agente IA usado |
| `created_at` | timestamp | Data de criação |
| `responded` | boolean | Se respondeu |

### Etapas do Funil IA

| Etapa | Descrição |
|-------|-----------|
| `=inicio` | Início da conversa |
| `Novo` | Novo lead |
| `Em Contato` | Em contato ativo |
| `Agendou` | ⭐ **Agendamento realizado** |

### Clientes (location_name)

- Dr. Luiz Augusto
- Marina Couto
- Marina Work Permit
- Social Business
- Lappe Finances
- Alberto Correia
- LEGACY AGENCY
- Mottivme Sales

---

## 3. Tabela: `socialfy_leads`

Tabela de prospecção/scraping de leads. **Não tem dados de agendamentos**, apenas leads prospectados.

---

## Queries Propostas para o Dashboard

### Query 1: Total de Agendamentos por Período

```sql
SELECT 
  DATE(scheduled_at) as data,
  COUNT(*) as total_agendamentos,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as realizados,
  SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show,
  SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as pendentes
FROM app_dash_principal
WHERE scheduled_at IS NOT NULL
  AND scheduled_at >= '2025-01-01'
GROUP BY DATE(scheduled_at)
ORDER BY data DESC;
```

### Query 2: Agendamentos por Origem (Tráfego vs Social)

```sql
SELECT 
  CASE 
    WHEN fonte_do_lead_bposs LIKE 'Tráfego%' THEN 'Tráfego Pago'
    WHEN fonte_do_lead_bposs LIKE 'Prospecção%' THEN 'Social Selling'
    WHEN fonte_do_lead_bposs LIKE 'Gatilho%' THEN 'Social Selling'
    WHEN fonte_do_lead_bposs LIKE 'Novo Seguidor%' THEN 'Social Selling'
    ELSE 'Outros'
  END as origem,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as realizados
FROM app_dash_principal
WHERE scheduled_at IS NOT NULL
GROUP BY origem;
```

### Query 3: Taxa de Comparecimento

```sql
SELECT 
  COUNT(*) as total_agendamentos,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as realizados,
  SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_comparecimento
FROM app_dash_principal
WHERE scheduled_at IS NOT NULL
  AND status IN ('completed', 'no_show');
```

### Query 4: Agendamentos da IA (n8n_schedule_tracking)

```sql
SELECT 
  location_name as cliente,
  source_original as canal,
  COUNT(*) as total_agendou
FROM n8n_schedule_tracking
WHERE etapa_funil = 'Agendou'
GROUP BY location_name, source_original
ORDER BY total_agendou DESC;
```

---

## Endpoints REST para Frontend

### Listar Agendamentos

```javascript
// Agendamentos com data
const { data } = await supabase
  .from('app_dash_principal')
  .select('*')
  .not('scheduled_at', 'is', null)
  .gte('scheduled_at', '2025-01-01')
  .order('scheduled_at', { ascending: false });
```

### Filtrar por Origem

```javascript
// Tráfego Pago
const { data: trafego } = await supabase
  .from('app_dash_principal')
  .select('*')
  .not('scheduled_at', 'is', null)
  .like('fonte_do_lead_bposs', 'Tráfego%');

// Social Selling  
const { data: social } = await supabase
  .from('app_dash_principal')
  .select('*')
  .not('scheduled_at', 'is', null)
  .or('fonte_do_lead_bposs.like.Prospecção%,fonte_do_lead_bposs.like.Gatilho%,fonte_do_lead_bposs.like.Novo Seguidor%');
```

---

## Campos Disponíveis para Filtros

| Filtro | Tabela | Campo |
|--------|--------|-------|
| Data do Agendamento | app_dash_principal | `scheduled_at` |
| Status | app_dash_principal | `status` |
| Origem (Tráfego/Social) | app_dash_principal | `fonte_do_lead_bposs` |
| Funil | app_dash_principal | `funil` |
| SDR Responsável | app_dash_principal | `lead_usuario_responsavel` |
| Tipo (Carreira/Consultoria) | app_dash_principal | `tipo_do_agendamento` |
| Cliente | n8n_schedule_tracking | `location_name` |
| Canal (WhatsApp/Instagram) | n8n_schedule_tracking | `source_original` |

---

## Conclusão

✅ **Dados JÁ EXISTEM** - Não precisa criar views

A tabela `app_dash_principal` tem todos os campos necessários para o dashboard:
- Data/hora do agendamento
- Status (completed, no_show, booked)
- Origem para distinguir Tráfego vs Social Selling
- SDR responsável
- Tipo de atendimento

Basta criar as queries conforme exemplos acima.
