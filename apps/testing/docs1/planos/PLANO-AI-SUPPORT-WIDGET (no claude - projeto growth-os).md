# 🎙️ PLANO: AI Support Widget (Assistente de Voz para Equipe)

> **Objetivo:** Criar um widget de IA flutuante com suporte a voz para ajudar a equipe interna a tirar dúvidas sobre processos, fluxos e uso do sistema.

---

## 📋 VISÃO GERAL

### O que é?
Um assistente de IA integrado ao dashboard que permite à equipe fazer perguntas sobre:
- Como funciona cada etapa do processo de vendas
- Onde encontrar informações no sistema
- Como usar features específicas
- Dúvidas sobre leads, calls, agentes
- Explicações sobre métricas e scores

### Modos de Interação
1. **Texto** - Chat tradicional (sempre disponível)
2. **Voz** - Push-to-talk com transcrição (opcional)
3. **Voz Contínua** - Modo hands-free com detecção de silêncio

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React - localhost:3003)             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   AISupportWidget.tsx                       │ │
│  │  ┌──────────┐  ┌─────────────────────────────────────────┐ │ │
│  │  │ 🎤 Mic   │  │  Chat Messages Area                     │ │ │
│  │  │ Button   │  │  ┌─────────────────────────────────┐   │ │ │
│  │  │          │  │  │ User: Como classifico um lead? │   │ │ │
│  │  │ ┌──────┐ │  │  └─────────────────────────────────┘   │ │ │
│  │  │ │Record│ │  │  ┌─────────────────────────────────┐   │ │ │
│  │  │ │ ing  │ │  │  │ AI: Para classificar um lead...│   │ │ │
│  │  │ └──────┘ │  │  └─────────────────────────────────┘   │ │ │
│  │  └──────────┘  └─────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────────┐│ │
│  │  │ [💬 Digite sua pergunta...]              [🎤] [📤]    ││ │
│  │  └────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼ WebSocket / HTTP
┌─────────────────────────────────────────────────────────────────┐
│                        N8N WORKFLOWS                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │         13-AI-Support-Widget.json                            ││
│  │                                                              ││
│  │  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  ││
│  │  │ Webhook  │───▶│ Whisper  │───▶│   RAG Search         │  ││
│  │  │ Receiver │    │ (STT)    │    │   (Segundo Cérebro)  │  ││
│  │  └──────────┘    └──────────┘    └──────────────────────┘  ││
│  │                                            │                 ││
│  │                                            ▼                 ││
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  ││
│  │  │ ElevenLabs   │◀───│ Claude/GPT   │◀───│ Context      │  ││
│  │  │ TTS (voz)    │    │ (resposta)   │    │ Builder      │  ││
│  │  └──────────────┘    └──────────────┘    └──────────────┘  ││
│  │         │                                                    ││
│  │         ▼                                                    ││
│  │  ┌──────────────────────────────────────────────────────┐  ││
│  │  │  Response: { text, audioUrl, sources, suggestions }  │  ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ support_chat_    │  │ rag_knowledge    │  │ support_       │ │
│  │ messages         │  │ (Segundo Cérebro)│  │ feedback       │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 ESTRUTURA DE ARQUIVOS

### Frontend (React)

```
front-factorai-mottivme-sales/
├── components/
│   └── AISupportWidget/
│       ├── index.tsx                 # Componente principal
│       ├── AISupportWidget.tsx       # Widget flutuante
│       ├── ChatMessage.tsx           # Mensagem individual
│       ├── VoiceRecorder.tsx         # Gravador de áudio
│       ├── AudioPlayer.tsx           # Player de resposta
│       ├── ContextIndicator.tsx      # Mostra contexto atual
│       └── styles.ts                 # Estilos do widget
├── hooks/
│   ├── useAISupport.ts              # Hook principal
│   ├── useVoiceRecording.ts         # Hook de gravação
│   └── useAudioPlayback.ts          # Hook de reprodução
├── services/
│   └── aiSupportService.ts          # API calls
└── types/
    └── aiSupport.ts                 # Tipos TypeScript
```

### Workflows n8n

```
Fluxos n8n/AI-Factory- Mottivme Sales/
├── 13-AI-Support-Widget.json        # Workflow principal
├── 14-Support-Context-Builder.json  # Builder de contexto
└── 15-Support-Analytics.json        # Analytics de uso
```

### SQL/Migrations

```
sql/migrations/
└── 013_ai_support_widget.sql        # Tabelas do widget
```

---

## 🗄️ SCHEMA DO BANCO DE DADOS

