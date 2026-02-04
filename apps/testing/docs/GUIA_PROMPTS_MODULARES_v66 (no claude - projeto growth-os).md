# GUIA: PROMPTS MODULARES v6.6

## Engenharia Reversa do Sistema Isabella Amare

---

## 1. VISÃO GERAL

Sistema que permite **cada cliente ter scripts/prompts diferentes** sem alterar código do n8n.

**Benefícios:**
- Um workflow n8n serve TODOS os clientes
- Prompts ficam no Supabase (fácil de editar)
- Modo ativo vem do GHL (agente_ia)
- Escala infinitamente

---

## 2. ARQUITETURA

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│    GHL      │────▶│    n8n      │────▶│     Supabase        │
│ (agente_ia) │     │  (workflow) │     │ (agent_versions)    │
└─────────────┘     └─────────────┘     └─────────────────────┘
                           │                      │
                           │                      ▼
                           │              ┌───────────────┐
                           │              │ prompts_by_mode│
                           │              │ (JSONB)        │
                           │              └───────────────┘
                           │                      │
                           ▼                      │
                    ┌─────────────┐               │
                    │  Preparar   │◀──────────────┘
                    │  Execução   │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Montar    │
                    │  Prompts    │──▶ system_prompt + prompts_by_mode[modo]
                    │   Finais    │
                    └─────────────┘
```

---

## 3. TABELA SUPABASE: agent_versions

### Campos principais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do agente |
| `agent_name` | TEXT | Nome do agente (ex: "Isabella Amare") |
| `version` | TEXT | Versão (ex: "v6.6") |
| `location_id` | TEXT | ID da location no GHL |
| `system_prompt` | TEXT | Prompt BASE (compartilhado por todos os modos) |
| `prompts_by_mode` | JSONB | Prompts específicos de cada modo |
| `tools_config` | JSONB | Configuração das ferramentas |
| `business_config` | JSONB | Dados do negócio (valores, endereços) |
| `personality_config` | JSONB | Personalidade e modos |
| `qualification_config` | JSONB | Regras de qualificação (BANT) |
| `compliance_rules` | JSONB | Regras e proibições |

### Estrutura do prompts_by_mode:

```json
{
  "sdr_inbound": "# MODO ATIVO: SDR INBOUND (Tráfego Pago)\n\n## CONTEXTO\nLead veio de anúncio...\n\n## FLUXO OBRIGATÓRIO\n...",

  "social_seller_instagram": "# MODO ATIVO: SOCIAL SELLER INSTAGRAM\n\n## CONTEXTO\nLead veio do Instagram DM...\n\n## TOM ESPECÍFICO\n...",

  "concierge": "# MODO ATIVO: CONCIERGE (Pós-Agendamento)\n\n## CONTEXTO\nLead JÁ agendou e PAGOU...",

  "scheduler": "# MODO ATIVO: SCHEDULER (Agendamento)\n\n## PRÉ-REQUISITO\nSOMENTE após PAGAMENTO CONFIRMADO...",

  "followuper": "# MODO ATIVO: FOLLOWUPER (Reengajamento)\n\n## CONTEXTO\nLead está INATIVO há dias/semanas...",

  "objection_handler": "# MODO ATIVO: OBJECTION HANDLER\n\n## MÉTODO A.R.O\n...",

  "reativador_base": "# MODO ATIVO: REATIVADOR BASE\n\n## CONTEXTO\nLead/cliente está INATIVO há MESES..."
}
```

---

## 4. FLUXO N8N (Passo a Passo)

### Nó 1: Mensagem recebida (Webhook)
- Recebe customData do GHL
- customData contém `agente_ia` (ex: "social_seller_instagram")

### Nó 2: Info
- Extrai dados da mensagem
- Expõe `agente_ia` em: `$('Info').first().json.agente_ia`

### Nó 3: Buscar Agente Ativo2
- Query no Supabase: `SELECT * FROM agent_versions WHERE location_id = X AND is_active = true`
- Retorna TODO o agente, incluindo `prompts_by_mode`

### Nó 4: Preparar Execução + Identificar Contexto3
**Código crítico:**
```javascript
// Pegar agente_ia do Info (fonte mais confiável)
const infoData = $('Info').first().json;

// Parsear prompts_by_mode do Supabase
const promptsByMode = safeParseJSON(agent.prompts_by_mode, {});

// Detectar modo ativo
const agenteIA = infoData.agente_ia
  || customData.agente_ia
  || agent.agent_type
  || 'sdr_inbound';

// Output inclui:
return {
  json: {
    agente_ia: agenteIA,
    prompts_by_mode: promptsByMode,
    system_prompt: agent.system_prompt,
    // ... outros campos
  }
};
```

### Nó 5: Montar Prompts Finais1
**Código crítico:**
```javascript
// Pegar prompts do Supabase
const promptsDoAgente = prev.prompts_by_mode || {};

