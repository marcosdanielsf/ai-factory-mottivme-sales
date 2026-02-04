# 📱 Instagram Onboarding API

Sistema para conectar contas Instagram via `sessionid` cookie.

## Visão Geral

O Instagram Onboarding permite que usuários conectem suas contas Instagram de forma segura:

1. Usuário obtém o `sessionid` do cookie do Instagram
2. Envia para a API
3. API valida a sessão fazendo request ao Instagram
4. Se válida, encripta e salva no banco
5. Conta fica disponível para automação

## Setup

### 1. Rodar Migration

Execute a migration para criar a tabela `instagram_sessions`:

```bash
# Via Supabase CLI
supabase db push migrations/010_instagram_sessions.sql

# Ou via psql direto
psql -h your-host -U postgres -d postgres -f migrations/010_instagram_sessions.sql
```

### 2. Configurar Chave de Encriptação

Gere uma chave Fernet e adicione ao `.env`:

```bash
# Gerar chave (rode no Python)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Exemplo de output:
# r8f2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4=
```

Adicione ao `.env`:
```env
ENCRYPTION_KEY=sua_chave_gerada_aqui
```

### 3. Instalar Dependências

```bash
pip install cryptography>=41.0.0
```

## Endpoints

### POST /api/instagram/connect

Conecta uma nova conta Instagram.

**Request:**
```json
{
  "session_id": "12345678901234567890%3AABCDEF...",
  "tenant_id": "seu-tenant-uuid"
}
```

**Headers:**
- `X-Tenant-ID`: Alternativa ao tenant_id no body

**Response (sucesso):**
```json
{
  "success": true,
  "username": "exemplo",
  "user_id_ig": "1234567890",
  "full_name": "Nome Exemplo",
  "followers": 1234,
  "following": 567,
  "is_business": true,
  "is_verified": false,
  "profile_pic_url": "https://...",
  "message": "Successfully connected @exemplo"
}
```

**Response (erro):**
```json
{
  "success": false,
  "username": "",
  "error": "Session expired or invalid. Please get a new sessionid."
}
```

### GET /api/instagram/accounts

Lista contas conectadas do tenant.

**Headers:**
- `X-Tenant-ID`: (obrigatório)

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": "uuid-da-sessao",
      "username": "exemplo",
      "user_id_ig": "1234567890",
      "full_name": "Nome Exemplo",
      "profile_pic_url": "https://...",
      "followers_count": 1234,
      "following_count": 567,
      "is_business": true,
      "is_verified": false,
      "status": "active",
      "last_validated_at": "2025-01-29T12:00:00Z",
      "created_at": "2025-01-29T10:00:00Z"
    }
  ],
  "count": 1
}
```

### DELETE /api/instagram/accounts/{username}

Remove uma conta conectada.

**Headers:**
- `X-Tenant-ID`: (obrigatório)

**Response:**
```json
{
  "success": true,
  "username": "exemplo",
  "message": "Successfully removed @exemplo"
}
```

### POST /api/instagram/accounts/{username}/validate

Re-valida se a sessão ainda funciona.

**Headers:**
- `X-Tenant-ID`: (obrigatório)

**Response:**
```json
{
  "success": true,
  "username": "exemplo",
  "status": "active",
  "is_valid": true,
  "followers": 1234
}
```

## Como Obter o Session ID

### Método 1: DevTools (Recomendado)

1. Abra o Instagram no navegador e faça login
2. Abra DevTools (F12)
3. Vá para Application → Cookies → instagram.com
4. Encontre o cookie `sessionid`
5. Copie o valor (ex: `12345678901234567890%3AABCDEFghijKLMNop...`)

### Método 2: Extensão de Navegador

Use extensões como "EditThisCookie" ou "Cookie Editor" para copiar cookies facilmente.

## Segurança

### Encriptação

- Session IDs são encriptados com **Fernet (AES-128-CBC + HMAC)**
- A chave de encriptação vem da variável `ENCRYPTION_KEY`
- Nunca armazenamos session IDs em texto plano

### Validação

- Antes de aceitar uma sessão, validamos contra a API do Instagram
- Se a sessão for inválida/expirada, retornamos erro claro

### Audit Log

- Todas as operações são registradas em `instagram_sessions_audit`
- Inclui IP e User-Agent quando disponíveis

## Status da Sessão

| Status | Descrição |
|--------|-----------|
| `active` | Sessão válida e funcionando |
| `expired` | Sessão expirou - precisa reconectar |
| `blocked` | Instagram bloqueou a conta |
| `pending_validation` | Aguardando primeira validação |

## Integração com Automação

Para usar a sessão na automação (DM Agent), use o endpoint interno:

```bash
GET /api/instagram/accounts/{username}/session
Headers:
  X-Tenant-ID: seu-tenant
  X-API-Key: sua-api-key-secreta
```

Retorna o session_id decriptado para uso no agente.

## Testes

### Validar uma Sessão (CLI)

```bash
cd implementation
python instagram_onboarding.py validate --session-id "SEU_SESSION_ID"
```

### Testar Configuração

```bash
python instagram_onboarding.py test
```

### cURL - Conectar Conta

```bash
curl -X POST http://localhost:8000/api/instagram/connect \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: seu-tenant-uuid" \
  -d '{
    "session_id": "12345678901234567890%3AABCDEF..."
  }'
```

### cURL - Listar Contas

```bash
curl http://localhost:8000/api/instagram/accounts \
  -H "X-Tenant-ID: seu-tenant-uuid"
```

## Troubleshooting

### "Encryption not configured"

A chave `ENCRYPTION_KEY` não está definida. Gere uma:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### "Session expired or invalid"

O session_id não é mais válido. Possíveis causas:
- Login expirou (Instagram expira sessões periodicamente)
- Usuário fez logout
- Instagram detectou atividade suspeita

Solução: Obtenha um novo session_id.

### "Rate limited by Instagram"

Muitas requisições. Aguarde alguns minutos e tente novamente.

### "Decryption failed"

A chave `ENCRYPTION_KEY` mudou ou os dados estão corrompidos.
Se a chave mudou, as sessões antigas não poderão ser decriptadas.

## Arquivos

```
implementation/
├── encryption.py           # Módulo de criptografia (Fernet)
├── instagram_onboarding.py # Endpoints da API
└── api_server.py           # Inclui o router

migrations/
└── 010_instagram_sessions.sql  # Tabela + audit + indexes
```
