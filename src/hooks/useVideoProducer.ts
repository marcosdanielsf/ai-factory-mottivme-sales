import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type VideoFormat = "reel" | "short" | "long" | "carrossel";
export type VideoStatus =
  | "draft"
  | "audio_generating"
  | "audio_ready"
  | "video_generating"
  | "video_ready"
  | "publishing"
  | "published"
  | "failed";
export type TACOTrack = "T" | "A" | "C" | "O" | "H";
export type Brand = "vertex" | "socialfy" | "mottivme";

export interface VideoProductionItem {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  script: string;
  format: VideoFormat;
  duration_target: number;
  taco_track: TACOTrack | null;
  status: VideoStatus;
  error_message: string | null;
  voice_id: string | null;
  avatar_id: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  elevenlabs_request_id: string | null;
  heygen_video_id: string | null;
  publish_channels: string[];
  publish_results: Record<string, any>;
  scheduled_at: string | null;
  published_at: string | null;
  metadata: Record<string, any>;
  brand: Brand;
}

export interface VideoAvatar {
  id: string;
  created_at: string;
  name: string;
  provider: string;
  provider_avatar_id: string;
  brand: Brand;
  language: string;
  is_active: boolean;
  metadata: Record<string, any>;
  style?: string;
}

export interface VideoVoice {
  id: string;
  created_at: string;
  name: string;
  provider: string;
  provider_voice_id: string;
  brand: Brand;
  language: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface VideoMetrics {
  total: number;
  producing: number;
  ready: number;
  published: number;
  failed: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════

export const useVideoQueue = (brand?: Brand) => {
  const [items, setItems] = useState<VideoProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("video_production_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (brand) {
        query = query.eq("brand", brand);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setItems(data || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar fila de vídeos";
      setError(message);
      console.error("Error in useVideoQueue:", err);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchQueue();

    // Real-time subscription for status changes
    const channel = supabase
      .channel("video_queue_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_production_queue",
          filter: brand ? `brand=eq.${brand}` : undefined,
        },
        () => {
          fetchQueue();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueue, brand]);

  return { items, loading, error, refetch: fetchQueue };
};

export const useVideoItem = (id: string) => {
  const [item, setItem] = useState<VideoProductionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("video_production_queue")
        .select("*")
        .eq("id", id)
        .single();

      if (queryError) throw queryError;

      setItem(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar vídeo";
      setError(message);
      console.error("Error in useVideoItem:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetchItem();

    // Real-time subscription for this specific item
    const channel = supabase
      .channel(`video_item_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_production_queue",
          filter: `id=eq.${id}`,
        },
        () => {
          fetchItem();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItem, id]);

  return { item, loading, error, refetch: fetchItem };
};

export const useVideoAvatars = (brand?: Brand) => {
  const [avatars, setAvatars] = useState<VideoAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("video_avatars")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (brand) {
        query = query.eq("brand", brand);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setAvatars(data || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar avatares";
      setError(message);
      console.error("Error in useVideoAvatars:", err);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  return { avatars, loading, error, refetch: fetchAvatars };
};

export const useVideoVoices = (brand?: Brand) => {
  const [voices, setVoices] = useState<VideoVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("video_voices")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (brand) {
        query = query.eq("brand", brand);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setVoices(data || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar vozes";
      setError(message);
      console.error("Error in useVideoVoices:", err);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  return { voices, loading, error, refetch: fetchVoices };
};

export const useVideoMetrics = (brand?: Brand) => {
  const [metrics, setMetrics] = useState<VideoMetrics>({
    total: 0,
    producing: 0,
    ready: 0,
    published: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("video_production_queue").select("status");

      if (brand) {
        query = query.eq("brand", brand);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const items = data || [];
      const total = items.length;
      const producing = items.filter(
        (item) =>
          item.status === "audio_generating" ||
          item.status === "video_generating" ||
          item.status === "publishing",
      ).length;
      const ready = items.filter(
        (item) => item.status === "video_ready",
      ).length;
      const published = items.filter(
        (item) => item.status === "published",
      ).length;
      const failed = items.filter((item) => item.status === "failed").length;

      setMetrics({ total, producing, ready, published, failed });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar métricas";
      setError(message);
      console.error("Error in useVideoMetrics:", err);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

export const createVideoItem = async (
  data: Partial<VideoProductionItem>,
): Promise<string> => {
  try {
    const { data: inserted, error: insertError } = await supabase
      .from("video_production_queue")
      .insert({
        title: data.title,
        script: data.script,
        format: data.format,
        duration_target: data.duration_target,
        taco_track: data.taco_track,
        status: data.status || "draft",
        voice_id: data.voice_id,
        avatar_id: data.avatar_id,
        publish_channels: data.publish_channels || [],
        scheduled_at: data.scheduled_at,
        metadata: data.metadata || {},
        brand: data.brand || "mottivme",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return inserted.id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao criar vídeo";
    console.error("Error creating video item:", err);
    throw new Error(message);
  }
};

export const updateVideoItem = async (
  id: string,
  updates: Partial<VideoProductionItem>,
) => {
  try {
    const { error: updateError } = await supabase
      .from("video_production_queue")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar vídeo";
    console.error("Error updating video item:", err);
    throw new Error(message);
  }
};

export const deleteVideoItem = async (id: string) => {
  try {
    const { error: deleteError } = await supabase
      .from("video_production_queue")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao deletar vídeo";
    console.error("Error deleting video item:", err);
    throw new Error(message);
  }
};

export const triggerVideoProduction = async (id: string) => {
  try {
    // First, update status to indicate production started
    await updateVideoItem(id, { status: "audio_generating" });

    // Fetch the full item so we can send required fields to the webhook
    const { data: item, error: fetchError } = await supabase
      .from("video_production_queue")
      .select("voice_id, avatar_id, format, script")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Call webhook to start production
    const webhookUrl = import.meta.env.VITE_VIDEO_PRODUCTION_WEBHOOK;
    if (!webhookUrl) {
      throw new Error("VITE_VIDEO_PRODUCTION_WEBHOOK não configurado");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queue_id: id,
        voice_id: item.voice_id,
        avatar_id: item.avatar_id,
        format: item.format,
        script: item.script,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook failed: ${errorText}`);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao iniciar produção";
    console.error("Error triggering video production:", err);

    // Revert status on error
    await updateVideoItem(id, {
      status: "failed",
      error_message: message,
    });

    throw new Error(message);
  }
};
