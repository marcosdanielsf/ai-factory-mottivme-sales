# 🔗 LinkedIn DM Agent - Guia Completo de Setup

## 📋 Visão Geral

O LinkedIn DM Agent automatiza prospecção B2B:
- Envia **connection requests** com nota personalizada
- Envia **mensagens de follow-up** para conexões aceitas
- Respeita rate limits pra evitar restrições
- Salva tudo no Supabase pra tracking

---

## 🚀 PASSO 1: Criar Tabelas no Supabase

### 1.1 Acessar SQL Editor
1. Abra: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk
2. Menu lateral → **SQL Editor**
3. Clique **+ New Query**

### 1.2 Executar Migration
Cole todo o conteúdo de `database/linkedin_tables.sql` e clique **Run**.

Ou execute cada bloco separadamente:

```sql
-- Tabela de Leads
CREATE TABLE IF NOT EXISTS linkedin_leads (
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
    priority TEXT CHECK (priority IN ('hot', 'warm', 'cold', 'skip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections Enviadas
CREATE TABLE IF NOT EXISTS linkedin_connections_sent (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES linkedin_leads(id),
    linkedin_url TEXT NOT NULL,
    connection_note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    account_used TEXT NOT NULL
);

-- Mensagens Enviadas
CREATE TABLE IF NOT EXISTS linkedin_messages_sent (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES linkedin_leads(id),
    linkedin_url TEXT NOT NULL,
    message_sent TEXT,
    template_used TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'replied')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_at TIMESTAMP WITH TIME ZONE,
    account_used TEXT NOT NULL
);

-- Log de Execuções
CREATE TABLE IF NOT EXISTS linkedin_dm_runs (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    mode TEXT NOT NULL CHECK (mode IN ('connection', 'message', 'hybrid')),
    connections_sent INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_log TEXT,
    account_used TEXT NOT NULL
);

-- Stats Diárias
CREATE TABLE IF NOT EXISTS linkedin_daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    account_used TEXT NOT NULL,
    connections_sent INTEGER DEFAULT 0,
    connections_accepted INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_replied INTEGER DEFAULT 0,
    UNIQUE(date, account_used)
);
```

### 1.3 Criar Índices (performance)
```sql
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_url ON linkedin_leads(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_priority ON linkedin_leads(priority);
CREATE INDEX IF NOT EXISTS idx_linkedin_conn_url ON linkedin_connections_sent(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_conn_status ON linkedin_connections_sent(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_msg_url ON linkedin_messages_sent(linkedin_url);
```

---

## 🔐 PASSO 2: Configurar Credenciais

### 2.1 Editar .env
```bash
cd ~/Projects/mottivme/1.\ ai-factory-mottivme-sales/4.\ socialfy-platform/AgenticOSKevsAcademy
nano .env
```

### 2.2 Adicionar variáveis do LinkedIn
```env
# LinkedIn Credentials
LINKEDIN_EMAIL=seu_email@exemplo.com
LINKEDIN_PASSWORD=sua_senha_aqui

# Rate Limits (não mexer a menos que saiba o que está fazendo)
LINKEDIN_CONN_PER_DAY=20
LINKEDIN_CONN_PER_WEEK=100
LINKEDIN_MSG_PER_DAY=50
```

### ⚠️ IMPORTANTE sobre a conta LinkedIn:
- Use uma conta **secundária** para testes iniciais
- Contas novas têm limites mais baixos
- Perfil deve estar **completo** (foto, headline, experiência)
- Evite VPN (LinkedIn detecta mudança de IP)

---

## 📥 PASSO 3: Obter Leads

### Opção A: Sales Navigator (Recomendado)
1. Acesse: https://www.linkedin.com/sales/
2. Faça uma busca com filtros (cargo, empresa, localização)
3. Selecione os leads desejados
4. **Export to CSV** (precisa de plano pago)

### Opção B: Busca Manual + Copy/Paste
1. Faça busca no LinkedIn: https://www.linkedin.com/search/results/people/
2. Copie as URLs dos perfis manualmente
3. Cole num arquivo CSV:
```csv
linkedin_url,full_name,headline,company
https://linkedin.com/in/joaosilva,João Silva,CEO at TechCo,TechCo
https://linkedin.com/in/mariaoliveira,Maria Oliveira,Diretora Marketing,GrowthCo
```

