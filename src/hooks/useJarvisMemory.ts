import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JarvisMemoryItem } from '../types/jarvis';

interface UseJarvisMemoryOptions {
  type?: JarvisMemoryItem['type'];
  project_slug?: string;
  search?: string;
}

interface UseJarvisMemoryReturn {
  memories: JarvisMemoryItem[];
  loading: boolean;
  error: string | null;
  filters: UseJarvisMemoryOptions;
  setFilters: (filters: UseJarvisMemoryOptions) => void;
  createMemory: (
    type: JarvisMemoryItem['type'],
    content: string,
    project_slug?: string | null,
    importance?: number
  ) => Promise<JarvisMemoryItem | null>;
  deleteMemory: (id: string) => Promise<void>;
  updateMemory: (id: string, content: string) => Promise<void>;
  searchSemantic: (query: string) => Promise<JarvisMemoryItem[]>;
  refetch: () => void;
}

export function useJarvisMemory(initialFilters: UseJarvisMemoryOptions = {}): UseJarvisMemoryReturn {
  const [memories, setMemories] = useState<JarvisMemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseJarvisMemoryOptions>(initialFilters);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    async function fetchMemories() {
      setLoading(true);
      try {
        let query = supabase
          .from('jarvis_memory')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.project_slug) {
          query = query.eq('project_slug', filters.project_slug);
        }
        if (filters.search) {
          query = query.ilike('content', `%${filters.search}%`);
        }

        const { data, error: err } = await query;
        if (err) throw err;
        setMemories(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar memórias');
      } finally {
        setLoading(false);
      }
    }

    fetchMemories();
  }, [filters, refreshTick]);

  const refetch = useCallback(() => {
    setRefreshTick(t => t + 1);
  }, []);

  const createMemory = useCallback(async (
    type: JarvisMemoryItem['type'],
    content: string,
    project_slug: string | null = null,
    importance = 5
  ): Promise<JarvisMemoryItem | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error: err } = await supabase
        .from('jarvis_memory')
        .insert({
          user_id: user.id,
          type,
          content,
          project_slug,
          importance,
          source: 'jarvis_chat',
        })
        .select()
        .single();

      if (err) throw err;
      setMemories(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar memória');
      return null;
    }
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('jarvis_memory')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar memória');
    }
  }, []);

  const updateMemory = useCallback(async (id: string, content: string) => {
    try {
      const { error: err } = await supabase
        .from('jarvis_memory')
        .update({ content })
        .eq('id', id);

      if (err) throw err;
      setMemories(prev => prev.map(m => m.id === id ? { ...m, content } : m));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar memória');
    }
  }, []);

  // Busca semântica — sem embedding por agora, usa ilike
  const searchSemantic = useCallback(async (query: string): Promise<JarvisMemoryItem[]> => {
    try {
      const { data, error: err } = await supabase
        .from('jarvis_memory')
        .select('*')
        .ilike('content', `%${query}%`)
        .order('importance', { ascending: false })
        .limit(20);

      if (err) throw err;
      return data ?? [];
    } catch {
      return [];
    }
  }, []);

  return {
    memories,
    loading,
    error,
    filters,
    setFilters,
    createMemory,
    deleteMemory,
    updateMemory,
    searchSemantic,
    refetch,
  };
}
