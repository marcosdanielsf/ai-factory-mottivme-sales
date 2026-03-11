# Skill: Frontend Analyzer

## Descricao
Skill especializado para analisar o frontend e garantir que os tipos TypeScript
estao alinhados com o schema do Supabase.

## Repositorio Frontend
```
/Users/marcosdaniels/Documents/Projetos/front-factorai-mottivme-sales/
```

## Arquivos Criticos (SEMPRE CONSULTAR)

### Types (Interfaces TypeScript)
```
/Users/marcosdaniels/Documents/Projetos/front-factorai-mottivme-sales/types.ts
```

### Componentes Principais
```
components/Layout.tsx      # Layout principal
components/Sidebar.tsx     # Menu lateral
components/MetricCard.tsx  # Cards de metricas
components/Toast.tsx       # Sistema de notificacoes
```

### Paginas
```
pages/Dashboard.tsx        # Dashboard principal
pages/Leads.tsx           # Gerenciamento de leads
pages/ClientDetail.tsx    # Detalhe de cliente
pages/PromptEditor.tsx    # Editor de prompts
pages/Approvals.tsx       # Aprovacao de mudancas
pages/KnowledgeBase.tsx   # Base de conhecimento
pages/Templates.tsx       # Templates de agentes
pages/Metrics.tsx         # Analytics
pages/Settings.tsx        # Configuracoes
pages/Login.tsx           # Autenticacao
```

### Biblioteca Supabase
```
lib/supabase.ts           # Cliente e helpers
lib/auth-context.tsx      # Contexto de autenticacao
```

## Tipos TypeScript ATUAIS no Frontend

### Tipos de Enum
```typescript
type Vertical = 'clinicas' | 'financeiro' | 'servicos' | 'mentores' | 'outros'
type ClientStatus = 'prospect' | 'cliente' | 'churned' | 'reativado'
type AgentType = 'sdr' | 'social_seller' | 'head_comercial' | 'secretaria' | 'suporte'
type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'scheduled' | 'completed' | 'no_show' | 'lost'
type Channel = 'whatsapp' | 'instagram' | 'messenger' | 'web' | 'sms'
type ConversationStatus = 'active' | 'closed' | 'archived'
type RequestType = 'revision' | 'hotfix' | 'rollback' | 'new_feature'
type AgencyPlan = 'starter' | 'professional' | 'enterprise'
type SubAccountPlan = 'basic' | 'pro' | 'enterprise'
type UserRole = 'super_admin' | 'agency_owner' | 'agency_admin' | 'agency_support' | 'sub_account_owner' | 'sub_account_admin' | 'sub_account_user'
```

### Interfaces Principais Existentes
- Agency
- SubAccount
- UserProfile
- UserPermissions
- Client
- AgentVersion
- Lead
- Conversation
- AgentMetrics
- AggregatedMetrics
- PromptChangeRequest
- KnowledgeDocument
- CallRecording
- AuditLog

## TIPOS QUE FALTAM NO FRONTEND

### SystemPrompt (FALTA CRIAR)
```typescript
interface SystemPrompt {
  id: string;
  agent_version_id: string;
  version: number;
  parent_id?: string;
  is_active: boolean;
  prompt_content: string;
  prompt_name?: string;
  prompt_description?: string;
  model_config?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    tools?: string[];
  };
  performance_score?: number;
  total_evaluations: number;
  total_conversations: number;
  change_reason?: 'auto_improvement' | 'manual_edit' | 'rollback' | 'initial';
  change_summary?: string;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  deactivated_at?: string;
}
```

### ReflectionLog (FALTA CRIAR)
```typescript
interface ReflectionLog {
  id: string;
  agent_version_id: string;
  system_prompt_id?: string;
  period_start: string;
  period_end: string;
  conversations_analyzed: number;
  messages_analyzed: number;
  score_completeness?: number;
  score_depth?: number;
  score_tone?: number;
  score_scope?: number;
  score_missed_opportunities?: number;
  overall_score: number;
  score_breakdown?: {
    completeness?: { score: number; weight: number; feedback: string };
    depth?: { score: number; weight: number; feedback: string };
    tone?: { score: number; weight: number; feedback: string };
    scope?: { score: number; weight: number; feedback: string };
    missed_opportunities?: { score: number; weight: number; feedback: string };
    examples?: string[];
    worst_conversations?: string[];
  };
  strengths?: string[];
  weaknesses?: string[];
  patterns_identified?: string[];
  action_taken: 'none' | 'suggestion' | 'auto_update' | 'escalate';
  action_reason?: string;
  suggestion_id?: string;
  cooldown_respected: boolean;
  previous_reflection_id?: string;
  hours_since_last_reflection?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  execution_time_ms?: number;
  evaluator_model: string;
  created_at: string;
  completed_at?: string;
}
```

