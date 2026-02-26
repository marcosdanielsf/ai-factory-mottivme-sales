import React from 'react';

interface ImpulsionadorBarProps {
  label: string;
  value: number;
  isPositive: boolean;
  maxValue: number;
}

export const ImpulsionadorBar: React.FC<ImpulsionadorBarProps> = ({
  label,
  value,
  isPositive,
  maxValue,
}) => {
  const pct = maxValue > 0 ? Math.min((Math.abs(value) / maxValue) * 100, 100) : 0;
  const colorClass = isPositive
    ? 'bg-emerald-400'
    : 'bg-red-400';
  const textColorClass = isPositive ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] text-text-secondary truncate max-w-[160px] group-hover:text-text-primary transition-colors">
          {label}
        </span>
        <span className={`text-[10px] font-semibold ml-2 tabular-nums ${textColorClass}`}>
          {isPositive ? '+' : ''}{value}%
        </span>
      </div>
      <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
