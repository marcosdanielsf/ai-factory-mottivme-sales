import React from 'react';
import { Loader2 } from 'lucide-react';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function ActionButton({
  label,
  onClick,
  loading = false,
  variant = 'primary',
  icon,
  disabled = false,
}: ActionButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses =
    variant === 'primary'
      ? 'bg-accent-primary hover:bg-accent-primary/80 text-white'
      : 'bg-bg-tertiary hover:bg-bg-hover text-text-primary border border-border-default';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
