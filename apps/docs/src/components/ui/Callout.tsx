import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

export type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const typeConfig: Record<CalloutType, {
  icon: React.ComponentType<{ className?: string }>;
  styles: string;
  iconColor: string;
}> = {
  info: {
    icon: Info,
    styles: 'bg-blue-500/10 border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    styles: 'bg-amber-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  error: {
    icon: AlertCircle,
    styles: 'bg-red-500/10 border-red-500/30',
    iconColor: 'text-red-400',
  },
  success: {
    icon: CheckCircle,
    styles: 'bg-green-500/10 border-green-500/30',
    iconColor: 'text-green-400',
  },
  tip: {
    icon: Lightbulb,
    styles: 'bg-purple-500/10 border-purple-500/30',
    iconColor: 'text-purple-400',
  },
};

export function Callout({ 
  type = 'info', 
  title, 
  children,
  className = '' 
}: CalloutProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        rounded-lg border p-4
        ${config.styles}
        ${className}
      `}
    >
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-white mb-1">{title}</h4>
          )}
          <div className="text-gray-300 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
