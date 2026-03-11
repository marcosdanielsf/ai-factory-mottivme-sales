import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { AiosSquadStrategy, aiosSquadStrategyConfig } from '../../../types/aios';

interface SquadMemberAgent {
  id: string;
  name: string;
  status: string;
}

interface SquadMember {
  id: string;
  agent_id: string;
  aios_agents: SquadMemberAgent;
}

interface SquadCardProps {
  id: string;
  name: string;
  description: string | null;
  strategy: AiosSquadStrategy;
  is_active: boolean;
  members: SquadMember[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
];

export function SquadCard({
  id,
  name,
  description,
  strategy,
  is_active,
  members,
}: SquadCardProps) {
  const navigate = useNavigate();
  const strategyConfig = aiosSquadStrategyConfig[strategy];
  const visibleMembers = members.slice(0, 3);
  const extraCount = members.length - visibleMembers.length;

  return (
    <div
      onClick={() => navigate(`/aios/squads/${id}`)}
      className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-hover transition-colors cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary leading-tight truncate">
          {name}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              is_active
                ? 'text-green-400 bg-green-400/10'
                : 'text-gray-500 bg-gray-500/10'
            }`}
          >
            {is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 font-medium w-fit">
        {strategyConfig.label}
      </span>

      {description && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {members.length > 0 && (
        <div className="flex items-center gap-1">
          {visibleMembers.map((member, idx) => (
            <div
              key={member.id}
              title={member.aios_agents.name}
              className={`w-6 h-6 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-semibold border border-bg-secondary`}
            >
              {getInitials(member.aios_agents.name)}
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-bg-tertiary border border-border-default flex items-center justify-center text-text-muted text-xs font-medium">
              +{extraCount}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-border-default pt-3 mt-auto">
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Users className="w-3 h-3" />
          {members.length} agentes
        </span>
      </div>
    </div>
  );
}
