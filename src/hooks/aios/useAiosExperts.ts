import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { AiosExpert } from '../../types/aios';

interface CreateExpertPayload {
  name: string;
  expertise: string;
  bio?: string | null;
  avatar_url?: string | null;
  squad_id?: string | null;
  voice_type?: string | null;
  frameworks?: AiosExpert['frameworks'];
  swipe_files?: AiosExpert['swipe_files'];
  checklists?: AiosExpert['checklists'];
}

interface UpdateExpertPayload extends Partial<CreateExpertPayload> {
  is_active?: boolean;
}

interface UseAiosExpertsReturn {
  data: AiosExpert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addExpert: (payload: CreateExpertPayload) => Promise<AiosExpert | null>;
  updateExpert: (id: string, payload: UpdateExpertPayload) => Promise<boolean>;
  deleteExpert: (id: string) => Promise<boolean>;
}

export function useAiosExperts(): UseAiosExpertsReturn {
  const [data, setData] = useState<AiosExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('aios_expert_clones')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.warn('[useAiosExperts] Tabela indisponivel:', fetchError.message);
        setData([]);
      } else {
        setData(mapRows(result ?? []));
      }
    } catch (err: unknown) {
      console.error('[useAiosExperts] Erro:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchExperts();
  }, [fetchExperts]);

  const addExpert = useCallback(async (payload: CreateExpertPayload): Promise<AiosExpert | null> => {
    const { data: inserted, error: insertError } = await supabase
      .from('aios_expert_clones')
      .insert({
        name: payload.name,
        expertise: payload.expertise,
        bio: payload.bio ?? null,
        avatar_url: payload.avatar_url ?? null,
        squad_id: payload.squad_id ?? null,
        voice_type: payload.voice_type ?? null,
        frameworks: payload.frameworks ?? [],
        swipe_files: payload.swipe_files ?? [],
        checklists: payload.checklists ?? [],
        is_active: true,
        total_tasks_executed: 0,
      })
      .select('*')
      .single();

    if (insertError || !inserted) return null;

    const mapped = mapRow(inserted);
    setData((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  }, []);

  const updateExpert = useCallback(async (id: string, payload: UpdateExpertPayload): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('aios_expert_clones')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) return false;

    setData((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...payload } as AiosExpert : e))
        .filter((e) => e.is_active !== false)
    );
    return true;
  }, []);

  const deleteExpert = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('aios_expert_clones')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) return false;

    setData((prev) => prev.filter((e) => e.id !== id));
    return true;
  }, []);

  return { data, loading, error, refetch: fetchExperts, addExpert, updateExpert, deleteExpert };
}

// =====================================================
// Row mappers — aios_expert_clones → AiosExpert
// =====================================================

function mapRow(row: Record<string, any>): AiosExpert {
  return {
    id: row.id,
    name: row.name ?? '',
    avatar_url: row.avatar_url ?? null,
    bio: row.bio ?? null,
    expertise: row.expertise ?? '',
    squad_id: row.squad_id ?? null,
    frameworks: Array.isArray(row.frameworks) ? row.frameworks : [],
    swipe_files: Array.isArray(row.swipe_files) ? row.swipe_files : [],
    checklists: Array.isArray(row.checklists) ? row.checklists : [],
    total_tasks_executed: row.total_tasks_executed ?? 0,
    is_active: row.is_active ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

function mapRows(rows: Record<string, any>[]): AiosExpert[] {
  return rows.map(mapRow);
}
