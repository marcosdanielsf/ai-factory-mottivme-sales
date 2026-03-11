import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Board } from "../types/board";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateBoardInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface UpdateBoardInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface UseBoardsReturn {
  boards: Board[];
  loading: boolean;
  error: string | null;
  fetchBoards: () => Promise<void>;
  createBoard: (input: CreateBoardInput) => Promise<Board | null>;
  updateBoard: (id: string, updates: UpdateBoardInput) => Promise<boolean>;
  deleteBoard: (id: string) => Promise<boolean>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBoards(): UseBoardsReturn {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("boards")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setBoards((data as Board[]) ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar boards";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = useCallback(
    async (input: CreateBoardInput): Promise<Board | null> => {
      try {
        const slug = slugify(input.name);
        const { data, error: err } = await supabase
          .from("boards")
          .insert({
            name: input.name,
            slug,
            description: input.description ?? null,
            icon: input.icon ?? "📋",
            color: input.color ?? "#579BFC",
            settings: {},
          })
          .select()
          .single();

        if (err) throw err;
        const board = data as Board;
        setBoards((prev) => [board, ...prev]);
        return board;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao criar board";
        setError(msg);
        return null;
      }
    },
    [],
  );

  const updateBoard = useCallback(
    async (id: string, updates: UpdateBoardInput): Promise<boolean> => {
      // optimistic update
      setBoards((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      );
      try {
        const { error: err } = await supabase
          .from("boards")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (err) throw err;
        return true;
      } catch (e) {
        // rollback
        await fetchBoards();
        const msg = e instanceof Error ? e.message : "Erro ao atualizar board";
        setError(msg);
        return false;
      }
    },
    [fetchBoards],
  );

  const deleteBoard = useCallback(
    async (id: string): Promise<boolean> => {
      // optimistic
      setBoards((prev) => prev.filter((b) => b.id !== id));
      try {
        const { error: err } = await supabase
          .from("boards")
          .delete()
          .eq("id", id);

        if (err) throw err;
        return true;
      } catch (e) {
        await fetchBoards();
        const msg = e instanceof Error ? e.message : "Erro ao deletar board";
        setError(msg);
        return false;
      }
    },
    [fetchBoards],
  );

  return {
    boards,
    loading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}
