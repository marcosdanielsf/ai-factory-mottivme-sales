import React, { useMemo, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Activity, Clock, Users, BarChart2, Database, Rocket, Play, Shield, Zap, Target, Heart, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardMetrics, useAgents, usePendingApprovals, useTestResults, useAgentPerformance } from '../src/hooks';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const Dashboard = () => {
  const { metrics } = useDashboardMetrics();
  const { agents } = useAgents();
  const { approvals } = usePendingApprovals();
  const { results: testResults } = useTestResults();
  const { performance } = useAgentPerformance();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showTestSuccess, setShowTestSuccess] = useState(false);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      setIsRunningTests(false);
      setShowTestSuccess(true);
      setTimeout(() => setShowTestSuccess(false), 4000);
    }, 2000);
  };

  // Formatar dados para o gráfico de evolução
  const chartData = useMemo(() => {
    return [...testResults].reverse().map(run => ({
      date: new Date(run.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: run.score_overall || 0,
      tone: run.score_dimensions?.tone || 0,
      engagement: run.score_dimensions?.engagement || 0,
      compliance: run.score_dimensions?.compliance || 0,
      accuracy: run.score_dimensions?.accuracy || 0,
    }));
  }, [testResults]);

  // Dados para o Radar Chart de dimensões (último teste)
  const radarData = useMemo(() => {
    const lastRun = testResults[0];
    if (!lastRun) return [];
    
    // Usar scores reais do novo sistema 0-10
    if (lastRun.score_dimensions) {
      return [
        { subject: 'Tom de Voz', A: lastRun.score_dimensions.tone || 0, fullMark: 10 },
        { subject: 'Engajamento', A: lastRun.score_dimensions.engagement || 0, fullMark: 10 },
        { subject: 'Script', A: lastRun.score_dimensions.compliance || 0, fullMark: 10 },
        { subject: 'Precisão', A: lastRun.score_dimensions.accuracy || 0, fullMark: 10 },
        { subject: 'Empatia', A: lastRun.score_dimensions.empathy || 0, fullMark: 10 },
        { subject: 'Eficiência', A: lastRun.score_dimensions.efficiency || 0, fullMark: 10 },
      ];
    }

    // Fallback para campos antigos
    return [
      { subject: 'Completude', A: lastRun.completeness_score || 0, fullMark: 10 },
      { subject: 'Tom de Voz', A: lastRun.tone_score || 0, fullMark: 10 },
      { subject: 'Engajamento', A: lastRun.engagement_score || 0, fullMark: 10 },
      { subject: 'Conversão', A: lastRun.conversion_score || 0, fullMark: 10 },
    ];
  }, [testResults]);

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
        
        <div className="flex items-center gap-3">
           {showTestSuccess && (
             <div className="flex items-center gap-2 text-accent-success text-sm animate-in fade-in slide-in-from-right-4 bg-bg-secondary border border-accent-success/20 px-3 py-1.5 rounded-md">
               <CheckCircle size={16} />
               Bateria V4 iniciada!
             </div>
           )}
           <button 
              onClick={handleRunTests}
              disabled={isRunningTests}
              className={`flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:bg-bg-tertiary rounded text-sm transition-colors ${isRunningTests ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Play size={16} className={isRunningTests ? 'animate-pulse' : ''} />
              {isRunningTests ? 'Rodando...' : 'Rodar Testes (V4)'}
           </button>
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

      {/* Performance Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Evolution Chart */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} />
            Evolução do Score (Média V4)
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-bg-secondary)', 
                      borderColor: 'var(--color-border-default)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--color-accent-primary)" 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    strokeWidth={2}
                    name="Score Médio"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Aguardando dados de validação...
              </div>
            )}
          </div>
        </div>

        {/* Conversion by Agent Chart */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} />
            Conversão por Agente (%)
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 h-[300px]">
            {performance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border-default)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--color-bg-tertiary)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-bg-secondary)', 
                      borderColor: 'var(--color-border-default)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Taxa de Conversão']}
                  />
                  <Bar dataKey="conversion_rate_pct" radius={[0, 4, 4, 0]}>
                    {performance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-accent-primary)' : 'var(--color-accent-success)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Sem dados de performance disponíveis.
              </div>
            )}
          </div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Target size={16} />
                Radar de Dimensões (V4)
              </h2>
              <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col items-center">
                {radarData.length > 0 ? (
                  <>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="var(--color-border-default)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                          <Radar
                            name="Score"
                            dataKey="A"
                            stroke="var(--color-accent-primary)"
                            fill="var(--color-accent-primary)"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                      {[
                        { label: 'Tom de Voz', score: testResults[0]?.score_dimensions?.tone || testResults[0]?.tone_score || 0, color: 'bg-accent-primary' },
                        { label: 'Engajamento', score: testResults[0]?.score_dimensions?.engagement || testResults[0]?.engagement_score || 0, color: 'bg-accent-success' },
                        { label: 'Script', score: testResults[0]?.score_dimensions?.compliance || testResults[0]?.completeness_score || 0, color: 'bg-accent-warning' },
                        { label: 'Precisão', score: testResults[0]?.score_dimensions?.accuracy || testResults[0]?.conversion_score || 0, color: 'bg-accent-error' },
                      ].map((dim, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-text-secondary">{dim.label}</span>
                          <span className="font-bold text-text-primary">{dim.score.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-text-muted text-xs">
                    Sem dados para o radar
                  </div>
                )}
              </div>
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
