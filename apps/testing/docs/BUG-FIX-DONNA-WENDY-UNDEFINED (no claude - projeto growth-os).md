# BUG FIX: Donna-Wendy System Prompt com Variáveis Undefined

**Data:** 11 de Janeiro de 2026
**Workflow:** Secretária Executiva Donna/Wendy
**Severidade:** Alta - Quebra funcionamento do agente

---

## Sintoma Reportado

O system prompt da Donna/Isabella está chegando com todas as variáveis `undefined`:

```xml
<contexto_conversa>
LEAD: undefined
CANAL: undefined
DDD: não identificado
DATA/HORA: undefined
ETIQUETAS: nenhuma
STATUS PAGAMENTO: undefined
MODO ATIVO: sdr_inbound
</contexto_conversa>

<hiperpersonalizacao>
undefined
</hiperpersonalizacao>

<calendarios_disponiveis>
• Calendários não configurados
</calendarios_disponiveis>
```

---

## Análise do Fluxo

```
┌─────────────────────┐
│ Deduplica Mensagens │
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│   Set mensagens     │ ← Define: mensagem, output_preview, mensagens_antigas
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│   Set mensagens2    │ ← Define: full_name, source, calendarios_ghl, status_pagamento ✅
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Buscar Agente Ativo │ ← Retorna: system_prompt, prompts_by_mode do Supabase ✅
└─────────┬───────────┘
          ↓
┌─────────────────────────────────────┐
│ Preparar Execução + Identificar     │ ← 🐛 BUG AQUI: NÃO REPASSA OS DADOS!
│ Contexto3                           │
└─────────┬───────────────────────────┘
          ↓
┌─────────────────────┐
│        If2          │
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Formatar Calendários│ ← Recebe undefined (calendarios_ghl perdido)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Montar Prompts      │ ← Recebe undefined (full_name, source, etc. perdidos)
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│ Agente Financeiro IA│
└─────────────────────┘
```

---

## Causa Raiz

O node **"Preparar Execução + Identificar Contexto3"** não faz spread do input para o output.

### Código ATUAL (com bug):

```javascript
// === OUTPUT ===
const output = {
  // Identificação
  contact_id: contactId,
  location_id: locationId,

  // Agente e modo
  agent_name: agentName,
  modo_ativo: modoFinal,
  fonte_deteccao: fonte,

  // Mensagem
  comando: comandoDetectado,
  mensagem_original: mensagem,
  mensagem: mensagemLimpa || mensagem,

  // Tools
  tools: TOOLS_POR_MODO[modoFinal] || TOOLS_POR_MODO['default'],

  // Flags
  mudou_modo: fonte === 'comando',
  is_info: isInfo,
  precisa_atualizar_sessao: fonte === 'comando',

  // Queries
  query_buscar_agente: `...`,
  query_atualizar_sessao: fonte === 'comando' ? {...} : null,

  // Para Switch node
  switch_value: modoFinal
};

return output;  // ❌ NÃO PASSA full_name, source, calendarios_ghl, etc.
```

**Dados perdidos:**
- `full_name`
- `source`
- `ddd`
- `data_hora`
- `etiquetas`
- `status_pagamento`
- `calendarios_ghl`
- `contexto_hiperpersonalizado`
- `system_prompt`
- `prompts_by_mode`
- E todos os outros campos do input!

---

## Solução

Adicionar `...input` no início do objeto output para passar todos os dados anteriores.

### Código CORRIGIDO:

