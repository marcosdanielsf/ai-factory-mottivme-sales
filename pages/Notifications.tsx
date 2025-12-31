import React from 'react';
import { MOCK_ALERTS } from '../constants';
import { AlertTriangle, CheckCircle, Bell, Filter, MoreHorizontal } from 'lucide-react';

const SeverityBadge = ({ severity }: { severity: string }) => {
  let styles = '';
  switch (severity) {
    case 'critical':
      styles = 'bg-accent-error/10 text-accent-error border-accent-error/20';
      break;
    case 'high':
      styles = 'bg-accent-warning/10 text-accent-warning border-accent-warning/20';
      break;
    case 'medium':
      styles = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      break;
    default:
      styles = 'bg-bg-tertiary text-text-muted border-border-default';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles} uppercase tracking-wider`}>
      {severity}
    </span>
  );
};

export const Notifications = () => {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border-default pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="text-text-muted" size={24} />
            Notificações
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Monitoramento em tempo real de situações que precisam de atenção.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors border border-transparent hover:border-border-default">
            <Filter size={14} />
            Filtrar
          </button>
           <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors border border-transparent hover:border-border-default">
            <CheckCircle size={14} />
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Alerts List */}
        {MOCK_ALERTS.map(alert => (
          <div key={alert.id} className="group bg-bg-secondary border border-border-default rounded-lg p-4 hover:bg-bg-tertiary transition-colors flex items-start gap-4">
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

            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
              <button className="p-2 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Empty State Mock */}
        {MOCK_ALERTS.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p>Tudo limpo! Nenhuma notificação pendente.</p>
          </div>
        )}
      </div>
    </div>
  );
};