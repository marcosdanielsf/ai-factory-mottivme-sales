import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Info,
  RefreshCw,
  RotateCcw,
  StickyNote,
} from 'lucide-react';
import { useAiosContextHealth } from '../../hooks/aios/useAiosContextHealth';
import { AiosContextEntityType, AiosContextHealth, AiosContextAlert } from '../../types/aios';

// =====================================================
// HELPERS
// =====================================================

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-400';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-red-400';
}

function scoreBorderColor(score: number): string {
  if (score >= 80) return 'border-green-400/20';
  if (score >= 50) return 'border-yellow-400/20';
  return 'border-red-400/30';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Saudavel';
  if (score >= 50) return 'Atencao';
  return 'Critico';
}

function entityTypeLabel(type: AiosContextEntityType): string {
  const map: Record<AiosContextEntityType, string> = {
    agent: 'Agente',
    clone: 'Clone',
    squad: 'Squad',
    project: 'Projeto',
  };
  return map[type];
}

function entityTypeBadgeClass(type: AiosContextEntityType): string {
  const map: Record<AiosContextEntityType, string> = {
    agent: 'bg-blue-400/10 text-blue-400',
    clone: 'bg-purple-400/10 text-purple-400',
    squad: 'bg-orange-400/10 text-orange-400',
    project: 'bg-cyan-400/10 text-cyan-400',
  };
  return map[type];
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d atras`;
  if (hours > 0) return `${hours}h atras`;
  if (mins > 0) return `${mins}min atras`;
  return 'agora';
}

// =====================================================
// ALERT ITEM
// =====================================================

function AlertItem({ alert }: { alert: AiosContextAlert }) {
  const config = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  }[alert.level];

  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-2 px-2 py-1.5 rounded ${config.bg}`}>
      <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${config.color}`} />
      <p className={`text-xs ${config.color}`}>{alert.message}</p>
    </div>
  );
}

// =====================================================
// HEALTH CARD (expansivel)
// =====================================================

function HealthCard({ item }: { item: AiosContextHealth }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-bg-secondary border rounded-lg transition-all duration-200 cursor-pointer hover:border-border-hover ${scoreBorderColor(item.health_score)}`}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">{item.entity_name}</h3>
            <span
              className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full ${entityTypeBadgeClass(item.entity_type)}`}
            >
              {entityTypeLabel(item.entity_type)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className={`text-xl font-bold ${scoreColor(item.health_score)}`}>
                {item.health_score}
              </p>
              <p className={`text-[10px] ${scoreColor(item.health_score)}`}>
                {scoreLabel(item.health_score)}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Progress bar animada */}
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${scoreBgColor(item.health_score)}`}
            style={{ width: `${item.health_score}%` }}
          />
        </div>

        {/* Alertas resumidos */}
        {item.alerts.length > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            {item.alerts.length} alerta{item.alerts.length > 1 ? 's' : ''}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle className="w-3 h-3" />
            Sem alertas
          </div>
        )}
      </div>

      {/* Expandido: alertas detalhados + notas */}
      {expanded && (
        <div
          className="border-t border-border-default px-4 pb-4 pt-3 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {item.alerts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Alertas</p>
              {item.alerts.map((alert, i) => (
                <AlertItem key={i} alert={alert} />
              ))}
            </div>
          )}

          {item.notes && (
            <div className="bg-bg-tertiary rounded p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted mb-1">
                <StickyNote className="w-3 h-3" />
                NOTAS
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Footer com timestamp */}
          <div className="flex items-center gap-1 text-[10px] text-text-muted pt-1 border-t border-border-default">
            <Clock className="w-3 h-3" />
            Atualizado {relativeTime(item.last_updated_at)}
          </div>
        </div>
      )}

      {/* Footer quando colapsado */}
      {!expanded && (
        <div className="flex items-center gap-1 text-[10px] text-text-muted px-4 pb-3">
          <Clock className="w-3 h-3" />
          {relativeTime(item.last_updated_at)}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SUMMARY STATS
// =====================================================

function SummaryStats({ data }: { data: AiosContextHealth[] }) {
  const healthy = data.filter((d) => d.health_score >= 80).length;
  const warning = data.filter((d) => d.health_score >= 50 && d.health_score < 80).length;
  const critical = data.filter((d) => d.health_score < 50).length;
  const avgScore =
    data.length
      ? Math.round(data.reduce((a, b) => a + b.health_score, 0) / data.length)
      : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 text-center">
        <p className={`text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore}</p>
        <p className="text-xs text-text-muted">Score Medio</p>
      </div>
      <div className="bg-bg-secondary border border-green-400/20 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-green-400">{healthy}</p>
        <p className="text-xs text-text-muted">Saudaveis</p>
      </div>
      <div className="bg-bg-secondary border border-yellow-400/20 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-yellow-400">{warning}</p>
        <p className="text-xs text-text-muted">Atencao</p>
      </div>
      <div className="bg-bg-secondary border border-red-400/20 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-red-400">{critical}</p>
        <p className="text-xs text-text-muted">Criticos</p>
      </div>
    </div>
  );
}

// =====================================================
// FILTER TABS
// =====================================================

const ENTITY_FILTERS: { value: AiosContextEntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'agent', label: 'Agentes' },
  { value: 'clone', label: 'Clones' },
  { value: 'squad', label: 'Squads' },
  { value: 'project', label: 'Projetos' },
];

type HealthFilter = 'all' | 'saudavel' | 'atencao' | 'critico';

const HEALTH_FILTERS: { value: HealthFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '' },
  { value: 'saudavel', label: 'Saudavel', color: 'text-green-400' },
  { value: 'atencao', label: 'Atencao', color: 'text-yellow-400' },
  { value: 'critico', label: 'Critico', color: 'text-red-400' },
];

// =====================================================
// MAIN PAGE
// =====================================================

export function AiosSynapse() {
  const [entityFilter, setEntityFilter] = useState<AiosContextEntityType | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, refetch, refreshHealth } = useAiosContextHealth(
    entityFilter,
    healthFilter
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHealth();
    setRefreshing(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Synapse — Context Health</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Monitoramento de saude de contexto por entidade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Recalcula scores com base no tempo de inatividade"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Recalcular
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && <SummaryStats data={data} />}

      {/* Filtros por tipo */}
      <div className="flex items-center gap-1 flex-wrap">
        {ENTITY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setEntityFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              entityFilter === f.value
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-hover border border-border-default'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Separador visual */}
        <div className="w-px h-5 bg-border-default mx-1" />

        {/* Filtros por saude */}
        {HEALTH_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setHealthFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              healthFilter === f.value
                ? 'bg-bg-tertiary text-text-primary border border-border-hover'
                : `bg-bg-secondary border border-border-default hover:bg-bg-hover ${f.color || 'text-text-muted hover:text-text-primary'}`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-40"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Nenhuma entidade monitorada</p>
          <p className="text-text-muted text-xs mt-1">
            Execute o seed SQL em sql/004_aios_context_health_seed.sql
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <HealthCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
