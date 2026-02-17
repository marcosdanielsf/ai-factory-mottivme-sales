import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ContentPiece {
  id: string;
  created_at: string;
  updated_at: string;
  campaign_id: string;
  type: 'post' | 'reel' | 'email' | 'ad' | 'story' | 'carousel';
  platform: 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube' | 'twitter' | 'email' | null;
  title: string | null;
  body: string;
  hook: string | null;
  cta: string | null;
  subject: string | null;
  preview_text: string | null;
  hashtags: string[] | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'carousel' | null;
  approval_status: 'pending' | 'approved' | 'rejected' | 'published' | 'scheduled';
  scheduled_at: string | null;
  published_at: string | null;
  ghl_post_id: string | null;
  generated_by: string;
  cost: number;
  metadata: Record<string, unknown>;
}

interface UseContentPiecesReturn {
  pieces: ContentPiece[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updatePiece: (id: string, updates: Partial<ContentPiece>) => Promise<ContentPiece | null>;
  approvePiece: (id: string) => Promise<boolean>;
  rejectPiece: (id: string) => Promise<boolean>;
  schedulePiece: (id: string, scheduledAt: string) => Promise<boolean>;
}

export function useContentPieces(filters?: {
  campaign_id?: string;
  approval_status?: string;
  type?: string;
  platform?: string;
}): UseContentPiecesReturn {
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('content_pieces')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }
    if (filters?.approval_status && filters.approval_status !== 'all') {
      query = query.eq('approval_status', filters.approval_status);
    }
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters?.platform && filters.platform !== 'all') {
      query = query.eq('platform', filters.platform);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPieces((data ?? []) as ContentPiece[]);
    }
    setLoading(false);
  }, [filters?.campaign_id, filters?.approval_status, filters?.type, filters?.platform]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updatePiece = useCallback(async (id: string, updates: Partial<ContentPiece>): Promise<ContentPiece | null> => {
    const { data, error: updateError } = await supabase
      .from('content_pieces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetch();
    return data as ContentPiece;
  }, [fetch]);

  const approvePiece = useCallback(async (id: string): Promise<boolean> => {
    const result = await updatePiece(id, { approval_status: 'approved' });
    return result !== null;
  }, [updatePiece]);

  const rejectPiece = useCallback(async (id: string): Promise<boolean> => {
    const result = await updatePiece(id, { approval_status: 'rejected' });
    return result !== null;
  }, [updatePiece]);

  const schedulePiece = useCallback(async (id: string, scheduledAt: string): Promise<boolean> => {
    const result = await updatePiece(id, { approval_status: 'scheduled', scheduled_at: scheduledAt });
    return result !== null;
  }, [updatePiece]);

  return { pieces, loading, error, refetch: fetch, updatePiece, approvePiece, rejectPiece, schedulePiece };
}
