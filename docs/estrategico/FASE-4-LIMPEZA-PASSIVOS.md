# FASE 4: LIMPEZA DE PASSIVOS E MIGRAÇÃO

**Data:** 14/01/2026
**Status:** Em Andamento
**Prioridade:** CRÍTICA para venda M&A

---

## OBJETIVO

Transferir **todas as contas e serviços** do CPF pessoal de Marcos Daniels para uma estrutura empresarial, eliminando dependências pessoais e bloqueios para venda.

---

## POR QUE ISSO É CRÍTICO

### Bloqueios para Venda Identificados

1. **Tudo no CPF do Marcos** ❌
   - Railway, Supabase, n8n, GHL em conta pessoal
   - Comprador não assume riscos de CPF de terceiro

2. **Sem separação patrimonial** ❌
   - Sem distinção entre pessoal e empresarial
   - Risco legal e fiscal

3. **Zero redundância** ❌
   - Se algo acontecer com o Marcos, tudo para
   - Continuidade de negócio comprometida

### Benefícios da Limpeza

- ✅ Business vendável (sem dependência pessoal)
- ✅ Compliance fiscal e jurídico
- ✅ Continuidade garantida
- ✅ Valuation aumentado (redução de risco)

---

## INVENTÁRIO COMPLETO DE PASSIVOS

### Serviços Críticos (Migração Imediata)

| # | Serviço | Uso | Conta Atual | Plano | Status |
|---|---------|-----|-------------|-------|--------|
| 1 | **Railway** | Backend APIs | CPF Marcos | $5/mês | ❌ Migrar |
| 2 | **Supabase** | Database + Vector | CPF Marcos | Free | ❌ Migrar |
| 3 | **n8n** | Workflows | Cliente Mentorfy | Próprio | ⚠️ Transferir |
| 4 | **GoHighLevel** | CRM | Agency Account Marcos | $97/mês/location | ❌ Migrar |
| 5 | **Vercel** | Frontend hosting | CPF Marcos | Hobby plan | ❌ Migrar |
| 6 | **OpenAI** | LLM API | CPF Marcos | Pay-as-you-go | ❌ Migrar |
| 7 | **Anthropic** | LLM API | CPF Marcos | Pay-as-you-go | ❌ Migrar |
| 8 | **Meta (WhatsApp)** | Business API | CPF Marcos | Free | ❌ Migrar |
| 9 | **Stripe** | Pagamentos | Não configurado | - | ❌ Configurar |
| 10 | **Domínios** | mottivme.com.br | CPF Marcos | Anual | ❌ Transferir |

### Serviços Secundários

| # | Serviço | Uso | Conta Atual | Prioridade |
|---|---------|-----|-------------|------------|
| 11 | **GitHub** | Código-fonte | CPF Marcos | Alta |
| 12 | **Google Workspace** | Email, Docs | CPF Marcos | Média |
| 13 | **Notion** | Documentação | CPF Marcos | Média |
| 14 | **Figma** | Design | CPF Marcos | Baixa |
| 15 | **Slack** | Comunicação | CPF Marcos | Baixa |

---

## ESTRUTURA EMPRESARIAL RECOMENDADA

### Opção 1: Criar Nova Empresa (Clean Slate)

**Vantagens:**
- ✅ Zero passivos pré-existentes
- ✅ Estrutura limpa para comprador
- ✅ Separação total de patrimônio

**Desvantagens:**
- ❌ Tempo de constituição (30-60 dias)
- ❌ Custos de abertura (R$ 2-5k)
- ❌ Precisa de contador desde dia 1

**Estrutura Sugerida:**

```
Mottivme Tecnologia Ltda (ou S.A.)
CNPJ: [NOVO]
├── Sócio 1: Marcos Daniels (99%)
├── Sócio 2: Cônjuge/Filha (1%) - sucessão
└── Capital Social: R$ 10.000 (mínimo LTDA)
```

