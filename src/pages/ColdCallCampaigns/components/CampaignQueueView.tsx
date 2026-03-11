import { Loader2 } from 'lucide-react';
import { useColdCallQueue, ColdCallQueueItem } from '../../../hooks/useColdCallQueue';
import { QUEUE_STATUS_CONFIG } from '../constants';

export function CampaignQueueView({ campaignId }: { campaignId: string }) {
  const { queue, loading, stats } = useColdCallQueue(campaignId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
        <span className="ml-2 text-sm text-text-muted">Carregando fila...</span>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-sm">
        Nenhum item na fila desta campanha.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border-default pt-4 space-y-3">
      {/* Stats row */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-text-muted">
          ⏳ {stats.pending} pendente{stats.pending !== 1 ? 's' : ''}
        </span>
        <span className="text-accent-primary">
          📞 {stats.calling} ligando
        </span>
        <span className="text-accent-success">
          ✅ {stats.completed} concluído{stats.completed !== 1 ? 's' : ''}
        </span>
        <span className="text-accent-error">
          ❌ {stats.failed} falha{stats.failed !== 1 ? 's' : ''}
        </span>
        {stats.retry > 0 && (
          <span className="text-accent-warning">
            🔄 {stats.retry} retry
          </span>
        )}
      </div>

      {/* Queue list */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {queue.map((item: ColdCallQueueItem) => {
          const cfg = QUEUE_STATUS_CONFIG[item.status] || QUEUE_STATUS_CONFIG.pending;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2 bg-bg-primary/50 rounded-lg text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base flex-shrink-0">{cfg.icon}</span>
                <div className="min-w-0">
                  <span className="text-text-primary font-medium truncate block">
                    {item.lead_name || item.phone_number}
                  </span>
                  {item.lead_name && (
                    <span className="text-text-muted text-xs">{item.phone_number}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                {item.attempt > 0 && (
                  <span className="text-xs text-text-muted">
                    #{item.attempt}/{item.max_attempts}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
