# Prompt para Gemini - Flow Builder Visual Frontend

## Contexto

Você vai criar um frontend Next.js 14 para um "Flow Builder Visual" - uma interface estilo Miro/Figma para criar, visualizar e simular fluxos conversacionais de vendas de IA.

## Objetivo Principal

Interface visual onde o usuário pode:
1. Arrastar cards (nodes) para um canvas infinito
2. Conectar cards com linhas (edges)
3. Clicar em cards para ver/editar conteúdo
4. Simular conversas e ver o "raciocínio" da IA

## Stack Obrigatória

```json
{
  "framework": "Next.js 14 (App Router)",
  "canvas": "@xyflow/react (React Flow)",
  "ui": "Tailwind CSS + shadcn/ui",
  "state": "Zustand",
  "drag_drop": "@dnd-kit/core",
  "animations": "framer-motion",
  "icons": "lucide-react"
}
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Redirect para /flows
│   ├── flows/
│   │   ├── page.tsx                # Lista de flows
│   │   └── [id]/
│   │       └── page.tsx            # Editor do flow
│   └── api/                        # Proxy para backend Python
│       └── [...path]/route.ts
├── components/
│   ├── ui/                         # shadcn components
│   ├── flow/
│   │   ├── FlowCanvas.tsx          # Canvas principal
│   │   ├── FlowControls.tsx        # Zoom, fit, minimap
│   │   ├── FlowMinimap.tsx         # Minimap navegação
│   │   └── FlowToolbar.tsx         # Toolbar superior
│   ├── nodes/                      # Custom nodes (cards)
│   │   ├── ModeNode.tsx            # Card de Mode
│   │   ├── EtapaNode.tsx           # Card de Etapa
│   │   ├── MensagemNode.tsx        # Card de Mensagem
│   │   ├── ScriptNode.tsx          # Card de Script
│   │   ├── DecisaoNode.tsx         # Card de Decisão
│   │   └── SimulacaoNode.tsx       # Card de Simulação
│   ├── panels/
│   │   ├── ComponentsPanel.tsx     # Painel esquerdo (drag components)
│   │   ├── PropertiesPanel.tsx     # Painel direito (props do node)
│   │   └── ReasoningPanel.tsx      # Painel de IA Reasoning
│   ├── modals/
│   │   ├── NodeDetailModal.tsx     # Modal de detalhes do node
│   │   └── SimulatorModal.tsx      # Modal do simulador
│   └── simulator/
│       ├── ChatSimulator.tsx       # Interface de chat
│       ├── MessageBubble.tsx       # Bolha de mensagem
│       └── ReasoningDisplay.tsx    # Display de critérios IA
├── stores/
│   ├── flowStore.ts                # Estado do flow (nodes, edges)
│   ├── uiStore.ts                  # Estado da UI (panels, modals)
│   └── simulatorStore.ts           # Estado do simulador
├── hooks/
│   ├── useFlow.ts                  # Hook para operações do flow
│   ├── useNodes.ts                 # Hook para manipular nodes
│   └── useSimulator.ts             # Hook para simulação
├── lib/
│   ├── api.ts                      # Cliente API (fetch wrapper)
│   ├── utils.ts                    # Utilitários gerais
│   └── constants.ts                # Constantes (tipos de nodes, etc)
└── types/
    ├── flow.ts                     # Tipos do flow
    ├── node.ts                     # Tipos dos nodes
    └── simulation.ts               # Tipos da simulação
```

## Tipos TypeScript

