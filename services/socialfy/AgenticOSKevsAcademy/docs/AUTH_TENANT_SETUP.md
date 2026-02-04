# Auth & Tenant Isolation - Setup Guide

Este guia explica como configurar e testar a autenticação multi-tenant no AgenticOS.

## 📁 Arquivos Criados

```
migrations/
  └── 009_auth_tenant.sql    # SQL para criar tabelas e RLS

implementation/
  ├── auth_middleware.py      # Middleware FastAPI para JWT
  ├── auth_routes.py          # Endpoints de autenticação
  └── api_server.py           # Modificado para incluir auth
```

## 🚀 Setup - Passo a Passo

### 1. Executar Migration no Supabase

Acesse o **SQL Editor** no Supabase Dashboard e execute:

```sql
-- Copie e cole o conteúdo de migrations/009_auth_tenant.sql
```

Ou via CLI:

```bash
# Se tiver psql configurado:
psql "$SUPABASE_DB_URL" -f migrations/009_auth_tenant.sql
```

**O que a migration faz:**
- ✅ Cria tabela `tenants` com link para `auth.users`
- ✅ Adiciona coluna `tenant_id` em `growth_leads`
- ✅ Habilita RLS em ambas as tabelas
- ✅ Cria policies para isolamento de dados
- ✅ Cria trigger para auto-criar tenant no signup

### 2. Adicionar Dependência

```bash
pip install PyJWT
```

Ou adicione ao `requirements.txt`:
```
PyJWT>=2.8.0
```

### 3. Configurar Variáveis de Ambiente (Opcional)

Para validação mais segura do JWT, configure:

```bash
# .env
SUPABASE_JWT_SECRET=your-jwt-secret  # Encontre em Settings > API > JWT Secret
```

## 🧪 Testando

### 1. Testar Signup

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@empresa.com",
    "password": "senha12345",
    "company_name": "Minha Empresa"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Conta criada com sucesso! Verifique seu email para confirmar.",
  "user_id": "uuid-do-usuario",
  "email": "teste@empresa.com",
  "access_token": "eyJhbGci..."
}
```

### 2. Testar Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@empresa.com",
    "password": "senha12345"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "teste@empresa.com"
  }
}
```

### 3. Testar Endpoint Autenticado

```bash
# Salve o access_token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# GET /api/auth/me
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "id": "uuid-do-usuario",
  "email": "teste@empresa.com",
  "full_name": null,
  "tenant": {
    "id": "uuid-do-tenant",
    "company_name": "Minha Empresa",
    "plan": "free",
    "plan_limits": {
      "max_leads": 100,
      "max_messages_per_day": 50
    }
  }
}
```

### 4. Testar Leads Isolados por Tenant

```bash
# Criar um lead (autenticado)
curl -X POST http://localhost:8000/api/v2/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instagram_username": "testuser",
    "name": "Test User",
    "lead_temperature": "warm"
  }'

# Listar leads do tenant
curl http://localhost:8000/api/v2/leads \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Testar Dashboard

```bash
curl http://localhost:8000/api/v2/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

## 🔐 Usando API Key (para n8n/webhooks)

Para serviços internos que não têm JWT, use a API key:

```bash
curl http://localhost:8000/api/v2/dashboard \
  -H "X-API-Key: socialfy-secret-2024"
```

## ✅ Critérios de Aceitação

| Critério | Status | Como Verificar |
|----------|--------|----------------|
| Tabela tenants criada | ⬜ | `SELECT * FROM tenants LIMIT 1;` |
| RLS ativo em growth_leads | ⬜ | `SELECT rowsecurity FROM pg_tables WHERE tablename='growth_leads';` |
| Middleware valida JWT | ⬜ | Teste com token inválido retorna 401 |
| Endpoint /api/auth/me funciona | ⬜ | Teste com token válido retorna dados |
| Dados isolados por tenant | ⬜ | Dois usuários não veem leads um do outro |

## 🔍 Verificar RLS no Supabase

```sql
-- Ver se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'growth_leads');

-- Ver policies criadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Testar isolamento (como usuário específico)
-- Isso só funciona se você tiver configurado um usuário para teste
SELECT set_config('request.jwt.claim.sub', 'uuid-do-usuario', true);
SELECT * FROM growth_leads;  -- Deve retornar apenas leads do tenant do usuário
```

## 📊 Planos e Limites

| Plano | max_leads | max_messages/day | max_accounts | Features |
|-------|-----------|------------------|--------------|----------|
| free | 100 | 50 | 1 | basic_scraping, lead_scoring |
| starter | 500 | 200 | 3 | + auto_dm, templates |
| pro | 2000 | 1000 | 10 | + analytics, api_access |
| enterprise | ∞ | ∞ | ∞ | all |

Para alterar limites:

```sql
UPDATE tenants 
SET plan = 'pro',
    plan_limits = '{
      "max_leads": 2000,
      "max_messages_per_day": 1000,
      "max_accounts": 10,
      "features": ["basic_scraping", "lead_scoring", "auto_dm", "templates", "analytics", "api_access"]
    }'::jsonb
WHERE id = 'uuid-do-tenant';
```

## 🐛 Troubleshooting

### "Auth modules not loaded"
- Verifique se `auth_middleware.py` e `auth_routes.py` estão na pasta `implementation/`
- Verifique se PyJWT está instalado: `pip install PyJWT`

### 401 Unauthorized
- Token expirado - faça login novamente
- Token inválido - verifique se o SUPABASE_URL está correto

### 403 Forbidden
- Tenant suspenso - verifique `status` na tabela tenants
- Limite de plano atingido - faça upgrade ou ajuste limites

### RLS não filtra dados
- Verifique se RLS está habilitado: `ALTER TABLE growth_leads ENABLE ROW LEVEL SECURITY;`
- Verifique se as policies foram criadas: `SELECT * FROM pg_policies WHERE tablename='growth_leads';`

## 📝 Próximos Passos

1. **Adicionar billing/payments** - Integrar com Stripe para upgrades de plano
2. **Migrar dados existentes** - Script para atribuir leads antigos a tenants
3. **Admin dashboard** - Painel para gerenciar tenants e planos
4. **Rate limiting por tenant** - Limites de API baseados no plano