```sql
-- ============================================
-- TABELA: support_chat_sessions
-- Sessões de chat do widget
-- ============================================
CREATE TABLE support_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,                    -- ID do usuário
    user_name TEXT,                           -- Nome do usuário
    user_role TEXT,                           -- Papel (cs, admin, etc)
    current_page TEXT,                        -- Página atual no dashboard
    session_context JSONB DEFAULT '{}',       -- Contexto da sessão
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    satisfaction_score INTEGER,               -- 1-5 (feedback final)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: support_chat_messages
-- Mensagens do chat
-- ============================================
CREATE TABLE support_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES support_chat_sessions(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,                    -- Texto da mensagem
    audio_url TEXT,                           -- URL do áudio (se voz)
    input_type TEXT DEFAULT 'text',           -- 'text' ou 'voice'

    -- Metadados da resposta (se role = 'assistant')
    sources JSONB DEFAULT '[]',               -- Fontes do RAG usadas
    confidence_score NUMERIC(3,2),            -- Confiança da resposta
    response_time_ms INTEGER,                 -- Tempo de resposta
    tokens_used INTEGER,                      -- Tokens consumidos

    -- Feedback do usuário
    was_helpful BOOLEAN,                      -- Útil?
    feedback_text TEXT,                       -- Comentário opcional

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: support_knowledge_gaps
-- Perguntas não respondidas (para melhorar base)
-- ============================================
CREATE TABLE support_knowledge_gaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,                   -- Pergunta original
    similar_questions TEXT[],                 -- Variações da mesma pergunta
    occurrence_count INTEGER DEFAULT 1,       -- Quantas vezes perguntaram
    last_asked_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'documented', 'ignored')),
    resolution_notes TEXT,                    -- Como foi resolvido
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: support_quick_actions
-- Ações rápidas sugeridas pela IA
-- ============================================
CREATE TABLE support_quick_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trigger_phrase TEXT NOT NULL,             -- Frase que ativa a ação
    action_type TEXT NOT NULL,                -- 'navigate', 'explain', 'tutorial'
    action_data JSONB NOT NULL,               -- Dados da ação
    priority INTEGER DEFAULT 0,               -- Prioridade de sugestão
    usage_count INTEGER DEFAULT 0,            -- Vezes que foi usada
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_support_messages_session ON support_chat_messages(session_id);
CREATE INDEX idx_support_sessions_user ON support_chat_sessions(user_id);
CREATE INDEX idx_knowledge_gaps_status ON support_knowledge_gaps(status);

-- RLS
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;
```

---

## 🧩 COMPONENTES REACT

### 1. AISupportWidget.tsx (Componente Principal)

```typescript
interface AISupportWidgetProps {
  userId: string;
  userName: string;
  userRole: 'cs' | 'admin' | 'viewer';
  currentPage: string;         // Ex: '/prompt-studio', '/leads'
  agentContext?: {             // Contexto do agente atual (se aplicável)
    agentId: string;
    agentName: string;
  };
}

// Estados do widget
type WidgetState =
  | 'minimized'    // Apenas botão flutuante
  | 'expanded'     // Chat aberto
  | 'recording'    // Gravando voz
  | 'processing'   // Processando resposta
  | 'playing';     // Reproduzindo áudio

// Features
- Botão flutuante fixo no canto inferior direito
- Expansão suave com animação
- Indicador de contexto atual ("Você está em: Prompt Studio")
- Histórico de mensagens da sessão
- Sugestões de perguntas baseadas na página atual
- Feedback thumbs up/down em cada resposta
```

### 2. VoiceRecorder.tsx

```typescript
interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart: () => void;
  onRecordingCancel: () => void;
  maxDuration?: number;        // Máximo em segundos (default: 60)
  silenceTimeout?: number;     // Auto-stop após silêncio (default: 2s)
}

// Features
- Push-to-talk (segurar para gravar)
- Click-to-toggle (clicar para iniciar/parar)
- Visualização de amplitude em tempo real
- Detecção de silêncio para auto-stop
- Cancelamento por gesto (arrastar para fora)
```

### 3. ChatMessage.tsx

```typescript
interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
    sources?: Array<{
      title: string;
      category: string;
      similarity: number;
    }>;
    timestamp: Date;
  };
  onFeedback: (messageId: string, helpful: boolean) => void;
  onPlayAudio: (audioUrl: string) => void;
}

// Features
- Avatar diferenciado (user vs AI)
- Player de áudio inline
- Expandir para ver fontes
- Botões de feedback
- Copiar texto
```

---

## 🔄 WORKFLOW N8N: 13-AI-Support-Widget.json

### Fluxo Principal

