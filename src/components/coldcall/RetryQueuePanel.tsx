import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Clock, 
  RotateCcw, 
  X, 
  Inbox,
  AlertCircle,
  Loader2,
  PhoneOutgoing
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────

interface RetryQueueEntry {
  id: string;
  phone: string;
  lead_name?: string;
  contact_id?: string;
  location_id?: string;
  attempt_number: number;
  max_attempts: number;
  next_retry_at: string;
  status: 'pending' | 'calling' | 'completed' | 'cancelled' | 'exhausted';
  last_outcome?: string;
  minutes_until_retry?: number;
  is_due?: boolean;
}

interface RetryQueuePanelProps {
  className?: string;
  botApiUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ─── Helpers ─────────────────────────────────────────────

function formatCountdown(minutes?: number): string {
  if (minutes === undefined || minutes === null) return '—';
  
  if (minutes <= 0) return 'Agora';
  if (minutes < 60) return `${minutes}min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function getOutcomeBadge(outcome?: string): { color: string; label: string } {
  switch (outcome) {
    case 'nao_atendeu':
      return { color: 'yellow', label: 'Não atendeu' };
    case 'caixa_postal':
      return { color: 'orange', label: 'Caixa postal' };
    case 'recusou':
      return { color: 'red', label: 'Recusou' };
    case 'agendou':
      return { color: 'green', label: 'Agendou' };
    default:
      return { color: 'gray', label: outcome || 'Desconhecido' };
  }
}

// ─── Component ───────────────────────────────────────────

export function RetryQueuePanel({
  className = '',
  botApiUrl = 'https://cold-call-bot-production.up.railway.app',
  autoRefresh = true,
  refreshInterval = 30000, // 30s
}: RetryQueuePanelProps) {
  const [retries, setRetries] = useState<RetryQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch retry queue
  const fetchQueue = async () => {
    try {
      setError(null);
      const res = await fetch(`${botApiUrl}/retry/queue?status=pending&limit=100`);
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      setRetries(data.queue || []);
    } catch (err) {
      console.error('Failed to fetch retry queue:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar fila');
    } finally {
      setLoading(false);
    }
  };

  // Retry now
  const handleRetryNow = async (retryId: string) => {
    try {
      setProcessingId(retryId);
      const res = await fetch(`${botApiUrl}/retry/now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retry_id: retryId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || `Erro ${res.status}`);
      }

      // Remove da lista local (será atualizado no próximo refresh)
      setRetries((prev) => prev.filter((r) => r.id !== retryId));
    } catch (err) {
      console.error('Failed to retry now:', err);
      alert(
        `Erro ao iniciar ligação: ${
          err instanceof Error ? err.message : 'Erro desconhecido'
        }`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Cancel retry
  const handleCancel = async (retryId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este retry?')) return;

    try {
      setProcessingId(retryId);
      const res = await fetch(`${botApiUrl}/retry/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retry_id: retryId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || `Erro ${res.status}`);
      }

      // Remove da lista local
      setRetries((prev) => prev.filter((r) => r.id !== retryId));
    } catch (err) {
      console.error('Failed to cancel retry:', err);
      alert(
        `Erro ao cancelar retry: ${
          err instanceof Error ? err.message : 'Erro desconhecido'
        }`
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchQueue();
    
    if (autoRefresh) {
      const interval = setInterval(fetchQueue, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Count pending due now
  const dueNowCount = retries.filter((r) => r.is_due).length;

  return (
    <div
      className={`bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-text-muted" />
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              🔄 Fila de Retries
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Ligações automáticas agendadas
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {dueNowCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/30">
              <AlertCircle className="w-3 h-3" />
              {dueNowCount} pronto{dueNowCount > 1 ? 's' : ''}
            </span>
          )}
          
          {retries.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-accent-primary/15 text-accent-primary text-xs font-semibold border border-accent-primary/30">
              {retries.length}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => fetchQueue()}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && retries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum retry pendente</p>
          <p className="text-xs mt-1 opacity-60">
            Ótimo! Todos os leads foram atendidos
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && retries.length > 0 && (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border-default">
              <tr className="text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3 text-center">Tentativa</th>
                <th className="px-4 py-3">Próximo Retry</th>
                <th className="px-4 py-3">Último Outcome</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {retries.map((retry) => {
                const outcome = getOutcomeBadge(retry.last_outcome);
                const isProcessing = processingId === retry.id;
                const isDue = retry.is_due || (retry.minutes_until_retry ?? 0) <= 0;

                return (
                  <tr
                    key={retry.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Lead */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isDue && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        <span className="font-medium text-text-primary">
                          {retry.lead_name || 'Lead'}
                        </span>
                      </div>
                    </td>

                    {/* Telefone */}
                    <td className="px-4 py-3 text-text-muted font-mono text-xs">
                      {retry.phone}
                    </td>

                    {/* Tentativa */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.05] text-text-muted text-xs font-medium">
                        <RotateCcw className="w-3 h-3" />
                        {retry.attempt_number}/{retry.max_attempts}
                      </span>
                    </td>

                    {/* Próximo Retry */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span
                          className={`text-xs font-medium ${
                            isDue ? 'text-red-400' : 'text-text-muted'
                          }`}
                        >
                          {isDue ? 'Agora' : formatCountdown(retry.minutes_until_retry)}
                        </span>
                      </div>
                    </td>

                    {/* Último Outcome */}
                    <td className="px-4 py-3">
                      <span
                        className={`
                          inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                          ${
                            outcome.color === 'yellow'
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                              : outcome.color === 'orange'
                              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                              : 'bg-white/[0.05] text-text-muted'
                          }
                        `}
                      >
                        {outcome.label}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ligar Agora */}
                        <button
                          onClick={() => handleRetryNow(retry.id)}
                          disabled={isProcessing}
                          className="
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-green-500/10 text-green-400 border border-green-500/20
                            hover:bg-green-500/20 hover:border-green-500/40
                            disabled:opacity-50 disabled:cursor-not-allowed
                            active:scale-95 transition-all duration-150
                          "
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Ligando...
                            </>
                          ) : (
                            <>
                              <PhoneOutgoing className="w-3 h-3" />
                              Ligar
                            </>
                          )}
                        </button>

                        {/* Cancelar */}
                        <button
                          onClick={() => handleCancel(retry.id)}
                          disabled={isProcessing}
                          className="
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-red-500/10 text-red-400 border border-red-500/20
                            hover:bg-red-500/20 hover:border-red-500/40
                            disabled:opacity-50 disabled:cursor-not-allowed
                            active:scale-95 transition-all duration-150
                          "
                        >
                          <X className="w-3 h-3" />
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      {!loading && !error && retries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between text-xs text-text-muted">
          <span>
            Total: <strong className="text-text-primary">{retries.length}</strong>{' '}
            retry{retries.length > 1 ? 's' : ''} pendente{retries.length > 1 ? 's' : ''}
          </span>
          <span className="text-[10px] opacity-60">
            Atualiza a cada {refreshInterval / 1000}s
          </span>
        </div>
      )}
    </div>
  );
}
