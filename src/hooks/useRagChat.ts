import { useState, useCallback, useEffect, useRef } from "react";
import { getErrorMessage } from "@/lib/getErrorMessage";

interface RagSource {
  id: string;
  score: number;
  metadata: {
    source_file?: string;
    file_type?: string;
    content_type?: string;
    text_preview?: string;
    page_number?: number;
    media_path?: string;
  };
}

interface RagMessage {
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  timestamp: number;
}

interface RagStats {
  totalVectors: number;
  namespaces: Record<string, { vector_count?: number }>;
}

export function useRagChat() {
  const [messages, setMessages] = useState<RagMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RagStats | null>(null);
  const fetchedStats = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/rag/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silent fail for stats
    }
  }, []);

  useEffect(() => {
    if (!fetchedStats.current) {
      fetchedStats.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || loading) return;

      setError(null);

      const userMsg: RagMessage = {
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/rag/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, topK: 5 }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message || errData.error || `HTTP ${res.status}`,
          );
        }

        const data = await res.json();

        const assistantMsg: RagMessage = {
          role: "assistant",
          content: data.answer || "Sem resposta.",
          sources: data.sources || [],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        const errorMsg: RagMessage = {
          role: "assistant",
          content: `Erro: ${getErrorMessage(err)}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    stats,
    sendMessage,
    clearMessages,
    refetchStats: fetchStats,
  };
}
