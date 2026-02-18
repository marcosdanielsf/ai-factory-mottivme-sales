import { useNavigate } from 'react-router-dom';
import { Brain, CheckSquare, FileText, ListChecks, User } from 'lucide-react';
import { AiosExpert } from '../../../types/aios';

interface ExpertCardProps {
  expert: AiosExpert;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function ExpertCard({ expert }: ExpertCardProps) {
  const navigate = useNavigate();
  const avatarColor = getAvatarColor(expert.id);

  return (
    <div
      onClick={() => navigate(`/aios/experts/${expert.id}`)}
      className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-hover transition-colors cursor-pointer group"
    >
      {/* Avatar + Nome */}
      <div className="flex items-start gap-3 mb-3">
        {expert.avatar_url ? (
          <img
            src={expert.avatar_url}
            alt={expert.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ${avatarColor}`}
          >
            {getInitials(expert.name)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">
            {expert.name}
          </h3>
          <p className="text-xs text-text-muted truncate">{expert.expertise}</p>
        </div>
      </div>

      {/* Bio */}
      {expert.bio && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-3 leading-relaxed">
          {expert.bio}
        </p>
      )}

      {/* Squad badge */}
      {expert.squad_id && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs rounded-full">
            <User className="w-3 h-3" />
            Squad vinculado
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="border-t border-border-default pt-3 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-text-muted">
            <Brain className="w-3 h-3" />
          </span>
          <span className="text-xs font-semibold text-text-primary">{expert.frameworks.length}</span>
          <span className="text-[10px] text-text-muted">frameworks</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-text-muted">
            <ListChecks className="w-3 h-3" />
          </span>
          <span className="text-xs font-semibold text-text-primary">{expert.checklists.length}</span>
          <span className="text-[10px] text-text-muted">checklists</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-text-muted">
            <FileText className="w-3 h-3" />
          </span>
          <span className="text-xs font-semibold text-text-primary">{expert.total_tasks_executed}</span>
          <span className="text-[10px] text-text-muted">tasks</span>
        </div>
      </div>
    </div>
  );
}
