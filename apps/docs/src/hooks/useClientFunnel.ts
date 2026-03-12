import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { DateRange } from "../components/DateRangePicker";

export interface FunnelDay {
  dia: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  mensagens: number;
  ctr: number;
  tx_conversao_msg: number;
  total_leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  receita: number;
  cpl: number | null;
  cpa: number | null;
  roas: number;
}

export interface AdBreakdown {
  ad_id: string;
  criativo: string;
  campanha: string;
  conjunto: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  leads_gerados: number;
  leads_responderam: number;
  leads_agendaram: number;
  leads_fecharam: number;
  receita: number;
  cpl: number | null;
  roas: number;
}

export interface FunnelTotals {
  gasto: number;
  impressoes: number;
  cliques: number;
  mensagens: number;
  total_leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  receita: number;
}

export interface FunnelKPIs {
  investido: number;
  cpl: number | null;
  cpa: number | null;
  roas: number;
}

export interface UseClientFunnelReturn {
  funnelData: FunnelDay[];
  adsBreakdown: AdBreakdown[];
  totals: FunnelTotals;
  kpis: FunnelKPIs;
  isValidToken: boolean | null;
  locationId: string | null;
  config: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_TOTALS: FunnelTotals = {
  gasto: 0,
  impressoes: 0,
  cliques: 0,
  mensagens: 0,
  total_leads: 0,
  responderam: 0,
  agendaram: 0,
  compareceram: 0,
  fecharam: 0,
  receita: 0,
};

const formatDateParam = (d: Date): string => d.toISOString().split("T")[0];

export const useClientFunnel = (
  token: string,
  dateRange: DateRange,
): UseClientFunnelReturn => {
  const [funnelData, setFunnelData] = useState<FunnelDay[]>([]);
  const [adsBreakdown, setAdsBreakdown] = useState<AdBreakdown[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateToken = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setError("Supabase not configured");
      setIsValidToken(false);
      return false;
    }

    if (!token) {
      setIsValidToken(false);
      return false;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "validate_share_token",
        {
          p_token: token,
        },
      );

      if (rpcError) throw rpcError;

      // RPC returns array: [{location_id, config}] if valid, [] if invalid
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      if (rows.length > 0 && rows[0].location_id) {
        setIsValidToken(true);
        setLocationId(rows[0].location_id);
        setConfig(rows[0].config ?? {});
        return true;
      }

      setIsValidToken(false);
      return false;
    } catch (err) {
      setError(getErrorMessage(err));
      setIsValidToken(false);
      return false;
    }
  }, [token]);

  const fetchFunnelData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    const start = dateRange.startDate;
    const end = dateRange.endDate;
    if (!start || !end) return;

    setLoading(true);
    setError(null);

    try {
      const dateFrom = formatDateParam(start);
      const dateTo = formatDateParam(end);

      const [funnelResult, adsResult] = await Promise.all([
        supabase.rpc("get_client_funnel", {
          p_token: token,
          p_date_from: dateFrom,
          p_date_to: dateTo,
        }),
        supabase.rpc("get_client_ads_breakdown", {
          p_token: token,
          p_date_from: dateFrom,
          p_date_to: dateTo,
        }),
      ]);

      if (funnelResult.error) throw funnelResult.error;
      if (adsResult.error) throw adsResult.error;

      setFunnelData((funnelResult.data as FunnelDay[]) ?? []);
      setAdsBreakdown((adsResult.data as AdBreakdown[]) ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, dateRange.startDate, dateRange.endDate]);

  // Validate token on mount (once)
  useEffect(() => {
    void validateToken().then((valid) => {
      if (valid) void fetchFunnelData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Re-fetch when dateRange changes (skip re-validation)
  useEffect(() => {
    if (isValidToken === true) {
      void fetchFunnelData();
    }
  }, [isValidToken, fetchFunnelData]);

  const totals = useMemo<FunnelTotals>(() => {
    if (funnelData.length === 0) return EMPTY_TOTALS;
    return funnelData.reduce<FunnelTotals>(
      (acc, day) => ({
        gasto: acc.gasto + (day.gasto ?? 0),
        impressoes: acc.impressoes + (day.impressoes ?? 0),
        cliques: acc.cliques + (day.cliques ?? 0),
        mensagens: acc.mensagens + (day.mensagens ?? 0),
        total_leads: acc.total_leads + (day.total_leads ?? 0),
        responderam: acc.responderam + (day.responderam ?? 0),
        agendaram: acc.agendaram + (day.agendaram ?? 0),
        compareceram: acc.compareceram + (day.compareceram ?? 0),
        fecharam: acc.fecharam + (day.fecharam ?? 0),
        receita: acc.receita + (day.receita ?? 0),
      }),
      { ...EMPTY_TOTALS },
    );
  }, [funnelData]);

  const kpis = useMemo<FunnelKPIs>(() => {
    const { gasto, total_leads, agendaram, receita } = totals;
    return {
      investido: gasto,
      cpl: total_leads > 0 ? gasto / total_leads : null,
      cpa: agendaram > 0 ? gasto / agendaram : null,
      roas: gasto > 0 ? receita / gasto : 0,
    };
  }, [totals]);

  return {
    funnelData,
    adsBreakdown,
    totals,
    kpis,
    isValidToken,
    locationId,
    config,
    loading,
    error,
    refetch: fetchFunnelData,
  };
};
