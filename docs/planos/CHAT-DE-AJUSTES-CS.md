# Chat de Ajustes para CS - Especificação Técnica

## Visão Geral

O **Chat de Ajustes** permite que o time de CS faça modificações controladas nos agentes de IA através de conversa em linguagem natural, sem precisar editar código ou acionar o desenvolvedor.

### Problema que Resolve

Hoje: CS → WhatsApp → Marcos → Edita prompt → Deploy

Com Chat: CS → Chat de Ajustes → IA interpreta → Aplica mudança → Versiona automaticamente

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    ChatAjustesPage.tsx                        │  │
│  │  ┌─────────────┐  ┌────────────────────────────────────────┐ │  │
│  │  │ AgentPicker │  │           ChatInterface                │ │  │
│  │  │             │  │  ┌──────────────────────────────────┐  │ │  │
│  │  │ [Social Sel]│  │  │ Mensagens                        │  │ │  │
│  │  │ [Isabela]   │  │  │                                  │  │ │  │
│  │  │ [Dr. Luiz]  │  │  │ 👤 "Cliente pediu pra não falar │  │ │  │
│  │  │             │  │  │     de preço antes de qualificar"│  │ │  │
│  │  │             │  │  │                                  │  │ │  │
│  │  │             │  │  │ 🤖 "Entendi! Vou adicionar..."  │  │ │  │
│  │  │             │  │  │    [Preview da mudança]         │  │ │  │
│  │  │             │  │  │    [✓ Aplicar] [✗ Cancelar]     │  │ │  │
│  │  │             │  │  │                                  │  │ │  │
│  │  └─────────────┘  │  └──────────────────────────────────┘  │ │  │
│  │                   │  ┌──────────────────────────────────┐  │ │  │
│  │  ┌─────────────┐  │  │ [Digite sua solicitação...]  [→] │  │ │  │
│  │  │ Histórico   │  │  └──────────────────────────────────┘  │ │  │
│  │  │ de Ajustes  │  └────────────────────────────────────────┘ │  │
│  │  └─────────────┘                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (n8n Workflow)                         │
│                                                                     │
│   Webhook ──▶ Interpreter ──▶ Validator ──▶ Applier ──▶ Versioner  │
│      │           (LLM)          (rules)      (SQL)       (SQL)     │
│      │                                                              │
│      └── Contexto: prompt atual, hiperpersonalizações, ferramentas │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (PostgreSQL)                       │
│                                                                     │
│   agent_versions ◄── system_prompts ◄── prompt_adjustments (NOVA)  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Zonas Editáveis vs Protegidas

### Estrutura do Prompt Atual

```markdown
### 1. PERSONA E CONTEXTO ###
[PARCIALMENTE EDITÁVEL]
- Tom de voz ✅
- Anti-persona ✅
- Características básicas ❌

### 2. SOBRE O NEGÓCIO ###
[NÃO EDITÁVEL - vem do kickoff]
- Nome, Segmento, Serviços, Diferenciais

### 3. MODOS DE OPERAÇÃO ###
[NÃO EDITÁVEL]
- first_contact, qualifier, scheduler, followuper

### 4. COMPLIANCE E GUARDRAILS ###
[EDITÁVEL]
- Proibições (NUNCA fazer) ✅
- Escalações (quando escalar) ✅

### 5. FEW-SHOT TRAINING ###
[EDITÁVEL]
- Exemplos de diálogos ✅
- Respostas para objeções ✅

### 6. HIPERPERSONALIZAÇÕES ###
[EDITÁVEL]
- DDD/Região ✅
- Setor/Nicho ✅
- Porte da empresa ✅
- Persona do cliente ✅

### 7. FERRAMENTAS ###
[EDITÁVEL - adicionar/remover]
- busca_disponibilidade ✅
- agendar_reuniao ✅
- consultar_crm ✅
```

### Mapeamento de Intenções