```javascript
/**
 * DONNA-WENDY v2.0.1 - Execute Code Node (n8n)
 *
 * FIX: Adicionado spread do input para preservar dados dos nodes anteriores
 *
 * FLUXO:
 * 1. Detecta comando /slash na mensagem
 * 2. Se não tem comando, usa GHL ou sessão do Supabase
 * 3. Retorna query pra atualizar sessão (próximo nó executa)
 */

// === MAPA DE COMANDOS → AGENTES ===
const COMANDOS = {
  // DONNA-WENDY
  '/donna': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  '/d': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  '/wendy': { agent_name: 'DONNA-WENDY', modo: 'confrontacao' },
  '/w': { agent_name: 'DONNA-WENDY', modo: 'confrontacao' },
  '/psico': { agent_name: 'DONNA-WENDY', modo: 'confrontacao' },
  '/fin': { agent_name: 'DONNA-WENDY', modo: 'financeiro' },
  '/financeiro': { agent_name: 'DONNA-WENDY', modo: 'financeiro' },
  '/f': { agent_name: 'DONNA-WENDY', modo: 'financeiro' },
  '/contrato': { agent_name: 'DONNA-WENDY', modo: 'contratos' },
  '/c': { agent_name: 'DONNA-WENDY', modo: 'contratos' },
  '/status': { agent_name: 'DONNA-WENDY', modo: 'briefing' },
  '/s': { agent_name: 'DONNA-WENDY', modo: 'briefing' },
  '/agenda': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  '/a': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  '/coach': { agent_name: 'DONNA-WENDY', modo: 'coach' },
  '/estrategista': { agent_name: 'DONNA-WENDY', modo: 'estrategista' },
  '/e': { agent_name: 'DONNA-WENDY', modo: 'estrategista' },
  '/reset': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  '/sair': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  '/modo': { agent_name: null, modo: 'info' },
  '/comandos': { agent_name: null, modo: 'info' },
  '/help': { agent_name: null, modo: 'info' },
};

// === MAPA GHL → AGENTES ===
const GHL_PARA_AGENTE = {
  'donna-wendy': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  'donna_wendy': { agent_name: 'DONNA-WENDY', modo: 'gestao_normal' },
  'financeiro': { agent_name: 'DONNA-WENDY', modo: 'financeiro' },
  'contratos': { agent_name: 'DONNA-WENDY', modo: 'contratos' },
};

const TOOLS_POR_MODO = {
  'gestao_normal': ['gestao', 'calendario', 'agentes', 'comunicacao'],
  'briefing': ['gestao', 'calendario', 'agentes'],
  'check_in': ['gestao', 'comportamento'],
  'relatorio_noturno': ['gestao', 'comportamento', 'financeiro'],
  'confrontacao': ['comportamento', 'gestao'],
  'coach': ['comportamento'],
  'estrategista': ['gestao', 'comportamento', 'agentes'],
  'financeiro': ['financeiro', 'comunicacao'],
  'contratos': ['contratos', 'comunicacao'],
  'default': ['gestao', 'comunicacao']
};

// === INPUT ===
const input = $input.first().json;
const contactId = input.contact_id || input.lead_id || input.contactId || '';
const locationId = input.location_id || input.locationId || '';
const mensagem = (input.output_preview || input.message || input.body || input.texto || input.mensagem || '').trim();
const agenteIaGHL = input.agente_ia || input.agente || '';

// Sessão anterior (se buscou antes)
const sessaoAnterior = {
  agent_name: input.sessao_agent_name || null,
  modo: input.sessao_modo || null
};

// === DETECTAR COMANDO ===
let comandoDetectado = null;
let configComando = null;
let mensagemLimpa = mensagem;
const msgLower = mensagem.toLowerCase();

for (const [cmd, config] of Object.entries(COMANDOS)) {
  if (msgLower === cmd || msgLower.startsWith(cmd + ' ') || msgLower.startsWith(cmd + '\n')) {
    comandoDetectado = cmd;
    configComando = config;
    mensagemLimpa = mensagem.replace(new RegExp('^' + cmd.replace('/', '\\/') + '\\s*', 'i'), '').trim();
    break;
  }
}

// === DETERMINAR AGENTE E MODO ===
let agentName = null;
let modoFinal = 'gestao_normal';
let fonte = 'default';
const isInfo = configComando?.modo === 'info';

if (configComando && configComando.agent_name) {
  agentName = configComando.agent_name;
  modoFinal = configComando.modo;
  fonte = 'comando';

} else if (agenteIaGHL && GHL_PARA_AGENTE[agenteIaGHL.toLowerCase()]) {
  const config = GHL_PARA_AGENTE[agenteIaGHL.toLowerCase()];
  agentName = config.agent_name;
  modoFinal = config.modo;
  fonte = 'ghl';

} else if (sessaoAnterior.agent_name) {
  agentName = sessaoAnterior.agent_name;
  modoFinal = sessaoAnterior.modo || 'gestao_normal';
  fonte = 'sessao';

} else {
  agentName = 'DONNA-WENDY';
  modoFinal = 'gestao_normal';
  fonte = 'default';
}

// ═══════════════════════════════════════════════════════════════════════════
// FIX v2.0.1: Calcular data_hora se não existir
// ═══════════════════════════════════════════════════════════════════════════
const dataHoraCalculada = input.data_hora || new Date().toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'full',
  timeStyle: 'short'
});

const horaNumero = input.hora_numero || new Date().getHours();

// ═══════════════════════════════════════════════════════════════════════════
// FIX v2.0.1: Gerar contexto hiperpersonalizado se não existir
// ═══════════════════════════════════════════════════════════════════════════
const contextoHiper = input.contexto_hiperpersonalizado ||
  'Usar abordagem padrão empática e acolhedora';

// === OUTPUT ===
const output = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX v2.0.1: SPREAD DO INPUT PARA PRESERVAR TODOS OS DADOS ANTERIORES
  // ═══════════════════════════════════════════════════════════════════════════
  ...input,

  // Identificação (sobrescreve se necessário)
  contact_id: contactId,
  location_id: locationId,

  // Agente e modo
  agent_name: agentName,
  modo_ativo: modoFinal,
  fonte_deteccao: fonte,
  agente_ia: modoFinal, // Para compatibilidade com Montar Prompts

  // Mensagem
  comando: comandoDetectado,
  mensagem_original: mensagem,
  mensagem: mensagemLimpa || mensagem,
  message: mensagemLimpa || mensagem, // Alias para compatibilidade

  // Tools
  tools: TOOLS_POR_MODO[modoFinal] || TOOLS_POR_MODO['default'],

  // Flags
  mudou_modo: fonte === 'comando',
  is_info: isInfo,
  precisa_atualizar_sessao: fonte === 'comando',

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX v2.0.1: Garantir campos obrigatórios para Montar Prompts
  // ═══════════════════════════════════════════════════════════════════════════
  data_hora: dataHoraCalculada,
  hora_numero: horaNumero,
  contexto_hiperpersonalizado: contextoHiper,
  historico_existe: (input.historico && input.historico.length > 0) || false,

  // Queries
  query_buscar_agente: `SELECT * FROM agent_versions WHERE agent_name = '${agentName}' AND location_id = '${locationId}' AND is_active = true LIMIT 1`,

  query_atualizar_sessao: fonte === 'comando' ? {
    table: 'donna_sessoes',
    body: {
      contact_id: contactId,
      agent_name: agentName,
      modo_atual: modoFinal,
      modo_anterior: sessaoAnterior.modo,
      updated_at: new Date().toISOString()
    },
    onConflict: 'contact_id'
  } : null,

  // Para Switch node
  switch_value: modoFinal
};

return output;
```

