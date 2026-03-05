import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const useBoardGroups = (boardId: string | undefined) => {
  const createGroup = useCallback(
    async (name: string, position: string, color?: string) => {
      if (!boardId) return { data: null, error: { message: "No board ID" } };

      return supabase.from("mindflow_groups").insert({
        board_id: boardId,
        name,
        position,
        color: color ?? "#6C6CFF",
      });
    },
    [boardId],
  );

  const updateGroup = useCallback(
    async (
      groupId: string,
      updates: Partial<{ name: string; color: string; is_collapsed: boolean }>,
    ) => {
      return supabase.from("mindflow_groups").update(updates).eq("id", groupId);
    },
    [],
  );

  const deleteGroup = useCallback(async (groupId: string) => {
    return supabase.from("mindflow_groups").delete().eq("id", groupId);
  }, []);

  const reorderGroup = useCallback(
    async (groupId: string, newPosition: string) => {
      return supabase.rpc("mindflow_reorder_group", {
        p_group_id: groupId,
        p_new_position: newPosition,
      });
    },
    [],
  );

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroup,
  };
};
