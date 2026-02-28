import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface GHLLocation {
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
  last_snapshot_applied_at: string | null;
  updated_at: string;
}

export interface GHLOpsStats {
  total: number;
  active: number;
  pitValid: number;
  healthy: number;
  drift: number;
  errors: number;
  unknown: number;
  totalFields: number;
  totalPipelines: number;
  totalTags: number;
  byVertical: Record<string, number>;
}

export interface UseGHLOpsReturn {
  locations: GHLLocation[];
  stats: GHLOpsStats;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY_STATS: GHLOpsStats = {
  total: 0,
  active: 0,
  pitValid: 0,
  healthy: 0,
  drift: 0,
  errors: 0,
  unknown: 0,
  totalFields: 0,
  totalPipelines: 0,
  totalTags: 0,
  byVertical: {},
};

type RawGHLLocation = {
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
  health_status: string;
  drift_fields: unknown;
  last_export_at: string | null;
  last_pit_check_at: string | null;
  last_snapshot_applied_at: string | null;
  updated_at: string;
};

function parseRow(row: RawGHLLocation): GHLLocation {
  let driftFields: string[] = [];
  if (Array.isArray(row.drift_fields)) {
    driftFields = row.drift_fields as string[];
  } else if (typeof row.drift_fields === 'string') {
    try {
      const parsed = JSON.parse(row.drift_fields);
      driftFields = Array.isArray(parsed) ? parsed : [];
    } catch {
      driftFields = [];
    }
  }

  const validStatuses = ['healthy', 'drift', 'error', 'unknown'] as const;
  const healthStatus = validStatuses.includes(row.health_status as typeof validStatuses[number])
    ? (row.health_status as GHLLocation['health_status'])
    : 'unknown';

  return {
    location_id: row.location_id,
    name: row.name,
    client: row.client,
    vertical: row.vertical,
    active: row.active,
    pit_valid: row.pit_valid,
    field_count: row.field_count ?? 0,
    pipeline_count: row.pipeline_count ?? 0,
    tag_count: row.tag_count ?? 0,
    snapshot_name: row.snapshot_name,
    snapshot_version: row.snapshot_version,
    health_status: healthStatus,
    drift_fields: driftFields,
    last_export_at: row.last_export_at,
    last_pit_check_at: row.last_pit_check_at,
    last_snapshot_applied_at: row.last_snapshot_applied_at,
    updated_at: row.updated_at,
  };
}

export const useGHLOps = (): UseGHLOpsReturn => {
  const [rawLocations, setRawLocations] = useState<GHLLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('ops_ghl_locations')
        .select('*')
        .order('active', { ascending: false })
        .order('name', { ascending: true });

      if (queryError) throw new Error(queryError.message);

      const parsed = ((data || []) as RawGHLLocation[]).map(parseRow);
      setRawLocations(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados GHL Ops';
      setError(message);
      console.error('[GHLOps Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo<GHLOpsStats>(() => {
    if (rawLocations.length === 0) return EMPTY_STATS;

    const byVertical: Record<string, number> = {};

    let active = 0;
    let pitValid = 0;
    let healthy = 0;
    let drift = 0;
    let errors = 0;
    let unknown = 0;
    let totalFields = 0;
    let totalPipelines = 0;
    let totalTags = 0;

    for (const loc of rawLocations) {
      if (loc.active) active++;
      if (loc.pit_valid === true) pitValid++;

      switch (loc.health_status) {
        case 'healthy': healthy++; break;
        case 'drift':   drift++;   break;
        case 'error':   errors++;  break;
        default:        unknown++; break;
      }

      totalFields += loc.field_count;
      totalPipelines += loc.pipeline_count;
      totalTags += loc.tag_count;

      if (loc.vertical) {
        byVertical[loc.vertical] = (byVertical[loc.vertical] ?? 0) + 1;
      }
    }

    return {
      total: rawLocations.length,
      active,
      pitValid,
      healthy,
      drift,
      errors,
      unknown,
      totalFields,
      totalPipelines,
      totalTags,
      byVertical,
    };
  }, [rawLocations]);

  return {
    locations: rawLocations,
    stats,
    loading,
    error,
    refetch: fetchData,
  };
};

export default useGHLOps;
