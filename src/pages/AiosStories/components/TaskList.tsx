import { TaskRow } from './TaskRow';

interface TaskListTask {
  id: string;
  title: string;
  status: string;
  assigned_agent_id: string | null;
  cost: number;
}

interface TaskListAgent {
  id: string;
  name: string;
}

interface TaskListProps {
  tasks: TaskListTask[];
  agents?: TaskListAgent[];
}

export function TaskList({ tasks, agents = [] }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="text-text-muted text-xs py-2 px-3">Sem tasks nesta fase.</p>;
  }

  return (
    <div className="divide-y divide-border-default">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} agents={agents} />
      ))}
    </div>
  );
}
