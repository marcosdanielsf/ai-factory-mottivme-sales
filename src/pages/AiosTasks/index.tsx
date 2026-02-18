import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAiosTasksExpanded } from '../../hooks/aios/useAiosTasksExpanded';
import { useAiosAgents } from '../../hooks/aios/useAiosAgents';
import { useAiosSquads } from '../../hooks/aios/useAiosSquads';
import { TaskKpiCards } from './components/TaskKpiCards';
import { TaskExecutorPieChart } from './components/TaskExecutorPieChart';
import { TaskTimelineChart } from './components/TaskTimelineChart';
import { TaskTable } from './components/TaskTable';
import { DecisionTreeViewer } from './components/DecisionTreeViewer';

type PeriodOption = '7d' | '30d' | '90d';
type ExecutorFilter = 'all' | 'agent' | 'worker' | 'clone' | 'human';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
type ActiveSection = 'overview' | 'decision';

export function AiosTasks() {
  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [squadFilter, setSquadFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [executorFilter, setExecutorFilter] = useState<ExecutorFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');

  const {
    tasks,
    loading,
    error,
    refetch,
    kpis,
    timeline,
    executorDistribution,
    conversionSuggestions,
  } = useAiosTasksExpanded({
    period,
    squad_id: squadFilter || undefined,
    agent_id: agentFilter || undefined,
    executor_type: executorFilter === 'all' ? undefined : executorFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: agents } = useAiosAgents();
  const { data: squads } = useAiosSquads();

  const filteredTasks = useMemo(() => tasks, [tasks]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-xl font-bold">Tasks AIOS</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Visao task-centric com roteamento Agent vs Worker
          </p>
        </div>

        {/* Secoes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-bg-secondary border border-border-default rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-1.5 transition-colors ${
                activeSection === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('decision')}
              className={`px-3 py-1.5 transition-colors ${
                activeSection === 'decision'
                  ? 'bg-indigo-600 text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Decision Tree
            </button>
          </div>

          <button
            onClick={refetch}
            className="p-2 bg-bg-secondary border border-border-default rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
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

        {/* Executor type */}
        <select
          value={executorFilter}
          onChange={(e) => setExecutorFilter(e.target.value as ExecutorFilter)}
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Todos os executores</option>
          <option value="agent">Agent</option>
          <option value="worker">Worker</option>
          <option value="clone">Clone</option>
          <option value="human">Humano</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="in_progress">Em andamento</option>
          <option value="completed">Concluida</option>
          <option value="failed">Falhou</option>
          <option value="skipped">Pulada</option>
        </select>

        {/* Squad filter */}
        {squads.length > 0 && (
          <select
            value={squadFilter}
            onChange={(e) => setSquadFilter(e.target.value)}
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
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todos os agentes</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {activeSection === 'overview' ? (
        <>
          {/* KPIs */}
          <TaskKpiCards
            total={kpis.total}
            tasksPerDay={kpis.tasksPerDay}
            byExecutor={kpis.byExecutor}
            economiaEstimada={kpis.economiaEstimada}
            totalCost={kpis.totalCost}
            loading={loading}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TaskTimelineChart data={timeline} loading={loading} />
            <TaskExecutorPieChart data={executorDistribution} loading={loading} />
          </div>

          {/* Tabela */}
          <TaskTable data={filteredTasks} loading={loading} pageSize={25} />
        </>
      ) : (
        <DecisionTreeViewer suggestions={conversionSuggestions} />
      )}
    </div>
  );
}
