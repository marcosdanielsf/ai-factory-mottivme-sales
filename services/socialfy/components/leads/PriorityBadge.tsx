import React from 'react';
import { Flame, Sun, Snowflake, Clock } from 'lucide-react';

export type Priority = 'hot' | 'warm' | 'cold' | 'nurturing';
export type BadgeSize = 'sm' | 'md';

interface PriorityBadgeProps {
  priority: Priority;
  size?: BadgeSize;
  showIcon?: boolean;
  showLabel?: boolean;
}

const priorityConfig: Record<Priority, {
  label: string;
  icon: React.ElementType;
  classes: string;
}> = {
  hot: {
    label: 'HOT',
    icon: Flame,
    classes: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  warm: {
    label: 'WARM',
    icon: Sun,
    classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  cold: {
    label: 'COLD',
    icon: Snowflake,
    classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  nurturing: {
    label: 'NURTURING',
    icon: Clock,
    classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = true,
  showLabel = true,
}) => {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium border rounded-full
        ${config.classes}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default PriorityBadge;
