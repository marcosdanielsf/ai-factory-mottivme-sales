import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
// SortableContext removed — using useDraggable + useDroppable instead
import { Plus, Filter } from 'lucide-react';
import type { ProjectTask, TaskStatus } from './types';
import { KANBAN_COLUMNS, PROJECTS } from './types';
import { SortableTaskCard, TaskCard } from './TaskCard';
import { CreateTaskModal, TaskDetailModal } from './TaskModals';

const COLUMN_IDS = KANBAN_COLUMNS.map((c) => c.id) as string[];

export function KanbanBoard({
  tasks,
  setTasks,
  updateStatus,
}: {
  tasks: ProjectTask[];
  setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
  updateStatus: (id: string, status: TaskStatus) => Promise<void>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Resolve target column — over.id can be a column ID or a task ID
    let targetColumn: TaskStatus;
    if (COLUMN_IDS.includes(over.id as string)) {
      targetColumn = over.id as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;
      targetColumn = overTask.status;
    }

    if (activeTask.status === targetColumn) return;

    // Optimistic update
    const prevStatus = activeTask.status;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === activeTask.id ? { ...task, status: targetColumn } : task
      )
    );

    try {
      await updateStatus(activeTask.id, targetColumn);
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeTask.id ? { ...task, status: prevStatus } : task
        )
      );
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterProject !== 'all' && task.project_key !== filterProject) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 p-3 bg-bg-secondary border border-border-default rounded-xl flex-1 mr-3">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
          >
            <option value="all">Todos projetos</option>
            {PROJECTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
          >
            <option value="all">Todas prioridades</option>
            <option value="p1">P1 - Critica</option>
            <option value="p2">P2 - Alta</option>
            <option value="p3">P3 - Media</option>
            <option value="p4">P4 - Baixa</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-bg-hover rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Nenhuma tarefa criada
          </h3>
          <p className="text-text-muted mb-6 max-w-md">
            Comece criando sua primeira tarefa e organize seu trabalho no quadro
            kanban
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar Primeira Tarefa
          </button>
        </div>
      )}

      {/* Kanban Board */}
      {tasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={filteredTasks.filter((t) => t.status === column.id)}
                onTaskClick={(id) => setSelectedTaskId(id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onTaskCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
            setShowModal(false);
          }}
        />
      )}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
          }}
          onTaskDeleted={(id) => {
            setTasks((prev) => prev.filter((t) => t.id !== id));
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}

// =============================================
// KanbanColumn
// =============================================

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: (typeof KANBAN_COLUMNS)[number];
  tasks: ProjectTask[];
  onTaskClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-bg-secondary border rounded-xl p-4 min-h-[500px] flex flex-col transition-colors ${
        isOver ? 'border-accent-primary bg-accent-primary/5' : 'border-border-default'
      }`}
    >
      <div
        className="flex items-center justify-between mb-4 pb-3 border-b"
        style={{ borderColor: column.color }}
      >
        <h3 className="text-sm font-semibold text-text-primary">{column.label}</h3>
        <span
          className="px-2 py-1 text-xs font-medium rounded"
          style={{
            backgroundColor: `${column.color}20`,
            color: column.color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {tasks.map((task) => (
          <SortableTaskCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}