### ImprovementSuggestion (FALTA CRIAR)
```typescript
interface ImprovementSuggestion {
  id: string;
  agent_version_id: string;
  reflection_log_id: string;
  current_prompt_id?: string;
  suggestion_type: 'prompt_update' | 'config_change' | 'escalation';
  current_value?: string;
  suggested_value: string;
  diff_summary?: string;
  rationale: string;
  expected_improvement?: string;
  risk_assessment?: string;
  confidence_score?: number;
  focus_areas?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'auto_applied' | 'rolled_back';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  applied_at?: string;
  applied_prompt_id?: string;
  rolled_back_at?: string;
  rollback_reason?: string;
  post_apply_score?: number;
  improvement_delta?: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  // Joined
  reflection_log?: ReflectionLog;
}
```

### SelfImprovingSettings (FALTA CRIAR)
```typescript
interface SelfImprovingSettings {
  id: string;
  agent_version_id?: string;
  location_id?: string;
  reflection_enabled: boolean;
  reflection_interval_hours: number;
  min_conversations_for_reflection: number;
  threshold_none: number;
  threshold_suggestion: number;
  threshold_auto_update: number;
  max_updates_per_day: number;
  cooldown_after_update_hours: number;
  require_approval_below_confidence: number;
  auto_apply_enabled: boolean;
  auto_apply_min_confidence: number;
  auto_apply_max_score_drop: number;
  notify_on_suggestion: boolean;
  notify_on_auto_update: boolean;
  notify_on_escalation: boolean;
  notification_emails?: string[];
  notification_webhook_url?: string;
  evaluator_model: string;
  created_at: string;
  updated_at: string;
}
```

### AgentConversation (FALTA CRIAR)
```typescript
interface AgentConversation {
  id: string;
  agent_version_id?: string;
  contact_id: string;
  conversation_id?: string;
  session_id?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  channel: string;
  source?: string;
  location_id?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  outcome?: 'scheduled' | 'lost' | 'warmed' | 'converted' | 'no_response';
  mensagens_total: number;
  mensagens_lead: number;
  mensagens_agente: number;
  tempo_resposta_medio_ms?: number;
  duracao_total_minutos?: number;
  qa_analyzed: boolean;
  qa_score?: number;
  qa_analyzed_at?: string;
  qa_feedback?: string;
  score_completeness?: number;
  score_depth?: number;
  score_tone?: number;
  score_scope?: number;
  score_missed_opportunities?: number;
  started_at: string;
  ended_at?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  messages?: AgentConversationMessage[];
}
```

### AgentConversationMessage (FALTA CRIAR)
```typescript
interface AgentConversationMessage {
  id: string;
  conversation_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  is_from_lead: boolean;
  sender_name?: string;
  original_message_id?: string;
  original_source?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  intent?: string;
  topics?: string[];
  created_at: string;
  processed_at?: string;
}
```

## Checklist de Implementacao Frontend

Antes de criar qualquer componente:

- [ ] Verificar se o tipo TypeScript existe em types.ts
- [ ] Verificar se os campos batem com o schema Supabase
- [ ] Criar helper function em lib/supabase.ts se necessario
- [ ] Verificar se precisa de nova rota em App.tsx
- [ ] Adicionar item no Sidebar se for pagina nova
- [ ] Usar Toast para feedback de acoes

## Padroes do Projeto

### Fetching de Dados
```typescript
const [data, setData] = useState<Type[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchData() {
    try {
      const result = await db.tableName.list(filters);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }
  fetchData();
}, [dependencies]);
```

### Tratamento de Erros
```typescript
try {
  await someAction();
  toast.success('Acao realizada com sucesso');
} catch (err) {
  toast.error('Erro ao realizar acao');
  console.error(err);
}
```

### Role-based Rendering
```typescript
{canManage && (
  <Button onClick={handleAction}>Acao</Button>
)}
```
