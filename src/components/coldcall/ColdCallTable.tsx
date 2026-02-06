import React from 'react';
import { Eye, Phone, Clock, FileText } from 'lucide-react';
import { CallStatusBadge } from './CallStatusBadge';

// ─── Types ───────────────────────────────────────────────

interface ColdCallLog {
  id: string;
  lead_name?: string;
  lead_phone?: string;
  phone_number?: string;
  duration_seconds?: number;
  created_at?: string;
  started_at?: string;
  status?: string;
  outcome?: string;
  transcript?: string | unknown[];
  summary?: string;
  [key: string]: unknown;
}

interface ColdCallTableProps {
  calls: ColdCallLog[];
  onViewTranscript: (call: ColdCallLog) => void;
  loading?: boolean;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(dateStr?: string): { date: string; time: string } {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function maskPhone(phone?: string): string {
  if (!phone) return '—';
  // Show last 4 digits: ****-1234
  if (phone.length >= 8) {
    return `****-${phone.slice(-4)}`;
  }
  return phone;
}

// ─── Skeleton Rows ───────────────────────────────────────

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border-default/50">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 bg-white/5 rounded animate-pulse"
                style={{ width: `${40 + Math.random() * 40}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Component ───────────────────────────────────────────

export function ColdCallTable({
  calls,
  onViewTranscript,
  loading,
  className = '',
}: ColdCallTableProps) {
  return (
    <div
      className={`bg-bg-secondary border border-border-default rounded-xl overflow-hidden ${className}`}
    >
      {/* Responsive scroll wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-xs font-medium text-text-muted px-4 py-3">
                Data/Hora
              </th>
              <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Lead</th>
              <th className="text-left text-xs font-medium text-text-muted px-4 py-3">
                Telefone
              </th>
              <th className="text-left text-xs font-medium text-text-muted px-4 py-3">
                Duração
              </th>
              <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-text-muted px-4 py-3">
                Outcome
              </th>
              <th className="text-right text-xs font-medium text-text-muted px-4 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center text-text-muted">
                    <Phone className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma ligação encontrada</p>
                  </div>
                </td>
              </tr>
            ) : (
              calls.map((call) => {
                const { date, time } = formatDateTime(call.started_at ?? call.created_at);
                const phone = call.lead_phone ?? call.phone_number;
                const hasTranscript = !!(
                  call.transcript &&
                  (typeof call.transcript === 'string'
                    ? call.transcript.length > 0
                    : (call.transcript as unknown[]).length > 0)
                );

                return (
                  <tr
                    key={call.id}
                    onClick={() => onViewTranscript(call)}
                    className="
                      border-b border-border-default/50
                      hover:bg-white/[0.03] cursor-pointer
                      transition-colors duration-100
                    "
                  >
                    {/* Date/Time */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-primary">{date}</span>
                      <span className="text-xs text-text-muted ml-1.5">{time}</span>
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-primary font-medium truncate block max-w-[180px]">
                        {call.lead_name ?? '—'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-secondary font-mono">
                        {maskPhone(phone)}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {formatDuration(call.duration_seconds)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <CallStatusBadge status={call.status} />
                    </td>

                    {/* Outcome */}
                    <td className="px-4 py-3">
                      <CallStatusBadge outcome={call.outcome} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTranscript(call);
                        }}
                        className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                          transition-all duration-150
                          ${
                            hasTranscript
                              ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20'
                              : 'bg-white/5 text-text-muted border border-border-default hover:bg-white/10'
                          }
                        `}
                        title={hasTranscript ? 'Ver transcrição' : 'Sem transcrição'}
                      >
                        {hasTranscript ? (
                          <>
                            <FileText className="w-3 h-3" />
                            Ver
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Info
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
