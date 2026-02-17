const PUBLISH_WEBHOOK = import.meta.env.VITE_CONTENT_PUBLISH_WEBHOOK || 'https://cliente-a1.mentorfy.io/webhook/content-publish';
const VIDEO_WEBHOOK = import.meta.env.VITE_VIDEO_PRODUCTION_WEBHOOK || 'https://cliente-a1.mentorfy.io/webhook/video-produce';

// --- Publish to GHL via n8n ---

export interface PublishRequest {
  content_id: string;
  body: string;
  type: 'post' | 'reel' | 'story' | 'carousel' | 'email' | 'ad';
  platform: string;
  media_url?: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
  schedule_date?: string;
  location_id?: string;
}

export interface PublishResponse {
  success: boolean;
  ghl_post_id?: string;
  error?: string;
}

export async function publishToGHL(request: PublishRequest): Promise<PublishResponse> {
  try {
    const res = await fetch(PUBLISH_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook error: ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, ghl_post_id: data.ghl_post_id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao publicar',
    };
  }
}

// --- Video Production via n8n ---

export interface VideoRequest {
  roteiro: string;
  voice_id?: string;
  avatar_id?: string;
  compose?: boolean;
  background_video_url?: string;
  content_id?: string;
}

export interface VideoResponse {
  success: boolean;
  queue_id?: string;
  error?: string;
}

export async function requestVideoProduction(request: VideoRequest): Promise<VideoResponse> {
  const payload = {
    roteiro: request.roteiro,
    voice_id: request.voice_id || 'eVXYtPVYB9wDoz9NVTIy', // Carla PT-BR
    avatar_id: request.avatar_id || '3e5d7c980b4146f3947806b917d54c32', // Diana
    compose: request.compose ?? false,
    background_video_url: request.background_video_url,
    content_id: request.content_id,
  };

  try {
    const res = await fetch(VIDEO_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook error: ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, queue_id: data.queue_id || data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao gerar video',
    };
  }
}
