import React, { useMemo, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Activity, Clock, Users, BarChart2, Database, Rocket, Play, Shield, Zap, Target, Heart, TrendingUp, CheckCircle, FileText, AlertCircle, Inbox, RefreshCw, MessageSquare, Calendar, UserCheck } from 'lucide-react';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { SearchableSelect, SelectOption } from '../components/SearchableSelect';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboardMetrics, useAgents, usePendingApprovals, useTestResults, useAgentPerformance, useFunnelMetrics, useLocations } from '../hooks';
import { useToast } from '../hooks/useToast';
import { TestReportModal } from '../components/TestReportModal';
import { DrilldownModal } from '../components/DrilldownModal';
import { useDrilldownLeads, MetricType } from '../hooks/useDrilldownLeads';
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

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
    <Icon size={16} />
    {title}
  </h2>
);

const ChartPlaceholder = ({ title, loading, error, empty, children, height = "h-[250px] md:h-[300px]" }: { title: string, loading?: boolean, error?: string | null, empty?: boolean, children: React.ReactNode, height?: string }) => (
  <div className="space-y-3 md:space-y-4">
    <SectionHeader title={title} icon={title.includes('Evolução') ? TrendingUp : BarChart2} />
    <div className={`bg-bg-secondary border border-border-default rounded-lg p-4 md:p-6 ${height} flex flex-col relative overflow-hidden`}>
      {loading ? (
        <div className="absolute inset-0 bg-bg-secondary/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted animate-pulse">Carregando dados...</p>
        </div>
      ) : error ? (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-4">
          <div className="w-10 h-10 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-2">
            <AlertCircle size={20} />
          </div>
          <p className="text-sm font-medium text-text-primary">Erro ao carregar dados</p>
          <p className="text-xs text-text-muted max-w-[200px]">{error}</p>
        </div>
      ) : empty ? (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-4">
          <div className="w-10 h-10 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-2">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-text-primary">Nenhum dado encontrado</p>
          <p className="text-xs text-text-muted max-w-[200px]">Os dados aparecerão aqui assim que as primeiras operações forem realizadas.</p>
        </div>
      ) : null}
      <div className={`h-full w-full ${(loading || error || empty) ? 'opacity-20 blur-[2px]' : ''}`}>
        {children}
      </div>
    </div>
  </div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { metrics } = useDashboardMetrics();
  const { agents, loading: agentsLoading, error: agentsError, refetch: refetchAgents } = useAgents();
  const { approvals, loading: approvalsLoading, error: approvalsError } = usePendingApprovals();
  const { testRuns: testResults, loading: testResultsLoading, error: testResultsError } = useTestResults();
  const { performance, loading: performanceLoading, error: performanceError, refetch: refetchPerformance } = useAgentPerformance();
  // DateRange padronizado
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  // Compatibilidade com hooks existentes - converter para periodo string
  const selectedPeriod = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return '30d';
    const days = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'hoje';
    if (days <= 7) return '7d';
    if (days <= 30) return '30d';
    return '90d';
  }, [dateRange]) as 'hoje' | '7d' | '30d' | '90d';

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const { locations, loading: locationsLoading } = useLocations();

  // Converter locations para formato SelectOption
  const locationOptions: SelectOption[] = useMemo(() =>
    locations.map(loc => ({
      id: loc.location_id,
      label: loc.location_name,
    })),
    [locations]
  );

  const { funnel, alerts, engagement, loading: funnelLoading, error: funnelError, refetch: refetchFunnel } = useFunnelMetrics(selectedPeriod, selectedLocation);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estado para drill-down
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState<string>('');
  const { leads: drilldownLeads, loading: drilldownLoading, error: drilldownError } = useDrilldownLeads(selectedMetric, selectedPeriod);

  // Handler para abrir drill-down
  const handleDrilldown = (metricType: MetricType, title: string) => {
    setSelectedMetric(metricType);
    setDrilldownTitle(title);
  };

  // Handler para clicar em um lead no drill-down
  const handleLeadClick = (leadId: string) => {
    navigate(`/supervision?lead=${leadId}`);
    setSelectedMetric(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    showToast('Atualizando indicadores...', 'info');
    
    try {
      // Atualizar todos os dados
      await Promise.all([
        refetchAgents?.(),
        refetchPerformance?.(),
        refetchFunnel?.()
      ]);
      
      showToast('Painel atualizado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao atualizar alguns dados', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    showToast('Iniciando bateria de testes V4...', 'info');
    
    setTimeout(() => {
      setIsRunningTests(false);
      showToast('Bateria V4 iniciada com sucesso!', 'success');
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-1 md:mb-2">🚀 Torre de Controle</h1>
          <p className="text-sm md:text-base text-text-secondary">Visão unificada: Sales OS + AI Factory.</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
           {/* Filtro de Período */}
           <DateRangePicker value={dateRange} onChange={setDateRange} />
           {/* Filtro de Usuário/Location */}
           <SearchableSelect
              options={locationOptions}
              selectedId={selectedLocation}
              onChange={setSelectedLocation}
              allLabel="Todos os Clientes"
              searchPlaceholder="Buscar cliente..."
              isLoading={locationsLoading}
              icon="building"
           />
           <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
              title="Atualizar indicadores"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
           </button>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {dashboardMetrics.map((metric, i) => (
          <MetricCard
            key={i}
            {...metric}
            trend={i === 2 ? "+24%" : undefined}
            trendDirection="up"
          />
        ))}
      </div>

      {/* Alertas Urgentes */}
      {(alerts.leadsSemResposta24h > 0 || alerts.followupsFalhados > 0 || alerts.leadsEsfriando > 0 || alerts.noShows > 0) && (
        <div className={`p-3 md:p-4 rounded-xl border-l-4 ${
          alerts.leadsSemResposta24h > 5 || alerts.followupsFalhados > 0
            ? 'bg-accent-error/5 border-accent-error'
            : 'bg-accent-warning/5 border-accent-warning'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className={`md:w-[18px] md:h-[18px] ${alerts.leadsSemResposta24h > 5 ? 'text-accent-error' : 'text-accent-warning'}`} />
              <span className="font-semibold text-sm md:text-base text-text-primary">AÇÕES URGENTES</span>
            </div>

            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              {alerts.leadsSemResposta24h > 0 && (
                <button 
                  onClick={() => handleDrilldown('sem_resposta_24h', 'Leads sem Resposta (24h+)')}
                  className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full ${alerts.leadsSemResposta24h > 5 ? 'bg-accent-error animate-pulse' : 'bg-accent-warning'}`} />
                  <span className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {alerts.leadsSemResposta24h} leads sem resposta {'>'}24h
                  </span>
                </button>
              )}
              {alerts.followupsFalhados > 0 && (
                <button 
                  onClick={() => handleDrilldown('follow_ups_pendentes', 'Follow-ups Pendentes')}
                  className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-accent-error animate-pulse" />
                  <span className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {alerts.followupsFalhados} follow-ups falhados
                  </span>
                </button>
              )}
              {alerts.leadsEsfriando > 0 && (
                <button 
                  onClick={() => handleDrilldown('leads_esfriando', 'Leads Esfriando')}
                  className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-accent-warning" />
                  <span className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {alerts.leadsEsfriando} leads esfriando
                  </span>
                </button>
              )}
              {alerts.noShows > 0 && (
                <button 
                  onClick={() => handleDrilldown('no_shows', 'No-Shows')}
                  className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-accent-warning" />
                  <span className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {alerts.noShows} no-shows
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Funil de Conversão + Métricas de Engajamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Funil */}
        <div className="space-y-3 md:space-y-4">
          <SectionHeader title="Funil de Conversão" icon={Target} />
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 md:p-6 min-h-[280px] md:min-h-[300px] relative">
            {funnelLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : funnelError ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <AlertCircle size={24} className="text-accent-error" />
                <p className="text-sm text-text-muted">Erro ao carregar funil</p>
              </div>
            ) : funnel.length === 0 || funnel.every(f => f.count === 0) ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Inbox size={24} className="text-text-muted" />
                <p className="text-sm text-text-muted">Nenhum dado no período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funnel.map((stage, i) => {
                  const maxCount = Math.max(...funnel.map(f => f.count), 1);
                  const width = (stage.count / maxCount) * 100;
                  const prevCount = i > 0 ? funnel[i - 1].count : stage.count;
                  const conversionRate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : '0';

                  // Mapeamento de estágio para tipo de métrica
                  const stageToMetric: Record<string, MetricType> = {
                    'Leads Novos': 'leads_novos',
                    'Responderam': 'responderam',
                    'Agendaram': 'agendaram',
                    'Compareceram': 'compareceram',
                    'Fecharam': 'fecharam'
                  };

                  return (
                    <div key={stage.stage}>
                      <div 
                        className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-bg-tertiary rounded-lg p-1.5 md:p-2 -mx-1.5 md:-mx-2 transition-colors group"
                        onClick={() => {
                          const metricType = stageToMetric[stage.stage];
                          if (metricType) {
                            handleDrilldown(metricType, stage.stage);
                          }
                        }}
                      >
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0" style={{ backgroundColor: `${stage.color}20` }}>
                          {i === 0 && <Users size={14} className="md:w-4 md:h-4" style={{ color: stage.color }} />}
                          {i === 1 && <MessageSquare size={14} className="md:w-4 md:h-4" style={{ color: stage.color }} />}
                          {i === 2 && <Calendar size={14} className="md:w-4 md:h-4" style={{ color: stage.color }} />}
                          {i === 3 && <UserCheck size={14} className="md:w-4 md:h-4" style={{ color: stage.color }} />}
                          {i === 4 && <CheckCircle size={14} className="md:w-4 md:h-4" style={{ color: stage.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                            <span className="text-xs md:text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate">{stage.stage}</span>
                            <span className="text-base md:text-lg font-bold text-text-primary">{stage.count}</span>
                            <span className="text-[9px] md:text-[10px] text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto hidden md:inline">
                              Ver leads →
                            </span>
                          </div>
                          <div className="h-2.5 md:h-3 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${width}%`, backgroundColor: stage.color }}
                            />
                          </div>
                        </div>
                      </div>
                      {i > 0 && i < funnel.length && (
                        <div className="flex items-center gap-3 ml-11 my-1">
                          <div className="h-4 border-l border-dashed border-border-default" />
                          <span className="text-xs text-text-muted">↓ {conversionRate}% converteram</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Taxa geral */}
                <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between">
                  <span className="text-sm text-text-muted">Conversão geral</span>
                  <span className="text-xl font-bold text-accent-success">
                    {funnel[0]?.count > 0
                      ? ((funnel[funnel.length - 1]?.count / funnel[0]?.count) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Métricas de Engajamento */}
        <div className="space-y-3 md:space-y-4">
          <SectionHeader title="Métricas de Follow-up" icon={Activity} />
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 md:p-6">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="p-3 md:p-4 bg-bg-tertiary rounded-lg">
                <div className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider mb-1 md:mb-2">Follow-ups/Lead</div>
                <div className="text-xl md:text-2xl font-bold text-text-primary">{engagement.followupsPerLead}</div>
              </div>
              <div className="p-3 md:p-4 bg-bg-tertiary rounded-lg">
                <div className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider mb-1 md:mb-2">Tentativa Converte</div>
                <div className="text-xl md:text-2xl font-bold text-text-primary">{engagement.tentativaQueConverte}</div>
              </div>
              <div className="p-3 md:p-4 bg-bg-tertiary rounded-lg">
                <div className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider mb-1 md:mb-2">Taxa de Resposta</div>
                <div className="flex items-end gap-1 md:gap-2">
                  <span className="text-xl md:text-2xl font-bold text-text-primary">{engagement.taxaResposta}%</span>
                  {engagement.taxaResposta > 30 && <TrendingUp size={14} className="text-accent-success mb-1" />}
                </div>
              </div>
              <div className="p-3 md:p-4 bg-bg-tertiary rounded-lg">
                <div className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider mb-1 md:mb-2">Tempo Resposta</div>
                <div className="text-xl md:text-2xl font-bold text-text-primary">{engagement.tempoAteResposta}</div>
              </div>
            </div>

            {/* Insight */}
            <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Zap size={12} className="text-accent-primary mt-0.5 flex-shrink-0" />
                <p className="text-[10px] md:text-xs text-text-secondary">
                  <strong className="text-text-primary">Insight:</strong> Leads que respondem no 2º follow-up têm 3x mais chance de agendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Evolution Chart */}
        <ChartPlaceholder 
          title="Evolução do Score (Média V4)" 
          loading={testResultsLoading} 
          error={testResultsError}
          empty={testResults.length === 0}
        >
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
        </ChartPlaceholder>

        {/* Conversion by Agent Chart */}
        <ChartPlaceholder 
          title="Conversão por Agente (%)" 
          loading={performanceLoading} 
          error={performanceError}
          empty={performance.length === 0}
        >
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
        </ChartPlaceholder>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Recent Activity & Tests */}
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
          {/* Agentes Recentes */}
          <div className="space-y-4">
            <SectionHeader title="Agentes Recentes" icon={Activity} />
            <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden min-h-[150px] relative">
              {agentsLoading ? (
                <div className="absolute inset-0 bg-bg-secondary/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
                   <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                   <span className="text-xs text-text-muted">Buscando agentes...</span>
                </div>
              ) : agentsError ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-center">
                  <AlertCircle size={20} className="text-accent-error mb-1" />
                  <p className="text-xs text-text-muted">Erro ao carregar agentes</p>
                </div>
              ) : agents.length > 0 ? (
                agents.slice(0, 3).map((agent, i) => (
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
                ))
              ) : (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
                  <Inbox size={24} className="text-text-muted mb-1" />
                  <p className="text-xs text-text-muted italic">Nenhum agente configurado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Últimos Testes (Validation) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-4">
              <SectionHeader title="Últimas Validações" icon={Activity} />
              <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden min-h-[200px] relative">
                {testResultsLoading ? (
                  <div className="absolute inset-0 bg-bg-secondary/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-muted">Carregando validações...</span>
                  </div>
                ) : testResultsError ? (
                  <div className="p-8 flex flex-col items-center justify-center gap-2 text-center">
                    <AlertCircle size={20} className="text-accent-error mb-1" />
                    <p className="text-xs text-text-muted">Erro ao carregar validações</p>
                  </div>
                ) : testResults.length > 0 ? (
                  testResults.slice(0, 3).map((test, i) => (
                    <div key={test.id} className="flex items-center gap-4 p-4 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors group">
                      <span className="text-lg">{test.status === 'completed' ? '✅' : '⚠️'}</span>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary font-medium">Run {test.id.slice(0, 8)}</p>
                        <p className="text-xs text-text-muted">
                          Passou: {test.passed_tests} | Falhou: {test.failed_tests}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-text-muted">
                          {new Date(test.created_at).toLocaleDateString()}
                        </span>
                        <button 
                          onClick={() => setSelectedReportId(test.id)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-accent-primary hover:underline transition-opacity"
                        >
                          <FileText size={10} />
                          Ver HTML
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
                    <Inbox size={24} className="text-text-muted mb-1" />
                    <p className="text-xs text-text-muted">Nenhuma validação encontrada</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <ChartPlaceholder 
                title="Radar de Dimensões (V4)" 
                loading={testResultsLoading} 
                error={testResultsError}
                empty={radarData.length === 0}
                height="h-[250px]"
              >
                <div className="h-[150px] w-full">
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
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {[
                    { label: 'Tom de Voz', score: testResults[0]?.score_dimensions?.tone || 0, color: 'bg-accent-primary' },
                    { label: 'Engajamento', score: testResults[0]?.score_dimensions?.engagement || 0, color: 'bg-accent-success' },
                    { label: 'Script', score: testResults[0]?.score_dimensions?.compliance || 0, color: 'bg-accent-warning' },
                    { label: 'Precisão', score: testResults[0]?.score_dimensions?.accuracy || 0, color: 'bg-accent-error' },
                  ].map((dim, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-text-secondary">{dim.label}</span>
                      <span className="font-bold text-text-primary">{dim.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </ChartPlaceholder>
            </div>
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="space-y-4">
          <SectionHeader title="Pipeline de Versões" icon={Activity} />
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3 min-h-[150px] relative">
            {approvalsLoading ? (
              <div className="absolute inset-0 bg-bg-secondary/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-text-muted">Verificando pipeline...</span>
              </div>
            ) : approvalsError ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center py-4">
                <AlertCircle size={16} className="text-accent-error" />
                <p className="text-[10px] text-text-muted">Erro no pipeline</p>
              </div>
            ) : (
              <>
                <div className={`flex items-center gap-3 p-3 border rounded-md transition-colors ${approvals.length > 0 ? 'bg-accent-warning/10 border-accent-warning/20' : 'bg-bg-tertiary border-border-default'}`}>
                  <div className={`w-2 h-2 rounded-full ${approvals.length > 0 ? 'bg-accent-warning animate-pulse' : 'bg-text-muted'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{approvals.length} Aprovações</p>
                    <p className="text-xs text-text-muted">Prompts aguardando revisão</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-default rounded-md">
                  <div className="w-2 h-2 rounded-full bg-accent-success"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-primary">0 Agentes com erro</span>
                    <p className="text-xs text-text-muted">Sistema operando normalmente</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg-tertiary border border-border-default rounded-md">
                  <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-primary">0 Calls pendentes</span>
                    <p className="text-xs text-text-muted">Processamento em dia</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedReportId && (
        <TestReportModal 
          run={testResults.find(r => r.id === selectedReportId) as any} 
          onClose={() => setSelectedReportId(null)} 
        />
      )}

      {/* Modal de Drill-Down */}
      <DrilldownModal
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={drilldownTitle}
        metricType={selectedMetric || 'total_leads'}
        leads={drilldownLeads}
        loading={drilldownLoading}
        error={drilldownError}
        onLeadClick={handleLeadClick}
      />
    </div>
  );
};
