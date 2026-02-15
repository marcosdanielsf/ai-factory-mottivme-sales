import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, DollarSign, Users, Calendar, CheckCircle, RefreshCw, Building2, ChevronDown, AlertCircle, Edit3, PlusCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { useAccount } from '../contexts/AccountContext';
import { useLocations } from '../hooks/useLocations';
import { useSalesGoals, calculateProjection, SalesGoal } from '../hooks/useSalesGoals';
import { useSocialSellingFunnel } from '../hooks/useSocialSellingFunnel';

// ============================================================================
// Planejamento de Vendas
// Calculadora de metas + tracking progresso vs planejado
// ============================================================================

const STATUS_CONFIG = {
  ahead: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Acima' },
  on_track: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'No ritmo' },
  behind: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Atras' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critico' },
};

interface CalculatorInputs {
  dailyInvestment: number;
  cpl: number;
  qualificationRate: number;
  schedulingRate: number;
  attendanceRate: number;
  conversionRate: number;
  averageTicket: number;
}

interface CalculatorResults {
  totalInvestment: number;
  totalLeads: number;
  mqls: number;
  scheduledCalls: number;
  attendedCalls: number;
  sales: number;
  revenue: number;
  sdrCount: number;
  closerCount: number;
  totalOpCost: number;
  roas: number;
  cac: number;
  netProfit: number;
}

const DEFAULT_INPUTS: CalculatorInputs = {
  dailyInvestment: 333,
  cpl: 5,
  qualificationRate: 50,
  schedulingRate: 40,
  attendanceRate: 70,
  conversionRate: 20,
  averageTicket: 1000,
};

