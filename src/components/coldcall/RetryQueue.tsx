import React from 'react';
import { PhoneCall, Clock, RotateCcw, Inbox } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────

interface PendingRetry {
  id: string;
  lead_name?: string;
  lead_phone?: string;
  phone_number?: string;
  attempt_number: number;
  max_attempts?: number;
  next_retry_at?: string;
  reason?: string;
}

interface RetryQueueProps {
  retries: PendingRetry[];
  onRetryNow?: (id: string) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diffMs = target - now;

  if (diffMs < 0) return 'Agora';

  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `em ${diffMin}min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `em ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `em ${diffD}d`;
}

// ─── Component ───────────────────────────────────────────

export function RetryQueue({ retries, onRetryNow, className = '' }: RetryQueueProps) {
  return (
    <div
      className={`bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-medium text-text-muted">Fila de Retry</h3>
        </div>
        {retries.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-medium border border-yellow-500/30">
            {retries.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {retries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-text-muted">
          <Inbox className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhuma ligação pendente</p>
          <p className="text-xs mt-1 opacity-60">Todas as tentativas foram realizadas</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {retries.map((retry) => {
            const phone = retry.lead_phone ?? retry.phone_number ?? '—';
            const name = retry.lead_name ?? phone;

            return (
              <li
                key={retry.id}
                className="
                  flex items-center gap-3 p-3 rounded-lg
                  bg-white/[0.02] border border-border-default
                  hover:bg-white/[0.04] hover:border-white/10
                  transition-all duration-150
                "
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      {phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Tentativa {retry.attempt_number}
                      {retry.max_attempts && `/${retry.max_attempts}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(retry.next_retry_at)}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {onRetryNow && (
                  <button
                    onClick={() => onRetryNow(retry.id)}
                    className="
                      shrink-0 inline-flex items-center gap-1.5
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-accent-primary/10 text-accent-primary border border-accent-primary/20
                      hover:bg-accent-primary/20 hover:border-accent-primary/40
                      active:scale-95
                      transition-all duration-150
                    "
                  >
                    <PhoneCall className="w-3 h-3" />
                    Ligar Agora
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
