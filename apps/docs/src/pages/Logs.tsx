import React, { useState } from 'react';
import { Search, Filter, AlertCircle, MessageSquare, CheckCircle2, Loader2, RefreshCw, Inbox, Calendar as CalendarIcon, Phone, User, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAgentConversations } from '../hooks';
import { useToast } from '../hooks/useToast';
import { useIsMobile } from '../hooks/useMediaQuery';

export const Logs = () => {
  const { showToast } = useToast();
  const { conversations, loading, error, refetch } = useAgentConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const filteredConversations = conversations.filter(log => 
    log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.lead_phone?.includes(searchTerm)
  );

  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar logs</h2>
        <p className="text-text-muted max-w-md mb-6">{error}</p>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-accent-primary" size={isMobile ? 20 : 24} />
            Logs de Conversa
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Monitoramento em tempo real do tráfego do WhatsApp (Via n8n).
          </p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
           <button 
             onClick={() => {
               refetch();
               showToast('Logs atualizados', 'info');
             }}
             disabled={loading}
             className="p-2 text-text-muted hover:text-accent-primary transition-colors bg-bg-secondary border border-border-default rounded-lg"
             title="Atualizar logs"
           >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
           </button>
           <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded border border-border-default transition-colors">
            <Filter size={14} />
            <span className="hidden sm:inline">Filtrar por Score</span>
            <span className="sm:hidden">Filtrar</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
           <input 
             type="text" 
             placeholder={isMobile ? "Buscar..." : "Buscar ID, nome ou telefone..."} 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-bg-secondary border border-border-default rounded px-3 pl-9 py-2 md:py-1.5 text-sm text-text-primary focus:border-accent-primary outline-none transition-all"
           />
        </div>
      </div>

      {/* Content */}
      <div className="border border-border-default rounded-xl bg-bg-secondary overflow-hidden shadow-sm">
        {/* Desktop Header - hidden on mobile */}
        {!isMobile && (
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-default bg-bg-tertiary/50 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <div className="col-span-2">ID Sessão</div>
            <div className="col-span-3">Lead / Contato</div>
            <div className="col-span-4">Última Interação</div>
            <div className="col-span-2">QA Score</div>
            <div className="col-span-1 text-right">Data</div>
          </div>
        )}
        
        {loading && conversations.length === 0 ? (
          <div className={isMobile ? "space-y-3 p-3" : "divide-y divide-border-default"}>
            {[...Array(6)].map((_, i) => (
              isMobile ? (
                <div key={i} className="bg-bg-tertiary/30 rounded-lg p-4 animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-bg-tertiary rounded w-20"></div>
                    <div className="h-4 bg-bg-tertiary rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-bg-tertiary rounded w-32"></div>
                  <div className="h-3 bg-bg-tertiary rounded w-full"></div>
                </div>
              ) : (
                <div key={i} className="grid grid-cols-12 gap-4 p-5 animate-pulse">
                  <div className="col-span-2">
                    <div className="h-4 bg-bg-tertiary rounded w-20"></div>
                  </div>
                  <div className="col-span-3 space-y-2">
                    <div className="h-4 bg-bg-tertiary rounded w-32"></div>
                    <div className="h-3 bg-bg-tertiary rounded w-24"></div>
                  </div>
                  <div className="col-span-4">
                    <div className="h-4 bg-bg-tertiary rounded w-full"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 bg-bg-tertiary rounded-full w-20"></div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <div className="h-4 bg-bg-tertiary rounded w-12"></div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          isMobile ? (
            /* Mobile: Cards */
            <div className="divide-y divide-border-default">
              {filteredConversations.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 hover:bg-bg-tertiary/50 transition-all"
                  onClick={() => toggleExpand(log.id)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-text-primary block truncate">
                        {log.lead_name}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {log.lead_phone}
                      </span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                      log.qa_score && log.qa_score >= 80 ? 'bg-accent-success/10 text-accent-success border-accent-success/20' : 
                      log.qa_score && log.qa_score >= 50 ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/20' :
                      'bg-accent-error/10 text-accent-error border-accent-error/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        log.qa_score && log.qa_score >= 80 ? 'bg-accent-success' : 
                        log.qa_score && log.qa_score >= 50 ? 'bg-accent-warning' :
                        'bg-accent-error'
                      }`} />
                      {log.qa_score}/100
                    </div>
                  </div>

                  {/* Preview Message */}
                  <p className="text-xs text-text-secondary truncate italic mb-2">
                    "{log.last_message}"
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">
                      {log.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {expandedLog === log.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLog === log.id && (
                    <div className="mt-3 pt-3 border-t border-border-default space-y-2 animate-in slide-in-from-top-2">
                      <div className="bg-bg-tertiary/50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Última Mensagem</p>
                        <p className="text-sm text-text-secondary italic">"{log.last_message}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-bg-tertiary/50 rounded p-2">
                          <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5">ID Sessão</p>
                          <p className="text-text-primary font-mono text-[10px] break-all">{log.id}</p>
                        </div>
                        <div className="bg-bg-tertiary/50 rounded p-2">
                          <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5">QA Score</p>
                          <p className="text-text-primary font-bold">{log.qa_score}/100</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: Table */
            <div className="divide-y divide-border-default">
              {filteredConversations.map((log) => (
                <div key={log.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-bg-tertiary transition-all cursor-pointer group">
                   <div className="col-span-2">
                      <span className="font-mono text-[10px] text-text-muted bg-bg-tertiary px-2 py-1 rounded border border-border-default group-hover:border-accent-primary/30 transition-colors">
                        {log.id.slice(0, 8)}
                      </span>
                   </div>
                   
                   <div className="col-span-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">{log.lead_name}</span>
                        <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <Phone size={10} />
                          {log.lead_phone}
                        </span>
                      </div>
                   </div>
                   
                   <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-bg-tertiary border border-border-default text-text-muted group-hover:text-accent-primary transition-colors">
                          <MessageSquare size={12} />
                        </div>
                        <p className="text-sm text-text-secondary truncate italic">
                          "{log.last_message}"
                        </p>
                      </div>
                   </div>
                   
                   <div className="col-span-2">
                     <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                       log.qa_score && log.qa_score >= 80 ? 'bg-accent-success/10 text-accent-success border-accent-success/20' : 
                       log.qa_score && log.qa_score >= 50 ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/20' :
                       'bg-accent-error/10 text-accent-error border-accent-error/20'
                     }`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${
                         log.qa_score && log.qa_score >= 80 ? 'bg-accent-success' : 
                         log.qa_score && log.qa_score >= 50 ? 'bg-accent-warning' :
                         'bg-accent-error'
                       }`} />
                       {log.qa_score}/100
                     </div>
                   </div>
                   
                   <div className="col-span-1 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-text-primary">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center">
            <div className="w-14 md:w-16 h-14 md:h-16 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
              <Inbox size={isMobile ? 28 : 32} />
            </div>
            <h3 className="text-base md:text-lg font-bold text-text-primary">Nenhuma conversa encontrada</h3>
            <p className="text-text-muted text-xs md:text-sm max-w-xs mt-1">
              {searchTerm ? `Nenhum resultado para "${searchTerm}". Tente outra busca.` : 'As conversas do WhatsApp aparecerão aqui em tempo real.'}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-sm text-accent-primary hover:underline font-medium"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