### Opção 2: Usar Empresa Existente

**Se você já tem empresa:**

```
[NOME EMPRESA EXISTENTE] Ltda
CNPJ: [EXISTENTE]
└── Atividade econômica: Adicionar "desenvolvimento de software"
```

**Vantagens:**
- ✅ Imediato (já existe)
- ✅ Sem custos de abertura

**Desvantagens:**
- ❌ Pode ter passivos ocultos
- ❌ Mix de atividades pode confundir due diligence

---

## ORDEM DE MIGRAÇÃO (CRÍTICO)

### Fase 1: Preparação (Semana 1)

**Passo 1: Criar/Preparar Empresa**

- [ ] Decidir: Nova empresa vs existente
- [ ] Se nova: Constituir empresa (30-60 dias)
- [ ] Se existente: Verificar CNPJ, contrato social
- [ ] Obter documentos:
  - [ ] CNPJ (cartão CNPJ digital)
  - [ ] Contrato social
  - [ ] Comprovante de endereço
  - [ ] Documentos dos sócios

**Passo 2: Criar Infraestrutura Financeira**

- [ ] Abertura de conta PJ (banco digital recomendado):
  - [ ] Inter, Nubank, Neon, C6
  - [ ] Requer: CNPJ + documentos sócios
- [ ] Emissor de cartão crédito PJ (opcional):
  - [ ] Para pagar serviços internacionais
- [ ] Contador para issuing de NF:

**Passo 3: Email Corporativo**

- [ ] Configurar email corporativo:
  - [ ] contato@mottivme.com.br
  - [ ] financeiro@mottivme.com.br
  - [ ] suporte@mottivme.com.br
  - [ ] ops@mottivme.com.br

---

### Fase 2: Migração de Serviços Críticos (Semana 2-4)

#### Serviço 1: Railway (PRIORIDADE MÁXIMA)

**Por que primeiro:** Backend APIs dependem disso

**Passos:**

```bash
# 1. Criar conta Railway para empresa
# Acessar: https://railway.app/
# Criar nova conta com email corporativo

# 2. Criar novo projeto Railway
railway login  # com conta corporativa
railway new --name mottivme-production

# 3. Migrar serviços um por um
railway add  # adicionar cada serviço
railway up   # deploy
railway domain  # configurar domínio customizado

# 4. Atualizar variáveis de ambiente
railway variables set OPENAI_API_KEY=sk-...
railway variables set SUPABASE_URL=...
railway variables set ANTHROPIC_API_KEY=...

# 5. Testar novo ambiente
curl https://[novo-dominio].up.railway.app/health

# 6. Atualizar DNS
# Apontar domínio para novo projeto Railway

# 7. Remover projeto antigo (APÓS confirmação)
railway destroy  # na conta pessoal
```

**Checklist:**
- [ ] Conta Railway corporativa criada
- [ ] Todos os serviços migrados
- [ ] Variáveis de ambiente configuradas
- [ ] Health checks passando
- [ ] Domínio atualizado
- [ ] Projeto antigo removido
- [ ] Custos sendo cobrados na conta corporativa

**Risco:** Downtime durante migração
**Mitigação:** Fazer em madrugada, ter rollback pronto

---

#### Serviço 2: Supabase (PRIORIDADE MÁXIMA)

**Por que segundo:** Database não pode parar

**Passos:**

```sql
-- 1. Criar projeto Supabase corporativo
-- Acessar: https://supabase.com/
-- Criar novo projeto com email corporativo

-- 2. Migration planejada
-- Fazer backup completo do projeto atual:
-- Dashboard > Database > Backups > Download

-- 3. Restore no novo projeto
-- Dashboard > Database > Backups > Restore

-- 4. Atualizar application URLs
-- Dashboard > Settings > API
-- Copiar nova URL e keys

-- 5. Migrar Edge Functions
-- CLI: supabase functions deploy --project-ref [NOVO-PROJETO]

-- 6. Atualizar Railway variables
-- RAILWAY_TOKEN com novas credenciais Supabase

-- 7. Migrar storage (se houver arquivos)
-- Download + upload manual ou via CLI
```

