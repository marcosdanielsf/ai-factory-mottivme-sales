import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JarvisProject } from '../types/jarvis';

type CreateProjectInput = Omit<JarvisProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type UpdateProjectInput = Partial<Omit<JarvisProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

interface UseJarvisProjectsReturn {
  projects: JarvisProject[];
  loading: boolean;
  error: string | null;
  createProject: (data: CreateProjectInput) => Promise<JarvisProject | null>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectBySlug: (slug: string) => JarvisProject | null;
  refetch: () => void;
}

export function useJarvisProjects(): UseJarvisProjectsReturn {
  const [projects, setProjects] = useState<JarvisProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('jarvis_projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;
        setProjects(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar projetos');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [refreshTick]);

  const refetch = useCallback(() => setRefreshTick(t => t + 1), []);

  const createProject = useCallback(async (data: CreateProjectInput): Promise<JarvisProject | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: created, error: err } = await supabase
        .from('jarvis_projects')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (err) throw err;
      setProjects(prev => [created, ...prev]);
      return created;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar projeto');
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: UpdateProjectInput) => {
    try {
      const { error: err } = await supabase
        .from('jarvis_projects')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (err) throw err;
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar projeto');
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('jarvis_projects')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar projeto');
    }
  }, []);

  const getProjectBySlug = useCallback((slug: string): JarvisProject | null => {
    return projects.find(p => p.slug === slug) ?? null;
  }, [projects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProjectBySlug,
    refetch,
  };
}
