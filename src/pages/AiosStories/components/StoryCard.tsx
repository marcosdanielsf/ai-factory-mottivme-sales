import { useNavigate } from 'react-router-dom';

interface StoryCardStory {
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

const PRIORITY_BORDER: Record<string, string> = {
  low: 'border-t-gray-500',
  medium: 'border-t-yellow-500',
  high: 'border-t-orange-500',
  critical: 'border-t-red-500',
};

const PRIORITY_LABEL: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baixa', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  medium: { label: 'Media', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  high: { label: 'Alta', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  critical: { label: 'Critica', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

interface StoryCardProps {
  story: StoryCardStory;
}

export function StoryCard({ story }: StoryCardProps) {
  const navigate = useNavigate();
  const priorityKey = story.priority ?? 'medium';
  const borderColor = PRIORITY_BORDER[priorityKey] ?? 'border-t-gray-500';
  const priorityConfig = PRIORITY_LABEL[priorityKey] ?? PRIORITY_LABEL.medium;

  const progressPct = story.progress ?? 0;
  const costFormatted =
    story.total_cost != null && story.total_cost > 0
      ? `$${story.total_cost.toFixed(3)}`
      : null;

  return (
    <div
      onClick={() => navigate(`/aios/stories/${story.id}`)}
      className={`bg-bg-tertiary border border-border-default border-t-2 ${borderColor} rounded-lg p-3 mb-2 cursor-pointer hover:bg-bg-hover transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-text-primary text-sm font-medium leading-snug line-clamp-2 flex-1">
          {story.title}
        </span>
        <span
          className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}
        >
          {priorityConfig.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-muted text-xs">
            {story.completed_phases ?? 0}/{story.total_phases ?? 0} fases
          </span>
          <span className="text-text-muted text-xs">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary rounded-full transition-all"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Lead agent */}
      {story.lead_agent_name && (
        <p className="text-text-muted text-xs mb-2">
          Agente: <span className="text-text-secondary">{story.lead_agent_name}</span>
        </p>
      )}

      {/* Footer */}
      {costFormatted && (
        <div className="flex items-center justify-end">
          <span className="text-text-muted text-xs shrink-0">{costFormatted}</span>
        </div>
      )}
    </div>
  );
}
