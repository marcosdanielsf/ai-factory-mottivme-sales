import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type IdeaSource = 'channel_monitoring' | 'trending_videos' | 'similar_video';
export type IdeaPlatform = 'youtube' | 'instagram' | 'tiktok';

export interface ContentIdea {
  id: string;
  video_title: string;
  channel_name?: string;
  video_summary?: string;
  duration?: string;
  upload_date?: string;
  source?: IdeaSource;
  platform?: IdeaPlatform;
  channel_url?: string;
  views: number;
  likes: number;
  comments: number;
  video_url?: string;
  video_description?: string;
  video_tags?: string;
  script_summary?: string;
  transcript?: string;
  shortlist: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaInput {
  video_title: string;
  channel_name?: string;
  video_summary?: string;
  duration?: string;
  upload_date?: string;
  source?: IdeaSource;
  platform?: IdeaPlatform;
  channel_url?: string;
  views?: number;
  likes?: number;
  comments?: number;
  video_url?: string;
  video_description?: string;
  video_tags?: string;
  script_summary?: string;
  transcript?: string;
}

export interface UseContentIdeasOptions {
  platform?: IdeaPlatform;
  source?: IdeaSource;
  shortlistOnly?: boolean;
  search?: string;
}

export const useContentIdeas = (options: UseContentIdeasOptions = {}) => {
  const { platform, source, shortlistOnly, search } = options;
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('content_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (platform) query = query.eq('platform', platform);
      if (source) query = query.eq('source', source);
      if (shortlistOnly) query = query.eq('shortlist', true);
      if (search) {
        query = query.or(
          `video_title.ilike.%${search}%,channel_name.ilike.%${search}%,video_tags.ilike.%${search}%`
        );
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setIdeas(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar ideias';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [platform, source, shortlistOnly, search]);

  const createIdea = useCallback(async (input: CreateIdeaInput) => {
    const { data, error: insertError } = await supabase
      .from('content_ideas')
      .insert({ ...input, shortlist: false })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchIdeas();
    return data;
  }, [fetchIdeas]);

  const toggleShortlist = useCallback(async (id: string, current: boolean) => {
    const { error: updateError } = await supabase
      .from('content_ideas')
      .update({ shortlist: !current })
      .eq('id', id);

    if (updateError) throw updateError;
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, shortlist: !current } : i));
  }, []);

  const deleteIdea = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('content_ideas')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setIdeas(prev => prev.filter(i => i.id !== id));
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  return { ideas, loading, error, refetch: fetchIdeas, createIdea, toggleShortlist, deleteIdea };
};
