import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ========== Types ==========

interface ClientUnitEconomics {
  location_id: string;
  location_name: string;
  is_active: boolean;
  acquisition_date: string | null;
  churn_date: string | null;
  months_active: number;
  total_revenue_brl: number;
  avg_monthly_revenue_brl: number;
  total_cost_brl: number;
  total_cost_usd: number;
  gross_profit_brl: number;
  margin_pct: number;
  ltv_brl: number;
  cac_brl: number;
  ltv_cac_ratio: number | null;
  avg_monthly_margin_brl: number;
  last_billing_month: string;
  first_billing_month: string;
}

interface UnitEconomicsSummary {
  active_clients: number;
  churned_clients: number;
  total_clients: number;
  mrr_brl: number;
  arr_brl: number;
  avg_margin_pct: number;
  avg_ticket_brl: number;
  avg_ltv_brl: number;
  avg_cac_brl: number;
  avg_ltv_cac_ratio: number | null;
  churn_rate_pct: number;
}

interface MRREvolution {
  month: string;
  mrr_brl: number;
  arr_brl: number;
  active_clients: number;
  avg_ticket_brl: number;
  prev_mrr_brl: number | null;
  mrr_growth_pct: number | null;
  net_new_mrr_brl: number;
  net_new_clients: number;
}

interface MonthlyChurn {
  month: string;
  churned_clients: number;
  churned_mrr_brl: number;
  total_clients_at_month: number;
  churn_rate_pct: number;
}

interface RunwayProjection {
  monthly_revenue_brl: number;
  active_clients: number;
  avg_ticket_brl: number;
  monthly_ai_cost_brl: number;
  estimated_opex_brl: number;
  monthly_gross_profit_brl: number;
  monthly_free_cash_brl: number;
  months_to_6mo_runway: number;
  operating_margin_pct: number;
}

// ========== Hook: useUnitEconomicsClients ==========

export function useUnitEconomicsClients() {
  const [data, setData] = useState<ClientUnitEconomics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("vw_unit_economics_clients")
        .select("*");
      if (err) throw err;
      setData(rows || []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao carregar unit economics",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ========== Hook: useUnitEconomicsSummary ==========

export function useUnitEconomicsSummary() {
  const [data, setData] = useState<UnitEconomicsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("vw_unit_economics_summary")
        .select("*")
        .single();
      if (err) throw err;
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar resumo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ========== Hook: useMRREvolution ==========

export function useMRREvolution() {
  const [data, setData] = useState<MRREvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("vw_mrr_evolution")
        .select("*")
        .order("month", { ascending: true });
      if (err) throw err;
      setData(rows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar MRR");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ========== Hook: useMonthlyChurn ==========

export function useMonthlyChurn() {
  const [data, setData] = useState<MonthlyChurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("vw_monthly_churn")
        .select("*")
        .order("month", { ascending: true });
      if (err) throw err;
      setData(rows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar churn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ========== Hook: useRunwayProjection ==========

export function useRunwayProjection() {
  const [data, setData] = useState<RunwayProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("vw_runway_projection")
        .select("*")
        .single();
      if (err) throw err;
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar runway");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
