import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { Activity, Clock, Users, BarChart2, Database, Rocket } from 'lucide-react';
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
      <div>
        <h1 className="text-3xl font-semibold mb-2">👋 Bom dia, Marcos</h1>
        <p className="text-text-secondary">Visão geral da operação de agentes.</p>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((metric, i) => (
          <MetricCard 
            key={i}
            {...metric}
            trend={i < 3 ? "+12%" : undefined} // Mock trend
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
