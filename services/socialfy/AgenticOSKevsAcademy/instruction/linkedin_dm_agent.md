# LinkedIn DM Agent - Information

## GOAL
Automatizar prospecção B2B no LinkedIn: enviar connection requests e mensagens personalizadas para leads qualificados, respeitando os limites da plataforma para evitar restrições.

## CONTEXT
Este agente opera como parte do AgenticOS para automatizar outreach B2B no LinkedIn. Os leads podem vir de:
- Sales Navigator exports
- Buscas por cargo/empresa
- Perfis que engajaram com nosso conteúdo
- Listas CSV importadas

## WORKFLOW

### Modo Connection (Para não-conexões)
1. Carregar sessão salva do LinkedIn (cookie li_at) ou fazer login
2. Ler lista de leads do Supabase ou CSV
3. Para cada lead:
   a. Verificar se já é conexão ou foi contactado
   b. Navegar até o perfil
   c. Clicar em "Connect"
   d. Adicionar nota personalizada (300 chars max)
   e. Registrar no banco de dados
   f. Aguardar delay aleatório (45-90s)
4. Respeitar limites: 20 connections/dia, 100/semana
5. Salvar sessão ao finalizar

### Modo Message (Para conexões existentes)
1. Carregar sessão salva
2. Ler lista de conexões para mensagem
3. Para cada conexão:
   a. Verificar se já foi contactada nessa campanha
   b. Navegar até o perfil ou messaging
   c. Enviar mensagem personalizada
   d. Registrar no banco de dados
   e. Aguardar delay aleatório (60-120s)
4. Respeitar limites: 50 mensagens/dia
5. Salvar sessão ao finalizar

## RATE LIMITS (CRÍTICOS)

### Connection Requests
- **20 connections/dia** (conservador para evitar restrição)
- **100 connections/semana** (limite real ~150, mas 100 é seguro)
- **Delay: 45-90 segundos** entre cada request

### Messages
- **50 mensagens/dia** (para conexões de 1º grau)
- **Delay: 60-120 segundos** entre cada mensagem
- **InMail: 20-50/mês** (apenas LinkedIn Premium)

### Penalidades
- **Excesso de connections**: Restrição temporária (24h-7 dias)
- **Spam reports**: Restrição de messaging
- **Automation detection**: Suspensão da conta

## CONSTRAINTS (Learned from experience)
- NEVER send more than 20 connections per day
- NEVER send more than 50 messages per day
- ALWAYS wait 45-90 seconds between connections
- ALWAYS wait 60-120 seconds between messages
- ALWAYS save session after successful actions
- IF login requires captcha, STOP and notify
- IF "connection limit reached" message appears, STOP immediately
- IF profile shows "Pending" connection, SKIP (already sent)
- NEVER connect with profile < 50 connections (likely fake)
- ALWAYS check if profile has "Message" button before sending
- CONNECTION NOTE limited to 300 characters max
- AVOID weekends and nights (lower acceptance rate)

## MESSAGE TEMPLATES

### Connection Request Note (max 300 chars)
```
Template 1: Mutual Interest
Oi {first_name}, vi que você trabalha com {specialty} na {company}. Tenho acompanhado o mercado de {industry} e adoraria conectar pra trocar ideias. Abraço!

Template 2: Content Hook
{first_name}, curti muito seu post sobre {topic}. Trabalho na área também e acho que temos muita coisa em comum. Vamos conectar?

Template 3: Direct Value
Oi {first_name}! Ajudo {target_audience} a {benefit}. Vi que você é {title} na {company} - acho que posso agregar valor. Conectamos?
```

### Follow-up Message (após conexão aceita)
```
Template 1: Warm Welcome
Oi {first_name}, obrigado por conectar! 🙏

Vi que você é {title} na {company}. Como está o mercado de {industry} por aí?

Tenho ajudado empresas como a sua com {solution}. Se fizer sentido, adoraria bater um papo.

Abs!

Template 2: Value First
{first_name}, valeu pela conexão!

Notei que você atua com {specialty}. Recentemente publiquei um material sobre {topic} que talvez te interesse: [link]

Se quiser trocar uma ideia sobre, estou à disposição!

Template 3: Direct Approach
Oi {first_name}!

Conectei porque trabalho com {target_audience} e vi que você é {title} na {company}.

Minha empresa ajuda empresas como a sua a {benefit}. Faz sentido uma call de 15 min essa semana?
```

## ERROR HANDLING
- Screenshot on error → Salvar para análise
- Update this file with new constraints learned
- Retry failed actions up to 2 times with exponential backoff
- If CAPTCHA detected → STOP and save session
- If "Commercial use limit" → STOP and notify

## METRICS TO TRACK
- Connections sent today/week
- Connections accepted (track manually or via scraper)
- Messages sent today
- Reply rate (if trackable via notifications)
- Errors encountered
- Profiles skipped (and reason)

## SUPABASE TABLES

### linkedin_leads
```sql
CREATE TABLE linkedin_leads (
    id SERIAL PRIMARY KEY,
    linkedin_url TEXT UNIQUE NOT NULL,
    full_name TEXT,
    first_name TEXT,
    headline TEXT,
    company TEXT,
    title TEXT,
    location TEXT,
    industry TEXT,
    connections_count INTEGER,
    source TEXT,
    icp_score INTEGER,
    priority TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### linkedin_connections_sent
```sql
CREATE TABLE linkedin_connections_sent (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES linkedin_leads(id),
    linkedin_url TEXT NOT NULL,
    connection_note TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    sent_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    account_used TEXT
);
```

### linkedin_messages_sent
```sql
CREATE TABLE linkedin_messages_sent (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES linkedin_leads(id),
    linkedin_url TEXT NOT NULL,
    message_sent TEXT,
    template_used TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT NOW(),
    account_used TEXT
);
```

### linkedin_dm_runs
```sql
CREATE TABLE linkedin_dm_runs (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    mode TEXT, -- 'connection' or 'message'
    connections_sent INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_log TEXT,
    account_used TEXT
);
```

## EXECUTION MODES

### 1. Login Only
```bash
python linkedin_dm_agent.py --login-only
```
- Abre browser, faz login, salva sessão
- Útil para setup inicial ou 2FA

### 2. Connection Mode
```bash
python linkedin_dm_agent.py --mode connection --limit 20
```
- Envia connection requests
- Usa nota personalizada de 300 chars
- Respeta limite diário

### 3. Message Mode
```bash
python linkedin_dm_agent.py --mode message --limit 30
```
- Envia mensagens para conexões existentes
- Usa templates completos
- Respeta limite diário

### 4. Hybrid Mode
```bash
python linkedin_dm_agent.py --mode hybrid
```
- Primeiro envia connections para novos leads
- Depois envia mensagens para conexões recentes que aceitaram

## BEST HOURS TO RUN
- **Terça a Quinta**: 9h-11h, 14h-16h (maior taxa de aceite)
- **Segunda e Sexta**: 10h-12h (ok, mas menor engajamento)
- **EVITAR**: Fins de semana, antes das 8h, após 18h