function calculateResults(inputs: CalculatorInputs, periodDays = 30): CalculatorResults {
  const totalInvestment = inputs.dailyInvestment * periodDays;
  const totalLeads = Math.floor(totalInvestment / inputs.cpl);
  const mqls = Math.floor(totalLeads * inputs.qualificationRate / 100);
  const scheduledCalls = Math.floor(mqls * inputs.schedulingRate / 100);
  const attendedCalls = Math.floor(scheduledCalls * inputs.attendanceRate / 100);
  const sales = Math.floor(attendedCalls * inputs.conversionRate / 100);
  const revenue = sales * inputs.averageTicket;
  const sdrCount = Math.ceil(mqls / 150);
  const closerCount = Math.ceil(attendedCalls / 60);
  const totalOpCost = totalInvestment + (sdrCount * 3000) + (closerCount * 5000) + (sales * 200) + 500 + 1000;
  const roas = totalInvestment > 0 ? revenue / totalInvestment : 0;
  const cac = sales > 0 ? totalOpCost / sales : 0;
  const netProfit = revenue - totalOpCost;

  return {
    totalInvestment,
    totalLeads,
    mqls,
    scheduledCalls,
    attendedCalls,
    sales,
    revenue,
    sdrCount,
    closerCount,
    totalOpCost,
    roas,
    cac,
    netProfit,
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function Planejamento() {
  const { selectedAccount } = useAccount();
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  });

  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [showCalculator, setShowCalculator] = useState(false);

  // Location efetivo
  const effectiveLocationId = selectedLocationId || selectedAccount?.location_id || null;
  const effectiveLocationName = useMemo(() => {
    if (selectedLocationId) {
      return locations.find(l => l.location_id === selectedLocationId)?.location_name || selectedLocationId;
    }
    if (selectedAccount?.location_id) return selectedAccount.location_name;
    return null;
  }, [selectedLocationId, selectedAccount, locations]);

  const { goals, activeGoal, loading: goalsLoading, createGoal, refetch } = useSalesGoals(effectiveLocationId);
  const funnelData = useSocialSellingFunnel(dateRange, effectiveLocationId);

  const calculatorResults = useMemo(() => calculateResults(calculatorInputs), [calculatorInputs]);

  // Auto-expand calculator if no active goal or no location selected
  React.useEffect(() => {
    if (!effectiveLocationId || (!goalsLoading && !activeGoal)) {
      setShowCalculator(true);
    }
  }, [goalsLoading, activeGoal, effectiveLocationId]);

  const handleSaveGoal = async () => {
    if (!effectiveLocationId || !dateRange.startDate || !dateRange.endDate) return;

    try {
      const newGoal: Omit<SalesGoal, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'created_by'> = {
        location_id: effectiveLocationId,
        period_type: 'monthly',
        period_start: dateRange.startDate.toISOString().split('T')[0],
        period_end: dateRange.endDate.toISOString().split('T')[0],
        goal_leads_total: calculatorResults.totalLeads,
        goal_leads_social_selling: Math.floor(calculatorResults.totalLeads * 0.4),
        goal_leads_trafego: Math.floor(calculatorResults.totalLeads * 0.4),
        goal_leads_organico: Math.floor(calculatorResults.totalLeads * 0.2),
        goal_responderam: calculatorResults.mqls,
        goal_agendamentos: calculatorResults.scheduledCalls,
        goal_comparecimentos: calculatorResults.attendedCalls,
        goal_vendas: calculatorResults.sales,
        goal_revenue_brl: calculatorResults.revenue,
        ticket_medio_estimado: calculatorInputs.averageTicket,
        goal_conversion_rate: calculatorInputs.conversionRate,
        calc_daily_investment: calculatorInputs.dailyInvestment,
        calc_cpl: calculatorInputs.cpl,
        calc_qualification_rate: calculatorInputs.qualificationRate,
        calc_scheduling_rate: calculatorInputs.schedulingRate,
        calc_attendance_rate: calculatorInputs.attendanceRate,
        calc_conversion_rate: calculatorInputs.conversionRate,
        calc_average_ticket: calculatorInputs.averageTicket,
      };

      await createGoal(newGoal);
      setShowCalculator(false);
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    }
  };

  const handleEditGoal = () => {
    if (activeGoal) {
      setCalculatorInputs({
        dailyInvestment: activeGoal.calc_daily_investment,
        cpl: activeGoal.calc_cpl,
        qualificationRate: activeGoal.calc_qualification_rate,
        schedulingRate: activeGoal.calc_scheduling_rate,
        attendanceRate: activeGoal.calc_attendance_rate,
        conversionRate: activeGoal.calc_conversion_rate,
        averageTicket: activeGoal.calc_average_ticket,
      });
    }
    setShowCalculator(true);
  };

  // Calcula dados reais acumulados do funil
  const actualData = useMemo(() => {
    const total = funnelData.socialSelling.leads + funnelData.trafego.leads + funnelData.organico.leads;
    const agendaram = funnelData.socialSelling.agendaram + funnelData.trafego.agendaram + funnelData.organico.agendaram;
    const compareceram = funnelData.socialSelling.compareceram + funnelData.trafego.compareceram + funnelData.organico.compareceram;
    const fecharam = funnelData.socialSelling.fecharam + funnelData.trafego.fecharam + funnelData.organico.fecharam;

    return {
      leads: total,
      leadsSS: funnelData.socialSelling.leads,
      leadsTrafego: funnelData.trafego.leads,
      leadsOrganico: funnelData.organico.leads,
      responderam: funnelData.socialSelling.responderam + funnelData.trafego.responderam + funnelData.organico.responderam,
      agendamentos: agendaram,
      comparecimentos: compareceram,
      vendas: fecharam,
    };
  }, [funnelData]);

  // Projecoes
  const projections = useMemo(() => {
    if (!activeGoal || !dateRange.startDate || !dateRange.endDate) return null;

    return {
      leads: calculateProjection(activeGoal.goal_leads_total, actualData.leads, activeGoal.period_start, activeGoal.period_end),
      leadsSS: calculateProjection(activeGoal.goal_leads_social_selling, actualData.leadsSS, activeGoal.period_start, activeGoal.period_end),
      leadsTrafego: calculateProjection(activeGoal.goal_leads_trafego, actualData.leadsTrafego, activeGoal.period_start, activeGoal.period_end),
      leadsOrganico: calculateProjection(activeGoal.goal_leads_organico, actualData.leadsOrganico, activeGoal.period_start, activeGoal.period_end),
      responderam: calculateProjection(activeGoal.goal_responderam, actualData.responderam, activeGoal.period_start, activeGoal.period_end),
      agendamentos: calculateProjection(activeGoal.goal_agendamentos, actualData.agendamentos, activeGoal.period_start, activeGoal.period_end),
      comparecimentos: calculateProjection(activeGoal.goal_comparecimentos, actualData.comparecimentos, activeGoal.period_start, activeGoal.period_end),
      vendas: calculateProjection(activeGoal.goal_vendas, actualData.vendas, activeGoal.period_start, activeGoal.period_end),
    };
  }, [activeGoal, actualData, dateRange]);

  // Chart data para projecao
  const chartData = useMemo(() => {
    if (!activeGoal || !projections) return [];

    const start = new Date(activeGoal.period_start);
    const end = new Date(activeGoal.period_end);
    const totalDays = projections.leads.totalDays;
    const daysElapsed = projections.leads.daysElapsed;

    // Dados reais acumulados dia a dia
    const dailyTrend = funnelData.dailyTrend || [];
    const dailyAccum: Record<string, number> = {};
    let cumulative = 0;
    dailyTrend.forEach(d => {
      cumulative += d.socialSelling + d.trafego + d.organico;
      dailyAccum[d.date] = cumulative;
    });

    const data: any[] = [];
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      const goalAccum = Math.round((activeGoal.goal_leads_total / totalDays) * (i + 1));
      const realAccum = dailyAccum[dateKey] || (i < daysElapsed ? actualData.leads : null);
      const projection = i >= daysElapsed ? Math.round(actualData.leads + (projections.leads.currentDailyRate * (i - daysElapsed + 1))) : null;

      data.push({
        date: dateKey,
        meta: goalAccum,
        real: realAccum,
        projecao: projection,
      });
    }

    return data;
  }, [activeGoal, projections, funnelData.dailyTrend, actualData.leads]);

  const isLoading = effectiveLocationId && (goalsLoading || funnelData.loading);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target size={20} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Planejamento de Vendas</h1>
                <p className="text-xs text-text-muted">
                  {effectiveLocationName && <span className="text-purple-400 font-medium">{effectiveLocationName}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <LocationSelector
                locations={locations}
                selectedLocationId={selectedLocationId}
                onChange={setSelectedLocationId}
                isLoading={locationsLoading}
              />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <button
                onClick={() => { refetch(); funnelData.refetch(); }}
                disabled={goalsLoading || funnelData.loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw size={16} className={`text-text-muted ${goalsLoading || funnelData.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Calculadora */}
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-text-primary">Calculadora de Metas</h3>
            </div>
            <ChevronDown size={18} className={`text-text-muted transition-transform ${showCalculator ? 'rotate-180' : ''}`} />
          </button>

          {showCalculator && (
            <div className="px-6 py-4 border-t border-border-default">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-primary mb-4">Parametros</h4>

                  <SliderInput
                    label="Investimento Marketing/dia"
                    value={calculatorInputs.dailyInvestment}
                    onChange={v => setCalculatorInputs(p => ({ ...p, dailyInvestment: v }))}
                    min={10}
                    max={50000}
                    step={10}
                    format={formatCurrency}
                  />
                  <SliderInput
                    label="CPL (Custo por Lead)"
                    value={calculatorInputs.cpl}
                    onChange={v => setCalculatorInputs(p => ({ ...p, cpl: v }))}
                    min={1}
                    max={100}
                    step={0.5}
                    format={formatCurrency}
                  />
                  <SliderInput
                    label="Taxa Qualificacao (%)"
                    value={calculatorInputs.qualificationRate}
                    onChange={v => setCalculatorInputs(p => ({ ...p, qualificationRate: v }))}
                    min={1}
                    max={100}
                    step={1}
                    format={v => `${v}%`}
                  />
                  <SliderInput
                    label="Taxa Agendamento (%)"
                    value={calculatorInputs.schedulingRate}
                    onChange={v => setCalculatorInputs(p => ({ ...p, schedulingRate: v }))}
                    min={1}
                    max={100}
                    step={1}
                    format={v => `${v}%`}
                  />
                  <SliderInput
                    label="Taxa Comparecimento (%)"
                    value={calculatorInputs.attendanceRate}
                    onChange={v => setCalculatorInputs(p => ({ ...p, attendanceRate: v }))}
                    min={10}
                    max={100}
                    step={1}
                    format={v => `${v}%`}
                  />
                  <SliderInput
                    label="Taxa Conversao (%)"
                    value={calculatorInputs.conversionRate}
                    onChange={v => setCalculatorInputs(p => ({ ...p, conversionRate: v }))}
                    min={1}
                    max={80}
                    step={1}
                    format={v => `${v}%`}
                  />
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-2">Ticket Medio</label>
                    <input
                      type="number"
                      value={calculatorInputs.averageTicket}
                      onChange={e => setCalculatorInputs(p => ({ ...p, averageTicket: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-bg-primary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Resultados */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-text-primary mb-4">Projecao (30 dias)</h4>
                  <ResultCard label="Total Leads" value={calculatorResults.totalLeads} icon={<Users size={16} />} />
                  <ResultCard label="MQLs (Qualificados)" value={calculatorResults.mqls} />
                  <ResultCard label="Calls Agendadas" value={calculatorResults.scheduledCalls} icon={<Calendar size={16} />} />
                  <ResultCard label="Calls Realizadas" value={calculatorResults.attendedCalls} />
                  <ResultCard label="Vendas" value={calculatorResults.sales} icon={<CheckCircle size={16} />} highlight="purple" />
                  <ResultCard label="Faturamento Bruto" value={formatCurrency(calculatorResults.revenue)} icon={<DollarSign size={16} />} highlight="green" />
                  <ResultCard label="SDRs Necessarios" value={calculatorResults.sdrCount} />
                  <ResultCard label="Closers Necessarios" value={calculatorResults.closerCount} />
                  <ResultCard label="ROAS" value={`${calculatorResults.roas.toFixed(2)}x`} />
                  <ResultCard label="CAC" value={formatCurrency(calculatorResults.cac)} />
                  <ResultCard
                    label="Lucro Liquido"
                    value={formatCurrency(calculatorResults.netProfit)}
                    highlight={calculatorResults.netProfit >= 0 ? 'green' : 'red'}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 items-center">
                <button
                  onClick={handleSaveGoal}
                  disabled={!effectiveLocationId}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Target size={16} />
                  Salvar como Meta do Mes
                </button>
                {!effectiveLocationId && (
                  <span className="text-xs text-yellow-400">Selecione um cliente para salvar a meta</span>
                )}
                {showCalculator && activeGoal && (
                  <button
                    onClick={() => setShowCalculator(false)}
                    className="px-4 py-2 bg-bg-hover hover:bg-bg-primary border border-border-default text-text-primary rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progresso vs Meta */}
        {activeGoal && projections && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Progresso vs Meta</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleEditGoal}
                  className="px-3 py-1.5 text-xs bg-bg-hover hover:bg-bg-primary border border-border-default text-text-primary rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <Edit3 size={12} />
                  Editar Meta
                </button>
                <button
                  onClick={() => setShowCalculator(true)}
                  className="px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle size={12} />
                  Nova Meta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProgressCard label="Leads" projection={projections.leads} />
              <ProgressCard label="Agendamentos" projection={projections.agendamentos} />
              <ProgressCard label="Comparecimentos" projection={projections.comparecimentos} />
              <ProgressCard label="Vendas" projection={projections.vendas} />
            </div>

            {/* Grafico Projecao */}
            <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Projecao de Leads</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v + 'T00:00:00');
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    labelFormatter={(v) => {
                      const d = new Date(v + 'T00:00:00');
                      return d.toLocaleDateString('pt-BR');
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="meta" name="Meta" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="real" name="Real" stroke="#a855f7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="projecao" name="Projecao" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Detalhamento por Origem */}
            <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-sm font-semibold text-text-primary">Detalhamento por Origem</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left px-6 py-3 text-text-muted font-medium">Metrica</th>
                      <th className="text-center px-4 py-3 text-pink-400 font-medium">Social Selling</th>
                      <th className="text-center px-4 py-3 text-orange-400 font-medium">Trafego</th>
                      <th className="text-center px-4 py-3 text-cyan-400 font-medium">Organico</th>
                      <th className="text-center px-4 py-3 text-text-muted font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border-default">
                      <td className="px-6 py-3 font-medium text-text-primary">Meta</td>
                      <td className="text-center px-4 py-3 text-text-secondary">{activeGoal.goal_leads_social_selling}</td>
                      <td className="text-center px-4 py-3 text-text-secondary">{activeGoal.goal_leads_trafego}</td>
                      <td className="text-center px-4 py-3 text-text-secondary">{activeGoal.goal_leads_organico}</td>
                      <td className="text-center px-4 py-3 text-text-secondary font-bold">{activeGoal.goal_leads_total}</td>
                    </tr>
                    <tr className="border-b border-border-default">
                      <td className="px-6 py-3 font-medium text-text-primary">Real</td>
                      <td className="text-center px-4 py-3 text-pink-400 font-bold">{actualData.leadsSS}</td>
                      <td className="text-center px-4 py-3 text-orange-400 font-bold">{actualData.leadsTrafego}</td>
                      <td className="text-center px-4 py-3 text-cyan-400 font-bold">{actualData.leadsOrganico}</td>
                      <td className="text-center px-4 py-3 text-text-primary font-bold">{actualData.leads}</td>
                    </tr>
                    <tr className="border-b border-border-default">
                      <td className="px-6 py-3 font-medium text-text-primary">% Atingido</td>
                      <td className="text-center px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">
                          {Math.round((actualData.leadsSS / activeGoal.goal_leads_social_selling) * 100)}%
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                          {Math.round((actualData.leadsTrafego / activeGoal.goal_leads_trafego) * 100)}%
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                          {Math.round((actualData.leadsOrganico / activeGoal.goal_leads_organico) * 100)}%
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                          {Math.round((actualData.leads / activeGoal.goal_leads_total) * 100)}%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-border-default">
                      <td className="px-6 py-3 font-medium text-text-primary">Projecao</td>
                      <td className="text-center px-4 py-3 text-text-secondary">{projections.leadsSS.projectedTotal}</td>
                      <td className="text-center px-4 py-3 text-text-secondary">{projections.leadsTrafego.projectedTotal}</td>
                      <td className="text-center px-4 py-3 text-text-secondary">{projections.leadsOrganico.projectedTotal}</td>
                      <td className="text-center px-4 py-3 text-text-secondary font-bold">{projections.leads.projectedTotal}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-medium text-text-primary">Status</td>
                      <td className="text-center px-4 py-3"><StatusBadge status={projections.leadsSS.status} /></td>
                      <td className="text-center px-4 py-3"><StatusBadge status={projections.leadsTrafego.status} /></td>
                      <td className="text-center px-4 py-3"><StatusBadge status={projections.leadsOrganico.status} /></td>
                      <td className="text-center px-4 py-3"><StatusBadge status={projections.leads.status} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Componentes Auxiliares
// ============================================================================

function SliderInput({ label, value, onChange, min, max, step, format }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-text-muted">{label}</label>
        <span className="text-xs font-bold text-text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer accent-purple-500"
        style={{
          background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((value - min) / (max - min)) * 100}%, #1f2937 ${((value - min) / (max - min)) * 100}%, #1f2937 100%)`,
        }}
      />
    </div>
  );
}

