import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { ProjectTask, TaskStatus } from './types';
import { getErrorMessage } from "../../lib/getErrorMessage";

// =============================================
// useProjectTasks — Fetch + filter tasks
// =============================================

export function useProjectTasks(projectKey?: string) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('mottivme_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectKey && projectKey !== 'all') {
        query = query.eq('project_key', projectKey);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setTasks((data || []) as ProjectTask[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Erro ao carregar tarefas');
      console.error('useProjectTasks error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, setTasks, loading, error, refetch: fetchTasks };
}

// =============================================
// useTaskMutations — CRUD operations
// =============================================

export function useTaskMutations(
  setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>
) {
  const [saving, setSaving] = useState(false);

  const createTask = async (
    data: Partial<ProjectTask>
  ): Promise<ProjectTask | null> => {
    setSaving(true);
    try {
      const { data: created, error } = await supabase
        .from('mottivme_tasks')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      const task = created as ProjectTask;
      setTasks((prev) => [task, ...prev]);
      return task;
    } catch (err: unknown) {
      console.error('createTask error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (
    id: string,
    data: Partial<ProjectTask>
  ): Promise<ProjectTask | null> => {
    setSaving(true);
    try {
      const { data: updated, error } = await supabase
        .from('mottivme_tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const task = updated as ProjectTask;
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      return task;
    } catch (err: unknown) {
      console.error('updateTask error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );

    try {
      const { error } = await supabase
        .from('mottivme_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err: unknown) {
      console.error('updateStatus error:', err);
      // Revert handled by caller if needed
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mottivme_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: unknown) {
      console.error('deleteTask error:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { createTask, updateTask, updateStatus, deleteTask, saving };
}
