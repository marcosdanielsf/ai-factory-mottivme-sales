import React from 'react';
import { getScoreBgClass } from '../../helpers';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md' }) => {
  const colorClass = getScoreBgClass(score);

  const sizeClasses: Record<NonNullable<ScoreGaugeProps['size']>, string> = {
    sm: 'w-9 h-9 text-sm font-bold',
    md: 'w-12 h-12 text-base font-bold',
    lg: 'w-16 h-16 text-xl font-bold',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClass}
        rounded-full border
        flex items-center justify-center
        tabular-nums leading-none
        select-none shrink-0
      `}
    >
      {Math.round(score)}
    </div>
  );
};
