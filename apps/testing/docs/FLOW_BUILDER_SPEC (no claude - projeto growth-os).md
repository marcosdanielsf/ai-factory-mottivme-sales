# Flow Builder Visual - Especificação

## Visão Geral

Interface visual estilo Miro/Figma para criar, visualizar e simular fluxos conversacionais de vendas.

## Core Features

### 1. Canvas Infinito
- Zoom in/out com scroll
- Pan com drag
- Grid opcional como guia
- Minimap para navegação

### 2. Cards (Nodes)

#### Tipos de Cards:

```
┌─────────────────────────────────────┐
│ 🎯 MODE CARD                        │
│ ─────────────────────────────────── │
│ Nome: SDR Inbound                   │
│ Status: ● Ativo                     │
│                                     │
│ Etapas: 4                           │
│ [Ativação] [Qualificação]           │
│ [Pitch] [Transição]                 │
│                                     │
│ ⚡ 234 conversas | 67% conversão    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 ETAPA CARD                       │
│ ─────────────────────────────────── │
│ Nome: Qualificação                  │
│ Objetivo: Entender dor e momento    │
│                                     │
│ Técnicas:                           │
│ • NEPQ Questions                    │
│ • Validação emocional               │
│                                     │
│ ▶ Ver simulação                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💬 MENSAGEM CARD                    │
│ ─────────────────────────────────── │
│ Tipo: Agent Response                │
│                                     │
│ "Oi Maria! Vi que você preencheu    │
│ o formulário agora pouco 😊         │
│ Me conta: o que te fez buscar       │
│ tratamento agora?"                  │
│                                     │
│ 🧠 Critérios IA:                    │
│ • Lead novo (< 5min)                │
│ • Origem: Formulário                │
│ • Aplicou: Abertura + Pergunta      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🎬 SCRIPT CARD                      │
│ ─────────────────────────────────── │
│ Tipo: Áudio Follow-up               │
│ Duração: 25s                        │
│                                     │
│ "Oi [Nome], aqui é a Julia do       │
│ Instituto Amare..."                 │
│                                     │
│ 🎵 [Play Preview]                   │
│ 📋 Copiar texto                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔀 DECISÃO CARD                     │
│ ─────────────────────────────────── │
│ Condição: lead.score > 80           │
│                                     │
│     ┌─── SIM ───► Scheduler         │
│     │                               │
│     └─── NÃO ───► Followuper        │
│                                     │
│ 🧠 Critério: Score BANT             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🧪 SIMULAÇÃO CARD                   │
│ ─────────────────────────────────── │
│ Lead: Maria Silva                   │
│ Persona: Mulher 45+, Menopausa      │
│                                     │
│ [💬] Conversa simulada              │
│ ├─ Agent: "Oi Maria!..."            │
│ ├─ Lead: "Oi, quero saber..."       │
│ ├─ Agent: "Entendo!..."             │
│ └─ 🧠 Decisão: → Scheduler          │
│                                     │
│ ▶ Rodar simulação                   │
└─────────────────────────────────────┘
```

### 3. Conexões (Edges)

- Linhas conectando cards
- Tipos:
  - Fluxo normal (→)
  - Condicional (--?-->)
  - Fallback (--->)
- Labels nas conexões
- Animação de "pulso" mostrando fluxo

### 4. Painel Lateral

```
┌──────────────────────────┐
│ 📦 COMPONENTES           │
│ ────────────────────────│
│ [+ Mode Card]            │
│ [+ Etapa Card]           │
│ [+ Mensagem Card]        │
│ [+ Script Card]          │
│ [+ Decisão Card]         │
│ [+ Simulação Card]       │
│                          │
│ 🔧 PROPRIEDADES          │
│ ────────────────────────│
│ (Exibe props do card     │
│  selecionado)            │
│                          │
│ Nome: [___________]      │
│ Tipo: [Dropdown___]      │
│ Ativo: [Toggle]          │
│                          │
│ 🧠 IA REASONING          │
│ ────────────────────────│
│ (Mostra critérios que    │
│  a IA usou para          │
│  tomar decisões)         │
└──────────────────────────┘
```

### 5. Simulador de Conversa

Modal/Drawer que abre ao clicar "Ver simulação":

```
┌─────────────────────────────────────────────────┐
│ 🧪 SIMULADOR DE CONVERSA                    [X] │
│ ───────────────────────────────────────────────│
│                                                 │
│ Lead: Maria Silva (Persona: Mulher 45+)         │
│ Mode: SDR Inbound → Scheduler                   │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 Julia (SDR Inbound)                      │ │
│ │ "Oi Maria! Vi que você preencheu..."        │ │
│ │                                             │ │
│ │ 🧠 Critérios:                               │ │
│ │ • Origem: Formulário LP Menopausa           │ │
│ │ • Tempo: < 5min desde preenchimento         │ │
│ │ • Aplicou: Reciprocidade + Pergunta Aberta  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 Maria                                    │ │
│ │ "Oi! Então, estou sentindo muito calor..."  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 Julia (SDR Inbound)                      │ │
│ │ "Entendo total, Maria. Esses calores são..." │ │
│ │                                             │ │
│ │ 🧠 Critérios:                               │ │
│ │ • Detectou: Dor principal (ondas de calor)  │ │
│ │ • Aplicou: Validação Emocional              │ │
│ │ • Próximo: Pergunta de Qualificação         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Continuar Simulação] [Resetar] [Exportar]      │
└─────────────────────────────────────────────────┘
```