```typescript
// types/node.ts
export type NodeType = 'mode' | 'etapa' | 'mensagem' | 'script' | 'decisao' | 'simulacao';

export interface BaseNodeData {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
}

export interface ModeNodeData extends BaseNodeData {
  type: 'mode';
  modeName: string;
  status: 'active' | 'inactive';
  etapas: string[];
  stats?: {
    conversations: number;
    conversionRate: number;
  };
  primeDirective?: string;
}

export interface EtapaNodeData extends BaseNodeData {
  type: 'etapa';
  objetivo: string;
  tecnicas: string[];
}

export interface MensagemNodeData extends BaseNodeData {
  type: 'mensagem';
  messageType: 'agent' | 'lead' | 'system';
  content: string;
  criteriosIA?: {
    applied: string[];
    detected: string[];
  };
}

export interface ScriptNodeData extends BaseNodeData {
  type: 'script';
  scriptType: 'audio' | 'video' | 'vsl' | 'story';
  duration?: string;
  content: string;
  audioUrl?: string;
}

export interface DecisaoNodeData extends BaseNodeData {
  type: 'decisao';
  condition: string;
  criterio: string;
  outputs: {
    sim: string;
    nao: string;
  };
}

export interface SimulacaoNodeData extends BaseNodeData {
  type: 'simulacao';
  leadName: string;
  persona: string;
  messages: SimulationMessage[];
  status: 'idle' | 'running' | 'completed';
}

// types/flow.ts
export interface Flow {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  canvasData?: {
    zoom: number;
    position: { x: number; y: number };
  };
  createdAt: string;
  updatedAt: string;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: ModeNodeData | EtapaNodeData | MensagemNodeData | ScriptNodeData | DecisaoNodeData | SimulacaoNodeData;
  width?: number;
  height?: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'default' | 'conditional' | 'fallback';
  label?: string;
  animated?: boolean;
}

// types/simulation.ts
export interface SimulationMessage {
  id: string;
  role: 'agent' | 'lead';
  content: string;
  timestamp: string;
  reasoning?: {
    appliedTechniques: string[];
    detectedIntents: string[];
    decisionFactors: string[];
    nextAction: string;
  };
}

export interface Simulation {
  id: string;
  flowId: string;
  persona: {
    name: string;
    description: string;
    characteristics: string[];
  };
  messages: SimulationMessage[];
  currentNodeId: string;
  status: 'running' | 'paused' | 'completed';
}
```

## Componentes Principais

### 1. FlowCanvas.tsx

```tsx
// Componente principal do canvas
// Usar @xyflow/react (React Flow v12+)
// Implementar:
// - Canvas infinito com pan e zoom
// - Grid de fundo opcional
// - Snap to grid
// - Multi-seleção de nodes
// - Undo/Redo
// - Minimap no canto inferior direito
// - Animação de "pulso" nas edges mostrando fluxo

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
```

### 2. Custom Nodes (Cards)

Cada tipo de node deve ter visual distinto:

```
┌─────────────────────────────────────┐
│ 🎯 MODE CARD                        │  ← Header com ícone e tipo
│ ─────────────────────────────────── │
│ Nome: SDR Inbound                   │  ← Nome em destaque
│ Status: ● Ativo                     │  ← Badge de status
│                                     │
│ Etapas: 4                           │  ← Info resumida
│ [Ativação] [Qualificação]           │  ← Tags das etapas
│ [Pitch] [Transição]                 │
│                                     │
│ ⚡ 234 conversas | 67% conversão    │  ← Stats (se houver)
└─────────────────────────────────────┘
```

