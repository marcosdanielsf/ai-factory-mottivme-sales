import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Filter, Check, MoreVertical, X, Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useSystemAlerts } from '../hooks/useSystemAlerts';
import { useToast } from '../hooks/useToast';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles = {
    critical: 'bg-accent-error/10 text-accent-error border-accent-error/20',
    high: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20',
    medium: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
    low: 'bg-bg-tertiary text-text-muted border-border-default'
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${styles[severity as keyof typeof styles] || styles.low}`}>
      {severity}
    </span>
  );
};

export const Notifications = () => {
  const { showToast } = useToast();
  const { alerts, loading, error, refetch, markAllAsRead, deleteAlert } = useSystemAlerts();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    
    if (filter !== 'all') {
      result = result.filter(a => a.severity === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.message.toLowerCase().includes(term) ||
        a.client_name?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [alerts, filter, searchTerm]);

  const handleMarkAllRead = () => {
    if (confirm('Tem certeza que deseja limpar todas as notificações?')) {
      markAllAsRead();
      showToast('Todas as notificações foram limpas', 'info');
    }
  };

  const handleDeleteAlert = (id: string) => {
    deleteAlert(id);
    showToast('Notificação removida', 'info');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary animate-pulse">Carregando alertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar alertas</h2>
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
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bell size={24} className="text-accent-primary" />
            Alertas & Monitoramento
          </h1>
          <p className="text-text-secondary text-sm mt-1">Incidentes críticos e status do sistema em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text"
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <button 
            onClick={() => {
              refetch();
              showToast('Alertas atualizados', 'info');
            }}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
            title="Atualizar alertas"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary transition-colors h-[38px]"
            >
              <Filter size={14} />
              Filtrar: {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      filter === f ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    } capitalize`}
                  >
                    {f === 'all' ? 'Todos' : f}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                showToast('Atualizando notificações...', 'info');
                refetch().then(() => showToast('Notificações atualizadas', 'success'));
              }}
              disabled={loading}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
              title="Atualizar notificações"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleMarkAllRead}
              disabled={alerts.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:bg-bg-tertiary text-text-primary rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Check size={16} />
              Marcar todas como lidas
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className="group bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-tertiary transition-colors flex items-start gap-4 relative">
              <div className={`mt-1 p-2 rounded-full ${
                alert.severity === 'critical' ? 'bg-accent-error/10 text-accent-error' :
                alert.severity === 'high' ? 'bg-accent-warning/10 text-accent-warning' :
                alert.severity === 'medium' ? 'bg-accent-primary/10 text-accent-primary' :
                'bg-bg-hover text-text-muted'
              }`}>
                <AlertTriangle size={18} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-text-primary">{alert.title}</h3>
                  <span className="text-xs text-text-muted">{alert.timestamp}</span>
                </div>
                
                <p className="text-sm text-text-secondary mb-2">{alert.message}</p>
                
                <div className="flex items-center gap-3">
                   <SeverityBadge severity={alert.severity} />
                   {alert.client_name && (
                     <span className="text-xs text-text-muted flex items-center gap-1">
                       👤 {alert.client_name}
                     </span>
                   )}
                </div>
              </div>

              <button 
                onClick={() => handleDeleteAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-bg-hover rounded text-text-muted hover:text-accent-error"
              >
                <X size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-4 bg-bg-secondary/50 border border-dashed border-border-default rounded-xl">
             <div className="p-4 bg-bg-tertiary rounded-full">
               {searchTerm ? <Search size={40} className="opacity-20" /> : <CheckCircle2 size={40} className="text-accent-success opacity-50" />}
             </div>
             <div className="text-center">
               <p className="font-medium text-text-primary">
                 {searchTerm ? 'Nenhum alerta encontrado' : 'Tudo limpo por aqui!'}
               </p>
               <p className="text-sm">
                 {searchTerm ? `Não encontramos alertas para "${searchTerm}"` : 'Nenhum alerta pendente no momento.'}
               </p>
               {searchTerm && (
                 <button 
                   onClick={() => setSearchTerm('')}
                   className="mt-4 text-xs text-accent-primary hover:underline"
                 >
                   Limpar busca
                 </button>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
