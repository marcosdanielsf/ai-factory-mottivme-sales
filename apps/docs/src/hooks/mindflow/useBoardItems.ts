import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ColumnValue } from "@/types/mindflow";

export const useBoardItems = (boardId: string | undefined) => {
  const createItem = useCallback(
    async (groupId: string, name: string, position: string) => {
      if (!boardId) return { data: null, error: { message: "No board ID" } };

      const {
        data: { user },
      } = await supabase.auth.getUser();

      return supabase.from("mindflow_items").insert({
        board_id: boardId,
        group_id: groupId,
        name,
        position,
        created_by: user?.id ?? "",
        column_values: {},
      });
    },
    [boardId],
  );

  const updateColumnValue = useCallback(
    async (itemId: string, columnId: string, value: ColumnValue) => {
      return supabase.rpc("mindflow_update_column_value", {
        p_item_id: itemId,
        p_column_id: columnId,
        p_value: value,
      });
    },
    [],
  );

  const updateName = useCallback(async (itemId: string, name: string) => {
    return supabase.from("mindflow_items").update({ name }).eq("id", itemId);
  }, []);

  const archiveItem = useCallback(async (itemId: string) => {
    return supabase
      .from("mindflow_items")
      .update({ is_archived: true })
      .eq("id", itemId);
  }, []);

  const moveItem = useCallback(
    async (itemId: string, targetGroupId: string, newPosition: string) => {
      return supabase.rpc("mindflow_move_item", {
        p_item_id: itemId,
        p_target_group_id: targetGroupId,
        p_new_position: newPosition,
      });
    },
    [],
  );

  return {
    createItem,
    updateColumnValue,
    updateName,
    archiveItem,
    moveItem,
  };
};
