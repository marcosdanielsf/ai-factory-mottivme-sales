import { AlertTriangle } from 'lucide-react';

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-warning/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-accent-warning" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <p className="text-text-secondary text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              confirmColor ?? 'bg-accent-error hover:bg-accent-error/80'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
