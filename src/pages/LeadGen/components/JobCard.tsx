import React from 'react';
import StatusBadge from './StatusBadge';

interface JobCardProps {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  notes?: string;
  isSelected?: boolean;
  onClick: () => void;
}

export default function JobCard({
  title,
  subtitle,
  status,
  notes,
  isSelected = false,
  onClick,
}: JobCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-3 cursor-pointer transition-colors border ${
        isSelected
          ? 'border-accent-primary bg-accent-primary/5'
          : 'bg-bg-secondary border-border-default hover:border-accent-primary/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-text-primary truncate flex-1">{title}</p>
        <StatusBadge status={status} size="sm" />
      </div>

      {subtitle && (
        <p className="text-xs text-text-muted truncate mb-1">{subtitle}</p>
      )}

      {notes && (
        <p className="text-xs text-text-muted/70 truncate italic">{notes}</p>
      )}
    </div>
  );
}
