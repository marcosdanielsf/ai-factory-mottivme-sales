import { useEffect, useState, useCallback } from 'react';
import { listContentsByProject, updateContent as apiUpdateContent } from '../lib/assemblyLineApi';
import type { AssemblyLineContent } from '../lib/assemblyLineApi';
import { publishToGHL, requestVideoProduction } from '../lib/contentPublisher';
import type { PublishRequest } from '../lib/contentPublisher';

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

function mapToPiece(content: AssemblyLineContent, projectId: string): ContentPiece {
  const statusMap: Record<string, ContentPiece['approval_status']> = {
    draft: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    published: 'published',
  };

  return {
    id: content.id,
    created_at: content.created_at,
    updated_at: content.updated_at,
    campaign_id: projectId,
    type: content.type as ContentPiece['type'],
    platform: null,
    title: content.title,
    body: content.body || '',
    hook: content.hook,
    cta: content.cta,
    subject: content.subject,
    preview_text: content.preview_text,
    hashtags: null,
    media_url: null,
    media_type: null,
    approval_status: statusMap[content.status] || 'pending',
    scheduled_at: null,
    published_at: content.published_at,
    ghl_post_id: null,
    generated_by: content.generated_by || 'assembly-line',
    cost: 0,
    metadata: {},
  };
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
  publishPiece: (id: string, platform: string, scheduleDate?: string) => Promise<boolean>;
  generateVideo: (id: string) => Promise<boolean>;
  publishingId: string | null;
  generatingVideoId: string | null;
}

export function useContentPieces(filters?: {
  campaign_id?: string;
  assembly_line_project_id?: string;
  approval_status?: string;
  type?: string;
  platform?: string;
}): UseContentPiecesReturn {
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);

  const projectId = filters?.assembly_line_project_id;

  const fetchPieces = useCallback(async () => {
    if (!projectId) {
      setPieces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiFilters: { type?: string; status?: string } = {};
      if (filters?.type && filters.type !== 'all') apiFilters.type = filters.type;
      if (filters?.approval_status && filters.approval_status !== 'all') {
        const reverseMap: Record<string, string> = {
          pending: 'draft',
          approved: 'approved',
          rejected: 'rejected',
          published: 'published',
        };
        apiFilters.status = reverseMap[filters.approval_status] || filters.approval_status;
      }

      const result = await listContentsByProject(projectId, apiFilters);
      const mapped = result.contents.map(c => mapToPiece(c, projectId));
      setPieces(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar conteudos';
      setError(msg);
      setPieces([]);
    }

    setLoading(false);
  }, [projectId, filters?.type, filters?.approval_status]);

  useEffect(() => {
    fetchPieces();
  }, [fetchPieces]);

  const updatePiece = useCallback(async (id: string, updates: Partial<ContentPiece>): Promise<ContentPiece | null> => {
    try {
      const apiUpdates: Record<string, string | undefined> = {};

      if (updates.approval_status) {
        const statusMap: Record<string, string> = {
          pending: 'draft',
          approved: 'approved',
          rejected: 'rejected',
          published: 'published',
        };
        apiUpdates.status = statusMap[updates.approval_status] || updates.approval_status;
      }
      if (updates.title !== undefined) apiUpdates.title = updates.title || undefined;
      if (updates.body !== undefined) apiUpdates.body = updates.body;
      if (updates.hook !== undefined) apiUpdates.hook = updates.hook || undefined;
      if (updates.cta !== undefined) apiUpdates.cta = updates.cta || undefined;

      const result = await apiUpdateContent(id, apiUpdates);
      await fetchPieces();
      return mapToPiece(result.content, projectId || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar';
      setError(msg);
      return null;
    }
  }, [fetchPieces, projectId]);

  const approvePiece = useCallback(async (id: string): Promise<boolean> => {
    const result = await updatePiece(id, { approval_status: 'approved' });
    return result !== null;
  }, [updatePiece]);

  const rejectPiece = useCallback(async (id: string): Promise<boolean> => {
    const result = await updatePiece(id, { approval_status: 'rejected' });
    return result !== null;
  }, [updatePiece]);

  const schedulePiece = useCallback(async (id: string, _scheduledAt: string): Promise<boolean> => {
    // Scheduling via Assembly Line — for now just approve
    const result = await updatePiece(id, { approval_status: 'approved' });
    return result !== null;
  }, [updatePiece]);

  const publishPiece = useCallback(async (id: string, platform: string, scheduleDate?: string): Promise<boolean> => {
    const piece = pieces.find(p => p.id === id);
    if (!piece) return false;

    setPublishingId(id);
    setError(null);

    try {
      const request: PublishRequest = {
        content_id: id,
        body: piece.body,
        type: piece.type,
        platform,
        media_url: piece.media_url || undefined,
        hook: piece.hook || undefined,
        cta: piece.cta || undefined,
        hashtags: piece.hashtags || undefined,
        schedule_date: scheduleDate,
      };

      const result = await publishToGHL(request);

      if (!result.success) {
        setError(result.error || 'Erro ao publicar no GHL');
        setPublishingId(null);
        return false;
      }

      // Update status in Assembly Line API
      await updatePiece(id, { approval_status: 'published' });
      setPublishingId(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar');
      setPublishingId(null);
      return false;
    }
  }, [pieces, updatePiece]);

  const generateVideo = useCallback(async (id: string): Promise<boolean> => {
    const piece = pieces.find(p => p.id === id);
    if (!piece) return false;

    setGeneratingVideoId(id);
    setError(null);

    try {
      // Build script from piece content
      const roteiro = [piece.hook, piece.body, piece.cta].filter(Boolean).join('\n\n');

      const result = await requestVideoProduction({
        roteiro,
        content_id: id,
      });

      if (!result.success) {
        setError(result.error || 'Erro ao gerar video');
        setGeneratingVideoId(null);
        return false;
      }

      // Video is generating in background (~4min)
      // The webhook will update the content when done
      setGeneratingVideoId(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar video');
      setGeneratingVideoId(null);
      return false;
    }
  }, [pieces]);

  return {
    pieces, loading, error, refetch: fetchPieces,
    updatePiece, approvePiece, rejectPiece, schedulePiece,
    publishPiece, generateVideo, publishingId, generatingVideoId,
  };
}
