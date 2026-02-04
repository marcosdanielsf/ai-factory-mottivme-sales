# Socialfy Platform - Guia de Deploy

## Pré-requisitos

Antes de fazer o deploy, certifique-se de ter:

- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Supabase](https://supabase.com)
- [ ] API Key do [Anthropic Claude](https://console.anthropic.com)
- [ ] Repositório GitHub configurado
- [ ] Node.js 18+ instalado localmente

---

## 1. Configuração do Supabase

### 1.1. Criar Projeto

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha:
   - **Name:** socialfy-platform
   - **Database Password:** [escolha uma senha forte]
   - **Region:** South America (São Paulo)
4. Aguarde a criação (2-3 minutos)

### 1.2. Executar Schema SQL

1. No painel lateral, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie o conteúdo de `/supabase/schema.sql`
4. Cole no editor e clique em "Run"
5. Verifique se as tabelas foram criadas em **Table Editor**

### 1.3. Configurar Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref your-project-ref

# Deploy das Edge Functions
supabase functions deploy qualify-lead
supabase functions deploy generate-message
supabase functions deploy score-lead

# Configurar secrets das Edge Functions
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
```

### 1.4. Copiar Credenciais

1. No painel lateral, vá em **Settings > API**
2. Copie:
   - **Project URL** (exemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (começa com `eyJ...`)
3. Guarde essas credenciais para o próximo passo

---

## 2. Configuração do Vercel

### 2.1. Importar Projeto do GitHub

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "Add New... > Project"
3. Selecione o repositório `socialfy-platform`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 2.2. Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

#### Para Production e Preview:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Importante:** Essas variáveis devem estar disponíveis em **Production**, **Preview** e **Development**.

### 2.3. Deploy

1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Acesse a URL de produção (exemplo: `https://socialfy-platform.vercel.app`)

---

## 3. Configurar Deploys Automáticos

### 3.1. Branches de Deploy

O projeto está configurado para deploy automático em:

- **main** → Produção (`socialfy-platform.vercel.app`)
- **develop** → Preview (`socialfy-platform-develop.vercel.app`)

### 3.2. Pull Request Previews

Toda vez que você abrir um PR, o Vercel criará um deploy de preview automático.

---

## 4. Rodar Localmente

### 4.1. Clonar Repositório

```bash
git clone https://github.com/marcosdanielsf/socialfy-platform.git
cd socialfy-platform
```

### 4.2. Instalar Dependências

```bash
npm install
```

### 4.3. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp env.example .env
```

2. Edite `.env` e preencha com suas credenciais:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.4. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 5. Build de Produção Local

Para testar o build de produção localmente:

```bash
# Build
npm run build

# Preview
npm run preview
```

Acesse: http://localhost:4173

---

## 6. Troubleshooting

### Erro: "Failed to fetch"

**Causa:** Variáveis de ambiente do Supabase não configuradas.

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidas
2. Verifique se as variáveis começam com `VITE_` (necessário para Vite)
3. Reinicie o servidor de desenvolvimento

### Erro: "Build failed"

**Causa:** Erro de TypeScript ou dependências faltando.

**Solução:**
```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Erro: "Supabase Edge Function timeout"

**Causa:** Edge Function demorou mais de 30 segundos.

**Solução:**
1. Verifique os logs no Supabase Dashboard > Edge Functions > Logs
2. Otimize a função ou aumente o timeout no código

### Dark Mode não funciona

**Causa:** Classe `.dark` não está sendo aplicada ao `<html>`.

**Solução:**
1. Verifique o `ThemeContext.tsx`
2. Certifique-se de que `document.documentElement.classList` está sendo manipulado

### Tailwind CSS não está aplicando estilos

**Causa:** Configuração do Tailwind v4 incorreta.

**Solução:**
1. Verifique se `@tailwindcss/vite` está em `vite.config.ts`
2. Verifique se `index.css` importa `@import "tailwindcss"`
3. Reinicie o servidor

---

## 7. Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint (se configurado)
npm run lint

# Typecheck
npm run typecheck

# Deploy manual para Vercel (requer Vercel CLI)
npx vercel --prod
```

---

## 8. Atualizações de Produção

### Processo Recomendado

1. Desenvolver em branch `feature/*`
2. Abrir PR para `develop`
3. Testar no preview deploy
4. Merge para `develop`
5. Testar em staging
6. Abrir PR de `develop` para `main`
7. Deploy automático para produção

### Rollback Rápido

Se algo der errado em produção:

1. Acesse [Vercel Dashboard](https://vercel.com/marcosdanielsfs-projects/socialfy-platform)
2. Vá em **Deployments**
3. Selecione o último deploy estável
4. Clique em **⋯ > Promote to Production**

---

## 9. Monitoramento

### Vercel Analytics

- Acesse: Vercel Dashboard > Analytics
- Métricas disponíveis:
  - Pageviews
  - Time to First Byte (TTFB)
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)

### Supabase Logs

- Acesse: Supabase Dashboard > Logs
- Disponível:
  - Database logs
  - Edge Function logs
  - API logs

---

## 10. Segurança

### Checklist de Segurança

- [x] Variáveis de ambiente configuradas no Vercel (não commitadas)
- [x] HTTPS habilitado (automático no Vercel)
- [x] Headers de segurança configurados (`vercel.json`)
- [x] Row Level Security (RLS) habilitado no Supabase
- [ ] Autenticação Supabase configurada (próximo passo)
- [ ] Rate limiting nas Edge Functions (próximo passo)

### Headers de Segurança

O `vercel.json` já configura:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## 11. Contato e Suporte

**Desenvolvedor:** Marcos Daniel (MottivMe Sales)

**Links:**
- [Vercel Dashboard](https://vercel.com/marcosdanielsfs-projects/socialfy-platform)
- [Supabase Dashboard](https://app.supabase.com)
- [GitHub Repository](https://github.com/marcosdanielsf/socialfy-platform)

---

**Última atualização:** 28/12/2024
