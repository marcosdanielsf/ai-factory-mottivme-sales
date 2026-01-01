import React, { useState, useMemo } from 'react';
import { Search, RotateCw, MessageSquare, Calendar, X, Send, Download, ChevronLeft, ChevronRight, User, AlertCircle, RefreshCw } from 'lucide-react';
import { MOCK_LEADS } from '../constants';
import { Lead } from '../types';
import { useToast } from '../src/hooks/useToast';

export const Leads = () => {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<Lead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 8;

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Lista de leads atualizada', 'info');
    }, 1000);
  };

  const allLeads = useMemo(() => {
    const leads = [...MOCK_LEADS] as Lead[];
    // Gerar leads extras para totalizar 87
    for (let i = 5; i <= 87; i++) {
      const statusOptions: Lead['status'][] = ['scheduled', 'new_lead', 'qualified', 'call_booked'];
      const status = statusOptions[i % statusOptions.length];
      
      leads.push({
        id: i.toString(),
        name: `Lead Cliente ${i}`,
        email: `cliente${i}@mottiv.me`,
        phone: `55119${Math.floor(Math.random() * 90000000 + 10000000)}`,
        scheduled_date: `${(i % 28) + 1}/01 às ${10 + (i % 8)}:00`,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    return leads;
  }, []);

  const filteredLeads = useMemo(() => {
    let filtered = allLeads;
    
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm)
      );
    }

    if (filter === 'Hoje') {
      const todayStr = '01/01'; // Mock de hoje baseado na data do sistema 2026-01-01
      filtered = filtered.filter(l => l.scheduled_date?.startsWith(todayStr));
    } else if (filter === 'Amanhã') {
      const tomorrowStr = '02/01';
      filtered = filtered.filter(l => l.scheduled_date?.startsWith(tomorrowStr));
    } else if (filter === 'Agendados') {
      filtered = filtered.filter(l => l.status === 'scheduled');
    }

    return filtered;
  }, [allLeads, searchTerm, filter]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = useMemo(() => {
    return filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  const handleExport = () => {
    try {
      // Simular exportação CSV
      const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Status', 'Data Agendamento'];
      const rows = filteredLeads.map(l => [l.id, l.name, l.email, l.phone, l.status, l.scheduled_date || '']);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Exportação concluída com sucesso', 'success');
    } catch (error) {
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

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <Calendar size={28} className="text-accent-primary" />
              <h1 className="text-3xl font-semibold">Leads Agendados</h1>
           </div>
          <p className="text-text-secondary">Gerencie os agendamentos realizados pelos agentes.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Total de Leads</span>
             <span className="text-sm font-bold text-text-primary">{allLeads.length}</span>
           </div>
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg border border-border-default transition-all active:scale-95"
           >
              <Download size={16} />
              Exportar
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

      {/* Toolbar */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-50" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por nome, email ou telefone..." 
              value={searchTerm}
              disabled={loading}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-bg-primary border border-border-default rounded-lg pl-10 pr-10 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm disabled:opacity-50"
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

          <div className="flex bg-bg-tertiary/50 rounded-lg border border-border-default p-1 w-full md:w-auto">
             {['Todos', 'Hoje', 'Amanhã', 'Agendados'].map((f) => (
               <button 
                 key={f} 
                 disabled={loading}
                 onClick={() => {
                   setFilter(f);
                   setCurrentPage(1);
                 }}
                 className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                   filter === f ? 'bg-bg-secondary text-accent-primary shadow-sm border border-border-default' : 'text-text-muted hover:text-text-primary'
                 } disabled:opacity-50`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>

        {(searchTerm || filter !== 'Todos') && (
          <div className="flex items-center justify-between text-xs border-t border-border-default pt-4">
            <p className="text-text-muted">
              Encontrados <span className="text-text-primary font-semibold">{filteredLeads.length}</span> leads
            </p>
            <button 
              onClick={clearFilters}
              disabled={loading}
              className="text-accent-primary hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <X size={12} />
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-bg-secondary border-l border-border-default w-full max-w-4xl h-full flex flex-row shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Lead Info Sidebar */}
            <div className="w-80 border-r border-border-default flex flex-col bg-bg-primary hidden md:flex">
              <div className="p-6 text-center border-b border-border-default">
                <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center text-2xl font-bold border border-border-default mx-auto mb-4 text-accent-primary">
                  {selectedChat.name.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-lg text-text-primary">{selectedChat.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  selectedChat.status === 'scheduled' ? 'bg-accent-success/10 text-accent-success border border-accent-success/20' : 
                  'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                }`}>
                  {selectedChat.status}
                </span>
              </div>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Informações de Contato</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted">E-mail</span>
                      <span className="text-sm text-text-primary break-all">{selectedChat.email}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted">Telefone</span>
                      <span className="text-sm text-text-primary">{selectedChat.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border-default">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Agendamento</h4>
                  <div className="bg-bg-secondary border border-border-default rounded-lg p-3">
                    <div className="flex items-center gap-2 text-accent-primary mb-1">
                      <Calendar size={14} />
                      <span className="text-sm font-bold">{selectedChat.scheduled_date || 'Não agendado'}</span>
                    </div>
                    <p className="text-[10px] text-text-muted">Fuso horário: America/Sao_Paulo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-bg-secondary">
              <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-secondary/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 md:hidden">
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-bold border border-border-default">
                    {selectedChat.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{selectedChat.name}</h3>
                    <p className="text-xs text-text-muted">{selectedChat.phone}</p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <span className="text-xs font-medium text-text-muted">Conversa com Lead</span>
                </div>
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div className="flex justify-start">
                    <div className="bg-bg-tertiary border border-border-default rounded-2xl rounded-tl-none p-4 max-w-[80%] text-sm shadow-sm">
                      <p className="text-[10px] font-bold text-accent-primary mb-1 uppercase tracking-wider">AI Agent</p>
                      Olá! Como posso ajudar você hoje? Notei seu interesse no plano Pro.
                    </div>
                 </div>
                 <div className="flex justify-end">
                    <div className="bg-accent-primary text-white rounded-2xl rounded-tr-none p-4 max-w-[80%] text-sm shadow-md shadow-accent-primary/10">
                      Gostaria de agendar uma reunião para falar sobre o plano Pro e como ele se integra ao meu sistema atual.
                    </div>
                 </div>
                 <div className="flex justify-start">
                    <div className="bg-bg-tertiary border border-border-default rounded-2xl rounded-tl-none p-4 max-w-[80%] text-sm shadow-sm">
                      <p className="text-[10px] font-bold text-accent-primary mb-1 uppercase tracking-wider">AI Agent</p>
                      Com certeza! Tenho disponibilidade amanhã às 10h ou 14h para uma demonstração técnica. Qual horário funciona melhor para você?
                    </div>
                 </div>
                 <div className="flex justify-end">
                    <div className="bg-accent-primary text-white rounded-2xl rounded-tr-none p-4 max-w-[80%] text-sm shadow-md shadow-accent-primary/10">
                      Amanhã às 10h seria perfeito.
                    </div>
                 </div>
                 <div className="flex justify-start">
                    <div className="bg-bg-tertiary border border-border-default rounded-2xl rounded-tl-none p-4 max-w-[80%] text-sm shadow-sm">
                      <p className="text-[10px] font-bold text-accent-primary mb-1 uppercase tracking-wider">AI Agent</p>
                      Ótimo! Acabei de agendar sua reunião para amanhã às 10h. Você receberá um link do Google Meet no seu e-mail em instantes.
                    </div>
                 </div>
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
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Modo de intervenção manual ativo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table-like List */}
      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-default bg-bg-tertiary text-[10px] font-bold text-text-muted uppercase tracking-widest">
          <div className="col-span-4">Lead</div>
          <div className="col-span-3">Contato</div>
          <div className="col-span-3">Agendamento</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        
        <div className="divide-y divide-border-default">
          {loading ? (
            [...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-5 animate-pulse">
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
              </div>
            ))
          ) : currentLeads.length > 0 ? (
            currentLeads.map((lead: Lead) => (
              <div key={lead.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-bg-hover transition-all group">
                 <div className="col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-bg-primary border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary group-hover:border-accent-primary/30 transition-colors">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">{lead.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {lead.status === 'scheduled' && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-success/10 text-accent-success border border-accent-success/20 font-bold uppercase tracking-wider">Agendado</span>
                        )}
                        {lead.status === 'new_lead' && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase tracking-wider">Novo</span>
                        )}
                        {lead.status === 'qualified' && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-warning/10 text-accent-warning border border-accent-warning/20 font-bold uppercase tracking-wider">Qualificado</span>
                        )}
                        <span className="text-[9px] text-text-muted font-medium">
                          {lead.status === 'won' ? 'Cliente Ativo' : 'Via Formulário'}
                        </span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="col-span-3 space-y-1">
                    <div className="text-xs text-text-secondary truncate font-medium">{lead.email}</div>
                    <div className="text-xs text-text-muted">{lead.phone}</div>
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
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                {searchTerm || filter !== 'Todos' ? (
                  <Search size={40} className="opacity-20" />
                ) : (
                  <User size={40} className="opacity-20" />
                )}
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-1">
                {searchTerm || filter !== 'Todos' ? 'Nenhum lead encontrado' : 'Nenhum lead agendado'}
              </h3>
              <p className="text-sm text-text-muted max-w-xs">
                {searchTerm || filter !== 'Todos' 
                  ? `Não encontramos resultados para sua busca atual. Tente ajustar os filtros.` 
                  : 'Aguardando os primeiros agendamentos realizados pelos agentes.'}
              </p>
              {(searchTerm || filter !== 'Todos') && (
                <button 
                  onClick={clearFilters}
                  className="mt-6 text-accent-primary hover:underline text-sm font-medium flex items-center gap-2"
                >
                  <X size={16} />
                  Limpar todos os filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-xs text-text-muted">
          Mostrando <span className="text-text-primary font-semibold">{loading ? '...' : currentLeads.length}</span> de <span className="text-text-primary font-semibold">{loading ? '...' : filteredLeads.length}</span> leads
        </div>
        
        <div className="flex gap-2 items-center">
           <button 
             onClick={() => handlePageChange(currentPage - 1)}
             disabled={currentPage === 1 || loading}
             className={`p-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary transition-all shadow-sm ${currentPage === 1 || loading ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover hover:border-accent-primary/30 active:scale-95'}`}
             title="Anterior"
           >
             <ChevronLeft size={18} />
           </button>
           
           <div className="flex items-center gap-1 px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm font-bold text-text-primary shadow-sm min-w-[80px] justify-center">
             <span>{currentPage}</span>
             <span className="text-text-muted font-normal">/</span>
             <span className="text-text-muted font-normal">{totalPages || 1}</span>
           </div>

           <button 
             onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === totalPages || totalPages === 0 || loading}
             className={`p-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary transition-all shadow-sm ${currentPage === totalPages || totalPages === 0 || loading ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover hover:border-accent-primary/30 active:scale-95'}`}
             title="Próximo"
           >
             <ChevronRight size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};