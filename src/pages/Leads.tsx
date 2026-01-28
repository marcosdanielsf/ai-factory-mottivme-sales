import React, { useState, useMemo, useEffect } from 'react';
import { Search, MessageSquare, Calendar, X, Send, Download, ChevronLeft, ChevronRight, User, RefreshCw, Building2, Instagram, Phone, Mail, ExternalLink, AlertCircle, Filter } from 'lucide-react';
import { Lead } from '../types';
import { useToast } from '../hooks/useToast';
import { useLeads, useLeadConversations, LeadFilter } from '../hooks/useLeads';
import { useIsMobile } from '../hooks/useMediaQuery';

// Tipo estendido de Lead com campos extras do Supabase
interface ExtendedLead extends Lead {
  instagram_handle?: string;
  company?: string;
  icp_score?: number;
  avatar_url?: string;
}

export const Leads = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<LeadFilter>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedChat, setSelectedChat] = useState<ExtendedLead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = isMobile ? 6 : 8;

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hook com dados reais do Supabase
  const { leads, totalCount, loading, error, refetch } = useLeads({
    filter,
    searchTerm: debouncedSearch,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  // Hook para conversas do lead selecionado
  const { messages: chatMessages, loading: loadingChat } = useLeadConversations(
    selectedChat?.id || null
  );

  const handleRefresh = async () => {
    await refetch();
    showToast('Lista de leads atualizada', 'info');
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleExport = () => {
    try {
      const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Status', 'Data Agendamento', 'Instagram', 'Empresa'];
      const rows = leads.map((l: ExtendedLead) => [
        l.id,
        l.name,
        l.email,
        l.phone,
        l.status,
        l.scheduled_date || '',
        l.instagram_handle || '',
        l.company || ''
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exportacao concluida com sucesso', 'success');
    } catch (err) {
      showToast('Erro ao exportar leads', 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilter('Todos');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (newFilter: LeadFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'scheduled': { bg: 'bg-accent-success/10', text: 'text-accent-success', label: 'Agendado' },
      'new_lead': { bg: 'bg-accent-primary/10', text: 'text-accent-primary', label: 'Novo' },
      'qualified': { bg: 'bg-accent-warning/10', text: 'text-accent-warning', label: 'Qualificado' },
      'call_booked': { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Call Agendada' },
      'won': { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Ganho' },
      'lost': { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Perdido' },
    };
    const badge = badges[status] || badges['new_lead'];
    return (
      <span className={`text-[9px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border border-current/20 font-bold uppercase tracking-wider`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-1">
            <Calendar size={isMobile ? 24 : 28} className="text-accent-primary" />
            <h1 className="text-xl md:text-3xl font-semibold">Leads Agendados</h1>
          </div>
          <p className="text-text-secondary text-sm md:text-base">Gerencie os agendamentos realizados pelos agentes.</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          {/* Total - visível no mobile também */}
          <div className="flex flex-col items-start md:items-end mr-auto md:mr-2">
            <span className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider font-medium">Total</span>
            <span className="text-sm font-bold text-text-primary">{loading ? '...' : totalCount}</span>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || leads.length === 0}
            className="flex items-center gap-2 p-2 md:px-4 md:py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg border border-border-default transition-all active:scale-95 disabled:opacity-50"
            title="Exportar"
          >
            <Download size={16} />
            <span className="hidden md:inline">Exportar</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
            title="Atualizar lista de leads"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <p className="text-red-500 font-medium">Erro ao carregar leads</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button onClick={handleRefresh} className="ml-auto text-red-500 hover:underline text-sm">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-4 shadow-sm space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-50" size={16} />
            <input
              type="text"
              placeholder={isMobile ? "Buscar..." : "Filtrar por nome, email ou telefone..."}
              value={searchTerm}
              disabled={loading}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-primary border border-border-default rounded-lg pl-9 md:pl-10 pr-9 py-2 md:py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm disabled:opacity-50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Mobile: Botão de filtro */}
          {isMobile ? (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`p-2 rounded-lg border transition-all ${
                filter !== 'Todos'
                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                  : 'bg-bg-primary border-border-default text-text-muted'
              }`}
            >
              <Filter size={18} />
            </button>
          ) : (
            /* Desktop: Filtros inline */
            <div className="flex bg-bg-tertiary/50 rounded-lg border border-border-default p-1">
              {(['Todos', 'Hoje', 'Amanha', 'Agendados'] as const).map((f) => (
                <button
                  key={f}
                  disabled={loading}
                  onClick={() => handleFilterChange(f === 'Amanha' ? 'Amanhã' : f as LeadFilter)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    (filter === f || (filter === 'Amanhã' && f === 'Amanha'))
                      ? 'bg-bg-secondary text-accent-primary shadow-sm border border-border-default'
                      : 'text-text-muted hover:text-text-primary'
                  } disabled:opacity-50`}
                >
                  {f === 'Amanha' ? 'Amanhã' : f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Filters Dropdown */}
        {isMobile && showMobileFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border-default">
            {(['Todos', 'Hoje', 'Amanha', 'Agendados'] as const).map((f) => (
              <button
                key={f}
                disabled={loading}
                onClick={() => {
                  handleFilterChange(f === 'Amanha' ? 'Amanhã' : f as LeadFilter);
                  setShowMobileFilters(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  (filter === f || (filter === 'Amanhã' && f === 'Amanha'))
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-muted'
                } disabled:opacity-50`}
              >
                {f === 'Amanha' ? 'Amanhã' : f}
              </button>
            ))}
          </div>
        )}

        {(searchTerm || filter !== 'Todos') && (
          <div className="flex items-center justify-between text-xs border-t border-border-default pt-3">
            <p className="text-text-muted">
              <span className="text-text-primary font-semibold">{totalCount}</span> leads
            </p>
            <button
              onClick={clearFilters}
              disabled={loading}
              className="text-accent-primary hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <X size={12} />
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className={`bg-bg-secondary border-l border-border-default h-full flex flex-row shadow-2xl animate-in slide-in-from-right duration-300 ${
            isMobile ? 'w-full' : 'w-full max-w-4xl'
          }`}>
            {/* Lead Info Sidebar - escondido no mobile */}
            <div className="w-80 border-r border-border-default flex-col bg-bg-primary hidden lg:flex">
              <div className="p-6 text-center border-b border-border-default">
                {selectedChat.avatar_url ? (
                  <img
                    src={selectedChat.avatar_url}
                    alt={selectedChat.name}
                    className="w-20 h-20 rounded-2xl border border-border-default mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center text-2xl font-bold border border-border-default mx-auto mb-4 text-accent-primary">
                    {selectedChat.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="font-bold text-lg text-text-primary">{selectedChat.name}</h3>
                {getStatusBadge(selectedChat.status)}
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Informacoes de Contato</h4>
                  <div className="space-y-3">
                    {selectedChat.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-text-muted" />
                        <span className="text-sm text-text-primary break-all">{selectedChat.email}</span>
                      </div>
                    )}
                    {selectedChat.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-text-muted" />
                        <span className="text-sm text-text-primary">{selectedChat.phone}</span>
                      </div>
                    )}
                    {selectedChat.instagram_handle && (
                      <div className="flex items-center gap-2">
                        <Instagram size={14} className="text-text-muted" />
                        <a
                          href={`https://instagram.com/${selectedChat.instagram_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent-primary hover:underline flex items-center gap-1"
                        >
                          {selectedChat.instagram_handle}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    {selectedChat.company && (
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-text-muted" />
                        <span className="text-sm text-text-primary">{selectedChat.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedChat.icp_score !== undefined && (
                  <div className="space-y-4 pt-4 border-t border-border-default">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">ICP Score</h4>
                    <div className="bg-bg-secondary border border-border-default rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-text-primary">{selectedChat.icp_score}</span>
                        <span className="text-xs text-text-muted">/100</span>
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-2">
                        <div
                          className="bg-accent-primary h-2 rounded-full transition-all"
                          style={{ width: `${selectedChat.icp_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-border-default">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Agendamento</h4>
                  <div className="bg-bg-secondary border border-border-default rounded-lg p-3">
                    <div className="flex items-center gap-2 text-accent-primary mb-1">
                      <Calendar size={14} />
                      <span className="text-sm font-bold">{selectedChat.scheduled_date || 'Nao agendado'}</span>
                    </div>
                    <p className="text-[10px] text-text-muted">Fuso horario: America/Sao_Paulo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-bg-secondary">
              <div className="p-3 md:p-4 border-b border-border-default flex items-center justify-between bg-bg-secondary/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-bold border border-border-default flex-shrink-0">
                    {selectedChat.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-primary text-sm truncate">{selectedChat.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>{selectedChat.phone}</span>
                      {getStatusBadge(selectedChat.status)}
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <span className="text-xs font-medium text-text-muted">Conversa com Lead</span>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingChat ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="animate-spin text-text-muted" size={24} />
                  </div>
                ) : chatMessages.length > 0 ? (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${
                        msg.role === 'user'
                          ? 'bg-accent-primary text-white rounded-2xl rounded-tr-none'
                          : 'bg-bg-tertiary border border-border-default rounded-2xl rounded-tl-none'
                      } p-4 max-w-[80%] text-sm shadow-sm`}>
                        {msg.role !== 'user' && (
                          <p className="text-[10px] font-bold text-accent-primary mb-1 uppercase tracking-wider">AI Agent</p>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  ))
                ) : (
                  // Mensagens placeholder quando não há histórico
                  <>
                    <div className="flex justify-start">
                      <div className="bg-bg-tertiary border border-border-default rounded-2xl rounded-tl-none p-4 max-w-[80%] text-sm shadow-sm">
                        <p className="text-[10px] font-bold text-accent-primary mb-1 uppercase tracking-wider">AI Agent</p>
                        Ola! Como posso ajudar voce hoje?
                      </div>
                    </div>
                    <div className="text-center text-text-muted text-xs py-4">
                      Nenhum historico de conversa encontrado
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-border-default bg-bg-primary/50">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Intervir na conversa..."
                    className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 pr-14 text-sm focus:border-accent-primary outline-none transition-all shadow-inner"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors shadow-sm">
                    <Send size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-warning animate-pulse"></div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Modo de intervencao manual ativo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table-like List */}
      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
        {/* Header - só no desktop */}
        {!isMobile && (
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-default bg-bg-tertiary text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <div className="col-span-4">Lead</div>
            <div className="col-span-3">Contato</div>
            <div className="col-span-3">Agendamento</div>
            <div className="col-span-2 text-right">Acoes</div>
          </div>
        )}

        <div className="divide-y divide-border-default">
          {loading ? (
            [...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className={isMobile ? "p-4 animate-pulse space-y-3" : "grid grid-cols-12 gap-4 p-5 animate-pulse"}>
                {isMobile ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex-shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-bg-tertiary rounded w-2/3"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-bg-tertiary rounded-lg w-full"></div>
                  </>
                ) : (
                  <>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-bg-tertiary"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-bg-tertiary rounded w-2/3"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <div className="h-3 bg-bg-tertiary rounded w-full"></div>
                      <div className="h-3 bg-bg-tertiary rounded w-1/2"></div>
                    </div>
                    <div className="col-span-3">
                      <div className="h-6 bg-bg-tertiary rounded-full w-3/4"></div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <div className="h-8 bg-bg-tertiary rounded-md w-24"></div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : leads.length > 0 ? (
            leads.map((lead: ExtendedLead) => (
              isMobile ? (
                /* VERSÃO MOBILE - Cards */
                <div key={lead.id} className="p-4 space-y-3 active:bg-bg-hover transition-all">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {lead.avatar_url ? (
                        <img
                          src={lead.avatar_url}
                          alt={lead.name}
                          className="w-10 h-10 rounded-xl border border-border-default object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-bg-primary border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0">
                          {lead.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-text-primary truncate">{lead.name}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {getStatusBadge(lead.status)}
                          {lead.instagram_handle && (
                            <span className="text-[9px] text-text-muted font-medium flex items-center gap-1">
                              <Instagram size={10} />
                              {lead.instagram_handle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-bg-tertiary/50 rounded-lg p-2">
                      <span className="text-text-muted block text-[10px]">Email</span>
                      <span className="text-text-primary truncate block">{lead.email || '-'}</span>
                    </div>
                    <div className="bg-bg-tertiary/50 rounded-lg p-2">
                      <span className="text-text-muted block text-[10px]">Telefone</span>
                      <span className="text-text-primary">{lead.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3">
                    {lead.scheduled_date ? (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-bg-primary border border-border-default text-text-primary text-xs font-medium">
                        <Calendar size={12} className="text-accent-primary" />
                        {lead.scheduled_date}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic">Aguardando...</span>
                    )}
                    <button
                      onClick={() => setSelectedChat(lead)}
                      className="text-xs font-bold flex items-center gap-2 bg-accent-primary text-white px-3 py-2 rounded-lg transition-all active:scale-95"
                    >
                      <MessageSquare size={14} />
                      Chat
                    </button>
                  </div>
                </div>
              ) : (
                /* VERSÃO DESKTOP - Tabela */
                <div key={lead.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-bg-hover transition-all group">
                  <div className="col-span-4 flex items-center gap-4">
                    {lead.avatar_url ? (
                      <img
                        src={lead.avatar_url}
                        alt={lead.name}
                        className="w-10 h-10 rounded-xl border border-border-default object-cover group-hover:border-accent-primary/30 transition-colors"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-bg-primary border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary group-hover:border-accent-primary/30 transition-colors">
                        {lead.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">{lead.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {getStatusBadge(lead.status)}
                        {lead.instagram_handle && (
                          <span className="text-[9px] text-text-muted font-medium flex items-center gap-1">
                            <Instagram size={10} />
                            {lead.instagram_handle}
                          </span>
                        )}
                        {!lead.instagram_handle && lead.acquisition_channel && (
                          <span className="text-[9px] text-text-muted font-medium">
                            Via {lead.acquisition_channel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <div className="text-xs text-text-secondary truncate font-medium">{lead.email || '-'}</div>
                    <div className="text-xs text-text-muted">{lead.phone || '-'}</div>
                  </div>

                  <div className="col-span-3">
                    {lead.scheduled_date ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-primary border border-border-default text-text-primary text-xs font-bold shadow-sm group-hover:border-accent-primary/20 transition-colors">
                        <Calendar size={14} className="text-accent-primary" />
                        {lead.scheduled_date}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic ml-2">Aguardando...</span>
                    )}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => setSelectedChat(lead)}
                      className="text-xs font-bold flex items-center gap-2 bg-bg-tertiary hover:bg-accent-primary hover:text-white text-text-primary transition-all px-4 py-2 rounded-lg border border-border-default hover:border-accent-primary shadow-sm"
                    >
                      <MessageSquare size={14} />
                      Abrir Chat
                    </button>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                {searchTerm || filter !== 'Todos' ? (
                  <Search size={32} className="opacity-20" />
                ) : (
                  <User size={32} className="opacity-20" />
                )}
              </div>
              <h3 className="text-base md:text-lg font-medium text-text-primary mb-1">
                {searchTerm || filter !== 'Todos' ? 'Nenhum lead encontrado' : 'Nenhum lead agendado'}
              </h3>
              <p className="text-xs md:text-sm text-text-muted max-w-xs">
                {searchTerm || filter !== 'Todos'
                  ? `Tente ajustar os filtros.`
                  : 'Aguardando os primeiros agendamentos.'}
              </p>
              {(searchTerm || filter !== 'Todos') && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-accent-primary hover:underline text-sm font-medium flex items-center gap-2"
                >
                  <X size={14} />
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2 px-1 md:px-2">
        <div className="text-[10px] md:text-xs text-text-muted">
          <span className="text-text-primary font-semibold">{loading ? '...' : leads.length}</span>
          <span className="hidden md:inline"> de </span>
          <span className="md:hidden">/</span>
          <span className="text-text-primary font-semibold">{loading ? '...' : totalCount}</span>
          <span className="hidden md:inline"> leads</span>
        </div>

        <div className="flex gap-1 md:gap-2 items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`p-1.5 md:p-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary transition-all shadow-sm ${currentPage === 1 || loading ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover hover:border-accent-primary/30 active:scale-95'}`}
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1 px-2 md:px-4 py-1.5 md:py-2 bg-bg-secondary border border-border-default rounded-lg text-xs md:text-sm font-bold text-text-primary shadow-sm min-w-[60px] md:min-w-[80px] justify-center">
            <span>{currentPage}</span>
            <span className="text-text-muted font-normal">/</span>
            <span className="text-text-muted font-normal">{totalPages || 1}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className={`p-1.5 md:p-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary transition-all shadow-sm ${currentPage === totalPages || totalPages === 0 || loading ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover hover:border-accent-primary/30 active:scale-95'}`}
            title="Proximo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
