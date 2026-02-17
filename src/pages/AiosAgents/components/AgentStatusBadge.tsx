import { AiosAgentStatus, aiosAgentStatusConfig } from '../../../types/aios';

interface AgentStatusBadgeProps {
  status: AiosAgentStatus;
  size?: 'sm' | 'md';
}

export function AgentStatusBadge({ status, size = 'md' }: AgentStatusBadgeProps) {
  const config = aiosAgentStatusConfig[status];
  const isActive = status === 'active';

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs gap-1'
    : 'px-2 py-0.5 text-xs gap-1.5';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.bgColor} ${config.color}`}
    >
      <span
        className={`rounded-full ${dotSize} ${config.color} bg-current ${isActive ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}
