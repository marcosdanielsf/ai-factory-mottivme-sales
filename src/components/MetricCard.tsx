import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  clickable?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  trend, 
  trendDirection,
  onClick,
  clickable = false
}) => {
  const isClickable = clickable || !!onClick;

  return (
    <div 
      className={`bg-bg-secondary border border-border-default rounded-lg p-4 transition-all flex flex-col h-full justify-between ${
        isClickable 
          ? 'cursor-pointer hover:bg-bg-tertiary hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5 active:scale-[0.98]' 
          : 'hover:bg-bg-tertiary'
      }`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-text-muted font-medium">{title}</h3>
          {Icon && <Icon size={16} className={`${isClickable ? 'text-accent-primary' : 'text-text-secondary'}`} />}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold text-text-primary">{value}</span>
          {trend && (
            <span className={`text-xs mb-1 ${
              trendDirection === 'up' ? 'text-accent-success' : 
              trendDirection === 'down' ? 'text-accent-error' : 'text-text-muted'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        {subtext && <p className="text-xs text-text-muted">{subtext}</p>}
        {isClickable && (
          <span className="text-[10px] text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Clique para detalhes →
          </span>
        )}
      </div>
    </div>
  );
};