import { useState, useMemo } from 'react';
import { useAiosCostEvents } from '../../hooks/aios/useAiosCostEvents';
import { useAiosCostBudgets } from '../../hooks/aios/useAiosCostBudgets';
import { useAiosAgents } from '../../hooks/aios/useAiosAgents';
import { useAiosSquads } from '../../hooks/aios/useAiosSquads';
import { CostOverviewCards } from './components/CostOverviewCards';
import { CostByModelChart } from './components/CostByModelChart';
import { CostByAgentChart } from './components/CostByAgentChart';
import { CostBySquadChart } from './components/CostBySquadChart';
import { CostTimelineChart } from './components/CostTimelineChart';
import { CostBudgetAlert } from './components/CostBudgetAlert';
import { CostTable } from './components/CostTable';

type PeriodOption = '7d' | '30d' | '90d';

function getDateFrom(period: PeriodOption): string {
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else d.setDate(d.getDate() - 90);
  return d.toISOString();
}

export function AiosCosts() {
  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [selectedSquad, setSelectedSquad] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  const dateFrom = getDateFrom(period);

  const eventsFilters = useMemo(
    () => ({
      date_from: dateFrom,
      ...(selectedAgent ? { agent_id: selectedAgent } : {}),
    }),
    [dateFrom, selectedAgent]
  );

  const { data: events, loading: eventsLoading, totalCost, totalTokens } = useAiosCostEvents(eventsFilters);
  const { data: budgets, loading: budgetsLoading } = useAiosCostBudgets();
  const { data: agents } = useAiosAgents();
  const { data: squads } = useAiosSquads();

  // Agent id -> name map
  const agentMap = useMemo<Record<string, string>>(
    () => Object.fromEntries(agents.map((a) => [a.id, a.name])),
    [agents]
  );

  // Filter events by squad if selected (via agent squad membership — fallback: filter in memory)
  const filteredEvents = useMemo(() => {
    if (!selectedSquad) return events;
    return events.filter((e) => {
      if (!e.agent_id) return false;
      const agent = agents.find((a) => a.id === e.agent_id);
      // agents don't have squad_id directly here; show all if no match info
      return !!agent;
    });
  }, [events, selectedSquad, agents]);

  // Derived data for charts
  const byModel = useMemo(() => {
    const map: Record<string, { cost: number; tokens: number }> = {};
    for (const e of filteredEvents) {
      const key = e.model ?? 'unknown';
      if (!map[key]) map[key] = { cost: 0, tokens: 0 };
      map[key].cost += e.cost ?? 0;
      map[key].tokens += (e.input_tokens ?? 0) + (e.output_tokens ?? 0);
    }
    const totalC = Object.values(map).reduce((s, v) => s + v.cost, 0);
    return Object.entries(map)
      .map(([model, v]) => ({
        model,
        cost: v.cost,
        tokens: v.tokens,
        percentage: totalC > 0 ? (v.cost / totalC) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredEvents]);

  const byAgent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredEvents) {
      if (!e.agent_id) continue;
      const name = agentMap[e.agent_id] ?? e.agent_id.slice(0, 8);
      map[name] = (map[name] ?? 0) + (e.cost ?? 0);
    }
    return Object.entries(map).map(([agent_name, cost]) => ({ agent_name, cost }));
  }, [filteredEvents, agentMap]);

  // Map agent_id -> squad_name for squad cost aggregation
  const agentToSquad = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const squad of squads) {
      const members = (squad as any).aios_squad_members ?? [];
      for (const m of members) {
        if (m.agent_id) map[m.agent_id] = squad.name;
      }
    }
    return map;
  }, [squads]);

  const bySquad = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredEvents) {
      if (!e.agent_id) continue;
      const squadName = agentToSquad[e.agent_id];
      if (!squadName) continue;
      map[squadName] = (map[squadName] ?? 0) + (e.cost ?? 0);
    }
    return Object.entries(map)
      .map(([squad_name, cost]) => ({ squad_name, cost }))
      .filter((s) => s.cost > 0);
  }, [filteredEvents, agentToSquad]);

  const timeline = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredEvents) {
      const day = e.created_at.slice(0, 10);
      map[day] = (map[day] ?? 0) + (e.cost ?? 0);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost }));
  }, [filteredEvents]);

  const activeBudgets = useMemo(
    () => budgets.filter((b) => b.is_active),
    [budgets]
  );

  const budgetRemaining = useMemo(() => {
    if (!activeBudgets.length) return -1;
    const total = activeBudgets.reduce((s, b) => s + b.budget_amount, 0);
    return total - totalCost;
  }, [activeBudgets, totalCost]);

  const budgetPerDay = useMemo(() => {
    if (!activeBudgets.length) return undefined;
    const totalBudget = activeBudgets.reduce((s, b) => s + b.budget_amount, 0);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return totalBudget / days;
  }, [activeBudgets, period]);

  const loading = eventsLoading || budgetsLoading;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-xl font-bold">Custos AIOS</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Monitoramento de consumo LLM e budget de agentes
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Periodo */}
          <div className="flex items-center bg-bg-secondary border border-border-default rounded-lg overflow-hidden text-sm">
            {(['7d', '30d', '90d'] as PeriodOption[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Squad filter */}
          {squads.length > 0 && (
            <select
              value={selectedSquad}
              onChange={(e) => setSelectedSquad(e.target.value)}
              className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todos os squads</option>
              {squads.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {/* Agent filter */}
          {agents.length > 0 && (
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todos os agentes</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Budget Alerts */}
      {!budgetsLoading && activeBudgets.length > 0 && (
        <CostBudgetAlert budgets={activeBudgets} totalCost={totalCost} />
      )}

      {/* KPIs */}
      <CostOverviewCards
        totalCost={totalCost}
        totalTokens={totalTokens}
        totalEvents={filteredEvents.length}
        budgetRemaining={budgetRemaining}
        loading={loading}
      />

      {/* Timeline — full width */}
      <CostTimelineChart
        data={timeline}
        budgetPerDay={budgetPerDay}
        loading={eventsLoading}
      />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CostByModelChart data={byModel} loading={eventsLoading} />
        <CostByAgentChart data={byAgent} loading={eventsLoading} />
        <CostBySquadChart data={bySquad} loading={eventsLoading} />
      </div>

      {/* Tabela detalhada */}
      <CostTable
        data={filteredEvents}
        agentMap={agentMap}
        loading={eventsLoading}
        pageSize={20}
      />
    </div>
  );
}