**Checklist:**
- [ ] Projeto Supabase corporativo criado
- [ ] Backup completo baixado
- [ ] Database restaurado no novo projeto
- [ ] Edge Functions migradas
- [ ] Storage migrado
- [ ] Railway apontando para novo Supabase
- [ ] Testes integrados passando
- [ ] Projeto antigo removido (APÓS 30 dias)

**Risco:** Perda de dados
**Mitigação:** Triplo backup (local + 2 clouds)

---

#### Serviço 3: n8n

**Situação:** Self-hosted em `cliente-a1.mentorfy.io`

**Passos:**

```bash
# 1. Transferir domínio mentorfy.io para empresa
# Contactar registrador (ex: Namecheap, GoDaddy)
# Alterar registrant contact para empresa

# 2. Atualizar whois/registrant
# Nome da empresa
# CNPJ da empresa
# Email corporativo

# 3. Transferir acesso do servidor
# Se VPS: transferir acesso para time corporativo
# Se Docker local: documentar acesso

# 4. Criar conta n8n cloud corporativa (opcional)
# Acessar: https://n8n.io/cloud/
# Criar conta corporativa

# 5. Export workflows do n8n atual
# n8n export:workflow --all > workflows-backup.json

# 6. Import na nova conta
# n8n import:workflow --input workflows-backup.json

# 7. Testar workflows críticos
# Executar manualmente cada workflow principal
```

**Checklist:**
- [ ] Domínio mentorfy.io transferido para empresa
- [ ] Acesso ao servidor documentado
- [ ] Workflows exportados (backup)
- [ ] Workflows importados em nova conta (se cloud)
- [ ] Webhooks atualizados (se mudou URL)
- [ ] Testes de workflows passando
- [ ] Monitoramento por 7 dias antes de encerrar antigo

---

#### Serviço 4: GoHighLevel

**Situação:** Agency Account pessoal + múltiplas locations

**Passos:**

```bash
# 1. Criar nova Agency Account corporativa
# Acessar: https://app.gohighlevel.com/
# Sign up como Agency com email corporativo

# 2. Para cada sub-account (location):
# Opção A: Transferir location
# - Location Settings > Transfer Ownership
# - Colocar email da nova agency

# Opção B: Criar novas locations
# - Re-onboarding do cliente (trabalhoso)
# - Usar apenas se transferência não for possível

# 3. Migrar workflows e automações
# Exportar/importar manualmente

# 4. Atualizar webhooks externos
# n8n, Railway, Supabase devem apontar para nova location

# 5. Atualizar integrações
# WhatsApp API
# Stripe (quando configurado)
# Outras ferramentas
```

**Checklist:**
- [ ] Agency Account corporativa criada
- [ ] Todas as locations transferidas ou recriadas
- [ ] Workflows migrados
- [ ] Webhooks atualizados
- [ ] Clientes notificados da mudança (se aplicável)
- [ ] Testes de integração passando
- [ ] Agency antiga cancelada (APÓS 30 dias)

**Comunicação com Cliente:**

```
Olá [NOME],

Estamos migrando nossa infraestrutura para uma
empresa dedicada, garantindo mais segurança e
estabilidade para você.

Mudanças previstas:
- [X] Seus dados permanecem os mesmos
- [X] Seu agente IA continua funcionando igual
- [X] Webhook do GHL será atualizado automaticamente
- [ ] Possível downtime de 5-10 min em [DATA/HORA]

Qualquer dúvida, estou à disposição.

Atenciosamente,
Marcos Daniels - Mottivme
```

---

#### Serviço 5: Vercel (Frontend)

**Passos:**

