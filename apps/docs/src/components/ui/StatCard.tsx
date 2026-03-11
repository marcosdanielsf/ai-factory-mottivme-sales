import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatCard({ 
  value, 
  label, 
  icon: Icon,
  trend,
  className = '' 
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-400';
    if (trend.value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div 
      className={`
        bg-white/5 border border-white/10 rounded-xl p-6
        hover:bg-white/[0.07] hover:border-white/20
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {value}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {label}
          </p>
        </div>
        {Icon && (
          <div className="p-2.5 bg-purple-500/20 rounded-lg">
            <Icon className="w-5 h-5 text-purple-400" />
          </div>
        )}
      </div>

      {trend && (
        <div className={`flex items-center gap-1.5 mt-4 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          {trend.label && (
            <span className="text-gray-500 text-sm">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
