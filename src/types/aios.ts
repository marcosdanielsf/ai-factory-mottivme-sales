// Types para o AIOS Dashboard — Agent Intelligence Operating System

// =====================================================
// STATUS TYPES
// =====================================================

export type AiosAgentStatus = 'idle' | 'active' | 'error' | 'offline';

export type AiosStoryStatus = 'pending' | 'in_progress' | 'qa' | 'completed' | 'failed';

export type AiosTaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export type AiosPhaseStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type AiosExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export type AiosPriority = 'low' | 'medium' | 'high' | 'critical';

export type AiosSquadStrategy = 'collaborative' | 'pipeline' | 'competitive';

export type AiosSquadMemberRole = 'lead' | 'member' | 'observer';

export type AiosCostEventType = 'llm_call' | 'tool_use' | 'embedding' | 'other';

export type AiosBudgetPeriod = 'daily' | 'weekly' | 'monthly';

// =====================================================
// CORE INTERFACES — matching aios_agents table
// =====================================================

export interface AiosAgent {
  id: string;                               // uuid
  name: string;                             // text
  persona: string | null;                   // text
  role: string | null;                      // text
  status: AiosAgentStatus;                  // text
  capabilities: Record<string, any>;        // jsonb — lista de capacidades V3
  config: Record<string, any>;              // jsonb — model stored here
  squad_id: string | null;                  // uuid FK aios_squads
  total_executions: number;                 // int
  total_cost: number;                       // numeric
  last_active_at: string | null;            // timestamptz
  is_active: boolean;                       // boolean
  created_at: string;                       // timestamptz
  updated_at: string;                       // timestamptz
}

// =====================================================
// CORE INTERFACES — matching aios_agent_executions table
// =====================================================

export interface AiosAgentExecution {
  id: string;                               // uuid
  agent_id: string;                         // uuid FK aios_agents
  story_id: string | null;                  // uuid FK aios_stories
  task_id: string | null;                   // uuid FK aios_tasks
  status: AiosExecutionStatus;              // text
  started_at: string;                       // timestamptz (also serves as created_at)
  completed_at: string | null;              // timestamptz
  duration_ms: number | null;               // int
  input_tokens: number;                     // int
  output_tokens: number;                    // int
  cost: number;                             // numeric
  model: string | null;                     // text
  error_message: string | null;             // text
  result: Record<string, any> | null;       // jsonb
}

// =====================================================
// CORE INTERFACES — matching aios_stories table
// =====================================================

export interface AiosStory {
  id: string;                               // uuid
  title: string;                            // text
  description: string | null;              // text
  status: AiosStoryStatus;                  // text
  priority: AiosPriority;                   // text
  squad_id: string | null;                  // uuid FK aios_squads
  assigned_agent_id: string | null;         // uuid FK aios_agents
  progress: number;                         // numeric 0-100
  total_phases: number;                     // int
  completed_phases: number;                 // int
  total_cost: number;                       // numeric
  started_at: string | null;               // timestamptz
  completed_at: string | null;             // timestamptz
  metadata: Record<string, any>;            // jsonb
  created_at: string;                       // timestamptz
  updated_at: string;                       // timestamptz
}

// =====================================================
// CORE INTERFACES — matching aios_story_phases table
// =====================================================

export interface AiosStoryPhase {
  id: string;                               // uuid
  story_id: string;                         // uuid FK aios_stories
  name: string;                             // text
  description: string | null;              // text
  phase_order: number;                      // int — ordem de execucao
  status: AiosPhaseStatus;                  // text
  started_at: string | null;               // timestamptz
  completed_at: string | null;             // timestamptz
}

// =====================================================
// CORE INTERFACES — matching aios_tasks table
// =====================================================

export interface AiosTask {
  id: string;                               // uuid
  phase_id: string;                         // uuid FK aios_story_phases
  story_id: string;                         // uuid FK aios_stories (denormalizado)
  title: string;                            // text
  description: string | null;              // text
  status: AiosTaskStatus;                   // text
  assigned_agent_id: string | null;         // uuid FK aios_agents
  result: Record<string, any> | null;       // jsonb
  cost: number;                             // numeric
  completed_at: string | null;             // timestamptz
  created_at: string;                       // timestamptz
}

// =====================================================
// CORE INTERFACES — matching aios_squads table
// =====================================================

export interface AiosSquad {
  id: string;                               // uuid
  name: string;                             // text
  description: string | null;              // text
  strategy: AiosSquadStrategy;             // text
  is_active: boolean;                       // boolean
  metadata: Record<string, any>;            // jsonb
  created_at: string;                       // timestamptz
  updated_at: string;                       // timestamptz
}

