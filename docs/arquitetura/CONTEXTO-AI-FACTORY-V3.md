# AI Factory V3 - Contexto do Projeto
**Ultima Atualizacao:** 2025-12-19

---

## Visao Geral do Sistema

Sistema de automacao de agentes de IA para GoHighLevel (GHL) com arquitetura modular, hiperpersonalizacao e validacao automatica.

### Arquitetura Principal

```
FLUXO COMPLETO:
1. Call de Kickoff gravada (Google Meet/Zoom)
2. Audio vai pro Google Drive
3. Workflow 10 detecta e processa
4. AI analisa e extrai configuracoes
5. Agent Version criado no Supabase
6. Boot Validator valida automaticamente
7. Se aprovado, agente e ativado
8. Workflow 05 executa o agente quando GHL envia webhook
```

---

## Workflows Principais

### 1. `10-AI-Factory-V3-Unified.json` - AI Factory Completa
**Status:** PRONTO PARA TESTE

**FASE 1 - Ingestao:**
- Google Drive Trigger (monitoramento de pasta)
- Filter (apenas arquivos novos)
- Buscar Call no Supabase
- Export Doc (transcrever audio)
- AI Analisar Kickoff (Groq Llama 3.3 70B)

**FASE 2 - Processamento:**
- Processar Analise (Code node com parse JSON robusto)
- Criar Agent Version no Supabase
- Salva `prompts_por_modo`, `hyperpersonalization`, `tools_config`

**FASE 3 - Validacao:**
- Preparar Cenarios de Validacao
- Claude Sonnet 4 valida o agente
- Switch por resultado (APROVADO/BLOQUEADO)
- Se aprovado: ativa automaticamente
- Se bloqueado: notifica via Slack

### 2. `05-AI-Agent-Execution-Modular.json` - Execucao do Agente
**Status:** CORRIGIDO - BUG DO MODO FIXADO

**Fluxo:**
1. Webhook GHL recebe mensagem
2. Info node extrai dados (nome, telefone, mensagem, `agente_ia`)
3. Switch "Tipo de IA" verifica se `agente_ia == "agente_versionado"`
4. Se sim: Buscar Agente Ativo no Supabase
5. Preparar Execucao + Identificar Contexto (CORRIGIDO!)
6. AI Agent Modular executa com prompt dinamico
7. Resposta enviada via GHL API

**BUG CORRIGIDO NESTA SESSAO:**
- Problema: Code node sempre pegava `modosIdentificados[0]` ignorando o campo `agente_ia`
- Solucao: Ler `agente_ia` do webhook e usar para selecionar de `prompts_por_modo`

### 3. `03-Call-Analyzer-Onboarding.json` - Analisador de Calls
**Status:** ATUALIZADO COM HIPERPERSONALIZACAO

**Extrai:**
- `business_context` (nome, tipo, servicos, precos)
- `hyperpersonalization` (ddd, setor, porte, cargo_decisor)
- `compliance_rules` (proibicoes, limites, escalacao)
- `personality_config` (tom, nome_agente, caracteristicas)
- `modos_identificados` (first_contact, scheduler, rescheduler, etc)
- `prompts_por_modo` (prompt completo para cada modo)

### 4. `08-Boot-Validator.json` - Validador Automatico
**Status:** ATUALIZADO

**Funcionalidades:**
- Roda a cada 5 minutos
- Busca agentes `pending_approval` ou `draft` com prompt
- Valida usando Claude Sonnet 4
- Nota minima para aprovacao: 8.0
- Violacoes criticas: bloqueia automaticamente
- Auto-ativa agentes aprovados

---

## Estrutura do Banco de Dados (Supabase)

### Tabela: `agent_versions`
```sql
- id UUID PRIMARY KEY
- client_id UUID (FK clients)
- location_id VARCHAR(100)
- agent_name VARCHAR(255)
- version INTEGER
- system_prompt TEXT
- agent_config JSONB  -- inclui prompts_por_modo, tools_config
- hyperpersonalization JSONB  -- DDD, setor, porte, cargo
- status ENUM ('draft', 'pending_approval', 'active', 'archived')
- validation_status VARCHAR(50)
- validation_score DECIMAL
- validation_result JSONB
- is_active BOOLEAN
- created_at, updated_at, validated_at, activated_at
```

### Tabela: `hyperpersonalization_metrics`
```sql
- id UUID PRIMARY KEY
- location_id VARCHAR(100)
- agent_version_id UUID
- ddd, setor, porte, cargo_decisor
- conversations_count, conversions_count
- conversion_rate, avg_response_sentiment
- period_start, period_end
```

### Migration: `002_add_hyperpersonalization.sql`
- Adiciona coluna `hyperpersonalization` em `agent_versions`
- Cria indices para busca por setor, DDD, porte
- Views de performance: `vw_hp_performance_por_setor`, `vw_hp_performance_por_regiao`

---

## Modos de Agente Disponiveis

1. **first_contact** - Primeiro contato com lead frio
2. **scheduler** - Agendar reunioes/consultas
3. **rescheduler** - Recuperar no-shows
4. **concierge** - Pos-agendamento ate o dia
5. **customer_success** - Pos-primeira reuniao
6. **objection_handler** - Lidar com objecoes
7. **followuper** - Reativar leads frios

---

## Codigo Corrigido - Preparar Execucao