function ResultCard({ label, value, icon, highlight }: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  highlight?: 'green' | 'red' | 'purple';
}) {
  const colorClass = highlight === 'green' ? 'text-green-400'
    : highlight === 'red' ? 'text-red-400'
    : highlight === 'purple' ? 'text-purple-400'
    : 'text-text-primary';

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-bg-primary rounded-lg border border-border-default">
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <span className={`text-sm font-bold ${colorClass}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function ProgressCard({ label, projection }: {
  label: string;
  projection: any;
}) {
  const status = STATUS_CONFIG[projection.status];
  const progress = Math.min(100, Math.round((projection.actualToDate / projection.goalTotal) * 100));

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">
        {projection.actualToDate} <span className="text-sm text-text-muted">/ {projection.goalTotal}</span>
      </div>
      <div className="w-full bg-bg-primary rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            projection.status === 'ahead' ? 'bg-emerald-500' :
            projection.status === 'on_track' ? 'bg-green-500' :
            projection.status === 'behind' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">
        Projecao: {projection.projectedTotal} ({projection.projectedPercentOfGoal}%)
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

function LocationSelector({ locations, selectedLocationId, onChange, isLoading }: {
  locations: { location_id: string; location_name: string }[];
  selectedLocationId: string | null;
  onChange: (id: string | null) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search.trim()
    ? locations.filter(l => l.location_name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  const selected = locations.find(l => l.location_id === selectedLocationId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg hover:border-purple-500/50 transition-colors disabled:opacity-50 min-w-[160px]"
      >
        <Building2 size={14} className={selected ? 'text-purple-400' : 'text-text-muted'} />
        <span className={`truncate ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected ? selected.location_name : 'Todos os Clientes'}
        </span>
        <ChevronDown size={14} className={`text-text-muted ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-bg-primary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
              !selectedLocationId ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-text-primary hover:bg-bg-hover'
            }`}
          >
            Todos os Clientes
          </button>
          <div className="border-t border-border-default max-h-[280px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">Nenhum cliente encontrado</div>
            ) : (
              filtered.map(loc => (
                <button
                  key={loc.location_id}
                  onClick={() => { onChange(loc.location_id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedLocationId === loc.location_id
                      ? 'bg-purple-500/20 text-purple-400 font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {loc.location_name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Planejamento;
