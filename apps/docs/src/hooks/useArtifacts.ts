import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FactoryArtifact } from '../types';

export const useArtifacts = (agentId?: string) => {
  const [artifacts, setArtifacts] = useState<FactoryArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('factory_artifacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela factory_artifacts não encontrada.');
          setArtifacts([]);
        } else {
          throw error;
        }
      } else {
        setArtifacts(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching artifacts:', err);
      setError(err.message || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const uploadArtifact = async (artifact: Omit<FactoryArtifact, 'id' | 'created_at'>) => {
    try {
      const artifactToUpload = agentId ? { ...artifact, agent_id: agentId } : artifact;
      console.log('Iniciando upload de artefato:', artifactToUpload);
      const { data, error } = await supabase
        .from('factory_artifacts')
        .insert([artifactToUpload])
        .select()
        .single();

      if (error) {
        console.error('Erro retornado pelo Supabase ao inserir artefato:', error);
        throw error;
      }
      setArtifacts(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error uploading artifact:', err);
      // Retornar o erro completo para que o chamador possa exibir detalhes
      return { data: null, error: err };
    }
  };

  const deleteArtifact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('factory_artifacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setArtifacts(prev => prev.filter(a => a.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting artifact:', err);
      return { error: err };
    }
  };

  return { 
    artifacts, 
    loading, 
    error,
    refetch: fetchArtifacts,
    uploadArtifact,
    deleteArtifact
  };
};
