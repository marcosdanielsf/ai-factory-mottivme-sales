import { Layout } from 'lucide-react';
import { StoryCard } from './StoryCard';

interface StoryKanbanColumnStory {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  progress?: number;
  total_phases?: number;
  completed_phases?: number;
  total_cost?: number;
  lead_agent_name?: string;
}

const STATUS_COLORS: Record<string, { header: string; dot: string }> = {
  pending: { header: 'text-gray-400', dot: 'bg-gray-500' },
  in_progress: { header: 'text-blue-400', dot: 'bg-blue-500' },
  qa: { header: 'text-yellow-400', dot: 'bg-yellow-500' },
  completed: { header: 'text-green-400', dot: 'bg-green-500' },
  failed: { header: 'text-red-400', dot: 'bg-red-500' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  qa: 'Em QA',
  completed: 'Concluido',
  failed: 'Falhou',
};

interface StoryKanbanColumnProps {
  status: string;
  stories: StoryKanbanColumnStory[];
}

export function StoryKanbanColumn({ status, stories }: StoryKanbanColumnProps) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <div className="min-w-[280px] flex-1 bg-bg-secondary rounded-lg p-3 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
        <span className={`text-sm font-semibold ${colors.header}`}>{label}</span>
        <span className="ml-auto text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded-full">
          {stories.length}
        </span>
      </div>

      {/* Cards or empty state */}
      <div className="flex-1 overflow-y-auto">
        {stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Layout size={28} className="text-text-muted mb-2 opacity-40" />
            <p className="text-text-muted text-xs">Nenhuma story</p>
          </div>
        ) : (
          stories.map((story) => <StoryCard key={story.id} story={story} />)
        )}
      </div>
    </div>
  );
}
