import { CheckCircle2, XCircle, Loader2, Ban, Clock, DollarSign, Cpu } from 'lucide-react';
import { AiosExecutionStatus } from '../../../types/aios';

interface AgentExecution {
  id: string;
  status: string;
  model: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  cost: number | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface AgentExecutionTimelineProps {
  executions: AgentExecution[];
  loading?: boolean;
}

function StatusIcon({ status }: { status: string }) {
  switch (status as AiosExecutionStatus) {
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'cancelled':
      return <Ban className="w-4 h-4 text-gray-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function statusBorderColor(status: string): string {
  switch (status as AiosExecutionStatus) {
    case 'running': return 'border-blue-400/40';
    case 'completed': return 'border-green-400/40';
    case 'failed': return 'border-red-400/40';
    case 'cancelled': return 'border-gray-400/40';
    default: return 'border-border-default';
  }
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (mins > 0) return `${mins}min atrás`;
  return 'agora';
}

export function AgentExecutionTimeline({ executions, loading }: AgentExecutionTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-bg-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <p className="text-sm text-text-muted italic py-4 text-center">
        Nenhuma execucao registrada
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {executions.map((exec) => {
        const totalTokens = (exec.input_tokens ?? 0) + (exec.output_tokens ?? 0);

        return (
          <div
            key={exec.id}
            className={`bg-bg-secondary border ${statusBorderColor(exec.status)} rounded-lg p-3`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <StatusIcon status={exec.status} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {exec.model ?? 'Modelo desconhecido'}
                  </p>
                  {exec.error_message && (
                    <p className="text-xs text-red-400 truncate mt-0.5">
                      {exec.error_message}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                {relativeTime(exec.started_at)}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 pl-6.5">
              {totalTokens > 0 && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Cpu className="w-3 h-3" />
                  {totalTokens.toLocaleString()} tokens
                </span>
              )}
              {exec.cost !== null && exec.cost > 0 && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <DollarSign className="w-3 h-3" />
                  ${exec.cost.toFixed(4)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                {formatDuration(exec.duration_ms)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
