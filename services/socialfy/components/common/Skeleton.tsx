import React from 'react';

interface SkeletonTextProps {
  lines?: number;
  width?: 'full' | 'half' | 'third' | 'quarter';
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 1,
  width = 'full',
  className = '',
}) => {
  const widths = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
    quarter: 'w-1/4',
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${
            i === lines - 1 && lines > 1 ? 'w-3/4' : widths[width]
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-3">
          <SkeletonText width="half" />
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
};

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={`${sizes[size]} bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse ${className}`}
    />
  );
};

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse ${className}`} />
  );
};

export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse ${className}`} />
  );
};
