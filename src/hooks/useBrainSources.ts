import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export type SourceType =
  | "youtube"
  | "pdf"
  | "audio"
  | "webpage"
  | "transcript"
  | "note"
  | "spreadsheet"
  | "other";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface KnowledgeSource {
  id: string;
  title: string;
  source_type: SourceType;
  source_url: string | null;
  file_path: string | null;
  author: string | null;
  processing_status: ProcessingStatus;
  total_chunks: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateSourceData {
  title: string;
  source_type: SourceType;
  source_url?: string;
  author?: string;
}

interface UseBrainSourcesResult {
  sources: KnowledgeSource[];
  loading: boolean;
  error: string | null;
  fetchSources: () => Promise<void>;
  createSource: (
    data: CreateSourceData,
  ) => Promise<{ source: KnowledgeSource | null; error: string | null }>;
}

export function useBrainSources(): UseBrainSourcesResult {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from("knowledge_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setSources((data as KnowledgeSource[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Auto-refresh se há sources em processamento
  useEffect(() => {
    const hasProcessing = sources.some(
      (s) =>
        s.processing_status === "processing" ||
        s.processing_status === "pending",
    );
    if (!hasProcessing) return;
    const interval = setInterval(fetchSources, 5000);
    return () => clearInterval(interval);
  }, [sources, fetchSources]);

  const createSource = async (data: CreateSourceData) => {
    const { data: source, error: err } = await supabase
      .from("knowledge_sources")
      .insert({
        title: data.title,
        source_type: data.source_type,
        source_url: data.source_url || null,
        author: data.author || null,
        processing_status: "pending",
        total_chunks: 0,
      })
      .select()
      .single();

    if (err) {
      return { source: null, error: err.message };
    }

    await fetchSources();
    return { source: source as KnowledgeSource, error: null };
  };

  return { sources, loading, error, fetchSources, createSource };
}