```bash
# 1. Criar conta Vercel corporativa
# Acessar: https://vercel.com/
# Sign up com email corporativo

# 2. Criar novo team
# Settings > Teams > Create Team
# Nome: "Mottivme"

# 3. Para cada projeto (frontend):
# Importar projeto para novo team
# Vercel > Import Project > [Git repo]
# Configurar environment variables
# Deploy

# 4. Atualizar domínios customizados
# Domains > Add Domain
# Configurar DNS

# 5. Testar aplicações
# socialfy-platform.vercel.app
# [outros frontends]

# 6. Remover projetos da conta pessoal
# (APÓS 30 dias de confirmação)
```

**Checklist:**
- [ ] Conta Vercel corporativa criada
- [ ] Team Mottivme criado
- [ ] Todos os frontends migrados
- [ ] Domínios customizados configurados
- [ ] Testes de aplicações passando
- [ ] Projetos antigos removidos

---

#### Serviço 6: OpenAI API

**Passos:**

```bash
# 1. Acessar conta OpenAI pessoal
# https://platform.openai.com/

# 2. Criar nova API key para empresa
# Settings > API Keys > Create new secret key
# Nome: "Mottivme Production"

# 3. Gerar novo billing method
# Settings > Billing > Add payment method
# Adicionar cartão corporativo

# 4. Atualizar Railway com nova key
railway variables set OPENAI_API_KEY=sk-[nova-key]

# 5. Testar integração
# Executar chamada de teste da IA

# 6. Monitorar usage por 7 dias
# Verificar se billing está correto

# 7. Remover API key antiga (APÓS confirmação)
# Settings > API Keys > Delete [key antiga]
```

**Observação:** OpenAI não permite "transferência de conta". A estratégia é:
- Criar nova key na conta pessoal mas com billing corporativo
- Ou criar nova conta corporativa (complexo)

**Recomendação:** Manter conta OpenAI pessoal mas com **cartão corporativo** para billing.

---

#### Serviço 7: Anthropic (Claude)

**Passos similares ao OpenAI:**

```bash
# 1. Acessar console Anthropic
# https://console.anthropic.com/

# 2. Criar nova API key
# Settings > API Keys > Create Key

# 3. Adicionar cartão corporativo
# Settings > Billing > Payment Methods

# 4. Atualizar Railway
railway variables set ANTHROPIC_API_KEY=sk-ant-[nova-key]

# 5. Testar integração

# 6. Remover key antiga (APÓS 7 dias)
```

---

#### Serviço 8: Meta for Business (WhatsApp)

**Passos:**

```bash
# 1. Acessar Meta Business Suite
# https://business.facebook.com/

# 2. Criar novo Business Manager corporativo
# Business Settings > Business Info > Create Business
# Nome: "Mottivme Tecnologia"
# CNPJ: [CNPJ empresa]

# 3. Transferir WhatsApp Business API
# Business Settings > Accounts > WhatsApp
# Settings > Transfer Account
# Selecionar novo Business Manager

# 4. Adicionar novo administrador
# Settings > Business App Settings > Users
# Add user com email corporativo

# 5. Atualizar access tokens
# Gerar novo token no novo Business Manager
# Atualizar n8n workflows com novo token

# 6. Testar envio de mensagens

# 7. Confirmar transferência
# Esperar confirmação de ambas as partes
```

**Checklist:**
- [ ] Business Manager corporativo criado
- [ ] WhatsApp API transferido
- [ ] Administradores corporativos adicionados
- [ ] Access tokens atualizados
- [ ] Testes de mensagens passando
- [ ] Business antigo removido (APÓS 30 dias)

---

#### Serviço 9: Stripe (Pagamentos)

**Situação:** Ainda não configurado

**Passos para Configuração Corporativa:**