Cores por tipo:
- Mode: Azul (#3B82F6)
- Etapa: Verde (#10B981)
- Mensagem: Roxo (#8B5CF6)
- Script: Laranja (#F59E0B)
- Decisão: Amarelo (#EAB308)
- Simulação: Rosa (#EC4899)

### 3. ComponentsPanel.tsx (Painel Esquerdo)

```tsx
// Painel com drag & drop de componentes
// Usar @dnd-kit para arrastar para o canvas
// Seções:
// - Componentes (cards disponíveis)
// - Templates (flows prontos)
// - Histórico (ações recentes)
```

### 4. PropertiesPanel.tsx (Painel Direito)

```tsx
// Painel que mostra propriedades do node selecionado
// Form dinâmico baseado no tipo do node
// Seções:
// - Propriedades básicas (nome, descrição)
// - Propriedades específicas do tipo
// - IA Reasoning (se aplicável)
// - Ações (deletar, duplicar)
```

### 5. SimulatorModal.tsx

```tsx
// Modal de simulação de conversa
// Interface estilo chat do WhatsApp
// Cada mensagem mostra:
// - Remetente (Agent ou Lead)
// - Conteúdo da mensagem
// - Botão para expandir "reasoning" da IA
//
// Footer com:
// - Input para próxima mensagem do lead (simulado)
// - Botão "Continuar Simulação"
// - Botão "Resetar"
// - Botão "Exportar"
```

## Estado (Zustand Stores)

### flowStore.ts

```typescript
interface FlowState {
  // Data
  currentFlow: Flow | null;
  nodes: FlowNode[];
  edges: FlowEdge[];

  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // History (undo/redo)
  history: FlowState[];
  historyIndex: number;

  // Actions
  setFlow: (flow: Flow) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: FlowEdge) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
}
```

### uiStore.ts

```typescript
interface UIState {
  // Panels
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  // Modals
  nodeDetailModalOpen: boolean;
  simulatorModalOpen: boolean;

  // Canvas
  canvasZoom: number;
  canvasPosition: { x: number; y: number };
  showGrid: boolean;
  showMinimap: boolean;

  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  openNodeDetailModal: () => void;
  closeNodeDetailModal: () => void;
  openSimulatorModal: () => void;
  closeSimulatorModal: () => void;
  setCanvasZoom: (zoom: number) => void;
}
```

## API Integration

O frontend vai consumir uma API FastAPI (Python). Criar proxy routes em Next.js:

```typescript
// src/app/api/[...path]/route.ts
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const response = await fetch(`${BACKEND_URL}/api/${path}`, {
    headers: request.headers,
  });
  return response;
}

// Implementar POST, PUT, DELETE também
```

### Endpoints que o frontend vai consumir:

```
GET    /api/flows                    # Lista flows
POST   /api/flows                    # Cria flow
GET    /api/flows/{id}               # Busca flow
PUT    /api/flows/{id}               # Atualiza flow
DELETE /api/flows/{id}               # Remove flow

GET    /api/flows/{id}/nodes         # Lista nodes
POST   /api/flows/{id}/nodes         # Adiciona node
PUT    /api/flows/{id}/nodes/{nid}   # Atualiza node
DELETE /api/flows/{id}/nodes/{nid}   # Remove node

GET    /api/flows/{id}/edges         # Lista edges
POST   /api/flows/{id}/edges         # Cria edge
DELETE /api/flows/{id}/edges/{eid}   # Remove edge

POST   /api/simulate                 # Inicia simulação
POST   /api/simulate/step            # Avança 1 step
GET    /api/simulate/{sid}/reasoning # Busca reasoning da IA
```

## Wireframes Visuais

### Tela Principal do Editor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎨 Flow Builder          [Flow: SDR Inbound ▼]    [Salvar] [Exportar] [▶]  │
├────────────┬──────────────────────────────────────────────────┬─────────────┤
│            │                                                  │             │
│ 📦 CARDS   │                    CANVAS                        │ 🔧 PROPS    │
│            │                                                  │             │
│ ┌────────┐ │   ┌─────────┐     ┌─────────┐     ┌─────────┐  │ Selecionado:│
│ │🎯 Mode │ │   │   SDR   │────►│  SCHD   │────►│  CONC   │  │ SDR Inbound │
│ └────────┘ │   └────┬────┘     └─────────┘     └─────────┘  │             │
│ ┌────────┐ │        │                                        │ Nome:       │
│ │📝 Etapa│ │        ▼                                        │ [________]  │
│ └────────┘ │   ┌─────────┐                                   │             │
│ ┌────────┐ │   │  OBJH   │                                   │ Status:     │
│ │💬 Msg  │ │   └─────────┘                                   │ [● Ativo]   │
│ └────────┘ │                                                  │             │
│ ┌────────┐ │                                                  │ 🧠 REASONING│
│ │🎬Script│ │                                                  │ ───────────│
│ └────────┘ │                                ┌────────────┐   │ (vazio)     │
│ ┌────────┐ │                                │  Minimap   │   │             │
│ │🔀Decisão│ │                                │ ┌────────┐ │   │             │
│ └────────┘ │                                │ │  ░░░░  │ │   │             │
│ ┌────────┐ │                                │ └────────┘ │   │             │
│ │🧪 Sim  │ │                                └────────────┘   │             │
│ └────────┘ │                                                  │             │
└────────────┴──────────────────────────────────────────────────┴─────────────┘
```

### Modal do Simulador

```
┌─────────────────────────────────────────────────────────────────┐
│ 🧪 SIMULADOR DE CONVERSA                                    [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Lead: Maria Silva (Mulher 45+, Menopausa)                       │
│ Mode: SDR Inbound                                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ 🤖 Julia (Agent)                               14:32 │   │ │
│ │  │ Oi Maria! Vi que você preencheu o formulário        │   │ │
│ │  │ agora pouco 😊 Me conta: o que te fez buscar         │   │ │
│ │  │ tratamento agora?                                    │   │ │
│ │  │                                                      │   │ │
│ │  │ [▼ Ver Reasoning da IA]                              │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                             │ │
│ │              ┌─────────────────────────────────────────┐   │ │
│ │              │ 👤 Maria (Lead)                   14:33 │   │ │
│ │              │ Oi! Estou sentindo muito calor à        │   │ │
│ │              │ noite, ondas de calor, sabe?            │   │ │
│ │              └─────────────────────────────────────────┘   │ │
│ │                                                             │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ 🤖 Julia (Agent)                               14:33 │   │ │
│ │  │ Entendo total, Maria! Esses calores são muito       │   │ │
│ │  │ incômodos mesmo 😔 Você está sentindo isso há       │   │ │
│ │  │ quanto tempo?                                        │   │ │
│ │  │                                                      │   │ │
│ │  │ [▼ Ver Reasoning da IA]                              │   │ │
│ │  │ ┌───────────────────────────────────────────────┐   │   │ │
│ │  │ │ 🧠 Critérios Aplicados:                       │   │   │ │
│ │  │ │ • Detectou: Dor principal (ondas de calor)    │   │   │ │
│ │  │ │ • Aplicou: Validação Emocional                │   │   │ │
│ │  │ │ • Técnica: NEPQ - Pergunta de Exploração      │   │   │ │
│ │  │ │ • Próximo: Qualificação temporal              │   │   │ │
│ │  │ └───────────────────────────────────────────────┘   │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Digite a próxima mensagem do lead (simulada)...             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Continuar Simulação]  [Resetar]  [Exportar JSON]               │
└─────────────────────────────────────────────────────────────────┘
```

## Requisitos de UX

1. **Performance**
   - Virtualization para canvas com muitos nodes
   - Lazy loading de dados dos nodes
   - Debounce em atualizações

2. **Acessibilidade**
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

3. **Responsividade**
   - Desktop first (canvas funciona melhor)
   - Tablet: painéis colapsáveis
   - Mobile: apenas visualização (sem edição)

4. **Feedback Visual**
   - Loading states em todas operações
   - Toast notifications para ações
   - Animações suaves (Framer Motion)

5. **Persistência**
   - Auto-save a cada 30 segundos
   - Indicador visual de "salvando..."
   - Confirmação ao sair com mudanças não salvas

## Comandos de Setup

```bash
# Criar projeto
npx create-next-app@latest flow-builder --typescript --tailwind --eslint --app --src-dir

# Instalar dependências
npm install @xyflow/react zustand framer-motion @dnd-kit/core @dnd-kit/sortable lucide-react

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card dialog input label select tabs toast tooltip

# Variáveis de ambiente
echo "BACKEND_URL=http://localhost:8000" > .env.local
```

## Entregáveis

1. Projeto Next.js 14 completo e funcional
2. Todos os componentes listados implementados
3. Integração com API backend
4. Responsivo (desktop focus)
5. Dark mode support
6. Documentação de componentes

## Contexto de Negócio

Este Flow Builder faz parte do "AI Factory" - uma plataforma para criar e gerenciar agentes de IA conversacionais para vendas. Os "modes" são diferentes personalidades/comportamentos do agente (SDR, Scheduler, Concierge, etc), e o builder permite visualizar como eles se conectam e simular conversas.

---

**IMPORTANTE**: Não adicione features além do especificado. Mantenha simples e funcional. O foco é:
1. Canvas funcionando com drag & drop
2. Nodes customizados para cada tipo
3. Painéis de componentes e propriedades
4. Modal de simulação com reasoning da IA
