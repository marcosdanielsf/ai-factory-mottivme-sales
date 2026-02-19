import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================================================
// HOOK: useLeadSegmentation
// Busca e agrega dados de segmentação de leads por Estado e Work Permit
// Usa n8n_schedule_tracking (fonte unificada) com normalização client-side
// ============================================================================

export interface EstadoMetrics {
  estado: string;
  totalLeads: number;
  convertidos: number;  // won
  perdidos: number;     // lost
  taxaConversao: number;
}

export interface WorkPermitMetrics {
  status: string;
  totalLeads: number;
  convertidos: number;  // won
  perdidos: number;     // lost
  taxaConversao: number;
}

export interface SegmentationTotals {
  totalLeads: number;
  comEstado: number;
  comWorkPermit: number;
  convertidos: number;  // won
  perdidos: number;     // lost
}

interface UseLeadSegmentationReturn {
  estados: EstadoMetrics[];
  workPermit: WorkPermitMetrics[];
  totals: SegmentationTotals;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Normaliza nomes de estados dos EUA
function normalizeState(rawState: string | null): string {
  if (!rawState || rawState.trim() === '' || rawState.toLowerCase() === 'null') {
    return 'Não informado';
  }

  const state = rawState.trim().toUpperCase();

  const stateMap: Record<string, string> = {
    // Florida
    'FL': 'Florida',
    'FLORIDA': 'Florida',
    'FLÓRIDA': 'Florida',
    'FLA': 'Florida',
    // Massachusetts
    'MA': 'Massachusetts',
    'MASSACHUSETTS': 'Massachusetts',
    'MASS': 'Massachusetts',
    // New Jersey
    'NJ': 'New Jersey',
    'NEW JERSEY': 'New Jersey',
    // New York
    'NY': 'New York',
    'NEW YORK': 'New York',
    // California
    'CA': 'California',
    'CALIFORNIA': 'California',
    // Texas
    'TX': 'Texas',
    'TEXAS': 'Texas',
    // Connecticut
    'CT': 'Connecticut',
    'CONNECTICUT': 'Connecticut',
    // Georgia
    'GA': 'Georgia',
    'GEORGIA': 'Georgia',
    // Utah
    'UT': 'Utah',
    'UTAH': 'Utah',
    // South Carolina
    'SC': 'South Carolina',
    'SOUTH CAROLINA': 'South Carolina',
    'CAROLINA DO SUL': 'South Carolina',
    // Nevada
    'NV': 'Nevada',
    'NEVADA': 'Nevada',
    // Illinois
    'IL': 'Illinois',
    'ILLINOIS': 'Illinois',
  };

  return stateMap[state] || state.charAt(0) + state.slice(1).toLowerCase();
}

// Normaliza status de work permit
function normalizeWorkPermit(rawPermit: string | null): string {
  if (!rawPermit || rawPermit.trim() === '' || rawPermit.toLowerCase() === 'null') {
    return 'Não informado';
  }

  const permit = rawPermit.toLowerCase().trim();

  if (permit.includes('possui') && !permit.includes('não')) {
    return 'Com Work Permit';
  }
  if (permit.includes('não') || permit.includes('nao')) {
    return 'Sem Work Permit';
  }
  if (['sim', 'yes', 'true', '1'].includes(permit)) {
    return 'Com Work Permit';
  }
  if (['não', 'nao', 'no', 'false', '0'].includes(permit)) {
    return 'Sem Work Permit';
  }

  return 'Não informado';
}

export const useLeadSegmentation = (
  dateRange?: DateRange | null,
  locationId?: string | null,
  responsavel?: string | null
): UseLeadSegmentationReturn => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calcular datas do período
      const startDate = dateRange?.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

      const endDate = dateRange?.endDate || (() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
      })();

      // Buscar leads com campos relevantes (n8n_schedule_tracking = fonte unificada)
      let query = supabase
        .from('n8n_schedule_tracking')
        .select(`
          id,
          state,
          work_permit,
          etapa_funil,
          created_at
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      if (responsavel) {
        query = query.eq('location_name', responsavel);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setRawData(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar segmentação');
      console.error('[LeadSegmentation Error]', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime(), locationId, responsavel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Processar dados para métricas
  // NOTA: Apenas status 'won' e 'lost' existem no enum
  const { estados, workPermit, totals } = useMemo(() => {
    const estadoMap: Record<string, {
      total: number;
      convertidos: number;
      perdidos: number;
    }> = {};

    const workPermitMap: Record<string, {
      total: number;
      convertidos: number;
      perdidos: number;
    }> = {};

    let totalLeads = 0;
    let comEstado = 0;
    let comWorkPermit = 0;
    let totalConvertidos = 0;
    let totalPerdidos = 0;

    rawData.forEach((lead) => {
      totalLeads++;

      const estado = normalizeState(lead.state);
      const wp = normalizeWorkPermit(lead.work_permit);
      const etapa = (lead.etapa_funil || '').toLowerCase();

      // Mapear etapa_funil para convertido/perdido
      const isConvertido = etapa === 'fechou' || etapa === 'won';
      const isPerdido = etapa === 'perdido' || etapa === 'lost';

      if (isConvertido) totalConvertidos++;
      if (isPerdido) totalPerdidos++;

      // Contagem por estado
      if (estado !== 'Não informado') {
        comEstado++;
      }
      if (!estadoMap[estado]) {
        estadoMap[estado] = { total: 0, convertidos: 0, perdidos: 0 };
      }
      estadoMap[estado].total++;
      if (isConvertido) estadoMap[estado].convertidos++;
      if (isPerdido) estadoMap[estado].perdidos++;

      // Contagem por work permit
      if (wp !== 'Não informado') {
        comWorkPermit++;
      }
      if (!workPermitMap[wp]) {
        workPermitMap[wp] = { total: 0, convertidos: 0, perdidos: 0 };
      }
      workPermitMap[wp].total++;
      if (isConvertido) workPermitMap[wp].convertidos++;
      if (isPerdido) workPermitMap[wp].perdidos++;
    });

    // Converter para arrays com taxas
    const estadosArr: EstadoMetrics[] = Object.entries(estadoMap)
      .filter(([estado]) => estado !== 'Não informado')
      .map(([estado, metrics]) => ({
        estado,
        totalLeads: metrics.total,
        convertidos: metrics.convertidos,
        perdidos: metrics.perdidos,
        taxaConversao: metrics.total > 0
          ? Math.round((metrics.convertidos / metrics.total) * 100)
          : 0,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 10); // Top 10

    const workPermitArr: WorkPermitMetrics[] = Object.entries(workPermitMap)
      .map(([status, metrics]) => ({
        status,
        totalLeads: metrics.total,
        convertidos: metrics.convertidos,
        perdidos: metrics.perdidos,
        taxaConversao: metrics.total > 0
          ? Math.round((metrics.convertidos / metrics.total) * 100)
          : 0,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);

    return {
      estados: estadosArr,
      workPermit: workPermitArr,
      totals: {
        totalLeads,
        comEstado,
        comWorkPermit,
        convertidos: totalConvertidos,
        perdidos: totalPerdidos,
      },
    };
  }, [rawData]);

  return { estados, workPermit, totals, loading, error, refetch: fetchData };
};

export default useLeadSegmentation;
