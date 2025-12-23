import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { DASHBOARD_METRICS, MOCK_ALERTS } from '../constants';
import { Activity, Clock, AlertTriangle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const criticalAlerts = MOCK_ALERTS.filter(a => a.severity === 'critical' || a.severity === 'high');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">🚀 Torre de Controle</h1>
          <p className="text-text-secondary">Visão unificada: Sales OS + AI Factory.</p>
        </div>
        
        <div className="flex gap-2">
           <Link to="/validacao" className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:bg-bg-tertiary rounded text-sm transition-colors">
              <Play size={16} />
              Rodar Testes (V4)
           </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_METRICS.map((metric, i) => (
          <MetricCard 
            key={i}
            {...metric}
            trend={i === 2 ? "+24%" : undefined} 
            trendDirection="up"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Center */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} />
            Alertas Críticos (n8n + Python)
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            {criticalAlerts.length > 0 ? criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4 p-4 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors group">
                <div className={`mt-1 w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-accent-error' : 'bg-accent-warning'}`}></div>
                <div className="flex-1">
                   <div className="flex justify-between">
                     <span className="text-sm font-medium text-text-primary">{alert.title}</span>
                     <span className="text-xs text-text-muted">{alert.timestamp}</span>
                   </div>
                   <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
                   <div className="mt-2 text-xs text-text-muted font-mono uppercase bg-bg-primary inline-block px-1.5 py-0.5 rounded border border-border-default">
                     Fonte: {alert.source}
                   </div>
                </div>
                <button className="px-3 py-1 text-xs border border-border-default rounded hover:bg-bg-primary transition-colors opacity-0 group-hover:opacity-100">
                  Resolver
                </button>
              </div>
            )) : (
              <div className="p-8 text-center text-text-muted">
                <p>Nenhum alerta crítico no momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} />
            Pipeline de Versões
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-4">
             {/* Production */}
             <div className="flex items-center justify-between">
               <div>
                  <div className="text-xs text-text-muted uppercase">Produção</div>
                  <div className="font-bold text-text-primary">v2.1</div>
               </div>
               <div className="h-2 w-24 bg-accent-success/20 rounded-full overflow-hidden">
                 <div className="h-full bg-accent-success w-[98%]"></div>
               </div>
             </div>
             
             {/* Staging */}
             <div className="flex items-center justify-between opacity-75">
               <div>
                  <div className="text-xs text-text-muted uppercase">Staging (Em Validação)</div>
                  <div className="font-bold text-text-primary">v2.2-beta</div>
               </div>
               <div className="h-2 w-24 bg-accent-error/20 rounded-full overflow-hidden">
                 <div className="h-full bg-accent-error w-[65%]"></div>
               </div>
             </div>
             
             {/* Dev */}
             <div className="flex items-center justify-between opacity-50">
               <div>
                  <div className="text-xs text-text-muted uppercase">Dev (Draft)</div>
                  <div className="font-bold text-text-primary">v2.3-alpha</div>
               </div>
               <div className="text-xs text-text-muted">Em edição</div>
             </div>
             
             <hr className="border-border-default" />
             
             <button className="w-full py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors">
               Ver Roadmap Completo
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};