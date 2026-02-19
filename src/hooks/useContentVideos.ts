import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type VideoStatus = 'draft' | 'generate' | 'in_progress' | 'ready' | 'error' | 'not_required';

export interface ContentVideo {
  id: string;
  idea_id?: string;
  idea?: string;
  title_chosen?: string;
  status: VideoStatus;
  search_term?: string;
  similar_videos?: string;
  similar_summaries?: string;
  similar_script?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoInput {
  idea_id?: string;
  idea?: string;
  title_chosen?: string;
  search_term?: string;
}

export interface UseContentVideosOptions {
  status?: VideoStatus;
  search?: string;
}

export const useContentVideos = (options: UseContentVideosOptions = {}) => {
  const { status, search } = options;
  const [videos, setVideos] = useState<ContentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('content_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (search) {
        query = query.or(
          `idea.ilike.%${search}%,title_chosen.ilike.%${search}%,search_term.ilike.%${search}%`
        );
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setVideos(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar vídeos';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  const createVideo = useCallback(async (input: CreateVideoInput) => {
    const { data, error: insertError } = await supabase
      .from('content_videos')
      .insert({ ...input, status: 'draft' })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchVideos();
    return data;
  }, [fetchVideos]);

  const updateStatus = useCallback(async (id: string, newStatus: VideoStatus) => {
    const { error: updateError } = await supabase
      .from('content_videos')
      .update({ status: newStatus })
      .eq('id', id);

    if (updateError) throw updateError;
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('content_videos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setVideos(prev => prev.filter(v => v.id !== id));
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  return { videos, loading, error, refetch: fetchVideos, createVideo, updateStatus, deleteVideo };
};
