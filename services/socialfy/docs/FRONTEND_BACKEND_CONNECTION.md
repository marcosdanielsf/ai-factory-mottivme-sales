# 🔌 Frontend Connection - Guia de Configuração

Este documento descreve as alterações feitas para conectar o frontend Socialfy ao backend real (AgenticOS + Supabase).

## 📦 Arquivos Criados/Modificados

### Novos Arquivos

1. **`hooks/useInstagramAccounts.ts`**
   - Hook completo para gerenciar contas Instagram
   - Funções: `createAccount`, `deleteAccount`, `validateSession`, `refetch`
   - Integra com AgenticOS API + Supabase para persistência

2. **`components/settings/ConnectInstagram.tsx`**
   - Interface completa para conectar contas Instagram
   - Form para adicionar nova conta (username + session_id)
   - Lista de contas conectadas com status
   - Botões de refresh e delete

3. **`supabase/migrations/20250129_create_instagram_accounts.sql`**
   - Migração SQL para criar tabela `instagram_accounts`
   - Row Level Security configurado por tenant
   - Índices para performance

### Arquivos Modificados

1. **`contexts/AuthContext.tsx`**
   - Adicionado suporte a `Tenant` e `UserProfile`
   - SignUp agora cria tenant automaticamente
   - Busca profile e tenant após login
   - Tradução de erros para português

2. **`components/views/SettingsView.tsx`**
   - Nova aba "Integrações" com `ConnectInstagram`
   - Botão de logout adicionado
   - Mostra dados do usuário logado
   - Textos traduzidos para português

3. **`hooks/index.ts`**
   - Exporta novo hook `useInstagramAccounts`

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente (.env)

```env
# Supabase (já configurado)
VITE_SUPABASE_URL=https://bfumywvwubvernvhjehk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# AgenticOS API
VITE_AGENTICOS_API_URL=https://agenticoskevsacademy-production.up.railway.app
```

### 2. Migração do Banco de Dados

Execute a migração SQL no Supabase:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no Supabase Dashboard:
# 1. Vá em SQL Editor
# 2. Cole o conteúdo de supabase/migrations/20250129_create_instagram_accounts.sql
# 3. Execute
```

### 3. Tabelas Necessárias

O sistema espera as seguintes tabelas no Supabase:

- `instagram_accounts` - Contas Instagram conectadas
- `growth_leads` - Leads capturados (já existe)
- `organizations` ou `tenants` - Tenants/workspaces
- `users` ou `socialfy_users` - Perfis de usuário

## 🧪 Como Testar

### 1. Iniciar o Frontend

```bash
cd /Users/marcosdaniels/Projects/mottivme/1.\ ai-factory-mottivme-sales/4.\ socialfy-platform

# Instalar dependências (se necessário)
npm install

# Iniciar em modo dev
npm run dev
```

### 2. Testar Login

1. Acesse http://localhost:5173
2. Faça login com uma conta existente ou crie nova
3. Após login, deve redirecionar para o dashboard

### 3. Testar Signup com Criação de Tenant

1. Na tela de login, clique em "Criar conta"
2. Preencha: Nome, Email, Senha
3. Um tenant será criado automaticamente
4. Verifique no Supabase se o tenant foi criado

### 4. Testar Conexão de Instagram

1. Após logado, vá em **Settings** → **Integrações**
2. Clique em "Adicionar Conta"
3. Informe:
   - **Username**: @seu_usuario
   - **Session ID**: (obter do cookie do Instagram)
4. Clique em "Conectar Conta"
5. A conta deve aparecer na lista

### 5. Como Obter Session ID do Instagram

1. Faça login no Instagram pelo navegador (desktop)
2. Abra DevTools (F12)
3. Vá em Application → Cookies → instagram.com
4. Encontre o cookie `sessionid`
5. Copie o valor completo

### 6. Verificar Dados Reais no Dashboard

1. O dashboard deve mostrar métricas de `growth_leads`
2. Se houver leads no banco, aparecerão no dashboard
3. Se não houver, métricas zeradas são esperadas

## ✅ Checklist de Validação

- [ ] Login funciona com Supabase Auth
- [ ] Signup cria usuário + tenant no banco
- [ ] Rotas são protegidas (redirect se não logado)
- [ ] Tela de Settings aparece após login
- [ ] Aba "Integrações" mostra componente ConnectInstagram
- [ ] Formulário de adicionar conta funciona
- [ ] Contas aparecem na lista após adicionar
- [ ] Botão de deletar remove a conta
- [ ] Dashboard mostra dados de growth_leads (ou métricas zeradas)
- [ ] Sem erros no console do browser

## 🐛 Troubleshooting

### Erro: "Table instagram_accounts doesn't exist"

Execute a migração SQL no Supabase.

### Erro: "User not authenticated"

Verifique se o login foi bem sucedido e o token está no localStorage.

### Erro de CORS ao chamar AgenticOS

O AgenticOS API precisa permitir CORS do localhost:5173.

### Dados não aparecem no dashboard

1. Verifique se há dados em `growth_leads` no Supabase
2. Verifique se o `location_id` ou `tenant_id` está correto
3. Confira o console para erros de fetch

## 📝 Próximos Passos

1. **Implementar validação real de session_id** - Atualmente usa validação básica
2. **Adicionar suporte a múltiplos tenants** - Switch entre workspaces
3. **Implementar webhooks para status de conta** - Receber updates do AgenticOS
4. **Adicionar notificações toast** - Feedback visual de ações
5. **Implementar rate limiting visual** - Mostrar uso do dia

---

**Atualizado em:** 2025-01-29
**Autor:** Subagent executor-frontend
