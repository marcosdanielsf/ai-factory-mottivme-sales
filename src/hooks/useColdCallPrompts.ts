import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────

export type PromptCategory = 'prospeccao' | 'followup' | 'qualificacao' | 'reativacao';

export interface ColdCallPrompt {
  id: string;
  name: string;
  description: string | null;
  category: PromptCategory;
  system_prompt: string;
  variables: Record<string, string>;
  voice_config: { speed: number; pitch: number };
  is_active: boolean;
  usage_count: number;
  avg_duration_seconds: number | null;
  conversion_rate: number | null;
  created_at: string;
  updated_at: string;
}

export type ColdCallPromptInsert = Omit<ColdCallPrompt, 'id' | 'usage_count' | 'avg_duration_seconds' | 'conversion_rate' | 'created_at' | 'updated_at'>;
export type ColdCallPromptUpdate = Partial<ColdCallPromptInsert>;

interface UseColdCallPromptsReturn {
  prompts: ColdCallPrompt[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPrompt: (data: ColdCallPromptInsert) => Promise<ColdCallPrompt | null>;
  updatePrompt: (id: string, data: ColdCallPromptUpdate) => Promise<ColdCallPrompt | null>;
  deletePrompt: (id: string) => Promise<boolean>;
  toggleActive: (id: string, isActive: boolean) => Promise<boolean>;
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useColdCallPrompts(): UseColdCallPromptsReturn {
  const [prompts, setPrompts] = useState<ColdCallPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('cold_call_prompts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (queryError) throw queryError;
      setPrompts((data as ColdCallPrompt[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar prompts';
      console.error('useColdCallPrompts fetch error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const createPrompt = useCallback(async (data: ColdCallPromptInsert): Promise<ColdCallPrompt | null> => {
    try {
      const { data: created, error: insertError } = await supabase
        .from('cold_call_prompts')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      const prompt = created as ColdCallPrompt;
      setPrompts(prev => [prompt, ...prev]);
      return prompt;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar prompt';
      console.error('createPrompt error:', err);
      setError(message);
      return null;
    }
  }, []);

  const updatePrompt = useCallback(async (id: string, data: ColdCallPromptUpdate): Promise<ColdCallPrompt | null> => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('cold_call_prompts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const prompt = updated as ColdCallPrompt;
      setPrompts(prev => prev.map(p => (p.id === id ? prompt : p)));
      return prompt;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar prompt';
      console.error('updatePrompt error:', err);
      setError(message);
      return null;
    }
  }, []);

  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('cold_call_prompts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPrompts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar prompt';
      console.error('deletePrompt error:', err);
      setError(message);
      return false;
    }
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error: toggleError } = await supabase
        .from('cold_call_prompts')
        .update({ is_active: isActive })
        .eq('id', id);

      if (toggleError) throw toggleError;

      setPrompts(prev => prev.map(p => (p.id === id ? { ...p, is_active: isActive } : p)));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status';
      console.error('toggleActive error:', err);
      setError(message);
      return false;
    }
  }, []);

  return {
    prompts,
    loading,
    error,
    refetch: fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleActive,
  };
}