---

## Mudanças Aplicadas

| Linha | Mudança | Motivo |
|-------|---------|--------|
| 1 | Versão v2.0.1 | Tracking da correção |
| 85-89 | Cálculo de `dataHoraCalculada` | Garantir que data_hora nunca seja undefined |
| 91 | Cálculo de `horaNumero` | Para regra de saudação funcionar |
| 96-97 | Cálculo de `contextoHiper` | Fallback para hiperpersonalização |
| 100 | `...input` no output | **PRINCIPAL FIX** - Preserva todos os dados |
| 114 | `agente_ia: modoFinal` | Compatibilidade com Montar Prompts |
| 120 | `message` alias | Compatibilidade com Montar Prompts |
| 130-133 | Campos obrigatórios | Garantir que nunca sejam undefined |

---

## Como Aplicar

1. Abrir o workflow no n8n
2. Clicar no node **"Preparar Execução + Identificar Contexto3"**
3. Substituir o código pelo código corrigido acima
4. Salvar e ativar o workflow
5. Testar enviando uma mensagem para a Donna

---

## Teste de Validação

Após aplicar o fix, o system prompt deve mostrar:

```xml
<contexto_conversa>
LEAD: João Silva
CANAL: whatsapp
DDD: 11
DATA/HORA: sábado, 11 de janeiro de 2026 às 22:15
ETIQUETAS: cliente, vip
STATUS PAGAMENTO: em_dia
MODO ATIVO: gestao_normal
</contexto_conversa>

<hiperpersonalizacao>
[REGIÃO 11] Cliente da região de São Paulo
Unidade mais próxima: Consultório Moema
</hiperpersonalizacao>

<calendarios_disponiveis>
• Consultório São Paulo (Moema): ID abc123
• Consulta Online (Telemedicina): ID def456
</calendarios_disponiveis>
```

---

## Prevenção Futura

Para evitar esse tipo de bug:

1. **Sempre usar spread** quando um node é intermediário no fluxo:
   ```javascript
   const output = {
     ...input,  // SEMPRE incluir no início
     // ... sobrescritas específicas
   };
   ```

2. **Validar dados no início do node Montar Prompts**:
   ```javascript
   const prev = $input.item.json;

   // Validação
   if (!prev.full_name) {
     console.warn('⚠️ full_name undefined - usando fallback');
   }
   ```

3. **Criar node de validação** entre Preparar e Montar para detectar undefined precocemente.

---

*Documento gerado em: 11/01/2026*
*Autor: Claude Code Assistant*
