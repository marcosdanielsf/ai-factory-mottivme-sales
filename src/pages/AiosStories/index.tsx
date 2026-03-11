import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useAiosStories } from '../../hooks/aios/useAiosStories';
import { useAiosSquads } from '../../hooks/aios/useAiosSquads';
import { StoryKanbanColumn } from './components/StoryKanbanColumn';
import { NewStoryModal } from './components/NewStoryModal';

const KANBAN_COLUMNS = [
  { status: 'pending', label: 'Pendente' },
  { status: 'in_progress', label: 'Em Andamento' },
  { status: 'qa', label: 'QA' },
  { status: 'completed', label: 'Concluido' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Todas prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
];

export function AiosStories() {
  const { data: stories, loading, error, refetch, createStory } = useAiosStories();
  const { data: squads } = useAiosSquads();
  const [showModal, setShowModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredStories = priorityFilter === 'all'
    ? stories
    : stories.filter((s) => s.priority === priorityFilter);

  function getStoriesForColumn(status: string) {
    return filteredStories.filter((s) => s.status === status);
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-text-primary text-xl font-bold">Story Board</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Gerencie stories dos agentes AIOS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-secondary text-sm focus:outline-none focus:border-accent-primary"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={refetch}
            className="p-2 bg-bg-secondary border border-border-default rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Nova Story
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
        {KANBAN_COLUMNS.map((col) => (
          <StoryKanbanColumn
            key={col.status}
            status={col.status}
            stories={getStoriesForColumn(col.status)}
          />
        ))}
      </div>

      {/* New story modal */}
      {showModal && (
        <NewStoryModal
          squads={squads}
          onClose={() => setShowModal(false)}
          onSubmit={createStory}
        />
      )}
    </div>
  );
}
