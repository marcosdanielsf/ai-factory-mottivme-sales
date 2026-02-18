import { useState } from 'react';
import { LayoutDashboard, FolderKanban } from 'lucide-react';
import { useProjectTasks, useTaskMutations } from './hooks';
import { KanbanBoard } from './KanbanBoard';
import { ProjectsView } from './ProjectsView';

type Tab = 'kanban' | 'projetos';

export function Projetos() {
  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const { tasks, setTasks, loading, error } = useProjectTasks();
  const { updateStatus } = useTaskMutations(setTasks);

  const handleProjectClick = (projectKey: string) => {
    // Switch to kanban filtered by this project
    setActiveTab('kanban');
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-bg-hover rounded animate-pulse" />
            <div className="h-4 w-80 bg-bg-hover rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[500px] bg-bg-hover rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-accent-error/10 border border-accent-error/20 rounded-xl p-6 text-center">
          <p className="text-accent-error font-medium">Erro ao carregar tarefas</p>
          <p className="text-text-muted text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projetos</h1>
          <p className="text-text-muted mt-1">
            {tasks.filter((t) => t.status !== 'done').length} tarefas abertas em{' '}
            {new Set(tasks.map((t) => t.project_key)).size} projetos
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-bg-secondary border border-border-default rounded-lg p-1">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'kanban'
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setActiveTab('projetos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projetos'
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Projetos
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'kanban' ? (
        <KanbanBoard tasks={tasks} setTasks={setTasks} updateStatus={updateStatus} />
      ) : (
        <ProjectsView tasks={tasks} onProjectClick={handleProjectClick} />
      )}
    </div>
  );
}

export default Projetos;
