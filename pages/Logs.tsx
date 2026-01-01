import React, { useState } from 'react';
import { Search, Filter, AlertCircle, MessageSquare, CheckCircle2, Loader2, RefreshCw, Inbox, Calendar as CalendarIcon, Phone, User, ExternalLink } from 'lucide-react';
import { useAgentConversations } from '../src/hooks';
import { useToast } from '../src/hooks/useToast';

export const Logs = () => {
  const { showToast } = useToast();
  const { conversations, loading, error, refetch } = useAgentConversations();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(log => 
    log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.lead_phone?.includes(searchTerm)
  );

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
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
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-accent-primary" size={24} />
            Logs de Conversa
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Monitoramento em tempo real do tráfego do WhatsApp (Via n8n).
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
            Filtrar por Score
          </button>
        </div>
      </div>

      <div className="flex gap-2">
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
           <input 
             type="text" 
             placeholder="Buscar ID, nome ou telefone..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-bg-secondary border border-border-default rounded px-3 pl-9 py-1.5 text-sm text-text-primary focus:border-accent-primary outline-none transition-all"
           />
        </div>
      </div>

      <div className="border border-border-default rounded-xl bg-bg-secondary overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-default bg-bg-tertiary/50 text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div className="col-span-2">ID Sessão</div>
          <div className="col-span-3">Lead / Contato</div>
          <div className="col-span-4">Última Interação</div>
          <div className="col-span-2">QA Score</div>
          <div className="col-span-1 text-right">Data</div>
        </div>
        
        {loading && conversations.length === 0 ? (
          <div className="divide-y divide-border-default">
            {[...Array(6)].map((_, i) => (
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
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Nenhuma conversa encontrada</h3>
            <p className="text-text-muted text-sm max-w-xs mt-1">
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