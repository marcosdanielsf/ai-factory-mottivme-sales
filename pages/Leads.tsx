import React, { useState, useMemo } from 'react';
import { Search, RotateCw, Filter, MessageSquare, Calendar, X, Send } from 'lucide-react';
import { MOCK_LEADS } from '../constants';

export const Leads = () => {
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  const filteredLeads = useMemo(() => {
    let filtered = [...MOCK_LEADS];
    
    // Adicionar leads extras para simular paginação e os "87 leads"
    if (filtered.length < 10) {
      for (let i = 4; i <= 20; i++) {
        filtered.push({
          id: i.toString(),
          name: `Lead Extra ${i}`,
          email: `lead${i}@example.com`,
          phone: `55119${Math.floor(Math.random() * 90000000 + 10000000)}`,
          scheduled_date: `${(i % 30) + 1}/12 às ${10 + (i % 8)}:00`,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm)
      );
    }

    if (filter === 'Hoje') {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const todayStr = `${day}/${month}`;
      filtered = filtered.filter(l => l.scheduled_date.startsWith(todayStr));
    } else if (filter === 'Amanhã') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const tomorrowStr = `${day}/${month}`;
      filtered = filtered.filter(l => l.scheduled_date.startsWith(tomorrowStr));
    }

    return filtered;
  }, [searchTerm, filter]);

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
             {MOCK_LEADS.length} leads
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
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-bg-secondary border border-border-default rounded px-3 pl-9 py-1.5 text-sm text-text-primary focus:border-text-muted outline-none transition-colors"
           />
        </div>
        <div className="flex bg-bg-secondary rounded border border-border-default p-0.5">
           {['Todos', 'Hoje', 'Amanhã'].map((f) => (
             <button 
               key={f} 
               onClick={() => setFilter(f)}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                 filter === f ? 'bg-bg-hover text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      {/* Chat Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-bg-secondary border-l border-border-default w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border-default flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-bold border border-border-default">
                  {selectedChat.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{selectedChat.name}</h3>
                  <p className="text-xs text-text-muted">{selectedChat.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedChat(null)}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               <div className="flex justify-start">
                  <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 max-w-[80%] text-sm">
                    <p className="text-xs font-bold text-accent-primary mb-1">AI Agent</p>
                    Olá! Como posso ajudar você hoje?
                  </div>
               </div>
               <div className="flex justify-end">
                  <div className="bg-accent-primary text-white rounded-lg p-3 max-w-[80%] text-sm">
                    Gostaria de agendar uma reunião para falar sobre o plano Pro.
                  </div>
               </div>
               <div className="flex justify-start">
                  <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 max-w-[80%] text-sm">
                    <p className="text-xs font-bold text-accent-primary mb-1">AI Agent</p>
                    Com certeza! Tenho disponibilidade amanhã às 10h ou 14h. Qual prefere?
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-border-default">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Intervir na conversa..." 
                  className="w-full bg-bg-primary border border-border-default rounded-full px-4 py-2 pr-12 text-sm focus:border-accent-primary outline-none transition-colors"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent-primary text-white rounded-full hover:bg-accent-primary/90 transition-colors">
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center italic">Você está no modo de intervenção manual.</p>
            </div>
          </div>
        </div>
      )}

      {/* Table-like List */}
      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-border-default bg-bg-tertiary text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="col-span-4">Lead</div>
          <div className="col-span-3">Contato</div>
          <div className="col-span-3">Agendamento</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        
        {filteredLeads.map((lead, i) => (
          <div key={lead.id} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-bg-hover transition-colors ${i !== filteredLeads.length -1 ? 'border-b border-border-default' : ''}`}>
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
                <button 
                  onClick={() => setSelectedChat(lead)}
                  className="text-xs flex items-center gap-1 hover:text-text-primary text-text-muted transition-colors px-2 py-1 hover:bg-bg-tertiary rounded"
                >
                   <MessageSquare size={14} />
                   Chat
                </button>
             </div>
          </div>
        ))}
        {filteredLeads.length === 0 && (
          <div className="p-8 text-center text-text-muted text-sm">
            Nenhum lead encontrado para os filtros selecionados.
          </div>
        )}
      </div>
      
      {/* Pagination Mock */}
      <div className="flex items-center justify-between text-xs text-text-muted px-2">
        <span>Mostrando {filteredLeads.length} de 87 leads</span>
        <div className="flex gap-1">
           <button className="px-2 py-1 rounded border border-border-default bg-bg-tertiary opacity-50 cursor-not-allowed">Anterior</button>
           <button className="px-2 py-1 rounded border border-border-default bg-bg-tertiary hover:bg-bg-hover transition-colors">Próxima</button>
        </div>
      </div>
    </div>
  );
};