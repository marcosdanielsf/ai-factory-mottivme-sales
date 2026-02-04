# Engenharia Reversa: Secretária Executiva (Donna/Wendy/Isabella)

**Versão:** 1.0.0
**Data:** 11 de Janeiro de 2026
**Projeto:** MOTTIVME Factory AI

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura de Dados](#2-arquitetura-de-dados)
3. [Fluxo de Execução](#3-fluxo-de-execução)
4. [Estrutura dos Nodes](#4-estrutura-dos-nodes)
5. [Sistema de Prompts](#5-sistema-de-prompts)
6. [Modos de Operação](#6-modos-de-operação)
7. [Integrações](#7-integrações)
8. [Padrões e Anti-Padrões](#8-padrões-e-anti-padrões)
9. [Checklist de Evolução](#9-checklist-de-evolução)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Visão Geral do Sistema

### O que é

A **Secretária Executiva** é um sistema de agentes IA que atende leads/clientes via WhatsApp e Instagram, com capacidade de:

- Atendimento automatizado (SDR)
- Agendamento de consultas
- Follow-up automático
- Gestão interna (Donna/Wendy)
- Operações financeiras (BPO)

### Agentes Disponíveis

| Agente | Função | Localização |
|--------|--------|-------------|
| **Isabella** | SDR principal, atendimento de leads | SDR Julia Amare workflow |
| **Donna** | Secretária executiva interna | Donna-Wendy workflow |
| **Wendy** | Modo confrontação/coaching | Mesmo workflow, modo diferente |

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    GHL (GoHighLevel)                     │
│              Webhook → customData → n8n                  │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      n8n Workflow                        │
│   Webhook → Normalização → Agente → IA → Resposta       │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                       Supabase                           │
│  • agent_versions (prompts, configs)                     │
│  • n8n_historico_mensagens (memória)                     │
│  • donna_sessoes (estado)                                │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    LLM (Gemini/GPT)                      │
│              Processa prompt → Gera resposta             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Arquitetura de Dados

### 2.1 Dados de Entrada (Webhook GHL)

```javascript
// Estrutura do body recebido do GHL
{
  "body": {
    "contact_id": "abc123",
    "location": {
      "id": "loc_xyz",
      "name": "Clínica Dr. Fulano"
    },
    "full_name": "João Silva",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+5511999999999",
    "tags": "cliente,vip",
    "message": {
      "body": "Oi, quero agendar uma consulta"
    },
    "customData": {
      "agente_ia": "sdr_inbound",           // Modo do agente
      "ghl_api_key": "pit-xxx",             // API Key da location
      "agenda consultorio sao paulo": "cal_abc",  // ID do calendário
      "agenda presidente prudente": "cal_def",
      "agenda online": "cal_ghi",
      "photo_audio": "",                     // URL se for áudio/imagem
      "work_permit": "sim",                  // Campos customizados
      "state": "SP"
    },
    "contact": {
      "attributionSource": {
        "utmSource": "facebook",
        "utmContent": "CONSULTORIA"
      }
    }
  }
}
```

### 2.2 Dados do Agente (Supabase)

```sql
-- Tabela: agent_versions
SELECT
  id,
  agent_name,           -- 'Isabella', 'DONNA-WENDY'
  agent_type,           -- 'sdr_inbound', 'gestao_normal'
  location_id,
  system_prompt,        -- Prompt base do agente
  prompts_by_mode,      -- JSON com prompts por modo
  tools_config,         -- Configuração de ferramentas
  business_config,      -- Regras de negócio
  hyperpersonalization, -- Config de hiperpersonalização
  scheduling_config,    -- Config de agendamento
  is_active,
  version
FROM agent_versions
WHERE location_id = 'xxx' AND is_active = true;
```

### 2.3 Estrutura do prompts_by_mode

```json
{
  "sdr_inbound": "Você é Isabella, SDR da clínica...",
  "social_seller_instagram": "Você está atendendo via Instagram DM...",
  "followuper": "Você está fazendo follow-up com um lead...",
  "scheduler": "Você está no modo de agendamento...",
  "objection_handler": "O lead apresentou uma objeção...",
  "reativador_base": "Você está reativando um lead antigo..."
}
```

### 2.4 Dados Calculados no Fluxo

```javascript
// Campos que são CALCULADOS durante o fluxo (não vêm do webhook)
{
  data_hora: "sábado, 11 de janeiro de 2026 às 22:15",  // Calculado
  hora_numero: 22,                                       // Calculado
  ddd: "11",                                             // Extraído do telefone
  periodo: "noite",                                      // Calculado pela hora
  contexto_hiperpersonalizado: "Cliente região SP...",   // Gerado
  calendarios_formatados: "• Consultório SP: ID xxx",    // Formatado
  historico_formatado: "[10:00] Lead: Oi...",           // Do Supabase
  historico_existe: true                                 // Boolean
}
```

---

## 3. Fluxo de Execução

### 3.1 Diagrama Completo

```
WEBHOOK GHL
    │
    ▼
┌─────────────────────┐
│ Mensagem recebida   │  Recebe JSON do GHL
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Contexto UTM        │  Detecta se é lead de tráfego
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Normalizar Nome     │  Limpa e formata o nome
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Normalizar Dados    │  Detecta objetivo_do_lead, agente_ia
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Info                │  Consolida todos os dados em um objeto
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Mensagens Anteriores│  Busca histórico no Supabase
│ (Postgres)          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Deduplica Mensagens │  Remove duplicatas do histórico
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Set mensagens       │  Formata mensagens antigas
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Set mensagens2      │  Mapeia campos para formato interno
└─────────┬───────────┘  ✅ SAÍDA: full_name, source, calendarios_ghl
          │
          ▼
┌─────────────────────┐
│ Buscar Agente Ativo │  Query Supabase por agent_versions
│ (Postgres)          │
└─────────┬───────────┘  ✅ SAÍDA: system_prompt, prompts_by_mode
          │
          ▼
┌─────────────────────────────────┐
│ Preparar Execução + Identificar │  Detecta comandos /slash
│ Contexto                        │  Determina modo ativo
└─────────┬───────────────────────┘  ⚠️ DEVE PASSAR DADOS ADIANTE
          │
          ▼
┌─────────────────────┐
│ Formatar Calendários│  Formata calendarios_ghl → string
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Montar Prompts      │  Monta system_prompt + user_prompt finais
│ Finais              │
└─────────┬───────────┘  ✅ SAÍDA: system_prompt, user_prompt
          │
          ▼
┌─────────────────────┐
│ Agente IA           │  Chama LLM com os prompts
│ (LangChain)         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Enviar Resposta     │  Envia via GHL API
│ (HTTP Request)      │
└─────────────────────┘
```

### 3.2 Regra de Ouro do Fluxo de Dados

> **Todo node intermediário DEVE fazer spread do input para não perder dados.**

```javascript
// ✅ CORRETO
const output = {
  ...input,  // Preserva TUDO que veio antes
  meuCampoNovo: "valor"
};

// ❌ ERRADO
const output = {
  meuCampoNovo: "valor"
  // Perdeu full_name, source, calendarios_ghl, etc.
};
```

---

## 4. Estrutura dos Nodes

### 4.1 Node: Set mensagens2

**Função:** Mapear dados do webhook para formato interno.

**Input esperado:** Dados do node Info + histórico
**Output obrigatório:**

```javascript
{
  location_id: string,
  contact_id: string,
  conversation_id: string,
  phone: string,
  full_name: string,
  message: string,
  source: 'whatsapp' | 'instagram',
  historico: array,
  etiquetas: array,
  status_pagamento: string,
  preferencia_audio_texto: 'texto' | 'audio',
  modo_agente: string,
  calendarios_ghl: {
    sao_paulo: string,
    presidente_prudente: string,
    online: string
  },
  ghl_api_key: string,
  formulario_trafego: object,
  is_lead_trafego: boolean
}
```

### 4.2 Node: Preparar Execução

**Função:** Detectar comandos /slash e determinar modo ativo.

**Input esperado:** Dados do Set mensagens2 + dados do agente
**Output obrigatório:**

```javascript
{
  ...input,  // ⚠️ CRÍTICO: Sempre incluir!

  contact_id: string,
  location_id: string,
  agent_name: string,
  modo_ativo: string,
  agente_ia: string,  // Alias para compatibilidade
  comando: string | null,
  mensagem: string,
  message: string,    // Alias
  tools: array,

  // Campos calculados
  data_hora: string,
  hora_numero: number,
  contexto_hiperpersonalizado: string,
  historico_existe: boolean
}
```

### 4.3 Node: Montar Prompts Finais

**Função:** Montar system_prompt e user_prompt finais.

**Campos que PRECISA receber:**

| Campo | Tipo | Usado em |
|-------|------|----------|
| `full_name` | string | `<contexto_conversa>` LEAD |
| `source` | string | `<contexto_conversa>` CANAL |
| `ddd` | string | `<contexto_conversa>` DDD |
| `data_hora` | string | `<contexto_conversa>` DATA/HORA |
| `etiquetas` | array | `<contexto_conversa>` ETIQUETAS |
| `status_pagamento` | string | `<contexto_conversa>` STATUS |
| `agente_ia` | string | MODO ATIVO |
| `contexto_hiperpersonalizado` | string | `<hiperpersonalizacao>` |
| `calendarios_formatados` | string | `<calendarios_disponiveis>` |
| `agendamento_info` | string | Regras de agendamento |
| `historico_formatado` | string | `<historico_conversa>` |
| `message` | string | `<mensagem_atual>` |
| `system_prompt` | string | Prompt base do agente |
| `prompts_by_mode` | object | Prompts por modo |
| `hora_numero` | number | Regra de saudação |
| `historico_existe` | boolean | Regra de saudação |

---

## 5. Sistema de Prompts

### 5.1 Estrutura do System Prompt Final

```xml
<!-- Parte 1: Prompt Base (do Supabase) -->
Você é Isabella, secretária virtual da Clínica XYZ...

<!-- Parte 2: Prompt do Modo Ativo (do prompts_by_mode) -->
[MODO: SDR INBOUND]
Seu objetivo é qualificar o lead e agendar uma consulta...

<!-- Parte 3: Regra de Saudação (calculada) -->
<regra_saudacao>
É a PRIMEIRA mensagem. Inicie com "Boa noite" de forma calorosa.
</regra_saudacao>
```

### 5.2 Estrutura do User Prompt Final

```xml
<contexto_conversa>
LEAD: João Silva
CANAL: whatsapp
DDD: 11
DATA/HORA: sábado, 11 de janeiro de 2026 às 22:15
ETIQUETAS: cliente, vip
STATUS PAGAMENTO: em_dia
MODO ATIVO: sdr_inbound
</contexto_conversa>

<respostas_formulario_trafego>
VEIO POR CAMPANHA: Facebook - Consultoria
SINTOMAS ATUAIS: Cansaço e insônia
</respostas_formulario_trafego>

<hiperpersonalizacao>
[REGIÃO 11] Cliente da região de São Paulo
Unidade mais próxima: Consultório Moema
Saudação recomendada: "Boa noite"
</hiperpersonalizacao>

<calendarios_disponiveis>
• Consultório São Paulo (Moema): ID cal_abc
• Consulta Online (Telemedicina): ID cal_ghi

Horários: Segunda a Sexta, 9h-18h | Sábado 8h-12h
Duração consulta: 1h a 1h30
Antecedência mínima: 24 horas
Cancelamento: Até 24h antes sem custo
</calendarios_disponiveis>

<historico_conversa>
[2026-01-11 22:10] Lead/Humano: Oi, vi o anúncio no Instagram
[2026-01-11 22:11] Assistente/IA: Boa noite! Que bom que entrou em contato...
</historico_conversa>

<mensagem_atual>
LEAD: Quero agendar uma consulta para semana que vem
</mensagem_atual>

Responda à mensagem acima como Isabella, seguindo as instruções do MODO ATIVO: sdr_inbound.
```

### 5.3 Variáveis Mustache

O sistema suporta substituição de variáveis no formato `{{ variavel }}`:

```javascript
const variaveis = {
  modo_agente: 'sdr_inbound',
  source: 'whatsapp',
  full_name: 'João Silva',
  timezone: 'America/Sao_Paulo',
  agente: 'Isabella',
  data_hora: '11/01/2026 22:15',
  status_pagamento: 'em_dia',
  preferencia_audio_texto: 'texto'
};

// Exemplo no prompt:
// "Olá {{ full_name }}, sou a {{ agente }}..."
// → "Olá João Silva, sou a Isabella..."
```

---

## 6. Modos de Operação

### 6.1 Modos da Isabella (SDR)

| Modo | Trigger | Objetivo |
|------|---------|----------|
| `sdr_inbound` | Lead novo | Qualificar e agendar |
| `social_seller_instagram` | Via Instagram | Adaptar tom para DM |
| `scheduler` | Pediu agendamento | Focar em disponibilidade |
| `followuper` | Follow-up ativo | Reengajar lead |
| `objection_handler` | Objeção detectada | Contornar objeção |
| `reativador_base` | Lead antigo | Reativar interesse |

### 6.2 Modos da Donna/Wendy (Interna)

| Modo | Comando | Objetivo |
|------|---------|----------|
| `gestao_normal` | `/donna`, `/d` | Gestão geral, agenda |
| `confrontacao` | `/wendy`, `/w`, `/psico` | Coaching, confrontação |
| `financeiro` | `/fin`, `/f` | Análise financeira |
| `contratos` | `/contrato`, `/c` | Gestão de contratos |
| `briefing` | `/status`, `/s` | Relatório do dia |
| `coach` | `/coach` | Modo coaching |
| `estrategista` | `/estrategista`, `/e` | Planejamento estratégico |

### 6.3 Detecção de Modo

```javascript
// Prioridade de detecção:
// 1. Comando /slash na mensagem
// 2. Campo agente_ia do GHL (customData)
// 3. Sessão persistida no Supabase
// 4. Default (sdr_inbound ou gestao_normal)

if (mensagem.startsWith('/')) {
  // 1. Comando tem prioridade máxima
  modo = COMANDOS[comando].modo;
} else if (customData.agente_ia) {
  // 2. GHL definiu o modo
  modo = customData.agente_ia;
} else if (sessao.modo) {
  // 3. Sessão anterior
  modo = sessao.modo;
} else {
  // 4. Default
  modo = 'sdr_inbound';
}
```

---

## 7. Integrações

### 7.1 GHL (GoHighLevel)

**Webhook de entrada:**
```
POST /webhook/{uuid}
Content-Type: application/json
Body: { body: { contact_id, message, customData, ... } }
```

**Envio de resposta:**
```javascript
// Via HTTP Request node
POST https://services.leadconnectorhq.com/conversations/messages
Headers:
  Authorization: Bearer {ghl_api_key}
  Version: 2021-07-28
Body:
  {
    type: "SMS" | "Email" | "WhatsApp",
    contactId: contact_id,
    message: resposta_ia
  }
```

### 7.2 Supabase

**Tabelas principais:**

```sql
-- Agentes configurados
agent_versions (
  id, agent_name, agent_type, location_id,
  system_prompt, prompts_by_mode, tools_config,
  is_active, version
)

-- Histórico de conversas
n8n_historico_mensagens (
  id, session_id, message, location_id, created_at
)

-- Sessões da Donna
donna_sessoes (
  contact_id, agent_name, modo_atual, modo_anterior, updated_at
)

-- Tracking de leads
n8n_schedule_tracking (
  contact_id, location_id, status, next_followup, created_at
)
```

### 7.3 LLM (Gemini/GPT)

```javascript
// Node: Agente IA (LangChain)
{
  promptType: "define",
  text: "{{ $json.user_prompt }}",
  options: {
    systemMessage: "{{ $json.system_prompt }}\n\n## HISTÓRICO\n{{ mensagens_antigas }}"
  }
}
```

---

## 8. Padrões e Anti-Padrões

### 8.1 Padrões (Fazer)

✅ **Sempre fazer spread do input em nodes intermediários:**
```javascript
const output = { ...input, meuCampo: "valor" };
```

✅ **Validar campos críticos antes de usar:**
```javascript
const fullName = prev.full_name || 'Visitante';
const source = prev.source || 'whatsapp';
```

✅ **Calcular campos derivados se não existirem:**
```javascript
const dataHora = input.data_hora || new Date().toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo'
});
```

✅ **Usar fallbacks em cascata:**
```javascript
const modo = customData.agente_ia
  || sessao.modo
  || agent.agent_type
  || 'sdr_inbound';
```

✅ **Logar dados importantes para debug:**
```javascript
console.log('>>> MODO DETECTADO:', modoAtivo);
console.log('>>> CAMPOS RECEBIDOS:', Object.keys(input));
```

### 8.2 Anti-Padrões (Evitar)

❌ **Criar novo objeto sem spread:**
```javascript
// ERRADO - perde todos os campos anteriores
const output = { contact_id, modo_ativo };
```

❌ **Assumir que campos existem:**
```javascript
// ERRADO - pode dar undefined
const nome = input.full_name;
```

❌ **Hardcodar valores que devem ser dinâmicos:**
```javascript
// ERRADO
const agente = "Isabella";
// CORRETO
const agente = input.agent_name || 'Isabella';
```

❌ **Ignorar erros silenciosamente:**
```javascript
// ERRADO
try { ... } catch(e) { }
// CORRETO
try { ... } catch(e) { console.error('Erro:', e); return fallback; }
```

---

## 9. Checklist de Evolução

### Ao Criar Novo Modo

- [ ] Adicionar no mapa `COMANDOS` (se tiver comando /slash)
- [ ] Adicionar no `prompts_by_mode` do agente no Supabase
- [ ] Adicionar no `TOOLS_POR_MODO` se precisar de tools específicas
- [ ] Testar transição de/para outros modos
- [ ] Documentar no README do agente

### Ao Criar Novo Node

- [ ] Verificar se precisa de `...input` no output
- [ ] Listar campos de entrada necessários
- [ ] Listar campos de saída produzidos
- [ ] Adicionar validação/fallback para campos críticos
- [ ] Adicionar logs para debug
- [ ] Testar com input mínimo (campos faltando)

### Ao Modificar Fluxo

- [ ] Mapear dependências de dados entre nodes
- [ ] Verificar se algum node intermediário quebra a chain
- [ ] Testar fluxo completo end-to-end
- [ ] Verificar se system_prompt final está completo
- [ ] Validar que nenhum campo está undefined

### Ao Adicionar Nova Location

- [ ] Criar registro em `agent_versions` com location_id
- [ ] Configurar calendários no `customData` do GHL
- [ ] Configurar `ghl_api_key` no workflow GHL
- [ ] Testar agendamento com calendários reais
- [ ] Verificar hiperpersonalização por DDD

---

## 10. Troubleshooting

### Problema: Campos undefined no prompt

**Sintoma:** System prompt mostra `LEAD: undefined`

**Diagnóstico:**
1. Verificar se webhook está enviando os dados
2. Verificar se cada node está passando dados adiante
3. Procurar node que não faz `...input`

**Solução:** Adicionar `...input` no output do node problemático

---

### Problema: Modo errado sendo ativado

**Sintoma:** Resposta não corresponde ao contexto

**Diagnóstico:**
1. Verificar `customData.agente_ia` no webhook
2. Verificar se sessão anterior está interferindo
3. Verificar se comando /slash foi detectado

**Solução:** Ajustar prioridade de detecção ou limpar sessão

---

### Problema: Calendários não aparecem

**Sintoma:** "Calendários não configurados"

**Diagnóstico:**
1. Verificar `customData['agenda xxx']` no webhook
2. Verificar se `calendarios_ghl` está sendo passado
3. Verificar node Formatar Calendários

**Solução:** Configurar calendários no GHL ou corrigir mapeamento

---

### Problema: Histórico não aparece

**Sintoma:** IA responde como se fosse primeira mensagem

**Diagnóstico:**
1. Verificar session_id no Supabase
2. Verificar se query de histórico retorna dados
3. Verificar se `historico_existe` está true

**Solução:** Corrigir session_id ou query do histórico

---

### Problema: Saudação repetida

**Sintoma:** IA diz "Boa noite" toda mensagem

**Diagnóstico:**
1. Verificar `historico_existe`
2. Verificar se histórico está sendo passado
3. Verificar regra de saudação

**Solução:** Garantir que `historico_existe` seja true quando há histórico

---

## Comandos Úteis

### Testar Agente via cURL

```bash
# Buscar agente ativo
curl -X POST "https://bfumywvwubvernvhjehk.supabase.co/rest/v1/rpc/get_active_agent" \
  -H "apikey: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_location_id": "xxx"}'
```

### Verificar Histórico

```bash
# Buscar histórico de um contato
curl "https://bfumywvwubvernvhjehk.supabase.co/rest/v1/n8n_historico_mensagens?session_id=eq.CONTACT_ID&order=created_at.desc&limit=10" \
  -H "apikey: YOUR_KEY"
```

### Simular Webhook

```bash
# Enviar mensagem de teste
curl -X POST "https://cliente-a1.mentorfy.io/webhook/UUID" \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "contact_id": "test123",
      "full_name": "Teste Silva",
      "message": { "body": "Oi, quero testar" },
      "customData": { "agente_ia": "sdr_inbound" }
    }
  }'
```

---

## Referências

- [CLAUDE.md do ai-factory-agents](./CLAUDE.md)
- [BUG-FIX-DONNA-WENDY-UNDEFINED.md](./BUG-FIX-DONNA-WENDY-UNDEFINED.md)
- [Arquitetura Follow-Up Universal](./ARQUITETURA_FOLLOW_UP_UNIVERSAL.md)
- [INDEX.md](../INDEX.md)

---

*Documento de engenharia reversa gerado em: 11/01/2026*
*Baseado na análise do workflow Secretária Executiva Donna/Wendy*
*Autor: Claude Code Assistant + Marcos Daniels*