```
[Webhook] ──▶ [Route by Type] ──┬──▶ [Text Query] ──▶ [RAG Search] ──┬──▶ [Build Context]
              (text/voice)      │                                     │
                                └──▶ [Voice Query] ──▶ [Whisper STT]──┘
                                                            │
                                                            ▼
[Response] ◀── [Format Response] ◀── [Claude/GPT] ◀── [Enrich Context]
    │
    └──▶ [If Voice Mode] ──▶ [ElevenLabs TTS] ──▶ [Upload Audio] ──▶ [Add audioUrl]
```

### Nodes Detalhados

```javascript
// 1. WEBHOOK - Recebe requisições
{
  "path": "/ai-support",
  "method": "POST",
  "authentication": "headerAuth",
  "body": {
    "type": "text | voice",
    "query": "string (se texto)",
    "audioBase64": "string (se voz)",
    "sessionId": "uuid",
    "userId": "string",
    "context": {
      "currentPage": "/prompt-studio",
      "agentId": "uuid (opcional)",
      "selectedLeadId": "uuid (opcional)"
    }
  }
}

// 2. RAG SEARCH - Busca no Segundo Cérebro
{
  "endpoint": "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search",
  "body": {
    "query": "{{ $json.query }}",
    "project_key": "mottivme-geral",
    "threshold": 0.5,
    "limit": 5
  }
}

// 3. CLAUDE/GPT - Gera resposta
{
  "model": "claude-3-5-sonnet",
  "system": `Você é o assistente de suporte interno da MOTTIVME Sales.

Seu papel é ajudar a equipe a entender:
- Como usar o sistema (dashboard, features)
- Como funciona o processo de vendas
- O que significam métricas e scores
- Onde encontrar informações

CONTEXTO ATUAL DO USUÁRIO:
- Página: {{ $json.context.currentPage }}
- Agente selecionado: {{ $json.context.agentName || 'Nenhum' }}

CONHECIMENTO RELEVANTE (do RAG):
{{ $json.ragResults }}

REGRAS:
1. Seja direto e objetivo
2. Use exemplos práticos quando possível
3. Se não souber, diga que vai escalar para documentação
4. Sugira próximos passos quando relevante
5. Fale em português brasileiro informal mas profissional`,

  "messages": [
    { "role": "user", "content": "{{ $json.query }}" }
  ]
}

// 4. ELEVENLABS TTS (se modo voz)
{
  "endpoint": "https://api.elevenlabs.io/v1/text-to-speech/{{ voiceId }}",
  "body": {
    "text": "{{ $json.response }}",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }
}

// 5. SALVAR NO SUPABASE
{
  "table": "support_chat_messages",
  "operation": "insert",
  "data": {
    "session_id": "{{ $json.sessionId }}",
    "role": "assistant",
    "content": "{{ $json.response }}",
    "audio_url": "{{ $json.audioUrl }}",
    "sources": "{{ $json.sources }}",
    "response_time_ms": "{{ $json.processingTime }}"
  }
}
```

---

## 🎯 SUGESTÕES CONTEXTUAIS

### Por Página

```typescript
const CONTEXTUAL_SUGGESTIONS: Record<string, string[]> = {
  '/': [
    'O que significa cada métrica do dashboard?',
    'Como interpretar a taxa de conversão?',
    'Por que o score do agente caiu?'
  ],
  '/leads': [
    'Como classificar um lead como HOT?',
    'O que fazer quando um lead não responde?',
    'Como funciona o scoring de leads?'
  ],
  '/prompt-studio': [
    'Como editar o prompt do agente?',
    'O que são zonas editáveis vs protegidas?',
    'Como publicar uma nova versão?'
  ],
  '/reflection-loop': [
    'Como funciona o Reflection Loop?',
    'O que significam as sugestões de melhoria?',
    'Como aprovar ou rejeitar uma sugestão?'
  ],
  '/calls': [
    'Como a IA analisa as calls?',
    'O que cada score significa?',
    'Como melhorar a taxa de follow-up?'
  ],
  '/configuracoes': [
    'Como alterar as configurações do agente?',
    'O que é o intervalo de reflexão?',
    'Como ativar notificações?'
  ]
};
```

---

## 📊 ANALYTICS E MÉTRICAS

### Métricas a Coletar

| Métrica | Descrição | Uso |
|---------|-----------|-----|
| `queries_per_day` | Perguntas por dia | Volume de uso |
| `avg_response_time` | Tempo médio de resposta | Performance |
| `voice_vs_text_ratio` | Proporção voz/texto | Preferência do usuário |
| `helpful_rate` | % de respostas úteis | Qualidade |
| `unanswered_rate` | % não respondidas | Knowledge gaps |
| `top_questions` | Perguntas mais frequentes | Documentação |
| `page_with_most_questions` | Página com mais dúvidas | UX issues |

### Dashboard de Analytics (futuro)

