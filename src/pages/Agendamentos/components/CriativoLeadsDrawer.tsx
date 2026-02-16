import React, { useState } from 'react';
import { X, Users, User, Phone, Mail, Clock, ExternalLink, MessageCircle } from 'lucide-react';
import type { CriativoLead } from '../../../hooks/useCriativoPerformance';
import { formatDate, formatPhone } from '../helpers';
import { FUNNEL_STAGES, getLeadStage } from '../constants';
import { LeadChatModal } from './LeadChatModal';

interface CriativoLeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  criativoName: string;
  leads: CriativoLead[];
  locationId: string | null;
}

export const CriativoLeadsDrawer: React.FC<CriativoLeadsDrawerProps> = ({ isOpen, onClose, criativoName, leads, locationId }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [chatLead, setChatLead] = useState<CriativoLead | null>(null);

  if (!isOpen) return null;

  const filteredLeads = leads.filter((lead) => {
    if (criativoName === 'Sem Criativo (UTM vazio)') {
      const utm = lead.utm_content;
      return !utm || utm === 'NULL' || utm === 'null' || utm.trim() === '';
    }
    return lead.utm_content === criativoName;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const orderA = getLeadStage(a).order;
    const orderB = getLeadStage(b).order;
    return orderB - orderA;
  });

  const displayLeads = activeFilter
    ? sortedLeads.filter((lead) => getLeadStage(lead).label === activeFilter)
    : sortedLeads;

  const funnelCounts = filteredLeads.reduce((acc, lead) => {
    const stage = getLeadStage(lead);
    acc[stage.label] = (acc[stage.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full md:max-w-lg bg-bg-secondary border-l border-border-default z-50 flex flex-col shadow-2xl animate-slide-in-right">
        <div className="px-4 md:px-6 py-4 border-b border-border-default">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-text-primary truncate pr-4">
              Leads do Criativo
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors flex-shrink-0">
              <X size={18} className="text-text-muted" />
            </button>
          </div>
          <p className="text-sm text-accent-primary truncate" title={criativoName}>{criativoName}</p>
          <p className="text-xs text-text-muted mt-1">
            {activeFilter ? `${displayLeads.length} de ${filteredLeads.length} leads` : `${filteredLeads.length} leads encontrados`}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(funnelCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([label, count]) => {
                const stage = Object.values(FUNNEL_STAGES).find((s) => s.label === label) || { bg: 'bg-bg-tertiary', color: 'text-text-muted' };
                const isActive = activeFilter === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveFilter(isActive ? null : label)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-all cursor-pointer ${stage.bg} ${stage.color} ${
                      isActive ? 'ring-2 ring-white/50 scale-105' : 'hover:ring-1 hover:ring-white/20'
                    }`}
                  >
                    {count} {label.toLowerCase()}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {displayLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">Nenhum lead encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayLeads.map((lead) => {
                const stage = getLeadStage(lead);
                const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sem nome';
                return (
                  <div
                    key={lead.id}
                    onClick={() => setChatLead(lead)}
                    className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:bg-bg-hover transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-accent-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{fullName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>
                            {stage.label}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>

                    <div className="space-y-1 mt-2">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Phone size={12} className="text-text-muted flex-shrink-0" />
                          <span>{formatPhone(lead.phone)}</span>
                        </div>
                      )}
                      {(lead as any).email && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Mail size={12} className="text-text-muted flex-shrink-0" />
                          <span className="truncate">{(lead as any).email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-text-muted mt-2 flex-wrap">
                      {lead.state && (
                        <span className="px-1.5 py-0.5 bg-bg-hover rounded">{lead.state}</span>
                      )}
                      {lead.session_source && (
                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">{lead.session_source}</span>
                      )}
                      {lead.source && lead.source !== lead.session_source && (
                        <span className="px-1.5 py-0.5 bg-bg-hover rounded">{lead.source}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {cleanPhone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${cleanPhone}`, '_blank'); }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs rounded-lg transition-colors"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>
                      )}
                      {locationId && lead.contact_id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`https://app.gohighlevel.com/v2/location/${locationId}/contacts/${lead.contact_id}`, '_blank'); }}
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

      <LeadChatModal
        lead={chatLead}
        onClose={() => setChatLead(null)}
        locationId={locationId}
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