### Opção C: Scraper (Apify/PhantomBuster)
Você já tem PhantomBuster configurado! Pode usar:
- **LinkedIn Search Export** - exporta resultados de busca
- **LinkedIn Profile Scraper** - scrapa perfis em massa

### Opção D: Dados de Teste
```bash
cd ~/Projects/mottivme/1.\ ai-factory-mottivme-sales/4.\ socialfy-platform/AgenticOSKevsAcademy
python scripts/populate_linkedin_leads.py --sample
```

---

## 📤 PASSO 4: Importar Leads pro Supabase

### 4.1 Formato do CSV
O script aceita vários formatos. Colunas reconhecidas:
- `linkedin_url` ou `Profile URL` ou `url`
- `full_name` ou `Name` ou `First Name` + `Last Name`
- `headline` ou `Title`
- `company` ou `Company`
- `title` ou `Job Title`
- `location` ou `Location`
- `industry` ou `Industry`

### 4.2 Importar
```bash
# Ativar ambiente virtual
source .venv/bin/activate

# Importar CSV
python scripts/populate_linkedin_leads.py --file ~/Downloads/leads.csv
```

O script vai:
1. Ler o CSV
2. Calcular ICP score automaticamente (baseado em cargo/empresa)
3. Classificar como hot/warm/cold
4. Inserir no Supabase

### 4.3 Verificar no Supabase
1. Acesse: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk
2. **Table Editor** → `linkedin_leads`
3. Deve ver os leads importados com score e priority

---

## 🔐 PASSO 5: Primeiro Login (Salvar Sessão)

### 5.1 Rodar em modo login
```bash
cd ~/Projects/mottivme/1.\ ai-factory-mottivme-sales/4.\ socialfy-platform/AgenticOSKevsAcademy
./run_linkedin_agent.sh
# Escolher opção 1 (Login apenas)
```

### 5.2 O que vai acontecer
1. Browser abre no LinkedIn
2. Preenche email/senha automaticamente
3. **Se pedir 2FA:** Complete manualmente no browser (tem 2 min)
4. Após login, sessão é salva em `sessions/linkedin_session.json`

### 5.3 Verificar sessão salva
```bash
ls -la sessions/linkedin_session.json
# Deve mostrar o arquivo com cookies salvos
```

---

## 🚀 PASSO 6: Rodar Campanha

### 6.1 Enviar Connection Requests
```bash
./run_linkedin_agent.sh
# Opção 2: Enviar Connection Requests
# Digitar quantidade (ex: 10 para teste inicial)
```

### 6.2 O que acontece
1. Pega leads do Supabase (ordenados por ICP score)
2. Para cada lead:
   - Abre perfil
   - Clica em "Connect"
   - Adiciona nota personalizada (300 chars)
   - Aguarda 45-90 segundos
3. Salva resultado no banco

### 6.3 Acompanhar execução
- Log em tempo real no terminal
- Logs salvos em `logs/linkedin_dm_YYYY-MM-DD.log`
- Screenshots de erros em `logs/`

---

## 💬 PASSO 7: Enviar Mensagens (após conexões aceitas)

### 7.1 Esperar aceitação
- Conexões são aceitas em 24h-7 dias
- Taxa típica: 20-40% de aceite

### 7.2 Atualizar status de conexões aceitas
Por enquanto, precisa atualizar manualmente ou criar script:
```sql
-- No Supabase SQL Editor
UPDATE linkedin_connections_sent 
SET status = 'accepted', accepted_at = NOW()
WHERE linkedin_url = 'https://linkedin.com/in/username';
```

### 7.3 Enviar mensagens
```bash
./run_linkedin_agent.sh
# Opção 3: Enviar Mensagens
```

---

## 📊 PASSO 8: Monitorar Resultados

### 8.1 Ver estatísticas
```bash
./run_linkedin_agent.sh
# Opção 5: Ver estatísticas do dia
```

