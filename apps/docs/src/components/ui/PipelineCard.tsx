import React from 'react';
import { ChevronRight, Activity, LucideIcon } from 'lucide-react';

interface PipelineStep {
  name: string;
  status?: 'completed' | 'active' | 'pending';
}

interface PipelineCardProps {
  name: string;
  description: string;
  steps?: PipelineStep[];
  icon?: LucideIcon;
  status?: 'active' | 'paused' | 'error';
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  active: {
    dot: 'bg-green-500',
    text: 'text-green-400',
    label: 'Ativo',
  },
  paused: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-400',
    label: 'Pausado',
  },
  error: {
    dot: 'bg-red-500',
    text: 'text-red-400',
    label: 'Erro',
  },
};

export function PipelineCard({ 
  name, 
  description, 
  steps = [],
  icon: Icon = Activity,
  status = 'active',
  onClick,
  className = '' 
}: PipelineCardProps) {
  const config = statusConfig[status];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        group bg-white/5 border border-white/10 rounded-xl p-5
        hover:bg-white/[0.08] hover:border-cyan-500/30
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 rounded-lg">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
              <span className={`text-xs ${config.text}`}>{config.label}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {description}
      </p>

      {/* Pipeline Preview */}
      {steps.length > 0 && (
        <div className="flex items-center gap-1 overflow-hidden">
          {steps.slice(0, 4).map((step, i) => (
            <React.Fragment key={i}>
              <div 
                className={`
                  px-2 py-1 rounded text-xs font-medium truncate max-w-[80px]
                  ${step.status === 'completed' 
                    ? 'bg-green-500/20 text-green-400' 
                    : step.status === 'active'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-white/10 text-gray-400'
                  }
                `}
                title={step.name}
              >
                {step.name}
              </div>
              {i < Math.min(steps.length, 4) - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
          {steps.length > 4 && (
            <span className="text-xs text-gray-500 ml-1">+{steps.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
