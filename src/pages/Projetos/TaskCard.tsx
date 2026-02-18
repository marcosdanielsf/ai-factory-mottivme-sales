import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Calendar, Tag, ChevronRight } from 'lucide-react';
import type { ProjectTask } from './types';
import { PRIORITY_COLORS, PROJECTS } from './types';

// =============================================
// DraggableTaskCard — wraps TaskCard with drag
// =============================================

export function SortableTaskCard({
  task,
  onTaskClick,
}: {
  task: ProjectTask;
  onTaskClick: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <TaskCard task={task} onTaskClick={onTaskClick} isDragging={isDragging} />
    </div>
  );
}

// =============================================
// TaskCard — Visual card
// =============================================

export function TaskCard({
  task,
  isDragging = false,
  onTaskClick,
}: {
  task: ProjectTask;
  isDragging?: boolean;
  onTaskClick?: (id: string) => void;
}) {
  const project = PROJECTS.find((p) => p.key === task.project_key);

  return (
    <div
      onClick={() => !isDragging && onTaskClick?.(task.id)}
      className={`bg-bg-tertiary border border-border-default rounded-lg p-3 hover:border-accent-primary/30 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-2xl ring-2 ring-accent-primary/50' : ''
      }`}
      style={{ touchAction: 'none' }}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-text-muted mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            {task.priority && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded flex-shrink-0"
                style={{
                  backgroundColor: `${PRIORITY_COLORS[task.priority] || '#6B7280'}20`,
                  color: PRIORITY_COLORS[task.priority] || '#6B7280',
                }}
              >
                {task.priority.toUpperCase()}
              </span>
            )}
            <h4 className="text-sm font-medium text-text-primary line-clamp-2">
              {task.title}
            </h4>
          </div>

          {project && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs">{project.emoji}</span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${project.color}20`,
                  color: project.color,
                }}
              >
                {project.name}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(task.due_date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Tag className="w-3 h-3" />
                <span>{task.tags.length}</span>
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted/50 mt-1 flex-shrink-0" />
      </div>
    </div>
  );
}