// Normalizar modo (aliases)
function normalizarModo(modo) {
  const aliases = {
    'sdr': 'sdr_inbound',
    'inbound': 'sdr_inbound',
    'social_seller': 'social_seller_instagram',
    'instagram': 'social_seller_instagram',
    'agendamento': 'scheduler',
    'followup': 'followuper',
    'objecao': 'objection_handler',
    'objecoes': 'objection_handler',
    'reativador': 'reativador_base'
  };
  return aliases[modo.toLowerCase()] || modo.toLowerCase();
}

const modoNormalizado = normalizarModo(modoAtivo);

// Selecionar prompt do modo ativo
const promptModoAtivo = promptsDoAgente[modoNormalizado]
  || promptsDoAgente['sdr_inbound']
  || '';

// Montar system prompt final
const systemPrompt = promptBase + '\n\n' + promptModoAtivo;
```

---

## 5. COMO CRIAR NOVO CLIENTE

### Passo 1: Copiar SQL base
Usar o arquivo: `sql/isabella_v66_INSERT_COMPLETO.sql`

### Passo 2: Alterar campos obrigatórios

```sql
-- Alterar estes campos:
'agent_name' = 'Nome do Novo Agente',
'location_id' = 'ID_DA_LOCATION_GHL',
'system_prompt' = '# NOVO AGENTE v1.0\n\n## PAPEL\nVocê é...',
'prompts_by_mode' = '{
  "sdr_inbound": "...",
  "social_seller_instagram": "...",
  ...
}'
```

### Passo 3: Personalizar prompts_by_mode

Cada modo deve conter:
- **Contexto**: Quando esse modo é ativado
- **Tom específico**: Como falar nesse modo
- **Fluxo obrigatório**: Etapas que DEVE seguir
- **Erros críticos**: O que NUNCA fazer
- **Exemplos**: Se necessário

### Passo 4: Executar INSERT no Supabase

### Passo 5: Configurar GHL
- No workflow do GHL, setar o campo `agente_ia` no customData
- Exemplo: `agente_ia = "sdr_inbound"` ou `agente_ia = "social_seller_instagram"`

---

## 6. MODOS DISPONÍVEIS (Padrão)

| Modo | Quando usar | Tom |
|------|-------------|-----|
| `sdr_inbound` | Lead de tráfego pago (formulário) | Acolhedor, curioso |
| `social_seller_instagram` | Lead do Instagram DM | Casual, autêntico |
| `concierge` | Pós-agendamento | Premium, atencioso |
| `scheduler` | Momento de agendar | Resolutivo |
| `followuper` | Lead inativo (dias/semanas) | Leve, sem pressão |
| `objection_handler` | Objeções | Empático, seguro |
| `reativador_base` | Lead inativo (meses) | Caloroso, nostálgico |

---

## 7. ARQUIVOS DO PROJETO

```
ai-factory-agents/
├── sql/
│   └── isabella_v66_INSERT_COMPLETO.sql    # SQL modelo para novos clientes
│
├── n8n_nodes/
│   ├── node_preparar_execucao_v66_supabase.js
│   └── node_montar_prompts_finais_v66_supabase.js
│
├── SDR_Isabella_v66_FINAL.json             # Workflow n8n completo
│
└── docs/
    └── GUIA_PROMPTS_MODULARES_v66.md       # Este documento
```

---

## 8. TROUBLESHOOTING

### Problema: Modo ativo sempre sdr_inbound
**Causa**: agente_ia não está chegando do GHL
**Solução**: Verificar se o campo agente_ia está no customData do GHL

### Problema: Prompt do modo não encontrado
**Causa**: Nome do modo diferente no prompts_by_mode
**Solução**: Usar a função normalizarModo() ou verificar chaves do JSON

### Problema: prompts_by_mode vazio
**Causa**: Campo não existe na tabela ou agente não tem o campo preenchido
**Solução**: Executar ALTER TABLE para adicionar coluna e UPDATE para preencher

---

## 9. CHECKLIST NOVO CLIENTE

- [ ] Copiar SQL INSERT do Isabella v6.6
- [ ] Alterar agent_name
- [ ] Alterar location_id
- [ ] Criar system_prompt (prompt base)
- [ ] Criar prompts_by_mode (7 modos)
- [ ] Preencher business_config (valores, endereços)
- [ ] Preencher tools_config (ferramentas habilitadas)
- [ ] Executar INSERT no Supabase
- [ ] Configurar agente_ia no GHL
- [ ] Testar cada modo

---

**Versão:** 6.6
**Data:** 2026-01-08
**Autor:** Claude + Marcos
