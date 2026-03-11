import React, { useState, useMemo } from 'react';
import {
  Server,
  RefreshCw,
  Building2,
  Key,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  DollarSign,
  GraduationCap,
  Code,
  ChevronDown,
} from 'lucide-react';
import { useGHLOps } from '../hooks/useGHLOps';

interface GHLLocation {
  location_id: string;
  name: string;
  client: string;
  vertical: string;
  active: boolean;
  pit_valid: boolean | null;
  field_count: number;
  pipeline_count: number;
  tag_count: number;
  snapshot_name: string | null;
  snapshot_version: string | null;
  health_status: 'healthy' | 'drift' | 'error' | 'unknown';
  drift_fields: string[];
  last_export_at: string | null;
  last_pit_check_at: string | null;
  updated_at: string;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

const HEALTH_CONFIG = {
  healthy: { label: 'Healthy', color: 'bg-green-500/15 text-green-400 border border-green-500/20' },
  drift:   { label: 'Drift',   color: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' },
  error:   { label: 'Error',   color: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  unknown: { label: 'Unknown', color: 'bg-white/10 text-text-muted border border-border-default' },
};

const VERTICAL_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  clinica:         { label: 'Clínica',        color: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',     icon: Stethoscope },
  financeiro_usa:  { label: 'Financeiro USA', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',     icon: DollarSign },
  educacao:        { label: 'Educação',        color: 'bg-purple-500/15 text-purple-400 border border-purple-500/20', icon: GraduationCap },
  interno:         { label: 'Interno',         color: 'bg-white/10 text-text-muted border border-border-default',   icon: Code },
};

function getVerticalConfig(vertical: string) {
  const key = vertical?.toLowerCase().replace(/\s+/g, '_');
  return VERTICAL_CONFIG[key] ?? { label: vertical ?? '—', color: 'bg-white/10 text-text-muted border border-border-default', icon: Server };
}

const SkeletonRow = () => (
  <tr className="border-b border-border-default">
    {[...Array(9)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 rounded bg-white/5 animate-pulse" style={{ width: `${40 + (i * 13) % 50}%` }} />
      </td>
    ))}
  </tr>
);

export const GHLOps: React.FC = () => {
  const { locations, stats, loading, error, refetch } = useGHLOps();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const verticalCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (locations ?? []).forEach((loc: GHLLocation) => {
      const key = loc.vertical?.toLowerCase().replace(/\s+/g, '_') ?? 'interno';
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [locations]);

  const verticalCards = [
    { key: 'clinica',        label: 'Clínica',        icon: Stethoscope,    color: 'text-pink-400',   bg: 'bg-pink-500/10' },
    { key: 'financeiro_usa', label: 'Financeiro USA', icon: DollarSign,     color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { key: 'educacao',       label: 'Educação',        icon: GraduationCap,  color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { key: 'interno',        label: 'Interno',         icon: Code,           color: 'text-text-muted', bg: 'bg-white/5' },
  ];

  return (
    <div className="bg-bg-primary min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Server size={20} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">GHL Operations</h1>
                <p className="text-xs text-text-muted">Monitoramento de locations GoHighLevel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw size={16} className={`text-text-muted ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={refetch}
            className="text-xs px-2 py-1 bg-red-500/20 rounded hover:bg-red-500/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Locations Ativas */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted leading-tight">Locations Ativas</p>
              {loading ? (
                <div className="h-6 w-16 rounded bg-white/5 animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-bold text-text-primary leading-tight mt-0.5">
                  {stats?.active ?? 0}
                  <span className="text-sm font-normal text-text-muted ml-1">/ {stats?.total ?? 0}</span>
                </p>
              )}
            </div>
          </div>

          {/* PITs Validos */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Key size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted leading-tight">PITs Válidos</p>
              {loading ? (
                <div className="h-6 w-16 rounded bg-white/5 animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-bold text-text-primary leading-tight mt-0.5">
                  {stats?.pitValid ?? 0}
                  <span className="text-sm font-normal text-text-muted ml-1">/ {stats?.active ?? 0}</span>
                </p>
              )}
            </div>
          </div>

          {/* Healthy */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted leading-tight">Healthy</p>
              {loading ? (
                <div className="h-6 w-12 rounded bg-white/5 animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-bold text-green-400 leading-tight mt-0.5">
                  {stats?.healthy ?? 0}
                </p>
              )}
            </div>
          </div>

          {/* Drift */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted leading-tight">Drift</p>
              {loading ? (
                <div className="h-6 w-12 rounded bg-white/5 animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-bold text-yellow-400 leading-tight mt-0.5">
                  {stats?.drift ?? 0}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vertical Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {verticalCards.map(({ key, label, icon: Icon, color, bg }) => (
            <div
              key={key}
              className="bg-bg-secondary rounded-xl border border-border-default p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-muted leading-tight truncate">{label}</p>
                {loading ? (
                  <div className="h-5 w-10 rounded bg-white/5 animate-pulse mt-1" />
                ) : (
                  <p className={`text-lg font-bold leading-tight mt-0.5 ${color}`}>
                    {verticalCounts[key] ?? 0}
                    <span className="text-xs font-normal text-text-muted ml-1">locations</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabela Principal */}
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Vertical
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    PIT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Fields
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Pipelines
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Último Export
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : !locations || locations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-text-muted text-sm">
                      Nenhuma location encontrada.
                    </td>
                  </tr>
                ) : (
                  (locations as GHLLocation[]).map((loc) => {
                    const health = HEALTH_CONFIG[loc.health_status] ?? HEALTH_CONFIG.unknown;
                    const vertConf = getVerticalConfig(loc.vertical);
                    const VertIcon = vertConf.icon;
                    const isExpanded = expandedRows.has(loc.location_id);
                    const hasDrift = loc.health_status === 'drift' && loc.drift_fields?.length > 0;

                    return (
                      <React.Fragment key={loc.location_id}>
                        <tr
                          className={`transition-colors hover:bg-white/[0.02] ${!loc.active ? 'opacity-60' : ''} ${hasDrift ? 'cursor-pointer' : ''}`}
                          onClick={hasDrift ? () => toggleRow(loc.location_id) : undefined}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {hasDrift && (
                                <ChevronDown
                                  size={14}
                                  className={`text-text-muted transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              )}
                              <div>
                                <p className="font-medium text-text-primary leading-tight">{loc.name}</p>
                                <p className="text-xs text-text-muted font-mono">{loc.location_id.slice(0, 8)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{loc.client}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${vertConf.color}`}>
                              <VertIcon size={11} />
                              {vertConf.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${health.color}`}>
                              {health.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {loc.pit_valid === null ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-text-muted border border-border-default">
                                N/A
                              </span>
                            ) : loc.pit_valid ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                                Válido
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                                Inválido
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                            {loc.field_count}
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                            {loc.pipeline_count}
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                            {loc.tag_count}
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">
                            {relativeTime(loc.last_export_at)}
                          </td>
                        </tr>

                        {/* Drift fields expanded row */}
                        {hasDrift && isExpanded && (
                          <tr className="bg-yellow-500/[0.03]">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-yellow-400 mb-1.5">
                                    Drift detectado em {loc.drift_fields.length} campo{loc.drift_fields.length !== 1 ? 's' : ''}:
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {loc.drift_fields.map((field) => (
                                      <span
                                        key={field}
                                        className="px-2 py-0.5 rounded-md text-xs font-mono bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                      >
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* Footer Totals */}
              {!loading && locations && locations.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border-default bg-white/[0.02]">
                    <td colSpan={5} className="px-4 py-2.5">
                      <span className="text-xs text-text-muted">
                        {(locations as GHLLocation[]).length} location{(locations as GHLLocation[]).length !== 1 ? 's' : ''} total
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs font-semibold text-text-secondary tabular-nums">
                        {stats?.totalFields ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs font-semibold text-text-secondary tabular-nums">
                        {stats?.totalPipelines ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs font-semibold text-text-secondary tabular-nums">
                        {stats?.totalTags ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLOps;
