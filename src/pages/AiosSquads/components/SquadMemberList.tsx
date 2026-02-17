import { X } from 'lucide-react';
import { AiosSquadMemberRole } from '../../../types/aios';

interface MemberAgent {
  id: string;
  name: string;
  status: string;
  config: Record<string, unknown> | null;
}

interface Member {
  id: string;
  squad_id: string;
  agent_id: string;
  role: AiosSquadMemberRole;
  aios_agents: MemberAgent;
}

interface SquadMemberListProps {
  squadId: string;
  members: Member[];
  onRemoveMember: (squadId: string, agentId: string) => Promise<boolean>;
}

const ROLE_CONFIG: Record<AiosSquadMemberRole, { label: string; color: string; bgColor: string }> = {
  lead: { label: 'Lead', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  member: { label: 'Membro', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  observer: { label: 'Observer', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
};

const AGENT_STATUS_CONFIG: Record<string, { color: string; bgColor: string; dot: string }> = {
  active: { color: 'text-green-400', bgColor: 'bg-green-400/10', dot: 'bg-green-400' },
  idle: { color: 'text-gray-400', bgColor: 'bg-gray-400/10', dot: 'bg-gray-400' },
  error: { color: 'text-red-400', bgColor: 'bg-red-400/10', dot: 'bg-red-400' },
  offline: { color: 'text-gray-600', bgColor: 'bg-gray-600/10', dot: 'bg-gray-600' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function SquadMemberList({ squadId, members, onRemoveMember }: SquadMemberListProps) {
  const handleRemove = async (agentId: string) => {
    await onRemoveMember(squadId, agentId);
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">
        Membros{' '}
        <span className="text-text-muted font-normal">({members.length})</span>
      </h2>

      {members.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">
          Nenhum agente neste squad
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
            const statusConfig =
              AGENT_STATUS_CONFIG[member.aios_agents.status] ?? AGENT_STATUS_CONFIG.offline;

            return (
              <li
                key={member.id}
                className="flex items-center gap-3 py-2 border-b border-border-default last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-semibold flex-shrink-0">
                  {getInitials(member.aios_agents.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-text-primary font-medium truncate">
                      {member.aios_agents.name}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleConfig.bgColor} ${roleConfig.color}`}
                    >
                      {roleConfig.label}
                    </span>
                  </div>
                  {member.aios_agents.config?.model && (
                    <span className="text-xs text-text-muted font-mono">
                      {String(member.aios_agents.config.model)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    {member.aios_agents.status}
                  </span>
                  <button
                    onClick={() => handleRemove(member.agent_id)}
                    className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Remover do squad"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
