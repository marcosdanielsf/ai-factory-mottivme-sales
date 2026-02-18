import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AiosTaskExpanded, ExecutorType } from '../../../hooks/aios/useAiosTasksExpanded';

interface TaskTableProps {
  data: AiosTaskExpanded[];
  loading: boolean;
  pageSize?: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gray-400 bg-gray-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
  skipped: 'text-yellow-400 bg-yellow-400/10',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluida',
  failed: 'Falhou',
  skipped: 'Pulada',
};

const EXECUTOR_COLORS: Record<ExecutorType, string> = {
  agent: 'text-violet-400 bg-violet-400/10',
  worker: 'text-emerald-400 bg-emerald-400/10',
  clone: 'text-amber-400 bg-amber-400/10',
  human: 'text-blue-400 bg-blue-400/10',
};

const EXECUTOR_LABELS: Record<ExecutorType, string> = {
  agent: 'Agent',
  worker: 'Worker',
  clone: 'Clone',
  human: 'Humano',
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskTable({ data, loading, pageSize = 25 }: TaskTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-bg-tertiary rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-12 text-center">
        <p className="text-text-muted text-sm">Nenhuma task encontrada com esses filtros</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Task</th>
              <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Story</th>
              <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Executor</th>
              <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Tipo</th>
              <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Status</th>
              <th className="text-right text-text-muted text-xs font-medium px-4 py-3">Duracao</th>
              <th className="text-right text-text-muted text-xs font-medium px-4 py-3">Custo</th>
              <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((task) => (
              <tr
                key={task.id}
                className="border-b border-border-default/50 hover:bg-bg-hover transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-text-primary text-sm font-medium line-clamp-1 max-w-[200px]" title={task.title}>
                    {task.title}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-text-secondary text-xs line-clamp-1 max-w-[140px]" title={task.story_title ?? undefined}>
                    {task.story_title ?? '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-text-secondary text-xs">{task.agent_name ?? '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EXECUTOR_COLORS[task.executor_type]}`}>
                    {EXECUTOR_LABELS[task.executor_type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status] ?? 'text-gray-400 bg-gray-400/10'}`}>
                    {STATUS_LABELS[task.status] ?? task.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-text-muted text-xs">{formatDuration(task.duration_ms)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-text-secondary text-xs font-mono">${task.cost.toFixed(5)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-text-muted text-xs">{formatDate(task.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
          <span className="text-text-muted text-xs">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} de {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-text-muted text-xs px-2">{page + 1}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
