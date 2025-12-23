import React from 'react';
import { Search, Filter, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';

const MOCK_LOGS = [
  { id: 'conv_1293', contact: '5511988...', score: 92, last_msg: 'Cliente confirmou interesse na demo', time: '2 min atrás', status: 'success' },
  { id: 'conv_1294', contact: '5511977...', score: 45, last_msg: 'Agente não soube responder sobre preço', time: '15 min atrás', status: 'warning' },
  { id: 'conv_1295', contact: '5521999...', score: 88, last_msg: 'Agendamento realizado com sucesso', time: '1h atrás', status: 'success' },
];

export const Logs = () => {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border-default pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-text-muted" size={24} />
            Logs de Conversa
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Monitoramento em tempo real do tráfego do WhatsApp (Via n8n).
          </p>
        </div>
        
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors border border-transparent hover:border-border-default">
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
             placeholder="Buscar ID ou telefone..." 
             className="w-full bg-bg-secondary border border-border-default rounded px-3 pl-9 py-1.5 text-sm text-text-primary focus:border-text-muted outline-none transition-colors"
           />
        </div>
      </div>

      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-border-default bg-bg-tertiary text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="col-span-2">ID</div>
          <div className="col-span-3">Contato</div>
          <div className="col-span-4">Última Mensagem (Resumo)</div>
          <div className="col-span-2">QA Score</div>
          <div className="col-span-1 text-right">Tempo</div>
        </div>
        
        {MOCK_LOGS.map((log, i) => (
          <div key={log.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-bg-tertiary transition-colors border-b border-border-default last:border-0 cursor-pointer">
             <div className="col-span-2 font-mono text-xs text-text-secondary">
               {log.id}
             </div>
             
             <div className="col-span-3 text-sm text-text-primary">
               {log.contact}
             </div>
             
             <div className="col-span-4 text-sm text-text-muted truncate">
               {log.last_msg}
             </div>
             
             <div className="col-span-2">
               <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                 log.status === 'success' ? 'bg-accent-success/10 text-accent-success border-accent-success/20' : 
                 'bg-accent-warning/10 text-accent-warning border-accent-warning/20'
               }`}>
                 {log.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                 {log.score}/100
               </div>
             </div>
             
             <div className="col-span-1 text-right text-xs text-text-muted">
                {log.time}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};