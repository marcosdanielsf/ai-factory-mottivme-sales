import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_ALERTS } from '../constants';
import { Bell, AlertTriangle, CheckCircle2, Clock, Filter, Check, MoreVertical, X, Trash2 } from 'lucide-react';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles = {
    critical: 'bg-accent-error/10 text-accent-error border-accent-error/20',
    high: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20',
    low: 'bg-bg-tertiary text-text-muted border-border-default'
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${styles[severity as keyof typeof styles] || styles.low}`}>
      {severity}
    </span>
  );
};

export const Notifications = () => {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'low'>('all');
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
    if (filter === 'all') return alerts;
    return alerts.filter(a => a.severity === filter);
  }, [alerts, filter]);

  const markAllRead = () => {
    if (confirm('Tem certeza que deseja limpar todas as notificações?')) {
      setAlerts([]);
    }
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

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
        
        <div className="flex items-center gap-3">
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Filter size={14} />
              Filtrar: {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {(['all', 'critical', 'high', 'low'] as const).map((f) => (
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

          <button 
            onClick={markAllRead}
            disabled={alerts.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded text-xs font-medium hover:bg-accent-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            Marcar todas como lidas
          </button>
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
                onClick={() => deleteAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-bg-hover rounded text-text-muted hover:text-accent-error"
              >
                <X size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-4 bg-bg-secondary/50 border border-dashed border-border-default rounded-xl">
             <div className="p-4 bg-bg-tertiary rounded-full">
               <CheckCircle2 size={40} className="text-accent-success opacity-50" />
             </div>
             <div className="text-center">
               <p className="font-medium text-text-primary">Tudo limpo por aqui!</p>
               <p className="text-sm">Nenhum alerta pendente no momento.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};