```bash
# 1. Criar conta Stripe corporativa
# https://dashboard.stripe.com/register
# Preencher com dados da empresa

# 2. Verificar conta (KYC)
# Enviar documentos da empresa:
# - CNPJ
# - Contrato social
# - Comprovante de endereço
# - Documentos dos sócios

# 3. Configurar produtos e preços
# Products > Create Product
# Pricing > Create Price

# 4. Integrar com plataforma
# Adicionar Stripe SDK nos frontends
# Configurar webhooks

# 5. Testar fluxo de pagamento
# Criar checkout de teste
# Simular pagamento

# 6. Ativar modo produção
```

**Produtos para Configurar:**

| Produto | Preço BRL | Preço USD |
|---------|-----------|-----------|
| Starter | R$ 497/mês | $97/mês |
| Growth | R$ 997/mês | $197/mês |
| Scale | R$ 1.997/mês | $397/mês |
| Setup Fee | R$ 1.000-5.000 | - |

---

#### Serviço 10: Domínios (mottivme.com.br)

**Passos:**

```bash
# 1. Identificar registrador atual
# WHOIS lookup para descobrir onde está registrado
# whois mottivme.com.br

# 2. Fazer unlock do domínio
# Painel do registrador > Lock Domain > Desativar

# 3. Obter authorization code (EPP code)
# Painel > Transfer Domain > Get Auth Code

# 4. Iniciar transferência para empresa
# Criar conta de domínio corporativa
# Iniciar transferência com EPP code

# 5. Aprovar transferência
# Email de confirmação enviado para registrant
# Aprovar em ambos os lados

# 6. Atualizar DNS
# Configurar DNS para nova conta

# 7. Atualizar whois/registrant
# Nome: Mottivme Tecnologia Ltda
# CNPJ: [novo]
```

**Checklist:**
- [ ] Registrador identificado
- [ ] Domínio desbloqueado
- [ ] Authorization code obtido
- [ ] Conta corporativa criada no registrador
- [ ] Transferência iniciada
- [ ] Transferência aprovada
- [ ] DNS atualizado e funcionando
- [ ] Whois atualizado

---

### Fase 3: Serviços Secundários (Semana 5-6)

#### Serviço 11: GitHub

**Passos:**

```bash
# 1. Criar organização GitHub corporativa
# https://github.com/organizations/new

# 2. Transferir repositórios
# Para cada repo:
# Settings > Transfer Ownership > Selecione org

# 3. Configurar permissões
# Adicionar colaboradores conforme necessário
# Proteger branches principais

# 4. Atualizar remotes locais
git remote set-url origin git@github.com:mottivme/[repo].git

# 5. Atualizar CI/CD
# GitHub Actions configurado para org
```

---

#### Serviço 12: Google Workspace

**Passos:**

```bash
# 1. Criar conta Workspace corporativa
# https://workspace.google.com/
# Plano Business Starter ou Standard

# 2. Migrar emails
# Ferramenta de migração do Google
# Migrar contas pessoais para corporativas

# 3. Configurar usuários
# marcos@mottivme.com.br
# financeiro@mottivme.com.br
# suporte@mottivme.com.br
# ops@mottivme.com.br

# 4. Migrar documentos Drive
# Download + Upload ou ferramenta de migração

# 5. Configurar calendário compartilhado

# 6. Encerrar conta pessoal (APÓS 30 dias)
```

---

#### Serviço 13: Notion / Figma / Slack

**Menos crítico, mas recomendação:**

- **Notion:** Criar workspace corporativo, transferir docs
- **Figma:** Criar team corporativo, transferir projects
- **Slack:** Criar workspace corporativo, migrar canais críticos

---

## DOCUMENTAÇÃO DE CREDENCIAIS

### Criar Arquivo de Senhas Corporativo

**Localização:** `~/Documents/MOTTIVME-CREDENTIALS/`

**Estrutura:**

