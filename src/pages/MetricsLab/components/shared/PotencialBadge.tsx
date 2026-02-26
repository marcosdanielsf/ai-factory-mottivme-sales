import React from 'react';
import { getPotencialConfig } from '../../helpers';
import type { PotencialLevel } from '../../helpers';

interface PotencialBadgeProps {
  potencial: PotencialLevel;
}

export const PotencialBadge: React.FC<PotencialBadgeProps> = ({ potencial }) => {
  const config = getPotencialConfig(potencial);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
      {config.label}
    </span>
  );
};