| Intenção do CS | Zona Afetada | Ação |
|----------------|--------------|------|
| "Não pode falar de preço" | GUARDRAILS.proibicoes | ADD |
| "Deve escalar se pedir proposta" | GUARDRAILS.escalacoes | ADD |
| "Tirar o emoji das mensagens" | PERSONA.tom_de_voz | UPDATE |
| "Adicionar exemplo de resposta para..." | FEW_SHOT | ADD |
| "Cliente é do setor de saúde" | HIPERPERSONALIZACOES.setor | UPDATE |
| "Não usar mais a ferramenta X" | FERRAMENTAS | REMOVE |
| "Agente deve ser mais formal" | PERSONA.tom_de_voz | UPDATE |
| "Adicionar ferramenta de consulta de estoque" | FERRAMENTAS | ADD |

---

## Schema do Banco de Dados

### Nova Tabela: `prompt_adjustments`

```sql
-- ============================================
-- TABELA: PROMPT_ADJUSTMENTS
-- ============================================
-- Registro de todos os ajustes feitos via Chat
-- Permite auditoria, rollback e análise de padrões

CREATE TABLE IF NOT EXISTS prompt_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,
  system_prompt_id UUID REFERENCES system_prompts(id), -- Prompt ANTES da mudança
  new_prompt_id UUID REFERENCES system_prompts(id),    -- Prompt DEPOIS da mudança

  -- Quem fez
  requested_by VARCHAR(255) NOT NULL, -- Email/nome do CS
  requested_by_role VARCHAR(50) DEFAULT 'cs', -- 'cs', 'admin', 'developer'

  -- O que pediu (linguagem natural)
  original_request TEXT NOT NULL, -- "Cliente pediu pra não falar de preço"

  -- Interpretação da IA
  interpreted_intent VARCHAR(100) NOT NULL, -- 'add_guardrail', 'update_persona', etc
  interpreted_zone VARCHAR(50) NOT NULL,    -- 'guardrails', 'few_shot', etc
  interpreted_action VARCHAR(20) NOT NULL,  -- 'add', 'update', 'remove'
  interpretation_confidence DECIMAL(3,2),   -- 0.00 a 1.00

  -- Mudança proposta
  change_preview JSONB NOT NULL,
  -- Estrutura:
  -- {
  --   "zone": "guardrails",
  --   "field": "proibicoes",
  --   "action": "add",
  --   "before": ["item1", "item2"],
  --   "after": ["item1", "item2", "Nunca mencionar preço antes de qualificar"],
  --   "diff_text": "+ Nunca mencionar preço antes de qualificar"
  -- }

  -- Status do ajuste
  status VARCHAR(50) DEFAULT 'pending',
  -- 'pending', 'approved', 'rejected', 'applied', 'rolled_back'

  -- Aprovação (se necessário)
  requires_approval BOOLEAN DEFAULT false, -- true se zona sensível ou confiança baixa
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Aplicação
  applied_at TIMESTAMPTZ,

  -- Rollback
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,

  -- Metadata
  session_id VARCHAR(255), -- ID da sessão de chat
  conversation_history JSONB DEFAULT '[]', -- Histórico do chat

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_adjustments_agent ON prompt_adjustments(agent_version_id, created_at DESC);
CREATE INDEX idx_adjustments_status ON prompt_adjustments(status);
CREATE INDEX idx_adjustments_requested_by ON prompt_adjustments(requested_by);
CREATE INDEX idx_adjustments_zone ON prompt_adjustments(interpreted_zone);

-- Comentários
COMMENT ON TABLE prompt_adjustments IS
  '[Chat de Ajustes] Registro de modificações feitas pelo CS via chat';
```

### Nova Tabela: `editable_zones_config`

