import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FactoryArtifact } from '../../types';

export const useArtifacts = (agentId?: string) => {
  const [artifacts, setArtifacts] = useState<FactoryArtifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtifacts();
  }, [agentId]);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error('Error fetching artifacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadArtifact = async (artifact: Omit<FactoryArtifact, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('factory_artifacts')
        .insert([artifact])
        .select()
        .single();

      if (error) throw error;
      setArtifacts(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error uploading artifact:', err);
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
    refetch: fetchArtifacts,
    uploadArtifact,
    deleteArtifact
  };
};
