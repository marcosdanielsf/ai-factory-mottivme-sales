import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Cpu, Activity, DollarSign, Clock } from 'lucide-react';
import { useAiosAgents } from '../../hooks/aios/useAiosAgents';
import { useAiosAgentExecutions } from '../../hooks/aios/useAiosAgentExecutions';
import { AiosAgentStatus } from '../../types/aios';
import { AgentStatusBadge } from './components/AgentStatusBadge';
import { AgentCapabilities } from './components/AgentCapabilities';
import { AgentExecutionTimeline } from './components/AgentExecutionTimeline';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (mins > 0) return `${mins}min atrás`;
  return 'agora';
}

export function AiosAgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: agents, loading: loadingAgent } = useAiosAgents();
  const { data: executions, loading: loadingExec } = useAiosAgentExecutions(id, 20);

  const agent = agents.find((a) => a.id === id);

  if (loadingAgent) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-bg-tertiary rounded animate-pulse" />
        <div className="h-32 bg-bg-tertiary rounded-lg animate-pulse" />
        <div className="h-64 bg-bg-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/aios/agents')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="text-center py-16">
          <Bot className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Agente nao encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/aios/agents')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Agentes
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{agent.name}</h1>
              {(agent.config?.model as string) && (
                <p className="text-xs text-text-muted font-mono mt-0.5">{(agent.config?.model as string)}</p>
              )}
            </div>
          </div>
          <AgentStatusBadge status={agent.status as AiosAgentStatus} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Execucoes</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {agent.total_executions?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Custo Total</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            ${Number(agent.total_cost ?? 0).toFixed(3)}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Ultima Atividade</span>
          </div>
          <p className="text-lg font-bold text-text-primary">
            {relativeTime(agent.last_active_at ?? null)}
          </p>
        </div>
      </div>

      {/* Info do agente */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Informacoes do Agente
        </h2>

        {agent.persona && (
          <div>
            <p className="text-xs text-text-muted mb-1">Persona</p>
            <p className="text-sm text-text-secondary leading-relaxed">{agent.persona}</p>
          </div>
        )}

        {(agent.config?.model as string) && (
          <div>
            <p className="text-xs text-text-muted mb-1">Modelo</p>
            <span className="inline-block text-xs font-mono bg-bg-tertiary text-text-primary px-2 py-1 rounded">
              {(agent.config?.model as string)}
            </span>
          </div>
        )}
      </div>

      {/* Capacidades */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Capacidades
        </h2>
        <AgentCapabilities capabilities={agent.capabilities ?? null} />
      </div>

      {/* Execucoes */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Execucoes Recentes
        </h2>
        <AgentExecutionTimeline executions={executions} loading={loadingExec} />
      </div>
    </div>
  );
}
