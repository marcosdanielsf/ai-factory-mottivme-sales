import type { ReactNode } from 'react';
import { Circle, Loader, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface TaskRowTask {
  id: string;
  title: string;
  status: string;
  assigned_agent_id: string | null;
  cost: number;
}

interface TaskRowAgent {
  id: string;
  name: string;
}

const STATUS_ICON: Record<string, ReactNode> = {
  pending: <Circle size={14} className="text-gray-500" />,
  in_progress: <Loader size={14} className="text-blue-400 animate-spin" />,
  completed: <CheckCircle size={14} className="text-green-400" />,
  failed: <XCircle size={14} className="text-red-400" />,
  skipped: <MinusCircle size={14} className="text-gray-500" />,
};

interface TaskRowProps {
  task: TaskRowTask;
  agents?: TaskRowAgent[];
}

export function TaskRow({ task, agents = [] }: TaskRowProps) {
  const icon = STATUS_ICON[task.status] ?? STATUS_ICON.pending;
  const agent = agents.find((a) => a.id === task.assigned_agent_id);

  const costDisplay = task.cost > 0 ? `$${task.cost.toFixed(4)}` : null;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-bg-hover transition-colors group">
      <span className="shrink-0">{icon}</span>
      <span
        className={`flex-1 text-sm leading-snug ${
          task.status === 'completed'
            ? 'text-text-secondary line-through decoration-gray-600'
            : task.status === 'skipped'
            ? 'text-text-muted line-through decoration-gray-700'
            : 'text-text-primary'
        }`}
      >
        {task.title}
      </span>
      {agent && (
        <span className="text-text-muted text-xs shrink-0 hidden group-hover:inline sm:inline">
          {agent.name}
        </span>
      )}
      {costDisplay && (
        <span className="text-text-muted text-xs shrink-0">{costDisplay}</span>
      )}
    </div>
  );
}
