import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { Activity, Clock, Users, BarChart2, Database, Rocket, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardMetrics, useAgents, usePendingApprovals, useTestResults } from '../src/hooks';

export const Dashboard = () => {
  const { metrics } = useDashboardMetrics();
  const { agents } = useAgents();
  const { approvals } = usePendingApprovals();
  const { results: testResults } = useTestResults();

  const dashboardMetrics = [
    {
      title: "Total de Agentes",
      value: metrics.loading ? "..." : metrics.totalAgents,
      subtext: "Agentes ativos",
      icon: Database
    },
    {
      title: "Leads Processados",
      value: metrics.loading ? "..." : metrics.totalLeads,
      subtext: "Últimos 30 dias",
      icon: Users
    },
    {
      title: "Taxa de Conversão",
      value: metrics.loading ? "..." : `${metrics.conversionRate}%`,
      subtext: "Média geral",
      icon: BarChart2
    },
    {
      title: "Campanhas Ativas",
      value: metrics.loading ? "..." : metrics.activeCampaigns,
      subtext: "Em execução",
      icon: Rocket
    }
  ];

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

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((metric, i) => (
          <MetricCard 
            key={i}
            {...metric}
            trend={i === 2 ? "+24%" : undefined} 
            trendDirection="up"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity & Tests */}
        <div className="lg:col-span-2 space-y-8">
          {/* Agentes Recentes */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} />
              Agentes Recentes
            </h2>
            <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
              {agents.slice(0, 3).map((agent, i) => (
                <div key={agent.id} className="flex items-center gap-4 p-4 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors">
                  <span className="text-lg">🤖</span>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary font-medium">{agent.name}</p>
                    <p className="text-xs text-text-muted">{agent.slug}</p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="p-4 text-center text-text-muted">Nenhum agente encontrado</div>
              )}
            </div>
          </div>

          {/* Últimos Testes (Validation) */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} />
              Últimas Validações
            </h2>
            <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
              {testResults.slice(0, 3).map((test, i) => (
                <div key={test.id} className="flex items-center gap-4 p-4 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors">
                  <span className="text-lg">{test.status === 'completed' ? '✅' : '⚠️'}</span>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary font-medium">Run {test.id.slice(0, 8)}</p>
                    <p className="text-xs text-text-muted">
                      Passou: {test.passed_tests} | Falhou: {test.failed_tests}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(test.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {testResults.length === 0 && (
                <div className="p-4 text-center text-text-muted">Nenhuma validação encontrada</div>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} />
            Pipeline de Versões
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-accent-warning/10 border border-accent-warning/20 rounded-md">
              <div className="w-2 h-2 rounded-full bg-accent-warning"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{approvals.length} Aprovações</p>
                <p className="text-xs text-text-muted">Prompts aguardando revisão</p>
              </div>
            </div>
             <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-default rounded-md">
               <div className="w-2 h-2 rounded-full bg-accent-error"></div>
               <span className="text-sm">0 Agentes com erro</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-default rounded-md">
               <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
               <span className="text-sm">0 Calls pendentes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
