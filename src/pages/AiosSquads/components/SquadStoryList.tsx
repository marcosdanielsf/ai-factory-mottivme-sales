import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { AiosStoryStatus, AiosPriority, aiosStoryStatusConfig, aiosPriorityConfig } from '../../../types/aios';

interface Story {
  id: string;
  title: string;
  status: AiosStoryStatus;
  priority: AiosPriority;
  progress: number;
  total_cost: number;
}

interface SquadStoryListProps {
  stories: Story[];
}

export function SquadStoryList({ stories }: SquadStoryListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">
        Stories{' '}
        <span className="text-text-muted font-normal">({stories.length})</span>
      </h2>

      {stories.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">
          Nenhuma story vinculada
        </p>
      ) : (
        <ul className="space-y-2">
          {stories.map((story) => {
            const statusConfig = aiosStoryStatusConfig[story.status];
            const priorityConfig = aiosPriorityConfig[story.priority];

            return (
              <li
                key={story.id}
                onClick={() => navigate(`/aios/stories/${story.id}`)}
                className="flex flex-col gap-2 py-2 border-b border-border-default last:border-0 cursor-pointer hover:bg-bg-hover rounded px-1 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-primary font-medium truncate">
                    {story.title}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}
                    >
                      {priorityConfig.label}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${story.progress}%` }}
  />
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {Math.round(story.progress)}%
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-text-muted flex-shrink-0">
                    <DollarSign className="w-3 h-3" />
                    {story.total_cost.toFixed(3)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
