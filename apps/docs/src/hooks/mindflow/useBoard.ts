import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  MindflowBoard,
  MindflowGroup,
  MindflowItem,
} from "@/types/mindflow";

interface UseBoardState {
  board: MindflowBoard | null;
  groups: MindflowGroup[];
  items: MindflowItem[];
  loading: boolean;
  error: string | null;
}

export const useBoard = (boardId: string | undefined) => {
  const [state, setState] = useState<UseBoardState>({
    board: null,
    groups: [],
    items: [],
    loading: true,
    error: null,
  });

  const fetchBoard = useCallback(async () => {
    if (!boardId) {
      setState({
        board: null,
        groups: [],
        items: [],
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [boardRes, groupsRes, itemsRes] = await Promise.all([
        supabase.from("mindflow_boards").select("*").eq("id", boardId).single(),
        supabase
          .from("mindflow_groups")
          .select("*")
          .eq("board_id", boardId)
          .order("position"),
        supabase
          .from("mindflow_items")
          .select("*")
          .eq("board_id", boardId)
          .eq("is_archived", false)
          .order("position"),
      ]);

      if (boardRes.error) throw boardRes.error;

      setState({
        board: boardRes.data as MindflowBoard,
        groups: (groupsRes.data as MindflowGroup[]) || [],
        items: (itemsRes.data as MindflowItem[]) || [],
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Erro ao carregar board",
      }));
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return {
    board: state.board,
    groups: state.groups,
    items: state.items,
    loading: state.loading,
    error: state.error,
    refetch: fetchBoard,
  };
};
