import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────

export interface IrisAccount {
  client_key: string;
  client_name: string;
  snapshot_date: string;
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number | null;
  active_campaigns: number;
}

export interface IrisCreative {
  client_key: string;
  client_name: string;
  snapshot_date: string;
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  frequency: number;
  leads: number;
  cpl: number | null;
  classification: string;
  classification_emoji: string;
  classification_action: string;
  is_fatiguing: boolean;
  fatigue_signals: string | null;
}

export interface IrisFunnel {
  client_key: string;
  client_name: string;
  snapshot_date: string;
  leads_gerados: number;
  leads_responderam: number;
  leads_agendaram: number;
  leads_fecharam: number;
  receita_total: number;
  gasto_total: number;
  roas: number;
  taxa_resposta: number;
  taxa_agendamento: number;
  taxa_fechamento: number;
  bottleneck_speed_to_lead: boolean;
  bottleneck_qualification: boolean;
  bottleneck_sales: boolean;
  bottleneck_no_show: boolean;
}

export interface IrisAlert {
  id: number;
  client_key: string;
  client_name: string;
  alert_date: string;
  severity: string;
  category: string;
  title: string;
  details: string | null;
  ad_id: string | null;
  ad_name: string | null;
  is_sent: boolean;
  is_resolved: boolean;
}

export interface IrisDashboardData {
  accounts: IrisAccount[];
  creatives: IrisCreative[];
  funnels: IrisFunnel[];
  alerts: IrisAlert[];
  trends: IrisAccount[];
}

// ── Hook ───────────────────────────────────────────────

export function useIrisDashboard() {
  const [accounts, setAccounts] = useState<IrisAccount[]>([]);
  const [creatives, setCreatives] = useState<IrisCreative[]>([]);
  const [funnels, setFunnels] = useState<IrisFunnel[]>([]);
  const [alerts, setAlerts] = useState<IrisAlert[]>([]);
  const [trends, setTrends] = useState<IrisAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Latest account snapshots (overview cards)
      let accountsQuery = supabase
        .from('iris_latest_account')
        .select('*');
      if (clientFilter) accountsQuery = accountsQuery.eq('client_key', clientFilter);
      const { data: accountsData, error: accountsErr } = await accountsQuery;
      if (accountsErr) throw accountsErr;

      // 2. Latest creatives
      let creativesQuery = supabase
        .from('iris_latest_creatives')
        .select('*')
        .order('spend', { ascending: false });
      if (clientFilter) creativesQuery = creativesQuery.eq('client_key', clientFilter);
      const { data: creativesData, error: creativesErr } = await creativesQuery;
      if (creativesErr) throw creativesErr;

      // 3. Funnel snapshots (latest date)
      let funnelsQuery = supabase
        .from('iris_funnel_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(20);
      if (clientFilter) funnelsQuery = funnelsQuery.eq('client_key', clientFilter);
      const { data: funnelsData, error: funnelsErr } = await funnelsQuery;
      if (funnelsErr) throw funnelsErr;

      // Deduplicate: keep only latest snapshot per client
      const latestFunnels: IrisFunnel[] = [];
      const seenClients = new Set<string>();
      for (const f of (funnelsData || [])) {
        if (!seenClients.has(f.client_key)) {
          seenClients.add(f.client_key);
          latestFunnels.push(f);
        }
      }

      // 4. Pending alerts
      let alertsQuery = supabase
        .from('iris_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (clientFilter) alertsQuery = alertsQuery.eq('client_key', clientFilter);
      const { data: alertsData, error: alertsErr } = await alertsQuery;
      if (alertsErr) throw alertsErr;

      // 5. Trends (last 30 days of account snapshots)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let trendsQuery = supabase
        .from('iris_account_snapshots')
        .select('*')
        .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });
      if (clientFilter) trendsQuery = trendsQuery.eq('client_key', clientFilter);
      const { data: trendsData, error: trendsErr } = await trendsQuery;
      if (trendsErr) throw trendsErr;

      setAccounts(accountsData || []);
      setCreatives(creativesData || []);
      setFunnels(latestFunnels);
      setAlerts(alertsData || []);
      setTrends(trendsData || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados IRIS';
      setError(message);
      console.error('IRIS Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientFilter]);

  useEffect(() => {
    if (fetchedRef.current && clientFilter === null) return;
    fetchedRef.current = true;
    fetchData();
  }, [fetchData]);

  return {
    accounts,
    creatives,
    funnels,
    alerts,
    trends,
    loading,
    error,
    refetch: fetchData,
    clientFilter,
    setClientFilter,
  };
}
