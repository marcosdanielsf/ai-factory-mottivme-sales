import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon: Icon, trend, trendDirection }) => {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-tertiary transition-colors flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-text-muted font-medium">{title}</h3>
          {Icon && <Icon size={16} className="text-text-secondary" />}
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
      {subtext && <p className="text-xs text-text-muted mt-3">{subtext}</p>}
    </div>
  );
};