```
~/Documents/MOTTIVME-CREDENTIALS/
├── README.md (instruções de acesso)
├── 01-RAILWAY.md
├── 02-SUPABASE.md
├── 03-N8N.md
├── 04-GHL.md
├── 05-VERCEL.md
├── 06-OPENAI.md
├── 07-ANTHROPIC.md
├── 08-META.md
├── 09-STRIPE.md
├── 10-DOMINIOS.md
├── 11-GITHUB.md
└── 12-WORKSPACE.md
```

**Template para cada serviço:**

```markdown
# [NOME DO SERVIÇO]

## Acesso
- URL: [URL]
- Email: [email corporativo]
- Senha: [VERGER] ou senha forte
- 2FA: [configurado sim/não]

## Chaves API
- Production: [chave]
- Development: [chave]

## Billing
- Plano: [plano atual]
- Custo mensal: [valor]
- Cartão: [últimos 4 dígitos]
- Fatura dia: [dia do mês]

## Contatos
- Suporte: [link/email]
- Account Manager: [se houver]

## Notas
[qualquer observação importante]

## Histórico de Mudanças
| Data | Mudança | Responsável |
|------|---------|-------------|
```

**SEGURANÇA:**
- 🔒 Criptografar arquivo com senha forte
- 🔒 Armazenar em local seguro (não versionar no Git)
- 🔒 Compartilhar APENAS com sócios

---

## RISCOS E MITIGAÇÕES

### Risco 1: Downtime Durante Migração

**Probabilidade:** Alta
**Impacto:** Alto

**Mitigação:**
- Fazer migrações em madrugada (2-5am)
- Ter plano de rollback pronto
- Comunicar clientes com antecedência
- Testar tudo em staging antes

### Risco 2: Perda de Dados

**Probabilidade:** Baixa
**Impacto:** Crítico

**Mitigação:**
- Triplo backup antes de cada migração
- Testar restore dos backups
- Manter backups por 90 dias pós-migração
- Documentar processo de restore

### Risco 3: Billing Duplo

**Probabilidade:** Média
**Impacto:** Médio

**Mitigação:**
- Cancelar contas antigas imediatamente após confirmação
- Monitorar faturas por 2 ciclos
- Contestar cobranças indevidas prontamente

### Risco 4: Falha de Integração

**Probabilidade:** Média
**Impacto:** Alto

**Mitigação:**
- Testar cada integração exaustivamente
- Monitorar logs por 7 dias pós-migração
- Ter suporte técnico de cada serviço na mão

---

## CRONOGRAMA COMPLETO (6 Semanas)

### Semana 1: Preparação
- [ ] Constituir/verificar empresa
- [ ] Abrir conta bancária PJ
- [ ] Configurar emails corporativos
- [ ] Criar estrutura de credenciais

### Semana 2: Railway + Supabase
- [ ] Migrar Railway (2 dias)
- [ ] Migrar Supabase (2 dias)
- [ ] Testar integrações (1 dia)
- [ ] Monitorar (2 dias)

### Semana 3: n8n + GHL
- [ ] Transferir domínio mentorfy.io
- [ ] Migrar/transferir n8n
- [ ] Criar nova Agency GHL
- [ ] Transferir locations
- [ ] Testar workflows

### Semana 4: Vercel + APIs
- [ ] Migrar Vercel
- [ ] Atualizar OpenAI billing
- [ ] Atualizar Anthropic billing
- [ ] Migrar Meta Business Manager

### Semana 5: Stripe + Domínios
- [ ] Configurar Stripe
- [ ] Transferir domínio mottivme.com.br
- [ ] Configurar DNS
- [ ] Testar pagamentos

### Semana 6: Serviços Secundários + Finalização
- [ ] Migrar GitHub
- [ ] Migrar Google Workspace
- [ ] Migrar Notion/Figma
- [ ] Cancelar todas as contas pessoais
- [ ] Auditoria final de migração
- [ ] Documentação completa

---

## CHECKLIST FINAL DE VALIDAÇÃO