### 8.2 No Supabase
```sql
-- Leads por status
SELECT * FROM linkedin_pipeline;

-- Conexões pendentes
SELECT * FROM linkedin_connections_sent WHERE status = 'pending';

-- Mensagens enviadas hoje
SELECT * FROM linkedin_messages_sent WHERE sent_at::date = CURRENT_DATE;

-- Taxa de aceite
SELECT 
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'accepted')::numeric / 
        NULLIF(COUNT(*), 0) * 100, 1
    ) as acceptance_rate
FROM linkedin_connections_sent;
```

---

## ⚠️ Rate Limits e Boas Práticas

### Limites Seguros (por dia)
| Ação | Limite Recomendado | Limite Máximo |
|------|-------------------|---------------|
| Connection Requests | 20 | 30 |
| Mensagens | 50 | 100 |
| Profile Views | 100 | 150 |

### Boas Práticas
1. **Não rode nos fins de semana** - menor taxa de aceite
2. **Melhores horários:** 9h-11h, 14h-16h (dias úteis)
3. **Personalize as notas** - evite parecer spam
4. **Varie os templates** - LinkedIn detecta padrões
5. **Pare se ver alertas** - "You've reached the limit"

### Sinais de Problema
- ⚠️ CAPTCHA aparecendo
- ⚠️ "We've restricted your account"
- ⚠️ Muitos "Connection request failed"

**Se acontecer:** Pare por 24-48h, reduza velocidade depois.

---

## 🔄 Automação com Cron (Opcional)

### Rodar automaticamente todo dia às 10h
```bash
crontab -e
```

Adicionar:
```cron
# LinkedIn Agent - 10h de segunda a sexta
0 10 * * 1-5 cd ~/Projects/mottivme/1.\ ai-factory-mottivme-sales/4.\ socialfy-platform/AgenticOSKevsAcademy && ./run_linkedin_headless.sh >> logs/cron.log 2>&1
```

### Criar script headless
```bash
#!/bin/bash
source .venv/bin/activate
python implementation/linkedin_dm_agent.py --mode connection --limit 15 --headless
```

---

## 🛠️ Troubleshooting

### "Login failed"
1. Verificar email/senha no .env
2. Deletar `sessions/linkedin_session.json`
3. Rodar `--login-only` novamente

### "Connect button not found"
- Perfil pode já ser conexão
- Perfil pode estar com limite de conexões
- Verificar screenshot em `logs/`

### "Session expired"
1. Deletar `sessions/linkedin_session.json`
2. Rodar login novamente
3. Completar 2FA se necessário

### Playwright não instalado
```bash
pip install playwright playwright-stealth
playwright install chromium
```

---

## 📁 Estrutura de Arquivos

```
AgenticOSKevsAcademy/
├── .env                              # Credenciais (NÃO COMMITAR!)
├── run_linkedin_agent.sh             # Menu interativo
│
├── implementation/
│   └── linkedin_dm_agent.py          # Código principal
│
├── config/
│   └── linkedin_dm_templates.py      # Templates de mensagem
│
├── instruction/
│   └── linkedin_dm_agent.md          # Documentação do agente
│
├── database/
│   └── linkedin_tables.sql           # Migration SQL
│
├── scripts/
│   └── populate_linkedin_leads.py    # Importar leads
│
├── sessions/
│   └── linkedin_session.json         # Cookies salvos
│
└── logs/
    ├── linkedin_dm_2026-02-04.log    # Logs do dia
    └── screenshot_*.png               # Screenshots de erro
```

---

## 🎯 Fluxo Completo Resumido

```
1. Criar tabelas (Supabase SQL Editor)
2. Configurar .env (email/senha LinkedIn)
3. Obter leads (Sales Nav / CSV / Scraper)
4. Importar leads (populate_linkedin_leads.py)
5. Login inicial (salvar sessão)
6. Rodar connections (20/dia)
7. Esperar aceites (24h-7dias)
8. Atualizar status aceitos
9. Enviar mensagens follow-up
10. Repetir 6-9
```

---

**Dúvidas?** Chama que eu ajudo! 🚀
