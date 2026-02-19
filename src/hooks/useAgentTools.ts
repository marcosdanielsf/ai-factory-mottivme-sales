import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type ToolStatus = 'active' | 'inactive' | 'deprecated';

export interface AgentTool {
  id: string;
  tool_name: string;
  resource?: string;
  json_config: Record<string, unknown>;
  status: ToolStatus;
  submitted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateToolInput {
  tool_name: string;
  resource?: string;
  json_config?: Record<string, unknown>;
  submitted_by?: string;
}

export const useAgentTools = () => {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('agent_tools')
        .select('*')
        .order('tool_name', { ascending: true });

      if (queryError) throw queryError;
      setTools(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar tools';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTool = useCallback(async (input: CreateToolInput) => {
    const { data, error: insertError } = await supabase
      .from('agent_tools')
      .insert({ ...input, json_config: input.json_config || {}, status: 'active' })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchTools();
    return data;
  }, [fetchTools]);

  const updateTool = useCallback(async (id: string, updates: Partial<Pick<AgentTool, 'tool_name' | 'resource' | 'json_config' | 'status'>>) => {
    const { error: updateError } = await supabase
      .from('agent_tools')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;
    await fetchTools();
  }, [fetchTools]);

  const deleteTool = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('agent_tools')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setTools(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  return { tools, loading, error, refetch: fetchTools, createTool, updateTool, deleteTool };
};