### 6. Visão de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐                │
│    │  LEAD    │      │   SDR    │      │SCHEDULER │                │
│    │  ENTRA   │ ───► │ INBOUND  │ ───► │          │                │
│    └──────────┘      └────┬─────┘      └────┬─────┘                │
│                           │                  │                      │
│                           │ objeção?         │ agendou?             │
│                           ▼                  ▼                      │
│                      ┌──────────┐      ┌──────────┐                │
│                      │ OBJECTION│      │CONCIERGE │                │
│                      │ HANDLER  │      │          │                │
│                      └──────────┘      └────┬─────┘                │
│                                              │                      │
│                                              │ não respondeu?       │
│                                              ▼                      │
│                                        ┌──────────┐                │
│                                        │FOLLOWUPER│                │
│                                        │          │                │
│                                        └──────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Stack Técnico

### Frontend (Gemini vai criar)
- **Framework**: Next.js 14 (App Router)
- **Canvas**: React Flow (ou Xyflow) - biblioteca de nodes/edges
- **UI**: Tailwind + shadcn/ui
- **State**: Zustand
- **Drag & Drop**: @dnd-kit
- **Animações**: Framer Motion

### Backend (Claude vai criar)
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **IA**: Anthropic Claude API
- **WebSocket**: Para simulação em tempo real

## API Endpoints

```
# Flows
GET    /api/flows                    # Lista flows do cliente
POST   /api/flows                    # Cria novo flow
GET    /api/flows/{id}               # Busca flow específico
PUT    /api/flows/{id}               # Atualiza flow
DELETE /api/flows/{id}               # Remove flow

# Cards/Nodes
GET    /api/flows/{id}/nodes         # Lista nodes do flow
POST   /api/flows/{id}/nodes         # Adiciona node
PUT    /api/flows/{id}/nodes/{nid}   # Atualiza node
DELETE /api/flows/{id}/nodes/{nid}   # Remove node

# Edges/Conexões
GET    /api/flows/{id}/edges         # Lista conexões
POST   /api/flows/{id}/edges         # Cria conexão
DELETE /api/flows/{id}/edges/{eid}   # Remove conexão

# Simulação
POST   /api/simulate                 # Roda simulação
POST   /api/simulate/step            # Avança 1 step
GET    /api/simulate/{sid}/reasoning # Busca critérios IA

# Scripts
POST   /api/scripts/generate         # Gera script (áudio, vídeo, etc)
GET    /api/scripts/{id}             # Busca script gerado

# Export
POST   /api/flows/{id}/export        # Exporta flow (PNG, JSON, PDF)
```

## Database Schema

```sql
-- Flows
CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    name TEXT NOT NULL,
    description TEXT,
    canvas_data JSONB, -- posições, zoom, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nodes (Cards)
CREATE TABLE flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- mode, etapa, mensagem, script, decisao, simulacao
    data JSONB NOT NULL, -- conteúdo específico do tipo
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    width FLOAT,
    height FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edges (Conexões)
CREATE TABLE flow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    source_node_id UUID REFERENCES flow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES flow_nodes(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'default', -- default, conditional, fallback
    label TEXT,
    condition JSONB, -- para edges condicionais
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulações
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES flows(id),
    persona JSONB NOT NULL,
    messages JSONB[] DEFAULT '{}',
    current_node_id UUID REFERENCES flow_nodes(id),
    status TEXT DEFAULT 'running',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reasoning Logs (critérios da IA)
CREATE TABLE reasoning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id),
    node_id UUID REFERENCES flow_nodes(id),
    message_index INT,
    criteria JSONB NOT NULL, -- {applied_techniques, detected_intents, decision_factors}
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Wireframes ASCII

### Tela Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎨 Flow Builder                                    [Salvar] [Exportar] [▶]  │
├────────────┬────────────────────────────────────────────────────┬───────────┤
│            │                                                    │           │
│ 📦 Cards   │                    CANVAS                          │ 🔧 Props  │
│            │                                                    │           │
│ [Mode]     │   ┌─────┐     ┌─────┐     ┌─────┐                 │ Nome:     │
│ [Etapa]    │   │ SDR │────►│SCHD │────►│CONC │                 │ [______]  │
│ [Mensagem] │   └──┬──┘     └─────┘     └─────┘                 │           │
│ [Script]   │      │                                            │ Tipo:     │
│ [Decisão]  │      ▼                                            │ [▼ Mode]  │
│ [Simulação]│   ┌─────┐                                         │           │
│            │   │OBJH │                                         │ 🧠 IA     │
│            │   └─────┘                                         │ Reasoning │
│            │                                                    │ ────────  │
│            │                                      [Minimap]     │ (vazio)   │
│            │                                      ┌────────┐    │           │
│            │                                      │  ░░░░  │    │           │
│            │                                      └────────┘    │           │
└────────────┴────────────────────────────────────────────────────┴───────────┘
```

### Card Expandido (Double-click)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 SDR INBOUND                                              [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Prime Directive:                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Seu ÚNICO SUCESSO é quando a lead AVANÇA para o próximo     │ │
│ │ estágio qualificada...                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Etapas:                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Ativação │►│Qualific. │►│  Pitch   │►│Transição │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ Few-shots: (3)                                                  │
│ ├─ Abertura padrão                                              │
│ ├─ Lead com dúvida                                              │
│ └─ Lead qualificado                                             │
│                                                                 │
│ [Editar] [Simular] [Duplicar]                                   │
└─────────────────────────────────────────────────────────────────┘
```
