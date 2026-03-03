import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";

export interface ToolCall {
  id: number;
  execution_id: string | null;
  contact_id: string | null;
  location_id: string | null;
  location_name: string | null;
  agent_name: string | null;
  agent_version: string | null;
  tool_name: string;
  tool_input: Record<string, unknown> | null;
  tool_output: string | null;
  success: boolean;
  called_at: string;
}

export interface Filters {
  locationId?: string;
  toolName?: string;
  onlyErrors?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

interface Stats {
  total: number;
  successRate: number;
  topTool: string;
  uniqueContacts: number;
}

export function useAgentToolCalls(filters: Filters = {}) {
  const [calls, setCalls] = useState<ToolCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("agent_tool_calls")
        .select("*")
        .order("called_at", { ascending: false })
        .limit(filters.limit || 100);

      if (filters.locationId)
        query = query.eq("location_id", filters.locationId);
      if (filters.toolName) query = query.eq("tool_name", filters.toolName);
      if (filters.onlyErrors) query = query.eq("success", false);
      if (filters.dateFrom) query = query.gte("called_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("called_at", filters.dateTo);

      const { data, error: err } = await query;
      if (err) throw err;
      setCalls(data || []);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : "Erro ao carregar tool calls";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    filters.locationId,
    filters.toolName,
    filters.onlyErrors,
    filters.dateFrom,
    filters.dateTo,
    filters.limit,
  ]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const stats: Stats = useMemo(() => {
    const total = calls.length;
    const successCount = calls.filter((c) => c.success).length;
    const successRate =
      total > 0 ? Math.round((successCount / total) * 100) : 0;

    const toolCounts = calls.reduce(
      (acc, c) => {
        acc[c.tool_name] = (acc[c.tool_name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const topTool =
      total > 0
        ? (Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
          "-")
        : "-";

    const uniqueContacts = new Set(
      calls.filter((c) => c.contact_id).map((c) => c.contact_id),
    ).size;

    return { total, successRate, topTool, uniqueContacts };
  }, [calls]);

  return { calls, loading, error, refetch: fetchCalls, stats };
}