```
┌─────────────────────────────────────────────────────────────┐
│  AI Support Analytics                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Esta Semana         📈 Tendência     🎯 Satisfaction    │
│  ┌─────────────┐       ┌───────────┐    ┌─────────────┐    │
│  │ 234 queries │       │  ↑ 12%    │    │  ⭐ 4.2/5   │    │
│  │ 89% helpful │       │  vs semana│    │  (156 votes)│    │
│  └─────────────┘       │  anterior │    └─────────────┘    │
│                        └───────────┘                        │
│                                                              │
│  🔥 Top Perguntas (knowledge gaps)                          │
│  1. "Como funciona o score do agente?" (23x)                │
│  2. "Onde vejo o histórico de versões?" (18x)               │
│  3. "Como faço rollback de prompt?" (15x)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: MVP Texto (1-2 dias)
- [ ] Criar componente `AISupportWidget.tsx`
- [ ] Implementar chat básico (só texto)
- [ ] Criar workflow n8n `13-AI-Support-Widget.json`
- [ ] Integrar com RAG existente
- [ ] Salvar mensagens no Supabase
- [ ] Adicionar ao Layout.tsx como widget flutuante

### Fase 2: Sugestões Contextuais (1 dia)
- [ ] Implementar `CONTEXTUAL_SUGGESTIONS`
- [ ] Detectar página atual via React Router
- [ ] Mostrar 3 sugestões ao abrir o widget
- [ ] Analytics de quais sugestões são clicadas

### Fase 3: Modo Voz (2-3 dias)
- [ ] Criar `VoiceRecorder.tsx` com Web Audio API
- [ ] Integrar Whisper para STT
- [ ] Integrar ElevenLabs para TTS
- [ ] Criar `AudioPlayer.tsx` para respostas
- [ ] Adicionar toggle texto/voz

### Fase 4: Feedback e Analytics (1 dia)
- [ ] Implementar thumbs up/down
- [ ] Criar tabela `support_knowledge_gaps`
- [ ] Workflow para detectar perguntas não respondidas
- [ ] Dashboard básico de analytics

### Fase 5: Melhorias (ongoing)
- [ ] Modo hands-free (always listening)
- [ ] Atalhos de teclado (Cmd+K para abrir)
- [ ] Integração com Slack para escalar dúvidas
- [ ] Tutorial interativo guiado pela IA

---

## 💰 ESTIMATIVA DE CUSTOS

### Por Mês (estimativa 500 queries)

| Serviço | Custo Unitário | Uso Estimado | Total |
|---------|----------------|--------------|-------|
| Claude 3.5 Sonnet | $3/1M tokens | ~100k tokens | ~$0.30 |
| Whisper API | $0.006/min | 50 min voz | ~$0.30 |
| ElevenLabs | $5/mo starter | ilimitado | $5.00 |
| Supabase | incluído | - | $0.00 |
| **TOTAL** | | | **~$6/mês** |

### Alternativas Gratuitas
- **Whisper local** via n8n (CPU-only, mais lento)
- **Coqui TTS** self-hosted (qualidade inferior)
- **gTTS** (Google Text-to-Speech gratuito)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

```
[ ] 1. Criar migration SQL (013_ai_support_widget.sql)
[ ] 2. Rodar migration no Supabase
[ ] 3. Criar estrutura de pastas no frontend
[ ] 4. Implementar AISupportWidget.tsx (MVP texto)
[ ] 5. Criar workflow n8n 13-AI-Support-Widget
[ ] 6. Testar integração texto completa
[ ] 7. Adicionar sugestões contextuais
[ ] 8. Implementar VoiceRecorder.tsx
[ ] 9. Integrar Whisper no n8n
[ ] 10. Integrar ElevenLabs no n8n
[ ] 11. Testar fluxo de voz completo
[ ] 12. Adicionar sistema de feedback
[ ] 13. Documentar no Segundo Cérebro
[ ] 14. Deploy e testes em produção
```

---

## 📝 NOTAS ADICIONAIS

### Alternativa: Gemini Live API
Se quisermos máxima qualidade de voz com emoção:
- Usar **Gemini 2.5 Flash Native Audio** via Vertex AI
- Requer conta GCP com billing
- Latência ~200ms (excelente)
- 30 vozes em 24 idiomas
- Custo: ~$0.075/1000 chars

### Alternativa: OpenAI Realtime API
- WebSocket bidirectional
- Voice-to-voice sem intermediário
- Custo: $0.06/min input + $0.24/min output
- Mais caro mas menor latência

### Recomendação
Começar com **Whisper + Claude + ElevenLabs** (mais barato e flexível), depois migrar para Gemini Live se necessário.

---

*Documento criado em: 2026-01-04*
*Última atualização: 2026-01-04*
*Autor: Claude Code + Marcos Daniels*
