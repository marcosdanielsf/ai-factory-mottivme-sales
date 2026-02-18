import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ProjectTask } from './types';
import { PROJECTS } from './types';

export function ProjectsView({
  tasks,
  onProjectClick,
}: {
  tasks: ProjectTask[];
  onProjectClick: (projectKey: string) => void;
}) {
  // Group by project
  const byProject: Record<string, ProjectTask[]> = {};
  tasks.forEach((task) => {
    if (!byProject[task.project_key]) {
      byProject[task.project_key] = [];
    }
    byProject[task.project_key].push(task);
  });

  // Calculate stats
  const projectStats = PROJECTS.map((project) => {
    const projectTasks = byProject[project.key] || [];
    const total = projectTasks.length;
    const done = projectTasks.filter((t) => t.status === 'done').length;
    const doing = projectTasks.filter((t) => t.status === 'doing').length;
    const review = projectTasks.filter((t) => t.status === 'review').length;
    const p1Open = projectTasks.filter(
      (t) => t.priority === 'p1' && t.status !== 'done'
    ).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const active = total - done;

    return { ...project, total, done, doing, review, p1Open, progress, active };
  }).filter((p) => p.total > 0);

  if (projectStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle2 className="w-12 h-12 text-text-muted mb-3" />
        <p className="text-lg font-medium text-text-primary">
          Nenhum projeto com tarefas
        </p>
        <p className="text-sm text-text-muted">
          Crie tarefas no Kanban para ve-las agrupadas aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projectStats.map((project) => (
        <div
          key={project.key}
          onClick={() => onProjectClick(project.key)}
          className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-colors cursor-pointer group"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{project.emoji}</span>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                {project.name}
              </h3>
            </div>
            {project.p1Open > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-accent-error/10 text-accent-error">
                {project.p1Open} P1
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-text-muted">Progresso</span>
              <span className="font-medium text-text-primary">{project.progress}%</span>
            </div>
            <div className="w-full h-2 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${project.progress}%`,
                  backgroundColor: project.color,
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-bg-tertiary rounded">
              <div className="font-medium text-text-primary">{project.active}</div>
              <div className="text-xs text-text-muted">Abertas</div>
            </div>
            <div className="p-2 bg-bg-tertiary rounded">
              <div className="font-medium text-text-primary">{project.doing}</div>
              <div className="text-xs text-text-muted">Em Prog.</div>
            </div>
            <div className="p-2 bg-bg-tertiary rounded">
              <div className="font-medium text-accent-success">{project.done}</div>
              <div className="text-xs text-text-muted">Feitas</div>
            </div>
          </div>

          {/* P1 Alert */}
          {project.p1Open > 0 && (
            <div className="mt-3 p-2 bg-accent-error/10 border border-accent-error/20 rounded text-xs text-accent-error flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              {project.p1Open} tarefa{project.p1Open > 1 ? 's' : ''} critica
              {project.p1Open > 1 ? 's' : ''} pendente{project.p1Open > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