### Antes de Considerar Completo

**Técnico:**
- [ ] Todos os serviços funcionando com conta corporativa
- [ ] Zero contas pessoais ativas (exceto OpenAI/Anthropic se billing corporativo)
- [ ] Todos os domínios transferidos para empresa
- [ ] Health checks passando em todos os serviços
- [ ] Monitoramento por 7 dias sem incidentes

**Financeiro:**
- [ ] Todas as faturas sendo cobradas na empresa
- [ ] Zero cobranças em CPF pessoal
- [ ] Cartões pessoais removidos de todos os serviços
- [ ] Fluxo de caixa mapeado

**Jurídico:**
- [ ] Empresa constituída e ativa
- [ ] Contrato social atualizado
- [ ] CNPJ registrado
- [ ] Alvará obtido (se necessário)
- [ ] Inscrição municipal/estadual

**Documental:**
- [ ] Todas as credenciais documentadas
- [ ] SOPs atualizados com novos dados
- [ ] Contratos com fornecedores atualizados
- [ ] Clientes notificados da mudança (se aplicável)

**Pessoal:**
- [ ] Marcos Daniels tem acesso corporativo a tudo
- [ ] Backup de acesso documentado
- [ ] Plano de sucessão definido
- [ ] Non-compete assinado (se aplicável)

---

## PÓS-MIGRAÇÃO

### Manutenção Contínua

**Mensal:**
- [ ] Revisar faturas de todos os serviços
- [ ] Atualizar documentação de credenciais
- [ ] Verificar se não há cobranças em CPF pessoal

**Trimestral:**
- [ ] Auditoria de acesso (quem tem acesso a quê)
- [ ] Rodar teste de disaster recovery
- [ ] Revisar e rotacionar senhas críticas

**Anual:**
- [ ] Renegociar contratos com fornecedores
- [ ] Revisar estrutura societária
- [ ] Atualizar valuation com novos números

---

## ESTRUTURA DE TRANSIÇÃO

### Período de Handover (Venda)

**Durante negociação de venda:**

1. **Acesso Limitado**
   - Comprador tem acesso à Data Room
   - Sem acesso a produção ainda

2. **Due Diligence**
   - Comprador revisa documentação
   - Verifica status de migração

3. **LOI (Letter of Intent)**
   - Proposta preliminar assinada
   - Acesso expandido para verificação

4. **Closing**
   - Transferência definitiva de acesso
   - Marcos Daniels sai (com non-compete)
   - Período de transição 3-6 meses (se acordado)

### Suporte Pós-Venda

**O que Marcos oferece:**
- 30 dias de suporte inclusos
- Disponível para consulta 2h/semana
- Treinamento de equipe do comprador
- Documentação completa de tudo

**O que NÃO está incluído:**
- Trabalho operacional contínuo
- Desenvolvimento de novas features
- Gestão de clientes (exceto handover)

---

## NOTAS IMPORTANTES

1. **NÃO fazer todas as migrações de uma vez**
   - Risco muito alto de quebrar tudo
   - Fazer um serviço por vez
   - Testar exaustivamente antes do próximo

2. **MANTER backups por 90 dias**
   - Não deletar contas antigas imediatamente
   - Manter por 90 dias para garantir que tudo funciona

3. **COMUNICAR clientes proativamente**
   - Transparência gera confiança
   - Explicar que é para MELHORAR serviço
   - Oferecer suporte extra durante migração

4. **DOCUMENTAR TUDO**
   - Cada passo, cada senha, cada decisão
   - Alguém precisa poder reproduzir sem você

5. **TESTAR, TESTAR, TESTAR**
   - Não assuma que vai funcionar
   - Teste em staging primeiro
   - Teste em produção fora de horário comercial

---

*FASE 4 - Limpeza de Passivos e Migração*
*Versão 1.0 - 14/01/2026*
*Próxima atualização: Semanal durante migração*
