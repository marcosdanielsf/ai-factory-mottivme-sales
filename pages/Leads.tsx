import React from 'react';
import { Search, RotateCw, Filter, MessageSquare, Calendar } from 'lucide-react';
import { MOCK_LEADS } from '../constants';

export const Leads = () => {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Calendar size={20} className="text-text-muted" />
              <h1 className="text-2xl font-bold">Leads Agendados</h1>
           </div>
          <p className="text-text-secondary text-sm">Gerencie os agendamentos realizados pelos agentes.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <span className="text-xs text-text-muted bg-bg-secondary px-2 py-1 rounded border border-border-default">
             87 leads
           </span>
           <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors">
              <RotateCw size={14} />
              Atualizar
           </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2">
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
           <input 
             type="text" 
             placeholder="Filtrar leads..." 
             className="w-full bg-bg-secondary border border-border-default rounded px-3 pl-9 py-1.5 text-sm text-text-primary focus:border-text-muted outline-none transition-colors"
           />
        </div>
        <div className="flex bg-bg-secondary rounded border border-border-default p-0.5">
           {['Todos', 'Hoje', 'Amanhã'].map((f, i) => (
             <button 
               key={f} 
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                 i === 0 ? 'bg-bg-hover text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      {/* Table-like List */}
      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-border-default bg-bg-tertiary text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="col-span-4">Lead</div>
          <div className="col-span-3">Contato</div>
          <div className="col-span-3">Agendamento</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        
        {MOCK_LEADS.map((lead, i) => (
          <div key={lead.id} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-bg-hover transition-colors ${i !== MOCK_LEADS.length -1 ? 'border-b border-border-default' : ''}`}>
             <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-bg-primary border border-border-default flex items-center justify-center text-xs font-medium text-text-secondary">
                  {lead.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{lead.name}</div>
                  <div className="text-xs text-text-muted">Via Formulário</div>
                </div>
             </div>
             
             <div className="col-span-3 space-y-0.5">
                <div className="text-xs text-text-secondary">{lead.email}</div>
                <div className="text-xs text-text-muted">{lead.phone}</div>
             </div>
             
             <div className="col-span-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs">
                   <Calendar size={12} />
                   {lead.scheduled_date}
                </div>
             </div>
             
             <div className="col-span-2 flex justify-end">
                <button className="text-xs flex items-center gap-1 hover:text-text-primary text-text-muted transition-colors px-2 py-1 hover:bg-bg-tertiary rounded">
                   <MessageSquare size={14} />
                   Chat
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};