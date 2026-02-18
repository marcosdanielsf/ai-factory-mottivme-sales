import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosSquadMemberAgent {
  id: string;
  name: string;
  status: string;
  persona: string | null;
}

interface AiosSquadMember {
  id: string;
  squad_id: string;
  agent_id: string;
  role: string | null;
  joined_at: string;
  aios_agents: AiosSquadMemberAgent;
}

interface AiosSquad {
  id: string;
  name: string;
  description: string | null;
  strategy: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  aios_squad_members: AiosSquadMember[];
}

interface CreateSquadInput {
  name: string;
  description?: string;
  strategy?: string;
  is_active?: boolean;
}

interface UpdateSquadInput extends Partial<CreateSquadInput> {
  id: string;
}

interface UseAiosSquadsReturn {
  data: AiosSquad[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createSquad: (input: CreateSquadInput) => Promise<AiosSquad | null>;
  updateSquad: (input: UpdateSquadInput) => Promise<AiosSquad | null>;
  addMember: (squadId: string, agentId: string, role?: string) => Promise<boolean>;
  removeMember: (squadId: string, agentId: string) => Promise<boolean>;
}

export function useAiosSquads(): UseAiosSquadsReturn {
  const [data, setData] = useState<AiosSquad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchSquads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('aios_squads')
        .select('*, aios_squad_members(*, aios_agents(id, name, status, persona))');

      if (fetchError) {
        console.warn('[useAiosSquads] Tabela indisponivel:', fetchError.message);
        setData([]);
      } else {
        setData((result ?? []) as AiosSquad[]);
      }
    } catch (err: unknown) {
      console.error('[useAiosSquads] Erro:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSquads();
  }, [fetchSquads]);

  const createSquad = useCallback(async (input: CreateSquadInput): Promise<AiosSquad | null> => {
    const { data: result, error: createError } = await supabase
      .from('aios_squads')
      .insert(input)
      .select('*, aios_squad_members(*, aios_agents(id, name, status, persona))')
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    await fetchSquads();
    return result as AiosSquad;
  }, [fetchSquads]);

  const updateSquad = useCallback(async ({ id, ...input }: UpdateSquadInput): Promise<AiosSquad | null> => {
    const { data: result, error: updateError } = await supabase
      .from('aios_squads')
      .update(input)
      .eq('id', id)
      .select('*, aios_squad_members(*, aios_agents(id, name, status, persona))')
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetchSquads();
    return result as AiosSquad;
  }, [fetchSquads]);

  const addMember = useCallback(async (squadId: string, agentId: string, role?: string): Promise<boolean> => {
    const { error: insertError } = await supabase
      .from('aios_squad_members')
      .insert({ squad_id: squadId, agent_id: agentId, role: role ?? null });

    if (insertError) {
      setError(insertError.message);
      return false;
    }

    await fetchSquads();
    return true;
  }, [fetchSquads]);

  const removeMember = useCallback(async (squadId: string, agentId: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('aios_squad_members')
      .delete()
      .eq('squad_id', squadId)
      .eq('agent_id', agentId);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    await fetchSquads();
    return true;
  }, [fetchSquads]);

  return { data, loading, error, refetch: fetchSquads, createSquad, updateSquad, addMember, removeMember };
}