```sql
-- ============================================
-- TABELA: EDITABLE_ZONES_CONFIG
-- ============================================
-- Configuração de quais zonas são editáveis e por quem

CREATE TABLE IF NOT EXISTS editable_zones_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Escopo (global ou por agente)
  agent_version_id UUID REFERENCES agent_versions(id), -- NULL = global

  -- Zona
  zone_name VARCHAR(50) NOT NULL, -- 'guardrails', 'few_shot', 'persona', etc
  zone_field VARCHAR(100), -- 'proibicoes', 'tom_de_voz', etc (NULL = toda a zona)

  -- Permissões
  editable_by_cs BOOLEAN DEFAULT true,
  editable_by_admin BOOLEAN DEFAULT true,

  -- Regras
  requires_approval BOOLEAN DEFAULT false,
  max_items INTEGER, -- Limite de itens (ex: max 10 proibições)
  validation_regex TEXT, -- Regex para validar entrada

  -- Exemplos/ajuda
  help_text TEXT, -- Texto de ajuda para o CS
  examples TEXT[], -- Exemplos de valores válidos

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint
  UNIQUE NULLS NOT DISTINCT (agent_version_id, zone_name, zone_field)
);

-- Dados iniciais (configuração padrão)
INSERT INTO editable_zones_config (zone_name, zone_field, editable_by_cs, requires_approval, help_text, examples) VALUES
  ('guardrails', 'proibicoes', true, false,
   'Coisas que o agente NUNCA deve fazer',
   ARRAY['Nunca mencionar preço', 'Nunca falar mal da concorrência']),

  ('guardrails', 'escalacoes', true, false,
   'Situações em que deve passar para humano',
   ARRAY['Se pedir proposta formal', 'Se demonstrar frustração']),

  ('persona', 'tom_de_voz', true, false,
   'Como o agente deve se comunicar',
   ARRAY['Formal e respeitoso', 'Amigável mas profissional']),

  ('persona', 'anti_persona', true, false,
   'Como o agente NÃO deve ser',
   ARRAY['Agressivo', 'Insistente demais']),

  ('few_shot', NULL, true, false,
   'Exemplos de diálogos para treinar o agente',
   ARRAY['Q: Como funciona? A: Nós ajudamos empresas a...']),

  ('hiperpersonalizacoes', 'setor', true, false,
   'Setor/nicho do cliente',
   ARRAY['Saúde', 'Tecnologia', 'Varejo']),

  ('hiperpersonalizacoes', 'porte', true, false,
   'Porte da empresa do cliente',
   ARRAY['PME', 'Médio', 'Enterprise']),

  ('hiperpersonalizacoes', 'persona_cliente', true, false,
   'Perfil típico do cliente',
   ARRAY['CEO', 'Gerente de Marketing', 'Diretor Comercial']),

  ('ferramentas', NULL, true, true, -- Requer aprovação
   'Ferramentas disponíveis para o agente',
   ARRAY['busca_disponibilidade', 'agendar_reuniao']),

  -- Zonas protegidas
  ('modos_operacao', NULL, false, true,
   'Modos de operação do agente (protegido)',
   NULL),

  ('sobre_negocio', NULL, false, true,
   'Informações do negócio (protegido - vem do kickoff)',
   NULL);
```

---

## Workflow n8n: 15-Chat-de-Ajustes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    15-Chat-de-Ajustes.json                          │
└─────────────────────────────────────────────────────────────────────┘

[Webhook] ──▶ [Validate Request] ──▶ [Load Context] ──▶ [Interpreter LLM]
    │                                       │                  │
    │                                       │                  ▼
    │                                       │         [Parse Intent]
    │                                       │                  │
    │                                       │                  ▼
    │                                       │         [Check Permissions]
    │                                       │                  │
    │                                       ▼                  ▼
    │                              ┌─────────────────────────────────┐
    │                              │       Generate Preview          │
    │                              │  - Mostra antes/depois          │
    │                              │  - Calcula diff                 │
    │                              └─────────────────────────────────┘
    │                                              │
    │                                              ▼
    │                                    [Response: Preview]
    │                                              │
    │◄─────────────────────────────────────────────┘
    │
    │  (Usuário aprova)
    │
    ▼
