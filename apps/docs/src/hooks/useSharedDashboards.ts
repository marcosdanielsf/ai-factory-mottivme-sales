import { useState, useCallback, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getErrorMessage } from "../lib/getErrorMessage";

export interface SharedDashboard {
  id: string;
  token: string;
  location_id: string;
  created_by: string | null;
  expires_at: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  last_accessed_at: string | null;
}

export interface UseSharedDashboardsReturn {
  dashboards: SharedDashboard[];
  loading: boolean;
  error: string | null;
  createShareLink: (
    locationId: string,
    expiresInDays?: number,
  ) => Promise<SharedDashboard | null>;
  revokeShareLink: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useSharedDashboards = (
  locationId?: string,
): UseSharedDashboardsReturn => {
  const [dashboards, setDashboards] = useState<SharedDashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase not configured");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("shared_dashboards")
        .select("*")
        .order("created_at", { ascending: false });

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setDashboards((data as SharedDashboard[]) ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const createShareLink = useCallback(
    async (
      locId: string,
      expiresInDays?: number,
    ): Promise<SharedDashboard | null> => {
      if (!isSupabaseConfigured()) {
        setError("Supabase not configured");
        return null;
      }

      setError(null);

      try {
        const insertPayload: Record<string, unknown> = {
          location_id: locId,
        };

        if (expiresInDays !== undefined && expiresInDays > 0) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expiresInDays);
          insertPayload.expires_at = expiresAt.toISOString();
        }

        const { data, error: insertError } = await supabase
          .from("shared_dashboards")
          .insert(insertPayload)
          .select()
          .single();

        if (insertError) throw insertError;

        const created = data as SharedDashboard;
        setDashboards((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      }
    },
    [],
  );

  const revokeShareLink = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setError("Supabase not configured");
      return false;
    }

    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("shared_dashboards")
        .update({ is_active: false })
        .eq("id", id);

      if (updateError) throw updateError;

      setDashboards((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: false } : d)),
      );
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  }, []);

  useEffect(() => {
    void fetchDashboards();
  }, [fetchDashboards]);

  return {
    dashboards,
    loading,
    error,
    createShareLink,
    revokeShareLink,
    refetch: fetchDashboards,
  };
};
