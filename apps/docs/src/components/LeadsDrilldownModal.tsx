import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  DollarSign,
  MessageSquare,
  Calendar,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
} from 'lucide-react';
import { PerformanceDrilldownLead, DrilldownFilter } from '../hooks/usePerformanceDrilldown';

interface LeadsDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: PerformanceDrilldownLead[];
  loading: boolean;
  error: string | null;
  title: string;
  subtitle?: string;
  clientName?: string; // Se filtrado por cliente específico
  filterType: DrilldownFilter;
}

// Componente de badge de status
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    new_lead: { label: 'Novo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Users size={12} /> },
    booked: { label: 'Agendado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Calendar size={12} /> },
    no_show: { label: 'No-Show', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock size={12} /> },
    completed: { label: 'Atendido', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: <CheckCircle size={12} /> },
    qualifying: { label: 'Qualificando', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: <Filter size={12} /> },
    won: { label: 'Fechado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle size={12} /> },
    lost: { label: 'Perdido', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle size={12} /> },
  };

  const config = configs[status.toLowerCase()] || { 
    label: status, 
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: <User size={12} />
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export const LeadsDrilldownModal: React.FC<LeadsDrilldownModalProps> = ({
  isOpen,
  onClose,
  leads,
  loading,
  error,
  title,
  subtitle,
  clientName,
  filterType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!isOpen) return null;

  // Filtrar por busca
  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(search) ||
      lead.phone.toLowerCase().includes(search) ||
      lead.email.toLowerCase().includes(search) ||
      lead.responsavel.toLowerCase().includes(search)
    );
  });

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIdx, startIdx + itemsPerPage);

  // Exportar CSV
  const handleExport = () => {
    const headers = ['Nome', 'Telefone', 'Email', 'Status', 'Responsável', 'Funil', 'Valor Estimado'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.phone,
      lead.email,
      lead.status,
      lead.responsavel,
      lead.funil,
      lead.valorEstimado?.toString() || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_drilldown_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formatar valor monetário
  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border-default flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Users className="text-accent-primary" size={24} />
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-text-muted mt-1">{subtitle}</p>
            )}
            {clientName && (
              <div className="flex items-center gap-2 mt-2">
                <Building2 size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Cliente: </span>
                <span className="text-xs font-medium text-accent-primary">{clientName}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-text-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border-default flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-bg-primary border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {filteredLeads.length} leads
            </span>
            <button
              onClick={handleExport}
              disabled={filteredLeads.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="animate-spin text-accent-primary mb-4" size={32} />
              <p className="text-sm text-text-muted">Carregando leads...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="text-red-400 mb-4" size={32} />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : paginatedLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Users className="text-text-muted mb-4" size={48} />
              <p className="text-text-primary font-medium">Nenhum lead encontrado</p>
              <p className="text-sm text-text-muted mt-1">
                {searchTerm ? 'Tente ajustar sua busca' : 'Não há leads com este filtro'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-bg-tertiary/50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Lead</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Contato</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Responsável</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {paginatedLeads.map((lead, idx) => (
                  <tr 
                    key={lead.id || idx} 
                    className="hover:bg-bg-tertiary/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted">
                          {lead.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{lead.name}</p>
                          {lead.funil && lead.funil !== '-' && (
                            <p className="text-xs text-text-muted">{lead.funil}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-text-primary">
                          <Phone size={12} className="text-text-muted" />
                          {lead.phone}
                        </div>
                        {lead.email && lead.email !== '-' && (
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Mail size={12} />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-text-muted" />
                        <span className="text-sm text-text-primary truncate max-w-[150px]">
                          {lead.responsavel}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lead.valorEstimado ? (
                        <span className="text-sm font-medium text-emerald-400">
                          {formatCurrency(lead.valorEstimado)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && !error && filteredLeads.length > 0 && (
          <div className="p-4 border-t border-border-default flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Mostrando {startIdx + 1}-{Math.min(startIdx + itemsPerPage, filteredLeads.length)} de {filteredLeads.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border-default bg-bg-tertiary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-text-primary px-3">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border-default bg-bg-tertiary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsDrilldownModal;