// =====================================================
// CORE INTERFACES — matching aios_squad_members table
// =====================================================

export interface AiosSquadMember {
  id: string;                               // uuid
  squad_id: string;                         // uuid FK aios_squads
  agent_id: string;                         // uuid FK aios_agents
  role: AiosSquadMemberRole;               // text
  joined_at: string;                        // timestamptz (also serves as created_at)
}

// =====================================================
// CORE INTERFACES — matching aios_cost_events table
// =====================================================

export interface AiosCostEvent {
  id: string;                               // uuid
  agent_id: string | null;                  // uuid FK aios_agents
  story_id: string | null;                  // uuid FK aios_stories
  execution_id: string | null;             // uuid FK aios_agent_executions
  event_type: AiosCostEventType;           // text
  model: string | null;                     // text
  input_tokens: number;                     // int
  output_tokens: number;                    // int
  cost: number;                             // numeric
  created_at: string;                       // timestamptz
}

// =====================================================
// CORE INTERFACES — matching aios_cost_budgets table
// =====================================================

export interface AiosCostBudget {
  id: string;                               // uuid
  name: string;                             // text
  period: AiosBudgetPeriod;                 // text
  budget_amount: number;                    // numeric
  spent_amount: number;                     // numeric — current spend
  alert_threshold: number;                  // numeric — ex: 80 = alertar com 80%
  squad_id: string | null;                  // uuid FK aios_squads (null = global)
  is_active: boolean;                       // boolean
  created_at: string;                       // timestamptz
}

// =====================================================
// VIEW INTERFACE — matching vw_aios_cost_summary
// =====================================================

export interface AiosCostSummary {
  agent_id: string | null;
  agent_name: string | null;
  model: string | null;
  date: string;                             // date — truncado por dia
  total_cost: number;
  total_tokens: number;
  event_count: number;
}

// =====================================================
// COMPOSITE TYPES — agrupamentos para uso nos componentes
// =====================================================

export interface AiosAgentWithExecutions extends AiosAgent {
  recent_executions: AiosAgentExecution[];
}

export interface AiosStoryWithPhases extends AiosStory {
  phases: AiosStoryPhaseWithTasks[];
}

export interface AiosStoryPhaseWithTasks extends AiosStoryPhase {
  tasks: AiosTask[];
}

export interface AiosSquadWithMembers extends AiosSquad {
  members: AiosSquadMemberExpanded[];
}

export interface AiosSquadMemberExpanded extends AiosSquadMember {
  agent: AiosAgent;
}

// =====================================================
// FILTER TYPES — para uso nos hooks e paginas
// =====================================================

export interface AiosAgentFilters {
  status?: AiosAgentStatus | 'all';
  search?: string;
}

export interface AiosStoryFilters {
  status?: AiosStoryStatus | 'all';
  priority?: AiosPriority | 'all';
  squad_id?: string | null;
  search?: string;
}

export interface AiosCostFilters {
  squad_id?: string | null;
  agent_id?: string | null;
  period?: AiosBudgetPeriod;
  date_from?: string;
  date_to?: string;
}

// =====================================================
// CONFIG VISUAL — badges e cores por tipo
// =====================================================

export const aiosAgentStatusConfig: Record<
  AiosAgentStatus,
  { label: string; color: string; bgColor: string }
> = {
  idle: {
    label: 'Ocioso',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
  active: {
    label: 'Ativo',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  error: {
    label: 'Erro',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  offline: {
    label: 'Offline',
    color: 'text-gray-600',
    bgColor: 'bg-gray-600/10',
  },
};

export const aiosStoryStatusConfig: Record<
  AiosStoryStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'Pendente',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  qa: {
    label: 'Em QA',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  completed: {
    label: 'Concluido',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  failed: {
    label: 'Falhou',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
};

export const aiosPriorityConfig: Record<
  AiosPriority,
  { label: string; color: string; bgColor: string; order: number }
> = {
  low: {
    label: 'Baixa',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    order: 1,
  },
  medium: {
    label: 'Media',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    order: 2,
  },
  high: {
    label: 'Alta',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    order: 3,
  },
  critical: {
    label: 'Critica',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    order: 4,
  },
};

export const aiosSquadStrategyConfig: Record<
  AiosSquadStrategy,
  { label: string; description: string }
> = {
  collaborative: {
    label: 'Colaborativo',
    description: 'Agentes trabalham juntos no mesmo objetivo',
  },
  pipeline: {
    label: 'Pipeline',
    description: 'Agentes em sequencia, output de um e input do proximo',
  },
  competitive: {
    label: 'Competitivo',
    description: 'Agentes geram solucoes independentes para comparacao',
  },
};
