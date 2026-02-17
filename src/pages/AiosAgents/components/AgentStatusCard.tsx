import { useNavigate } from 'react-router-dom';
import { Activity, DollarSign, Clock } from 'lucide-react';
import { AiosAgentStatus } from '../../../types/aios';
import { AgentStatusBadge } from './AgentStatusBadge';

interface AgentStatusCardProps {
  id: string;
  name: string;
  persona: string | null;
  status: AiosAgentStatus;
  model: string | null;
  total_executions: number;
  total_cost: number;
  last_active_at: string | null;
}

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

function statusBorderColor(status: AiosAgentStatus): string {
  switch (status) {
    case 'active': return 'border-l-green-400';
    case 'error': return 'border-l-red-400';
    case 'offline': return 'border-l-gray-600';
    default: return 'border-l-gray-400';
  }
}

export function AgentStatusCard({
  id,
  name,
  persona,
  status,
  model,
  total_executions,
  total_cost,
  last_active_at,
}: AgentStatusCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/aios/agents/${id}`)}
      className={`bg-bg-secondary border border-border-default border-l-4 ${statusBorderColor(status)} rounded-lg p-4 hover:bg-bg-hover transition-colors cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary leading-tight truncate">
          {name}
        </h3>
        <AgentStatusBadge status={status} size="sm" />
      </div>

      {persona && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2 leading-relaxed">
          {persona}
        </p>
      )}

      {model && (
        <p className="text-xs text-text-secondary mb-3 font-mono bg-bg-tertiary px-2 py-0.5 rounded w-fit">
          {model}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-border-default pt-3 mt-auto">
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Activity className="w-3 h-3" />
          {total_executions.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <DollarSign className="w-3 h-3" />
          ${total_cost.toFixed(3)}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
          <Clock className="w-3 h-3" />
          {relativeTime(last_active_at)}
        </span>
      </div>
    </div>
  );
}
