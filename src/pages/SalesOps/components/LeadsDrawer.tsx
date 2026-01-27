import React, { useEffect, useState } from 'react';
import { X, Phone, MessageCircle, User, Clock, ExternalLink, Hash } from 'lucide-react';
import { salesOpsDAO, type LeadDetail } from '../../../lib/supabase-sales-ops';

export type LeadFilterType = 
  | 'ativos' 
  | 'inativos' 
  | 'prontos_fu' 
  | 'fu_0' 
  | 'fu_1' 
  | 'fu_2' 
  | 'fu_3' 
  | 'fu_4_plus';

interface LeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filterType: LeadFilterType;
  locationId?: string | null;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPhone = (phone: string | null) => {
  if (!phone) return 'Sem telefone';
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  // Formato brasileiro
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

const truncateMessage = (msg: string | null, maxLength = 80) => {
  if (!msg) return 'Sem mensagens';
  if (msg.length <= maxLength) return msg;
  return msg.slice(0, maxLength) + '...';
};

export const LeadsDrawer: React.FC<LeadsDrawerProps> = ({
  isOpen,
  onClose,
  title,
  filterType,
  locationId,
}) => {
  const [leads, setLeads] = useState<LeadDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen, filterType, locationId]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesOpsDAO.getLeadsByFilter(filterType, locationId ?? undefined);
      setLeads(data);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
      setError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (lead: LeadDetail) => {
    // Abre no Supervision com filtro de busca pelo telefone/session
    if (lead.session_id) {
      // Se tiver session_id, navega direto para Supervision
      // A URL usa HashRouter
      window.location.href = `#/supervision?search=${encodeURIComponent(lead.contact_phone || lead.contact_name || '')}`;
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:max-w-lg bg-[#0d0d0d] border-l border-[#333] z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#333]">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-white">{title}</h2>
            <p className="text-xs md:text-sm text-gray-400">
              {loading ? 'Carregando...' : `${leads.length} leads encontrados`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-lg hover:bg-[#222] transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-lg p-3 md:p-4 animate-pulse">
                  <div className="h-3 md:h-4 bg-[#333] rounded w-3/4 mb-2 md:mb-3" />
                  <div className="h-2.5 md:h-3 bg-[#333] rounded w-1/2 mb-1.5 md:mb-2" />
                  <div className="h-2.5 md:h-3 bg-[#333] rounded w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 md:p-6 text-center">
              <p className="text-red-400 text-sm md:text-base">{error}</p>
              <button
                onClick={loadLeads}
                className="mt-3 md:mt-4 px-3 md:px-4 py-1.5 md:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-4 md:p-6 text-center">
              <User size={40} className="mx-auto text-gray-600 mb-3 md:mb-4" />
              <p className="text-gray-400 text-sm md:text-base">Nenhum lead encontrado</p>
            </div>
          ) : (
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.session_id || lead.contact_id}
                  onClick={() => handleLeadClick(lead)}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 md:p-4 hover:bg-[#222] hover:border-[#444] transition-all cursor-pointer group"
                >
                  {/* Lead Header */}
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-white text-sm md:text-base truncate">
                          {lead.contact_name || 'Sem nome'}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-400 truncate">
                          {lead.location_name || 'Sem cliente'}
                        </p>
                      </div>
                    </div>

                    {/* Actions - always visible on mobile */}
                    <div className="flex items-center gap-1.5 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {lead.contact_phone && (
                        <button
                          onClick={(e) => handleWhatsAppClick(e, lead.contact_phone)}
                          className="p-1.5 md:p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle size={14} className="text-green-400" />
                        </button>
                      )}
                      <button
                        className="p-1.5 md:p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                        title="Ver no Supervision"
                      >
                        <ExternalLink size={14} className="text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 mb-1.5 md:mb-2">
                    <Phone size={12} />
                    <span>{formatPhone(lead.contact_phone)}</span>
                  </div>

                  {/* Last Message */}
                  <div className="bg-[#0d0d0d] rounded-lg p-2 md:p-3 mb-2 md:mb-3">
                    <p className="text-xs md:text-sm text-gray-300">
                      {truncateMessage(lead.last_message, 60)}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Hash size={10} className="md:w-3 md:h-3" />
                      <span>{lead.follow_up_count} FUs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="md:w-3 md:h-3" />
                      <span>{formatDate(lead.last_contact_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default LeadsDrawer;
