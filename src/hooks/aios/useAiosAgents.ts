import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";

// Types from ../../types/aios
interface AiosAgent {
  id: string;
  name: string;
  status: string;
  squad_id: string | null;
  persona: string | null;
  role: string | null;
  config: Record<string, unknown> | null;
  capabilities: Record<string, unknown> | null;
  total_executions: number;
  total_cost: number;
  last_active_at: string | null;
  is_active: boolean;
  agent_source: string;
  created_at: string;
  updated_at: string;
}

interface CreateAgentInput {
  name: string;
  status?: string;
  squad_id?: string;
  persona?: string;
  role?: string;
  config?: Record<string, unknown>;
}

interface UpdateAgentInput extends Partial<CreateAgentInput> {
  id: string;
}

interface UseAiosAgentsReturn {
  data: AiosAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAgent: (input: CreateAgentInput) => Promise<AiosAgent | null>;
  updateAgent: (input: UpdateAgentInput) => Promise<AiosAgent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
}

export function useAiosAgents(filters?: {
  status?: string;
  squad_id?: string;
}): UseAiosAgentsReturn {
  const [data, setData] = useState<AiosAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const statusFilter = filters?.status;
  const squadFilter = filters?.squad_id;

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("aios_agents").select("*").order("name");

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (squadFilter) {
        query = query.eq("squad_id", squadFilter);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        console.warn(
          "[useAiosAgents] Tabela indisponivel:",
          fetchError.message,
        );
        setData([]);
      } else {
        setData(result ?? []);
      }
    } catch (err: unknown) {
      console.error("[useAiosAgents] Erro:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, squadFilter]);

  useEffect(() => {
    if (!statusFilter && !squadFilter) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    fetchAgents();
  }, [fetchAgents, statusFilter, squadFilter]);

  const createAgent = useCallback(
    async (input: CreateAgentInput): Promise<AiosAgent | null> => {
      const { data: result, error: createError } = await supabase
        .from("aios_agents")
        .insert(input)
        .select()
        .single();

      if (createError) {
        setError(createError.message);
        return null;
      }

      await fetchAgents();
      return result;
    },
    [fetchAgents],
  );

  const updateAgent = useCallback(
    async ({ id, ...input }: UpdateAgentInput): Promise<AiosAgent | null> => {
      const { data: result, error: updateError } = await supabase
        .from("aios_agents")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      await fetchAgents();
      return result;
    },
    [fetchAgents],
  );

  const deleteAgent = useCallback(
    async (id: string): Promise<boolean> => {
      const { error: deleteError } = await supabase
        .from("aios_agents")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      await fetchAgents();
      return true;
    },
    [fetchAgents],
  );

  return {
    data,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
