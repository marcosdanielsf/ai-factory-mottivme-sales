import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { CjmSlaStatusRow } from "../types/cjm";

export const useCjmSlaStatus = (locationId?: string | null) => {
  const [slaItems, setSlaItems] = useState<CjmSlaStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlaStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("vw_cjm_sla_status")
        .select("*")
        .order("hours_overdue", { ascending: false });

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSlaItems((data || []) as CjmSlaStatusRow[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar status SLA";
      console.error("useCjmSlaStatus error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchSlaStatus();
  }, [fetchSlaStatus]);

  return { slaItems, loading, error, refetch: fetchSlaStatus };
};
