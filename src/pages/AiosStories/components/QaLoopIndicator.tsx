import type { ReactNode } from 'react';
import { CheckCircle, XCircle, Loader, GitBranch } from 'lucide-react';

interface QaLoop {
  loop_index: number;
  status: string;
  total_tokens: number;
  total_cost: number;
  started_at: string;
  completed_at: string | null;
}

const LOOP_STATUS_CONFIG: Record<string, { icon: ReactNode; color: string; label: string }> = {
  completed: {
    icon: <CheckCircle size={14} className="text-green-400" />,
    color: 'border-green-500/40 bg-green-500/5',
    label: 'Aprovado',
  },
  failed: {
    icon: <XCircle size={14} className="text-red-400" />,
    color: 'border-red-500/40 bg-red-500/5',
    label: 'Reprovado',
  },
  in_progress: {
    icon: <Loader size={14} className="text-blue-400 animate-spin" />,
    color: 'border-blue-500/40 bg-blue-500/5',
    label: 'Em andamento',
  },
};

interface QaLoopIndicatorProps {
  loops: QaLoop[];
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'em andamento';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export function QaLoopIndicator({ loops }: QaLoopIndicatorProps) {
  if (loops.length === 0) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <GitBranch size={14} className="opacity-50" />
        <span>Sem ciclos QA</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loops.map((loop) => {
        const config = LOOP_STATUS_CONFIG[loop.status] ?? LOOP_STATUS_CONFIG.in_progress;
        const duration = formatDuration(loop.started_at, loop.completed_at);

        return (
          <div
            key={loop.loop_index}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${config.color}`}
          >
            <span className="shrink-0">{config.icon}</span>
            <span className="text-text-primary text-sm font-medium">
              QA Loop #{loop.loop_index + 1}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                loop.status === 'completed'
                  ? 'text-green-400 bg-green-400/10'
                  : loop.status === 'failed'
                  ? 'text-red-400 bg-red-400/10'
                  : 'text-blue-400 bg-blue-400/10'
              }`}
            >
              {config.label}
            </span>
            <div className="ml-auto flex items-center gap-3 text-text-muted text-xs">
              <span>{loop.total_tokens.toLocaleString()} tokens</span>
              {loop.total_cost > 0 && <span>${loop.total_cost.toFixed(4)}</span>}
              <span>{duration}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
