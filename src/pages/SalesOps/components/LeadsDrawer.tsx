import React, { useEffect, useState } from 'react';
import { X, Phone, MessageCircle, User, Clock, ExternalLink, Hash, Instagram, Check, Square, CheckSquare, Send, XCircle, AlertTriangle, ArrowLeft, Bot, UserCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { salesOpsDAO, updateLeadsBatch, scheduleFollowUpBatch, getConversationMessages, type LeadDetail, type LeadFilterType, type ConversationMessage } from '../../../lib/supabase-sales-ops';

export type { LeadFilterType };

type BatchAction = 'send_fu' | 'deactivate' | 'mark_responded' | null;

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
  const cleaned = phone.replace(/\D/g, '');
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

// Detectar se o filtro é por etapa
const isEtapaFilter = (filterType: LeadFilterType): boolean => {
  return /^etapa_\d+_(ativos|respondidos|desistentes)$/.test(filterType);
};

// Modal de Conversa
const ConversationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lead: LeadDetail | null;
}> = ({ isOpen, onClose, lead }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lead?.contact_id) {
      loadMessages();
    }
  }, [isOpen, lead?.contact_id]);

  const loadMessages = async () => {
    if (!lead?.contact_id) return;
    setLoading(true);
    try {
      const data = await getConversationMessages(lead.contact_id);
      setMessages(data);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full md:max-w-2xl bg-[#0d0d0d] border-l border-[#333] z-[70] flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#333] bg-[#1a1a1a]">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#333] transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            lead.source === 'instagram' ? 'bg-pink-500/20' :
            lead.source === 'whatsapp' ? 'bg-green-500/20' : 'bg-blue-500/20'
          }`}>
            {lead.source === 'instagram' ? (
              <Instagram size={18} className="text-pink-400" />
            ) : lead.source === 'whatsapp' ? (
              <MessageCircle size={18} className="text-green-400" />
            ) : (
              <User size={18} className="text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{lead.contact_name || 'Sem nome'}</h3>
            <p className="text-xs text-gray-400 truncate">
              {lead.location_name || 'Sem cliente'} • {lead.follow_up_count} follow-ups
            </p>
          </div>
          {lead.contact_phone && (
            <button
              onClick={() => {
                const cleaned = (lead.contact_phone || '').replace(/\D/g, '');
                window.open(`https://wa.me/${cleaned}`, '_blank');
              }}
              className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
              title="Abrir WhatsApp"
            >
              <MessageCircle size={18} className="text-green-400" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Nenhuma mensagem encontrada</p>
              <p className="text-gray-500 text-sm mt-1">As mensagens da conversa aparecerão aqui</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAI = msg.message?.type === 'ai';
              const content = msg.message?.content || '';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${isAI ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isAI
                          ? 'bg-[#1a1a1a] border border-[#333] text-gray-200'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{content}</p>
                    </div>
                    <p className={`text-[10px] text-gray-500 mt-1 ${isAI ? 'text-left' : 'text-right'}`}>
                      {formatMessageDate(msg.created_at)}
                    </p>
                  </div>
                  {!isAI && (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 order-2">
                      <UserCircle size={16} className="text-green-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#1a1a1a]">
          <button
            onClick={() => {
              window.location.href = `#/supervision?search=${encodeURIComponent(lead.contact_phone || lead.contact_name || '')}`;
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            Abrir no Supervision (modo completo)
          </button>
        </div>
      </div>
    </>
  );
};

// Modal de confirmação
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: BatchAction;
  selectedCount: number;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, action, selectedCount, isLoading }) => {
  if (!isOpen || !action) return null;

  const actionConfig = {
    send_fu: {
      title: 'Enviar Follow-up',
      description: `Você está prestes a agendar follow-up para ${selectedCount} lead${selectedCount > 1 ? 's' : ''}.`,
      icon: <Send className="text-blue-400" size={24} />,
      confirmText: 'Agendar Follow-ups',
      confirmClass: 'bg-blue-500 hover:bg-blue-600',
    },
    deactivate: {
      title: 'Desativar Leads',
      description: `Você está prestes a desativar ${selectedCount} lead${selectedCount > 1 ? 's' : ''}. Eles não receberão mais follow-ups automáticos.`,
      icon: <XCircle className="text-red-400" size={24} />,
      confirmText: 'Desativar',
      confirmClass: 'bg-red-500 hover:bg-red-600',
    },
    mark_responded: {
      title: 'Marcar como Respondido',
      description: `Você está prestes a marcar ${selectedCount} lead${selectedCount > 1 ? 's' : ''} como respondido${selectedCount > 1 ? 's' : ''}.`,
      icon: <Check className="text-green-400" size={24} />,
      confirmText: 'Marcar Respondido',
      confirmClass: 'bg-green-500 hover:bg-green-600',
    },
  };

  const config = actionConfig[action];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[60]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center">
              {config.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{config.title}</h3>
              <p className="text-sm text-gray-400">{selectedCount} lead{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}</p>
            </div>
          </div>

          <p className="text-gray-300 mb-6">{config.description}</p>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${config.confirmClass}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                config.confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
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
  
  // Batch selection state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<BatchAction>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Conversation modal state
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [isConversationOpen, setIsConversationOpen] = useState(false);

  // Expanded messages state
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadLeads();
      // Limpar seleção ao abrir
      setSelectedLeads([]);
      setActionResult(null);
      setExpandedMessages(new Set());
    }
  }, [isOpen, filterType, locationId]);

  // Toggle message expansion
  const toggleMessageExpansion = (e: React.MouseEvent, contactId: string | null) => {
    e.stopPropagation();
    if (!contactId) return;
    
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  const loadLeads = async () => {
    console.log('[LeadsDrawer] loadLeads called with:', { filterType, locationId });
    setLoading(true);
    setError(null);
    try {
      const data = await salesOpsDAO.getLeadsByFilter(filterType, locationId ?? undefined);
      console.log('[LeadsDrawer] getLeadsByFilter returned:', data?.length, 'leads');
      setLeads(data);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
      setError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (lead: LeadDetail) => {
    setSelectedLead(lead);
    setIsConversationOpen(true);
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  // ============================================
  // BATCH SELECTION HANDLERS
  // ============================================

  const toggleLeadSelection = (e: React.MouseEvent, contactId: string | null) => {
    e.stopPropagation();
    if (!contactId) return;
    
    setSelectedLeads(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.contact_id).filter((id): id is string => id !== null));
    }
  };

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const isSomeSelected = selectedLeads.length > 0;

  // ============================================
  // BATCH ACTION HANDLERS
  // ============================================

  const handleBatchAction = (action: BatchAction) => {
    setPendingAction(action);
  };

  const confirmBatchAction = async () => {
    if (!pendingAction || selectedLeads.length === 0) return;

    setIsActionLoading(true);
    setActionResult(null);

    try {
      let result;

      switch (pendingAction) {
        case 'send_fu':
          result = await scheduleFollowUpBatch(selectedLeads, locationId ?? null);
          break;
        case 'deactivate':
          result = await updateLeadsBatch(selectedLeads, { ativo: false });
          break;
        case 'mark_responded':
          result = await updateLeadsBatch(selectedLeads, { responded: true });
          break;
      }

      if (result?.success) {
        setActionResult({ 
          success: true, 
          message: `${result.updated} lead${result.updated > 1 ? 's' : ''} atualizado${result.updated > 1 ? 's' : ''} com sucesso!` 
        });
        setSelectedLeads([]);
        // Recarregar lista após sucesso
        await loadLeads();
      } else {
        setActionResult({ 
          success: false, 
          message: result?.error || 'Erro ao processar ação' 
        });
      }
    } catch (err) {
      setActionResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Erro desconhecido' 
      });
    } finally {
      setIsActionLoading(false);
      setPendingAction(null);
    }
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
          <div className="flex items-center gap-3">
            {/* Select All Checkbox */}
            {!loading && leads.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="p-1 rounded hover:bg-[#222] transition-colors"
                title={isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              >
                {isAllSelected ? (
                  <CheckSquare size={20} className="text-blue-400" />
                ) : isSomeSelected ? (
                  <div className="relative">
                    <Square size={20} className="text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-0.5 bg-blue-400 rounded" />
                    </div>
                  </div>
                ) : (
                  <Square size={20} className="text-gray-400" />
                )}
              </button>
            )}
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">{title}</h2>
              <p className="text-xs md:text-sm text-gray-400">
                {loading ? 'Carregando...' : isSomeSelected ? `${selectedLeads.length} de ${leads.length} selecionados` : `${leads.length} leads encontrados`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-lg hover:bg-[#222] transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Action Result Banner */}
        {actionResult && (
          <div className={`px-4 py-3 text-sm flex items-center gap-2 ${
            actionResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {actionResult.success ? <Check size={16} /> : <AlertTriangle size={16} />}
            {actionResult.message}
            <button
              onClick={() => setActionResult(null)}
              className="ml-auto p-1 hover:bg-white/10 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

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
            <div className="p-3 md:p-4 space-y-2 md:space-y-3 pb-24">
              {leads.map((lead) => {
                const isSelected = lead.contact_id ? selectedLeads.includes(lead.contact_id) : false;
                
                return (
                  <div
                    key={lead.session_id || lead.contact_id}
                    onClick={() => handleLeadClick(lead)}
                    className={`bg-[#1a1a1a] border rounded-lg p-3 md:p-4 hover:bg-[#222] transition-all cursor-pointer group ${
                      isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-[#333] hover:border-[#444]'
                    }`}
                  >
                    {/* Lead Header */}
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        {/* Selection Checkbox */}
                        <button
                          onClick={(e) => toggleLeadSelection(e, lead.contact_id)}
                          className="p-0.5 rounded hover:bg-[#333] transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-blue-400" />
                          ) : (
                            <Square size={18} className="text-gray-500 group-hover:text-gray-400" />
                          )}
                        </button>
                        
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          lead.source === 'instagram' ? 'bg-pink-500/20' : 
                          lead.source === 'whatsapp' ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          {lead.source === 'instagram' ? (
                            <Instagram size={16} className="text-pink-400" />
                          ) : lead.source === 'whatsapp' ? (
                            <MessageCircle size={16} className="text-green-400" />
                          ) : (
                            <User size={16} className="text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white text-sm md:text-base truncate">
                              {lead.contact_name || 'Sem nome'}
                            </h3>
                            {lead.source && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                lead.source === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                                lead.source === 'whatsapp' ? 'bg-green-500/20 text-green-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {lead.source === 'instagram' ? 'IG' : lead.source === 'whatsapp' ? 'WA' : lead.source.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-400 truncate">
                            {lead.location_name || 'Sem cliente'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
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
                    {lead.contact_phone && (
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 mb-1.5 md:mb-2 ml-7 md:ml-8">
                        <Phone size={12} />
                        <span>{formatPhone(lead.contact_phone)}</span>
                      </div>
                    )}

                    {/* Last Message / Follow-up Message - Clicável para expandir */}
                    {lead.last_message && (
                      <div 
                        onClick={(e) => toggleMessageExpansion(e, lead.contact_id)}
                        className="bg-[#0d0d0d] rounded-lg p-2 md:p-3 mb-2 md:mb-3 ml-7 md:ml-8 cursor-pointer hover:bg-[#111] transition-colors group/msg"
                      >
                        {isEtapaFilter(filterType) ? (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <MessageCircle size={10} />
                                Mensagem de Follow-up Enviada:
                              </p>
                              <span className="text-[10px] text-gray-500 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                {expandedMessages.has(lead.contact_id || '') ? (
                                  <>Recolher <ChevronUp size={10} /></>
                                ) : (
                                  <>Expandir <ChevronDown size={10} /></>
                                )}
                              </span>
                            </div>
                            <p className={`text-xs md:text-sm text-gray-200 ${
                              expandedMessages.has(lead.contact_id || '') 
                                ? 'whitespace-pre-wrap' 
                                : 'line-clamp-3'
                            }`}>
                              {lead.last_message}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs md:text-sm text-gray-300 flex-1 ${
                              expandedMessages.has(lead.contact_id || '') 
                                ? 'whitespace-pre-wrap' 
                                : 'line-clamp-2'
                            }`}>
                              {lead.last_message}
                            </p>
                            {lead.last_message.length > 100 && (
                              <span className="text-gray-500 flex-shrink-0">
                                {expandedMessages.has(lead.contact_id || '') ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-gray-500 ml-7 md:ml-8">
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
                );
              })}
            </div>
          )}
        </div>

        {/* Batch Actions Footer - Sticky */}
        {isSomeSelected && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] px-4 py-3 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white font-medium">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selecionado{selectedLeads.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setSelectedLeads([])}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Limpar seleção
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchAction('send_fu')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 md:py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors min-h-[44px]"
                title="Enviar Follow-up"
              >
                <Send size={18} className="md:w-4 md:h-4" />
                <span className="hidden md:inline">Enviar FU</span>
              </button>
              <button
                onClick={() => handleBatchAction('deactivate')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 md:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors border border-red-500/30 min-h-[44px]"
                title="Desativar"
              >
                <XCircle size={18} className="md:w-4 md:h-4" />
                <span className="hidden md:inline">Desativar</span>
              </button>
              <button
                onClick={() => handleBatchAction('mark_responded')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 md:py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-colors border border-green-500/30 min-h-[44px]"
                title="Marcar Respondido"
              >
                <Check size={18} className="md:w-4 md:h-4" />
                <span className="hidden md:inline">Respondido</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmBatchAction}
        action={pendingAction}
        selectedCount={selectedLeads.length}
        isLoading={isActionLoading}
      />

      {/* Conversation Modal */}
      <ConversationModal
        isOpen={isConversationOpen}
        onClose={() => {
          setIsConversationOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
      />

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
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default LeadsDrawer;
