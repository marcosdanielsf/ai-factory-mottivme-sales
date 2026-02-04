import React, { useState, useMemo } from 'react';
import { X, Search, User, Phone, Mail, MessageSquare, Calendar, ExternalLink, Inbox, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardDrilldownLead, MetricType } from '../hooks/useDrilldownLeads';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  metricType: MetricType;
  leads: DashboardDrilldownLead[];
  loading: boolean;
  error?: string | null;
  onLeadClick?: (leadId: string) => void;
}

// Mapeamento de títulos amigáveis para cada tipo de métrica
const METRIC_TITLES: Record<MetricType, string> = {
  total_leads: 'Todos os Leads',
  leads_novos: 'Leads Novos',
  responderam: 'Leads que Responderam',
  agendaram: 'Leads que Agendaram',
  compareceram: 'Leads que Compareceram',
  fecharam: 'Leads Convertidos',
  sem_resposta_24h: 'Leads sem Resposta (24h+)',
  follow_ups_pendentes: 'Follow-ups Pendentes',
  leads_esfriando: 'Leads Esfriando',
  no_shows: 'No-Shows'
};

// Mapeamento de cores para status
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  novo: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  available: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  new_lead: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  cold: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  warm: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  hot: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  in_cadence: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  responding: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  replied: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  qualified: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  scheduled: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  call_booked: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  booked: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  attended: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  completed: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  converted: 'bg-green-500/10 text-green-500 border-green-500/20',
  won: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-green-500/10 text-green-500 border-green-500/20',
  lost: 'bg-red-500/10 text-red-500 border-red-500/20',
  no_show: 'bg-red-500/10 text-red-500 border-red-500/20',
  noshow: 'bg-red-500/10 text-red-500 border-red-500/20',
  missed: 'bg-red-500/10 text-red-500 border-red-500/20',
  proposal: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

const ITEMS_PER_PAGE = 20;

export const DrilldownModal: React.FC<DrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  metricType,
  leads,
  loading,
  error,
  onLeadClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar leads por busca
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.name?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  // Reset página quando busca muda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Não renderizar se não estiver aberto
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase().trim();
    return STATUS_COLORS[normalizedStatus] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (!message) return '-';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleLeadClick = (leadId: string) => {
    if (onLeadClick) {
      onLeadClick(leadId);
    } else {
      // Navegar para a página de Supervision com o lead selecionado
      window.open(`/supervision?lead=${leadId}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-tertiary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <User size={20} className="text-accent-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {title || METRIC_TITLES[metricType]}
              </h2>
              <p className="text-sm text-text-muted">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-primary rounded-lg transition-colors text-text-muted hover:text-text-primary border border-transparent hover:border-border-default"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border-default">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-muted">Carregando leads...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-12 h-12 bg-accent-error/10 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-accent-error" />
              </div>
              <p className="text-sm font-medium text-text-primary">Erro ao carregar leads</p>
              <p className="text-xs text-text-muted text-center max-w-xs">{error}</p>
            </div>
          ) : paginatedLeads.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-12 h-12 bg-bg-tertiary rounded-full flex items-center justify-center">
                <Inbox size={24} className="text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-primary">Nenhum lead encontrado</p>
              <p className="text-xs text-text-muted text-center max-w-xs">
                {searchQuery 
                  ? 'Tente ajustar os termos de busca.' 
                  : 'Não há leads nesta categoria no período selecionado.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {paginatedLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-bg-tertiary transition-colors cursor-pointer group"
                  onClick={() => handleLeadClick(lead.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-accent-primary" />
                    </div>

                    {/* Info Principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-text-primary truncate">
                          {lead.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-medium uppercase rounded border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-text-muted mb-2">
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail size={12} />
                            {lead.email}
                          </span>
                        )}
                      </div>

                      {/* Última Mensagem */}
                      {lead.last_message && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-bg-primary/50 rounded border border-border-default">
                          <MessageSquare size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-secondary truncate">
                              {truncateMessage(lead.last_message)}
                            </p>
                            {lead.last_message_at && (
                              <p className="text-[10px] text-text-muted mt-1">
                                {formatDate(lead.last_message_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Action */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-text-muted flex items-center gap-1">
                          <Calendar size={10} />
                          Criado: {formatDate(lead.created_at)}
                        </p>
                        {lead.updated_at !== lead.created_at && (
                          <p className="text-[10px] text-text-muted">
                            Atualizado: {formatDate(lead.updated_at)}
                          </p>
                        )}
                      </div>

                      <button
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-accent-primary hover:underline transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeadClick(lead.id);
                        }}
                      >
                        <ExternalLink size={12} />
                        Ver conversa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com Paginação */}
        {!loading && !error && filteredLeads.length > 0 && (
          <div className="p-4 border-t border-border-default bg-bg-tertiary flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} de {filteredLeads.length}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-border-default hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-accent-primary text-white'
                            : 'hover:bg-bg-secondary text-text-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-border-default hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-default rounded text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Footer simples quando não há dados */}
        {(loading || error || filteredLeads.length === 0) && (
          <div className="p-4 border-t border-border-default bg-bg-tertiary flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-default rounded text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrilldownModal;
