import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { DASHBOARD_METRICS } from '../constants';
import { Activity, Clock } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">👋 Bom dia, Marcos</h1>
        <p className="text-text-secondary">Visão geral da operação de agentes.</p>
      </div>

      {/* Detailed Metrics Grid from Nina integration, adapted style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_METRICS.map((metric, i) => (
          <MetricCard 
            key={i}
            {...metric}
            trend={i < 3 ? "+12%" : undefined} // Mock trend
            trendDirection="up"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} />
            Atividade Recente
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            {[
              { text: "Clínica Sorriso - Agente v2.1 ativado", time: "2h atrás", icon: "🚀" },
              { text: "Escritório ABC - Nova call de kickoff processada", time: "4h atrás", icon: "📹" },
              { text: "Dr. João - Prompt atualizado (v2.2 pending)", time: "6h atrás", icon: "✏️" },
              { text: "Consultoria XYZ - Cliente criado", time: "1d atrás", icon: "👤" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-text-primary flex-1">{item.text}</span>
                <span className="text-xs text-text-muted">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} />
            Pendências
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-accent-warning/10 border border-accent-warning/20 rounded-md">
              <div className="w-2 h-2 rounded-full bg-accent-warning"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">3 Aprovações</p>
                <p className="text-xs text-text-muted">Prompts aguardando revisão</p>
              </div>
            </div>
             <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-default rounded-md">
               <div className="w-2 h-2 rounded-full bg-accent-error"></div>
               <span className="text-sm">1 Agente com erro de API</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-default rounded-md">
               <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
               <span className="text-sm">2 Calls pendentes de análise</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};