[Webhook: Confirm] ──▶ [Apply Change] ──▶ [Create New Version] ──▶ [Log Adjustment]
                              │                    │                      │
                              │                    │                      │
                              ▼                    ▼                      ▼
                       [Update Prompt]     [system_prompts]      [prompt_adjustments]
                                                  │
                                                  ▼
                                          [Activate New Version]
                                                  │
                                                  ▼
                                          [Response: Success]
```

### Nós Principais

#### 1. Interpreter LLM (Claude Sonnet)

```json
{
  "model": "claude-sonnet-4-20250514",
  "system_prompt": "Você é um assistente especializado em interpretar solicitações de ajuste para agentes de IA conversacionais.\n\nSua tarefa é:\n1. Entender o que o CS está pedindo em linguagem natural\n2. Identificar qual ZONA do prompt precisa ser modificada\n3. Identificar qual AÇÃO deve ser tomada (add, update, remove)\n4. Gerar a mudança específica\n\n## ZONAS DISPONÍVEIS\n- guardrails.proibicoes: Coisas que o agente NUNCA deve fazer\n- guardrails.escalacoes: Quando passar para humano\n- persona.tom_de_voz: Como o agente fala\n- persona.anti_persona: Como o agente NÃO deve ser\n- few_shot: Exemplos de diálogos\n- hiperpersonalizacoes.setor: Setor do cliente\n- hiperpersonalizacoes.porte: Porte da empresa\n- hiperpersonalizacoes.persona_cliente: Perfil do cliente\n- ferramentas: Tools disponíveis\n\n## ZONAS PROTEGIDAS (não pode editar)\n- modos_operacao\n- sobre_negocio\n- estrutura_prompt\n\n## FORMATO DE RESPOSTA\n```json\n{\n  \"understood\": true,\n  \"zone\": \"guardrails\",\n  \"field\": \"proibicoes\",\n  \"action\": \"add\",\n  \"value\": \"Nunca mencionar preço antes de confirmar qualificação do lead\",\n  \"confidence\": 0.95,\n  \"explanation\": \"Vou adicionar uma nova proibição na seção de Guardrails...\"\n}\n```",
  "messages": [
    {
      "role": "user",
      "content": "Contexto do agente:\n{{ $json.prompt_atual }}\n\nSolicitação do CS:\n{{ $json.request }}"
    }
  ]
}
```

#### 2. Generate Preview

```javascript
// Code Node: Gera preview da mudança
const interpretation = $json.interpretation;
const currentPrompt = $json.current_prompt;

// Parsear o prompt atual em zonas
const zones = parsePromptIntoZones(currentPrompt);

// Aplicar a mudança virtualmente
const preview = {
  zone: interpretation.zone,
  field: interpretation.field,
  action: interpretation.action,
  before: zones[interpretation.zone][interpretation.field],
  after: applyChange(
    zones[interpretation.zone][interpretation.field],
    interpretation.action,
    interpretation.value
  ),
  diff_text: generateDiff(before, after)
};

return {
  success: true,
  preview,
  requires_approval: checkIfRequiresApproval(interpretation),
  confirmation_message: generateConfirmationMessage(interpretation, preview)
};
```

---

## Frontend: Componentes React

### 1. ChatAjustesPage.tsx

```tsx
// pages/ChatAjustes.tsx
import { useState } from 'react';
import { AgentSelector } from '@/components/chat-ajustes/AgentSelector';
import { ChatInterface } from '@/components/chat-ajustes/ChatInterface';
import { AdjustmentHistory } from '@/components/chat-ajustes/AdjustmentHistory';