```javascript
// IDENTIFICAR CONTEXTO (MODO) - LE DO CAMPO agente_ia DO GHL
const modosIdentificados = toolsConfig.modos_identificados || toolsConfig.modos_ativos || [];
const promptsPorModo = toolsConfig.prompts_por_modo || {};

// Ler o campo agente_ia que vem do GHL
const agenteIaDoGHL = webhook.agente_ia || webhook.customFields?.agente_ia || webhook.custom_fields?.agente_ia || '';

let contexto = agenteIaDoGHL;

// Validar se existe prompt para este modo
if (!contexto || !promptsPorModo[contexto]) {
  if (promptsPorModo['first_contact']) {
    contexto = 'first_contact';
  } else {
    const primeiroModoDisponivel = Object.keys(promptsPorModo)[0];
    if (primeiroModoDisponivel) {
      contexto = primeiroModoDisponivel;
    } else {
      contexto = 'first_contact';
    }
  }
}

// Usar o prompt do modo correto
const promptDoModo = promptsPorModo[contexto] || '';
```

---

## Hiperpersonalizacao Engine

### Mapeamento de DDD para Linguagem Regional
```javascript
const dddEngine = {
  '11': { regiao: 'SP Capital', estilo: 'Paulistano direto ao ponto, objetivo' },
  '21': { regiao: 'RJ Capital', estilo: 'Carioca descontraido, usa girias leves' },
  '31': { regiao: 'BH', estilo: 'Mineiro acolhedor, pede confirmacao' },
  '41': { regiao: 'Curitiba', estilo: 'Curitibano formal, educado' },
  '51': { regiao: 'POA', estilo: 'Gaucho caloroso, usa "tu"' },
  // ... outros DDDs
};
```

### Mapeamento de Setor para Vocabulario
```javascript
const setorEngine = {
  'saude': { termo_cliente: 'paciente', acao: 'consulta', analogias: ['diagnostico', 'tratamento'] },
  'odontologia': { termo_cliente: 'paciente', acao: 'avaliacao', analogias: ['sorriso', 'saude bucal'] },
  'juridico': { termo_cliente: 'cliente', acao: 'audiencia', analogias: ['processo', 'defesa'] },
  'tech': { termo_cliente: 'usuario', acao: 'demo', analogias: ['deploy', 'sprint'] },
  // ... outros setores
};
```

---

## GHL Architect V2 Framework

Template de prompt para agentes:

```markdown
# PERSONA
[Quem e o agente, tom de voz]

# OBJETIVO
[Meta principal do modo atual]

# PROTOCOLO DE CONVERSA
[Fluxo passo-a-passo]

# GUARDRAILS (Regras Rigidas)
[O que NUNCA fazer, limites]

# FEW-SHOT (Exemplos)
[3-5 exemplos de conversas ideais]

# HIPERPERSONALIZACAO
- DDD: {{ $json.hyperpersonalization.ddd }}
- Setor: {{ $json.hyperpersonalization.setor }}
- Porte: {{ $json.hyperpersonalization.porte }}
- Ajustes regionais: [instrucoes especificas]
```

---

## Pendencias e Proximos Passos

### Para Testar
1. [ ] Workflow 10 com uma call real de kickoff
2. [ ] Verificar se Google Drive trigger esta configurado
3. [ ] Testar fluxo completo: call -> agent_version -> validacao -> ativacao
4. [ ] Testar workflow 05 com agente ativo recebendo mensagem

### Melhorias Futuras
- [ ] Dashboard de metricas de hiperpersonalizacao
- [ ] A/B testing por DDD/Setor
- [ ] Feedback loop automatico (ajustar prompts baseado em conversoes)
- [ ] Multi-idioma (espanhol para EUA)

---

## Credenciais e Conexoes Necessarias

- **Supabase:** Postgres connection configurada
- **Anthropic API:** Para Claude Sonnet 4 (validacao)
- **Groq API:** Para Llama 3.3 70B (analise de calls)
- **GHL API:** Para enviar mensagens
- **Google Drive:** Para trigger de arquivos

---

## Comandos Uteis

### Buscar agente ativo por location
```sql
SELECT * FROM agent_versions
WHERE location_id = 'LOCATION_ID'
  AND is_active = TRUE
  AND status = 'active'
ORDER BY version DESC
LIMIT 1;
```

### Verificar agentes pendentes de validacao
```sql
SELECT id, agent_name, status, validation_status, created_at
FROM agent_versions
WHERE status = 'pending_approval'
   OR validation_status IS NULL
ORDER BY created_at DESC;
```

### Ativar agente manualmente
```sql
UPDATE agent_versions
SET is_active = TRUE, status = 'active', activated_at = NOW()
WHERE id = 'AGENT_VERSION_ID';
```

---

## Historico de Sessoes

### 2025-12-19 (Esta Sessao)
- Corrigido bug no workflow 05 (modo sempre pegava primeiro)
- Adicionado suporte a hiperpersonalizacao
- Criada migration 002_add_hyperpersonalization.sql
- Atualizado workflow 03 com extracao de hiperpersonalizacao
- Atualizado workflow 08 com parse robusto de JSON
- Workflow 10 pronto para teste

---

**Mantenedor:** Marcos Daniels / Claude Code
**Versao do Sistema:** v3.0-hyperpersonalized
