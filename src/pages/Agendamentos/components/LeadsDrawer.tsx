import React, { useState } from 'react';
import { X, Clock, CalendarCheck, XCircle, ExternalLink, User } from 'lucide-react';
import { useAgendamentos, getOrigem, type Agendamento, type AgendamentosFilters } from '../../../hooks/useAgendamentos';
import { formatDate } from '../helpers';
import { STATUS_COLORS } from '../constants';
import { LeadDetailModal } from './LeadDetailModal';

interface LeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filters: AgendamentosFilters;
}

export const LeadsDrawer: React.FC<LeadsDrawerProps> = ({ isOpen, onClose, title, filters }) => {
  const { agendamentos, loading, error, totalCount } = useAgendamentos(filters);
  const [selectedLead, setSelectedLead] = useState<Agendamento | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full md:max-w-lg bg-bg-secondary border-l border-border-default z-50 flex flex-col shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border-default">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <p className="text-sm text-text-muted">
              {loading ? 'Carregando...' : `${totalCount} agendamentos`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-bg-tertiary rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-bg-hover rounded w-3/4 mb-3" />
                  <div className="h-3 bg-bg-hover rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-text-muted">{error}</p>
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-12">
              <CalendarCheck size={48} className="mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentos.map((lead) => {
                const status = lead.status?.toLowerCase() || 'booked';
                const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.booked;
                const origem = getOrigem(lead.fonte_do_lead_bposs);
                const agendamentoDate = lead.agendamento_data || lead.scheduled_at;

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-bg-tertiary border border-border-default rounded-lg p-4 cursor-pointer hover:bg-bg-hover transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                          <User size={18} className="text-accent-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {lead.contato_principal || 'Sem nome'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted ml-13">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDate(agendamentoDate)}</span>
                      </div>
                      {origem && (
                        <span className={origem === 'trafego' ? 'text-orange-400' : 'text-pink-400'}>
                          {origem === 'trafego' ? '📣 Tráfego' : '🤝 Social'}
                        </span>
                      )}
                      {lead.lead_usuario_responsavel && (
                        <span className="text-text-secondary">
                          👤 {lead.lead_usuario_responsavel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <LeadDetailModal
        isOpen={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
      />

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