export function ChatAjustesPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="flex h-screen">
      {/* Sidebar - Seletor de Agente */}
      <aside className="w-64 border-r border-zinc-800 p-4">
        <AgentSelector
          onSelect={setSelectedAgent}
          selected={selectedAgent}
        />
        <AdjustmentHistory agentId={selectedAgent?.id} />
      </aside>

      {/* Main - Chat Interface */}
      <main className="flex-1 flex flex-col">
        {selectedAgent ? (
          <ChatInterface agent={selectedAgent} />
        ) : (
          <EmptyState message="Selecione um agente para começar" />
        )}
      </main>
    </div>
  );
}
```

### 2. ChatInterface.tsx

```tsx
// components/chat-ajustes/ChatInterface.tsx
import { useState } from 'react';
import { Message, PendingChange } from '@/types/chat-ajustes';

interface Props {
  agent: Agent;
}

export function ChatInterface({ agent }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Adiciona mensagem do usuário
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Chama o webhook do n8n
      const response = await fetch('/api/chat-ajustes', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: agent.id,
          request: input,
          session_id: sessionId
        })
      });

      const data = await response.json();

      if (data.preview) {
        // IA interpretou e gerou preview
        setPendingChange(data.preview);

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.confirmation_message,
          preview: data.preview,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyChange = async () => {
    if (!pendingChange) return;

    const response = await fetch('/api/chat-ajustes/apply', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: agent.id,
        change: pendingChange,
        session_id: sessionId
      })
    });

    const data = await response.json();

    if (data.success) {
      const successMessage: Message = {
        role: 'assistant',
        content: `✅ Alteração aplicada! Nova versão: v${data.new_version}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      setPendingChange(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold">Chat de Ajustes</h1>
        <p className="text-sm text-zinc-400">Agente: {agent.name}</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {pendingChange && (
          <ChangePreview
            change={pendingChange}
            onApply={applyChange}
            onCancel={() => setPendingChange(null)}
          />
        )}

        {isLoading && <LoadingIndicator />}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua solicitação de ajuste..."
            className="flex-1 bg-zinc-900 rounded-lg px-4 py-2"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. ChangePreview.tsx

```tsx
// components/chat-ajustes/ChangePreview.tsx
interface Props {
  change: PendingChange;
  onApply: () => void;
  onCancel: () => void;
}

export function ChangePreview({ change, onApply, onCancel }: Props) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <h3 className="font-semibold mb-2">Preview da Alteração</h3>

      {/* Zona afetada */}
      <div className="text-sm text-zinc-400 mb-3">
        📍 Seção: <span className="text-white">{change.zone}</span>
        {change.field && (
          <> → <span className="text-white">{change.field}</span></>
        )}
      </div>

      {/* Diff */}
      <div className="bg-zinc-950 rounded p-3 font-mono text-sm mb-4">
        {change.action === 'add' && (
          <div className="text-green-400">+ {change.value}</div>
        )}
        {change.action === 'remove' && (
          <div className="text-red-400">- {change.before}</div>
        )}
        {change.action === 'update' && (
          <>
            <div className="text-red-400">- {change.before}</div>
            <div className="text-green-400">+ {change.after}</div>
          </>
        )}
      </div>

      {/* Aviso se requer aprovação */}
      {change.requires_approval && (
        <div className="bg-yellow-900/30 text-yellow-400 p-2 rounded mb-4 text-sm">
          ⚠️ Esta alteração requer aprovação de um administrador
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded"
        >
          ✓ Aplicar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded"
        >
          ✗ Cancelar
        </button>
      </div>
    </div>
  );
}
```

---

## Fluxo Completo de Uso

### Cenário 1: Adicionar Proibição

```
👤 CS: "O cliente Isabela pediu para o agente não mencionar
       concorrentes durante a conversa"

🤖 IA: "Entendi! Vou adicionar uma regra de COMPLIANCE.

        📍 Seção: GUARDRAILS (Proibições)
        ➕ Adicionar: 'Nunca mencionar ou comparar com concorrentes'

        ┌────────────────────────────────────┐
        │ + Nunca mencionar ou comparar com  │
        │   concorrentes                     │
        └────────────────────────────────────┘

        [✓ Aplicar]  [✏️ Editar]  [✗ Cancelar]"

👤 CS: [Clica em Aplicar]

🤖 IA: "✅ Alteração aplicada com sucesso!

        Nova versão: v3.2
        Agente: Isabela

        A partir de agora, o agente não mencionará concorrentes."
```

### Cenário 2: Modificar Tom de Voz

```
👤 CS: "Preciso que o Social Seller seja mais formal,
       o cliente reclama que tá muito informal"

🤖 IA: "Entendi! Vou ajustar o TOM DE VOZ do agente.

        📍 Seção: PERSONA (Tom de Voz)
        🔄 Atualizar:

        ┌────────────────────────────────────┐
        │ - Seu tom profissional mas amigável│
        │ + Seu tom é formal e respeitoso,   │
        │   mantendo profissionalismo em     │
        │   todas as interações              │
        └────────────────────────────────────┘

        [✓ Aplicar]  [✏️ Editar]  [✗ Cancelar]"
```

### Cenário 3: Zona Protegida

```
👤 CS: "Quero mudar os modos de operação do agente"

🤖 IA: "⚠️ Desculpe, mas a seção MODOS DE OPERAÇÃO é protegida
        e não pode ser modificada via Chat de Ajustes.

        Esta seção define a lógica fundamental do agente e
        requer alteração técnica pelo desenvolvedor.

        📞 Por favor, entre em contato com @marcos para
        essa solicitação.

        Posso ajudar com outras modificações:
        • Guardrails (proibições, escalações)
        • Tom de voz e personalidade
        • Exemplos de diálogos (few-shot)
        • Hiperpersonalizações"
```

---

## Segurança e Auditoria

### Permissões por Papel

| Papel | Zonas Editáveis | Aprovação |
|-------|-----------------|-----------|
| **CS** | guardrails, few_shot, persona.tom, hiperpersonalizacoes | Não precisa |
| **CS** | ferramentas | Precisa aprovação |
| **Admin** | Tudo exceto modos_operacao | Não precisa |
| **Developer** | Tudo | Não precisa |

### Logs de Auditoria

Toda alteração é registrada em `prompt_adjustments` com:
- Quem pediu
- O que pediu (texto original)
- Como foi interpretado
- O que foi mudado (diff)
- Quando foi aplicado
- Versão anterior e nova

### Rollback

Se uma alteração causar problemas:

```
👤 CS: "A última alteração no Social Seller quebrou algo,
       preciso voltar atrás"

🤖 IA: "Encontrei 3 alterações recentes no Social Seller:

        1. v3.2 (há 2h) - Adicionou proibição sobre preços
        2. v3.1 (há 5h) - Alterou tom de voz
        3. v3.0 (há 2d) - Versão inicial

        Qual versão deseja restaurar?

        [Restaurar v3.1]  [Restaurar v3.0]  [Cancelar]"
```

---

## Próximos Passos para Implementação

### Fase 1: Backend (Prioridade Alta)
1. [ ] Criar tabela `prompt_adjustments`
2. [ ] Criar tabela `editable_zones_config`
3. [ ] Criar workflow `15-Chat-de-Ajustes.json`
4. [ ] Testar interpretação de intenções com Claude

### Fase 2: Frontend (Prioridade Alta)
1. [ ] Criar página `/chat-ajustes`
2. [ ] Implementar `ChatInterface` component
3. [ ] Implementar `ChangePreview` component
4. [ ] Conectar com API do n8n

### Fase 3: Refinamento (Prioridade Média)
1. [ ] Adicionar histórico de ajustes na sidebar
2. [ ] Implementar rollback via chat
3. [ ] Adicionar notificações de mudanças
4. [ ] Dashboard de auditoria

### Fase 4: Inteligência (Prioridade Baixa)
1. [ ] Sugestões automáticas baseadas em padrões
2. [ ] Aprendizado com ajustes anteriores
3. [ ] Integração com Reflection Loop
