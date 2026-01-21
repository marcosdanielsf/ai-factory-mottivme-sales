# Plano: Painel de Supervisão para Gestora de IA

## Contexto

A gestora de IA atualmente usa o Kommo para acompanhar leads de múltiplas contas Instagram dos clientes. O objetivo é trazer essa funcionalidade para dentro do front AI Factory, permitindo:

1. **Monitorar** se a IA está funcionando corretamente
2. **Intervir** quando necessário (pausar IA, responder manualmente)
3. **Marcar** leads como agendados/convertidos
4. **Visualizar** chats e etapas do funil por cliente

## Arquitetura Atual (Descobertas)

### Integração GHL Existente
- 46 sub-contas/locations configuradas
- Tabelas de conversas: `agent_conversations`, `agent_conversation_messages`
- Limite de 500 mensagens por busca
- Sync unidirecional (GHL → Supabase)
- Sem webhooks real-time configurados

### Estrutura de Dados Fragmentada
- `socialfy_leads` - tabela principal de leads
- `agent_conversations` - conversas dos agentes
- `agent_conversation_messages` - mensagens
- `n8n_historico_mensagens` - histórico via n8n
- `socialfy_messages` - mensagens Socialfy
- Sistema FUU (Follow Up Universal) com 6 tabelas

### Problema Principal
Dados de conversas fragmentados em múltiplas tabelas sem contexto unificado.

---

## Proposta de Implementação

### Fase 1: Consolidação de Dados (1-2 semanas)

#### 1.1 View Unificada de Conversas
```sql
CREATE VIEW vw_unified_conversations AS
SELECT
  c.id,
  c.location_id,
  c.contact_id,
  c.contact_name,
  c.contact_phone,
  c.status,
  c.last_message_at,
  c.ai_enabled,
  l.location_name as client_name,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_activity
FROM agent_conversations c
LEFT JOIN ghl_locations l ON c.location_id = l.location_id
LEFT JOIN agent_conversation_messages m ON c.id = m.conversation_id
GROUP BY c.id, l.location_name;
```

#### 1.2 Nova Tabela de Estado de Supervisão
```sql
CREATE TABLE supervision_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id),
  status VARCHAR(50) DEFAULT 'ai_active', -- ai_active, human_takeover, paused, scheduled, converted
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Fase 2: Backend/Hooks (1 semana)

#### 2.1 Hook: useSupervisionPanel
```typescript
// src/hooks/useSupervisionPanel.ts
interface ConversationWithSupervision {
  id: string;
  clientName: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: Date;
  status: 'ai_active' | 'human_takeover' | 'paused' | 'scheduled' | 'converted';
  aiEnabled: boolean;
  messageCount: number;
  funnelStage?: string;
}

export function useSupervisionPanel(options: {
  clientId?: string;
  status?: string[];
  limit?: number;
}) {
  // Busca conversas com estado de supervisão
}
```

#### 2.2 Hook: useConversationMessages
```typescript
// src/hooks/useConversationMessages.ts
export function useConversationMessages(conversationId: string) {
  // Busca mensagens de uma conversa específica
  // Inclui histórico de intervenções humanas
}
```

#### 2.3 Hook: useSupervisionActions
```typescript
// src/hooks/useSupervisionActions.ts
export function useSupervisionActions() {
  // pauseAI(conversationId)
  // resumeAI(conversationId)
  // takeOver(conversationId)
  // markAsScheduled(conversationId, date)
  // markAsConverted(conversationId)
  // sendMessage(conversationId, message)
}
```

### Fase 3: Interface (2 semanas)

#### 3.1 Nova Página: /supervision
```
src/pages/Supervision.tsx
├── SupervisionHeader (filtros por cliente, status, busca)
├── ConversationList (lista de conversas com badges de status)
├── ConversationDetail (chat + ações)
└── FunnelView (visualização do funil por cliente)
```

#### 3.2 Componentes Principais

**ConversationList**
- Lista de conversas ordenadas por última atividade
- Badges: 🤖 IA Ativa, 👤 Humano, ⏸️ Pausada, 📅 Agendada, ✅ Convertida
- Indicador de mensagens não lidas
- Filtro rápido por status

**ConversationDetail**
- Histórico de mensagens (estilo WhatsApp)
- Indicador de quem enviou (IA vs Humano vs Lead)
- Campo de resposta manual
- Botões de ação rápida:
  - Pausar IA
  - Assumir conversa
  - Marcar como agendada
  - Marcar como convertida
  - Devolver para IA

**FunnelView**
- Kanban com etapas do funil
- Drag & drop para mover leads
- Contadores por etapa
- Filtro por cliente

### Fase 4: Integrações (1 semana)

#### 4.1 Webhook GHL → Supabase (Real-time)
- Configurar webhook no GHL para novas mensagens
- n8n workflow para processar e salvar
- Atualizar view em tempo real

#### 4.2 Ação: Enviar Mensagem via GHL
- Endpoint no n8n para enviar mensagens
- Marcar mensagem como "enviada por humano"
- Atualizar status da conversa

---

## Escopo MVP (Recomendado)

Para entregar valor rápido, sugiro começar com:

### MVP Semana 1-2
1. ✅ View unificada de conversas (SQL)
2. ✅ Hook `useSupervisionPanel` básico
3. ✅ Página `/supervision` com lista de conversas
4. ✅ Visualização de mensagens (read-only)
5. ✅ Filtro por cliente

### MVP Semana 3
6. ✅ Ações básicas: pausar/retomar IA
7. ✅ Marcar como agendada/convertida
8. ✅ Notas na conversa

### Fase 2 (Futuro)
- Envio de mensagens manuais
- Kanban de funil
- Webhooks real-time
- Notificações push

---

## Dependências e Riscos

### Dependências
- Acesso à API GHL para ações (já existe)
- Tabelas de conversas populadas (verificar)
- Permissões de escrita no Supabase

### Riscos
| Risco | Mitigação |
|-------|-----------|
| Dados fragmentados | View unificada resolve |
| Limite 500 mensagens GHL | Paginação no hook |
| Sync não real-time | Polling a cada 30s (MVP) |
| Performance com muitos clientes | Índices + filtros obrigatórios |

---

## Estrutura de Arquivos

```
src/
├── pages/
│   └── Supervision.tsx           # Nova página principal
├── components/
│   └── supervision/
│       ├── ConversationList.tsx  # Lista de conversas
│       ├── ConversationDetail.tsx # Chat + ações
│       ├── SupervisionHeader.tsx # Filtros
│       ├── MessageBubble.tsx     # Bolha de mensagem
│       └── StatusBadge.tsx       # Badge de status
├── hooks/
│   ├── useSupervisionPanel.ts    # Hook principal
│   ├── useConversationMessages.ts # Mensagens
│   └── useSupervisionActions.ts  # Ações
└── types/
    └── supervision.ts            # Tipos TypeScript
```

---

## Perguntas para Definir Escopo

1. **Prioridade**: Começar pelo MVP (read-only + ações básicas) ou já incluir envio de mensagens?

2. **Clientes**: Todos os 46 clientes ou subset específico para piloto?

3. **Real-time**: Polling (mais simples) ou webhooks (mais complexo mas melhor UX)?

4. **Kanban**: Essencial no MVP ou pode ser fase 2?
