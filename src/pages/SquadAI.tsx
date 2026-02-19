import React, { useMemo } from 'react';
import {
  Bot,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Activity,
  Zap,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { useSquadAI, Execution, PipelineAgent, AgentStats, N8N_BASE } from '../hooks/useSquadAI';

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}min`;
};

const formatTime = (iso: string): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (iso: string): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const timeAgo = (iso: string): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const ms = Date.now() - d.getTime();
  if (ms < 60000) return 'agora';
  if (ms < 3600000) return `${Math.round(ms / 60000)}min atras`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h atras`;
  return `${Math.round(ms / 86400000)}d atras`;
};

// ═══════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} className={color} />
      <span className="text-xs text-[#8b949e] uppercase font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-[#8b949e] mt-1">{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// PIPELINE CARD
// ═══════════════════════════════════════════════════════════════════════

interface PipelineCardProps {
  agent: PipelineAgent;
  stats: AgentStats | undefined;
  lastExec: Execution | undefined;
  isLast: boolean;
}

const PipelineCard = ({ agent, stats, lastExec, isLast }: PipelineCardProps) => {
  const rateColor = !stats
    ? 'text-[#8b949e]'
    : stats.successRate >= 80
    ? 'text-[#3fb950]'
    : stats.successRate >= 50
    ? 'text-[#d29922]'
    : 'text-[#f85149]';

  return (
    <div className="flex items-center gap-0">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 min-w-[220px] hover:border-[#58a6ff]/40 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#58a6ff]/10 flex items-center justify-center text-xs font-bold text-[#58a6ff]">
            {agent.order}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{agent.shortName}</p>
            <p className="text-[10px] text-[#8b949e]">{agent.nodeCount} nodes</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#8b949e] mb-3 line-clamp-2">{agent.description}</p>

        {/* Stats */}
        {stats ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#8b949e]">Execucoes</span>
              <span className="text-white font-medium">{stats.totalExecutions}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8b949e]">Taxa sucesso</span>
              <span className={`font-semibold ${rateColor}`}>{stats.successRate}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8b949e]">Tempo medio</span>
              <span className="text-white">{formatDuration(stats.avgDurationMs)}</span>
            </div>

            {/* Success rate bar */}
            <div className="h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.successRate >= 80
                    ? 'bg-[#3fb950]'
                    : stats.successRate >= 50
                    ? 'bg-[#d29922]'
                    : 'bg-[#f85149]'
                }`}
                style={{ width: `${stats.successRate}%` }}
              />
            </div>

            {/* Last execution */}
            {stats.lastExecution && (
              <p className="text-[10px] text-[#8b949e]">
                Ultima: {timeAgo(stats.lastExecution)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-3 bg-[#0d1117] rounded animate-pulse" />
            <div className="h-3 bg-[#0d1117] rounded animate-pulse w-3/4" />
          </div>
        )}

        {/* Last execution status indicator */}
        {lastExec && (
          <div className="mt-3 pt-3 border-t border-[#30363d]">
            <div className="flex items-center gap-1.5">
              {lastExec.status === 'success' ? (
                <CheckCircle2 size={12} className="text-[#3fb950]" />
              ) : (
                <XCircle size={12} className="text-[#f85149]" />
              )}
              <span className="text-[10px] text-[#8b949e]">
                #{lastExec.id} - {formatTime(lastExec.startedAt)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Arrow connector */}
      {!isLast && (
        <div className="flex-shrink-0 px-2">
          <ArrowRight size={20} className="text-[#30363d]" />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }: { status: Execution['status'] }) => {
  const config = {
    success: { icon: CheckCircle2, color: 'text-[#3fb950]', bg: 'bg-[#3fb950]/10', label: 'Sucesso' },
    error: { icon: XCircle, color: 'text-[#f85149]', bg: 'bg-[#f85149]/10', label: 'Erro' },
    running: { icon: Activity, color: 'text-[#58a6ff]', bg: 'bg-[#58a6ff]/10', label: 'Rodando' },
    waiting: { icon: Clock, color: 'text-[#d29922]', bg: 'bg-[#d29922]/10', label: 'Aguardando' },
    unknown: { icon: AlertTriangle, color: 'text-[#8b949e]', bg: 'bg-[#8b949e]/10', label: 'Desconhecido' },
  }[status] || { icon: AlertTriangle, color: 'text-[#8b949e]', bg: 'bg-[#8b949e]/10', label: status };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color} ${config.bg}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const SquadAI = () => {
  const { pipeline, executions, agentStats, squadStats, loading, error, refresh } = useSquadAI();

  // Merge all executions sorted by startedAt desc
  const allExecutions = useMemo(() => {
    const all: Execution[] = [];
    executions.forEach((execs) => all.push(...execs));
    all.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return all;
  }, [executions]);

  const n8nBaseUrl = `${N8N_BASE}/workflow`;

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Bot size={26} className="text-[#58a6ff]" />
              Squad AI
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Pipeline de agentes do AI Factory — execucoes em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-[#8b949e] hover:text-white hover:border-[#58a6ff]/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#f85149] mt-0.5" />
            <div>
              <p className="text-sm text-[#f85149] font-medium">{error}</p>
              {error.includes('nao configurada') && (
                <p className="text-xs text-[#8b949e] mt-1">
                  Va em Configuracoes e adicione sua API key do n8n no campo <code className="px-1 bg-[#0d1117] rounded">mottivme_n8n_api_key</code> no localStorage.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total Execucoes"
            value={loading ? '...' : squadStats.totalExecutions}
            color="text-[#58a6ff]"
            sub={`${pipeline.length} agentes no pipeline`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Taxa de Sucesso"
            value={loading ? '...' : `${squadStats.successRate}%`}
            color={squadStats.successRate >= 80 ? 'text-[#3fb950]' : squadStats.successRate >= 50 ? 'text-[#d29922]' : 'text-[#f85149]'}
            sub="Ultimas 50 exec por agente"
          />
          <StatCard
            icon={AlertTriangle}
            label="Erros Hoje"
            value={loading ? '...' : squadStats.errorsToday}
            color={squadStats.errorsToday > 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}
            sub={squadStats.errorsToday === 0 ? 'Nenhum erro hoje' : 'Verifique os logs'}
          />
          <StatCard
            icon={Zap}
            label="Duracao Media"
            value={loading ? '...' : formatDuration(squadStats.avgDurationMs)}
            color="text-[#d29922]"
            sub="Tempo medio de execucao"
          />
        </div>

        {/* Pipeline Visualization */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[#58a6ff]" />
            Pipeline de Execucao
          </h3>
          <div className="flex items-start overflow-x-auto pb-2 gap-0">
            {pipeline.map((agent, index) => (
              <PipelineCard
                key={agent.id}
                agent={agent}
                stats={agentStats.get(agent.id)}
                lastExec={executions.get(agent.id)?.[0]}
                isLast={index === pipeline.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Recent Executions Table */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-[#8b949e]" />
              Execucoes Recentes
            </h3>
            <span className="text-xs text-[#8b949e]">{allExecutions.length} execucoes</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-[#0d1117] rounded animate-pulse" />
              ))}
            </div>
          ) : allExecutions.length === 0 ? (
            <div className="p-12 text-center">
              <Settings size={32} className="mx-auto text-[#30363d] mb-3" />
              <p className="text-sm text-[#8b949e]">Nenhuma execucao encontrada</p>
              <p className="text-xs text-[#484f58] mt-1">Configure a API key do n8n para ver dados reais</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0d1117]">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">ID</th>
                    <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">Agente</th>
                    <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">Status</th>
                    <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">Data</th>
                    <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">Inicio</th>
                    <th className="text-right p-3 text-xs font-semibold text-[#8b949e] uppercase">Duracao</th>
                    <th className="text-right p-3 text-xs font-semibold text-[#8b949e] uppercase">n8n</th>
                  </tr>
                </thead>
                <tbody>
                  {allExecutions.map((exec) => {
                    const duration =
                      exec.startedAt && exec.stoppedAt
                        ? new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()
                        : null;

                    return (
                      <tr
                        key={`${exec.workflowId}-${exec.id}`}
                        className="border-t border-[#30363d] hover:bg-[#0d1117] transition-colors"
                      >
                        <td className="p-3 text-[#8b949e] font-mono text-xs">#{exec.id}</td>
                        <td className="p-3">
                          <span className="text-white text-xs font-medium">{exec.workflowName}</span>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={exec.status} />
                        </td>
                        <td className="p-3 text-xs text-[#8b949e]">{formatDate(exec.startedAt)}</td>
                        <td className="p-3 text-xs text-white">{formatTime(exec.startedAt)}</td>
                        <td className="p-3 text-right text-xs">
                          {duration !== null ? (
                            <span className={duration > 30000 ? 'text-[#d29922]' : 'text-[#8b949e]'}>
                              {formatDuration(duration)}
                            </span>
                          ) : (
                            <span className="text-[#484f58]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={`${n8nBaseUrl}/${exec.workflowId}/executions/${exec.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                            title="Abrir no n8n"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquadAI;
