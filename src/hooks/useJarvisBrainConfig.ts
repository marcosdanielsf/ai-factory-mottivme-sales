import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JarvisBrainConfig } from '../types/jarvis';

const DEFAULT_CONFIG: Omit<JarvisBrainConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  keyword_confidence: 0.7,
  semantic_confidence: 0.8,
  max_docs_context: 5,
  max_conversations_context: 10,
  max_memories_context: 10,
  default_model: 'claude-haiku-4-5-20251001',
  rate_limit_per_minute: 20,
  max_response_length: 2048,
  confirm_destructive: true,
};

interface UseJarvisBrainConfigReturn {
  config: JarvisBrainConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (data: Partial<Omit<JarvisBrainConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  ensureConfig: () => Promise<JarvisBrainConfig | null>;
}

export function useJarvisBrainConfig(): UseJarvisBrainConfigReturn {
  const [config, setConfig] = useState<JarvisBrainConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: err } = await supabase
          .from('jarvis_brain_config')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (err) throw err;
        if (data) {
          setConfig(data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar configuração');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const ensureConfig = useCallback(async (): Promise<JarvisBrainConfig | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: existing } = await supabase
        .from('jarvis_brain_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setConfig(existing);
        return existing;
      }

      // Criar config padrão se não existir
      const { data: created, error: err } = await supabase
        .from('jarvis_brain_config')
        .insert({ ...DEFAULT_CONFIG, user_id: user.id })
        .select()
        .single();

      if (err) throw err;
      setConfig(created);
      return created;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao garantir configuração');
      return null;
    }
  }, []);

  const updateConfig = useCallback(async (
    data: Partial<Omit<JarvisBrainConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: upserted, error: err } = await supabase
        .from('jarvis_brain_config')
        .upsert(
          { ...DEFAULT_CONFIG, ...data, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (err) throw err;
      setConfig(upserted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar configuração');
    }
  }, []);

  return {
    config,
    loading,
    error,
    updateConfig,
    ensureConfig,
  };
}
