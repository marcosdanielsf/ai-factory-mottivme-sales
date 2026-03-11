import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

function getStatusStyle(status: string): string {
  const normalized = status.toLowerCase().trim();

  if (normalized === 'not processed' || normalized === 'pending') {
    return 'bg-bg-tertiary text-text-muted border-border-default';
  }
  if (
    normalized === 'in progress' ||
    normalized === 'processing' ||
    normalized === 'running'
  ) {
    return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
  }
  if (
    normalized === 'processed' ||
    normalized === 'done' ||
    normalized === 'complete' ||
    normalized === 'completed'
  ) {
    return 'bg-accent-success/10 text-accent-success border-accent-success/20';
  }
  if (normalized === 'error' || normalized === 'failed') {
    return 'bg-accent-error/10 text-accent-error border-accent-error/20';
  }

  return 'bg-bg-tertiary text-text-muted border-border-default';
}

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors duration-150 ${getStatusStyle(status)} ${sizeStyles[size]}`}
    >
      {status}
    </span>
  );
}
