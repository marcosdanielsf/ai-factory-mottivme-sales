import React, { useState, useEffect } from 'react';
import { X, Users, User, Phone, Mail, Clock, ExternalLink, MessageCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../helpers';
import type { FunnelLead } from '../types';

// ─── Step filter config ─────────────────────────────────────────────────────

const STEP_FILTERS: Record<string, (lead: FunnelLead) => boolean> = {
  ghl_leads: () => true,
  ghl_em_contato: (l) =>
    ['Em Contato', 'Agendou', 'No-show', 'Perdido', 'Compareceu', 'Fechou'].includes(l.etapa_funil),
  ghl_agendou: (l) =>
    ['Agendou', 'Compareceu', 'Fechou', 'No-show'].includes(l.etapa_funil),
  ghl_compareceu: (l) =>
    ['Compareceu', 'Fechou'].includes(l.etapa_funil),
  ghl_won: (l) => l.opp_status === 'won',
};

const STEP_LABELS: Record<string, string> = {
  ghl_leads: 'Leads',
  ghl_em_contato: 'Respondeu',
  ghl_agendou: 'Agendou',
  ghl_compareceu: 'Compareceu',
  ghl_won: 'Fechou',
};

const ETAPA_COLORS: Record<string, { bg: string; text: string }> = {
  Novo: { bg: 'bg-blue-500/10', text: 'text-blue-300' },
  'Em Contato': { bg: 'bg-cyan-500/10', text: 'text-cyan-300' },
  Agendou: { bg: 'bg-amber-500/10', text: 'text-amber-300' },
  'No-show': { bg: 'bg-rose-500/10', text: 'text-rose-300' },
  Compareceu: { bg: 'bg-violet-500/10', text: 'text-violet-300' },
  Fechou: { bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  Perdido: { bg: 'bg-red-500/10', text: 'text-red-300' },
};

function getEtapaColor(etapa: string) {
  return ETAPA_COLORS[etapa] ?? { bg: 'bg-white/[0.04]', text: 'text-[var(--text-secondary)]' };
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

interface FunnelLeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepKey: string;
  adName: string;
  leads: FunnelLead[];
  loading: boolean;
  locationId: string | null;
}

export const FunnelLeadsDrawer: React.FC<FunnelLeadsDrawerProps> = ({
  isOpen, onClose, stepKey, adName, leads, loading, locationId,
}) => {
  const [etapaFilter, setEtapaFilter] = useState<string | null>(null);

  // Reset filtro ao mudar de step
  useEffect(() => {
    setEtapaFilter(null);
  }, [stepKey]);

  if (!isOpen) return null;

  const stepLabel = STEP_LABELS[stepKey] ?? stepKey;
  const filterFn = STEP_FILTERS[stepKey] ?? (() => true);
  const filtered = leads.filter(filterFn);

  // Contagem por etapa para filtro
  const etapaCounts = filtered.reduce((acc, l) => {
    const key = l.opp_status === 'won' ? 'Fechou' : l.etapa_funil;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const displayed = etapaFilter
    ? filtered.filter((l) => {
        const key = l.opp_status === 'won' ? 'Fechou' : l.etapa_funil;
        return key === etapaFilter;
      })
    : filtered;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div key={stepKey} className="fixed right-0 top-0 h-full w-full md:max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-default)] z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate pr-4">
              {stepLabel}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0">
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>
          <p className="text-sm text-[var(--accent-primary)] truncate" title={adName}>{adName}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {etapaFilter
              ? `${displayed.length} de ${filtered.length} leads`
              : `${filtered.length} leads`}
          </p>

          {/* Etapa filter pills */}
          {Object.keys(etapaCounts).length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(etapaCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([etapa, count]) => {
                  const color = getEtapaColor(etapa);
                  const isActive = etapaFilter === etapa;
                  return (
                    <button
                      key={etapa}
                      onClick={() => setEtapaFilter(isActive ? null : etapa)}
                      className={`text-xs px-2 py-0.5 rounded-full transition-all cursor-pointer ${color.bg} ${color.text} ${
                        isActive ? 'ring-2 ring-white/50 scale-105' : 'hover:ring-1 hover:ring-white/20'
                      }`}
                    >
                      {count} {etapa.toLowerCase()}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-white/[0.06] rounded w-2/3 mb-3" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2 mb-2" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-[var(--text-muted)]">Nenhum lead encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map((lead) => {
                const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sem nome';
                const etapaLabel = lead.opp_status === 'won' ? 'Fechou' : lead.etapa_funil;
                const color = getEtapaColor(etapaLabel);

                return (
                  <div
                    key={lead.unique_id}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.05] transition-all group"
                  >
                    {/* Name + badge */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-amber-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate text-sm">{fullName}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                            {etapaLabel}
                          </span>
                        </div>
                      </div>
                      {lead.monetary_value != null && lead.monetary_value > 0 && (
                        <div className="flex items-center gap-1 text-emerald-300 text-xs font-semibold flex-shrink-0">
                          <DollarSign size={12} />
                          {formatCurrency(lead.monetary_value)}
                        </div>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1 mt-2">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <Phone size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <Mail size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-2">
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatDateShort(lead.created_at)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      {cleanPhone && (
                        <button
                          onClick={() => window.open(`https://wa.me/${cleanPhone}`, '_blank')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs rounded-lg transition-colors"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>
                      )}
                      {locationId && lead.contact_id && (
                        <button
                          onClick={() => window.open(`https://app.gohighlevel.com/v2/location/${locationId}/contacts/${lead.contact_id}`, '_blank')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded-lg transition-colors"
                        >
                          <ExternalLink size={12} />
                          CRM
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </>
  );
};
