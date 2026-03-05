import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type {
  Board,
  BoardColumn,
  BoardGroup,
  BoardItem,
  BoardItemValue,
  BoardView,
  BoardData,
  ColumnType,
  BoardColumnSettings,
} from "../types/board";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CellValueInput {
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_json?: unknown | null;
}

interface UseBoardDataReturn {
  boardData: BoardData | null;
  loading: boolean;
  error: string | null;
  fetchBoardBySlug: (slug: string) => Promise<void>;
  addGroup: (
    boardId: string,
    name: string,
    color: string,
  ) => Promise<BoardGroup | null>;
  addItem: (
    boardId: string,
    groupId: string,
    name: string,
  ) => Promise<BoardItem | null>;
  updateItemName: (itemId: string, name: string) => void;
  updateItemValue: (
    itemId: string,
    columnId: string,
    value: CellValueInput,
  ) => void;
  moveItem: (
    itemId: string,
    newGroupId: string,
    newPosition: number,
  ) => Promise<void>;
  reorderItems: (groupId: string, orderedIds: string[]) => Promise<void>;
  deleteItem: (itemId: string) => Promise<boolean>;
  addColumn: (
    boardId: string,
    name: string,
    type: ColumnType,
    settings?: BoardColumnSettings,
  ) => Promise<BoardColumn | null>;
  updateColumn: (
    columnId: string,
    updates: Partial<
      Pick<BoardColumn, "name" | "settings" | "width" | "is_visible">
    >,
  ) => Promise<boolean>;
  deleteColumn: (columnId: string) => Promise<boolean>;
  updateGroupName: (groupId: string, name: string) => Promise<boolean>;
  toggleGroupCollapsed: (groupId: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBoardData(): UseBoardDataReturn {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para debounce de saves de celula
  const pendingSaves = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBoardBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      // Queries paralelas
      const [boardRes, columnsRes, groupsRes, itemsRes, viewsRes] =
        await Promise.all([
          supabase.from("boards").select("*").eq("slug", slug).single(),
          supabase.from("board_columns").select("*").order("position"),
          supabase.from("board_groups").select("*").order("position"),
          supabase
            .from("board_items")
            .select("*, values:board_item_values(*)")
            .order("position"),
          supabase.from("board_views").select("*").order("position"),
        ]);

      if (boardRes.error) throw boardRes.error;

      const board = boardRes.data as Board;

      // Filtrar por board_id no cliente (queries paralelas sem join em board_id)
      const columns = ((columnsRes.data ?? []) as BoardColumn[]).filter(
        (c) => c.board_id === board.id,
      );
      const groups = ((groupsRes.data ?? []) as BoardGroup[]).filter(
        (g) => g.board_id === board.id,
      );
      const items = ((itemsRes.data ?? []) as BoardItem[]).filter(
        (i) => i.board_id === board.id,
      );
      const views = ((viewsRes.data ?? []) as BoardView[]).filter(
        (v) => v.board_id === board.id,
      );

      // Indexar items por group_id
      const itemsByGroup: Record<string, BoardItem[]> = {};
      for (const item of items) {
        if (!itemsByGroup[item.group_id]) itemsByGroup[item.group_id] = [];
        itemsByGroup[item.group_id].push(item);
      }

      setBoardData({ board, columns, groups, items, views, itemsByGroup });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar board";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Groups ─────────────────────────────────────────────────────────────────

  const addGroup = useCallback(
    async (
      boardId: string,
      name: string,
      color: string,
    ): Promise<BoardGroup | null> => {
      if (!boardData) return null;
      const position = boardData.groups.length;
      try {
        const { data, error: err } = await supabase
          .from("board_groups")
          .insert({
            board_id: boardId,
            name,
            color,
            position,
            collapsed: false,
          })
          .select()
          .single();

        if (err) throw err;
        const group = data as BoardGroup;
        setBoardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            groups: [...prev.groups, group],
            itemsByGroup: { ...prev.itemsByGroup, [group.id]: [] },
          };
        });
        return group;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao criar grupo";
        setError(msg);
        return null;
      }
    },
    [boardData],
  );

  const updateGroupName = useCallback(
    async (groupId: string, name: string): Promise<boolean> => {
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          groups: prev.groups.map((g) =>
            g.id === groupId ? { ...g, name } : g,
          ),
        };
      });
      try {
        const { error: err } = await supabase
          .from("board_groups")
          .update({ name })
          .eq("id", groupId);
        if (err) throw err;
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const toggleGroupCollapsed = useCallback((groupId: string) => {
    setBoardData((prev) => {
      if (!prev) return prev;
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const collapsed = !group.collapsed;
      // fire-and-forget save
      supabase
        .from("board_groups")
        .update({ collapsed })
        .eq("id", groupId)
        .then(() => {});
      return {
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, collapsed } : g,
        ),
      };
    });
  }, []);

  // ── Items ──────────────────────────────────────────────────────────────────

  const addItem = useCallback(
    async (
      boardId: string,
      groupId: string,
      name: string,
    ): Promise<BoardItem | null> => {
      if (!boardData) return null;
      const groupItems = boardData.itemsByGroup[groupId] ?? [];
      const position = groupItems.length;
      try {
        const { data, error: err } = await supabase
          .from("board_items")
          .insert({ board_id: boardId, group_id: groupId, name, position })
          .select()
          .single();

        if (err) throw err;
        const item = { ...(data as BoardItem), values: [] };
        setBoardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: [...prev.items, item],
            itemsByGroup: {
              ...prev.itemsByGroup,
              [groupId]: [...(prev.itemsByGroup[groupId] ?? []), item],
            },
          };
        });
        return item;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao criar item";
        setError(msg);
        return null;
      }
    },
    [boardData],
  );

  // Atualiza nome do item com optimistic update + debounce save
  const updateItemName = useCallback((itemId: string, name: string) => {
    setBoardData((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((i) =>
        i.id === itemId ? { ...i, name } : i,
      );
      const updatedByGroup: Record<string, BoardItem[]> = {};
      for (const [gid, items] of Object.entries(prev.itemsByGroup)) {
        updatedByGroup[gid] = items.map((i) =>
          i.id === itemId ? { ...i, name } : i,
        );
      }
      return { ...prev, items: updatedItems, itemsByGroup: updatedByGroup };
    });

    const key = `item-name-${itemId}`;
    const existing = pendingSaves.current.get(key);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      supabase
        .from("board_items")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", itemId)
        .then(() => {});
      pendingSaves.current.delete(key);
    }, 300);
    pendingSaves.current.set(key, t);
  }, []);

  // Atualiza valor de celula com optimistic update + debounce 300ms
  const updateItemValue = useCallback(
    (itemId: string, columnId: string, value: CellValueInput) => {
      // Optimistic update
      setBoardData((prev) => {
        if (!prev) return prev;
        const updateValues = (item: BoardItem): BoardItem => {
          if (item.id !== itemId) return item;
          const existing = item.values ?? [];
          const idx = existing.findIndex((v) => v.column_id === columnId);
          let newValues: BoardItemValue[];
          if (idx >= 0) {
            newValues = existing.map((v, i) =>
              i === idx ? { ...v, ...value } : v,
            );
          } else {
            newValues = [
              ...existing,
              {
                id: `optimistic-${Date.now()}`,
                item_id: itemId,
                column_id: columnId,
                value_text: null,
                value_number: null,
                value_date: null,
                value_json: null,
                ...value,
              },
            ];
          }
          return { ...item, values: newValues };
        };

        const updatedItems = prev.items.map(updateValues);
        const updatedByGroup: Record<string, BoardItem[]> = {};
        for (const [gid, items] of Object.entries(prev.itemsByGroup)) {
          updatedByGroup[gid] = items.map(updateValues);
        }
        return { ...prev, items: updatedItems, itemsByGroup: updatedByGroup };
      });

      // Debounced save
      const key = `cell-${itemId}-${columnId}`;
      const existing = pendingSaves.current.get(key);
      if (existing) clearTimeout(existing);
      const t = setTimeout(async () => {
        pendingSaves.current.delete(key);
        // Upsert por item_id + column_id
        const { data: existing_val } = await supabase
          .from("board_item_values")
          .select("id")
          .eq("item_id", itemId)
          .eq("column_id", columnId)
          .maybeSingle();

        if (existing_val) {
          await supabase
            .from("board_item_values")
            .update(value)
            .eq("id", existing_val.id);
        } else {
          await supabase
            .from("board_item_values")
            .insert({ item_id: itemId, column_id: columnId, ...value });
        }
      }, 300);
      pendingSaves.current.set(key, t);
    },
    [],
  );

  const moveItem = useCallback(
    async (itemId: string, newGroupId: string, newPosition: number) => {
      setBoardData((prev) => {
        if (!prev) return prev;
        const item = prev.items.find((i) => i.id === itemId);
        if (!item) return prev;
        const oldGroupId = item.group_id;
        const updatedItem = {
          ...item,
          group_id: newGroupId,
          position: newPosition,
        };
        const updatedItems = prev.items.map((i) =>
          i.id === itemId ? updatedItem : i,
        );
        const updatedByGroup = { ...prev.itemsByGroup };
        updatedByGroup[oldGroupId] = (updatedByGroup[oldGroupId] ?? []).filter(
          (i) => i.id !== itemId,
        );
        const targetGroup = [...(updatedByGroup[newGroupId] ?? [])];
        targetGroup.splice(newPosition, 0, updatedItem);
        updatedByGroup[newGroupId] = targetGroup;
        return { ...prev, items: updatedItems, itemsByGroup: updatedByGroup };
      });

      await supabase
        .from("board_items")
        .update({ group_id: newGroupId, position: newPosition })
        .eq("id", itemId);
    },
    [],
  );

  const reorderItems = useCallback(
    async (groupId: string, orderedIds: string[]) => {
      setBoardData((prev) => {
        if (!prev) return prev;
        const groupItems = [...(prev.itemsByGroup[groupId] ?? [])];
        const reordered = orderedIds
          .map((id) => groupItems.find((i) => i.id === id))
          .filter((i): i is BoardItem => !!i)
          .map((item, idx) => ({ ...item, position: idx }));

        const updatedItems = prev.items.map((item) => {
          const r = reordered.find((ri) => ri.id === item.id);
          return r ?? item;
        });

        return {
          ...prev,
          items: updatedItems,
          itemsByGroup: { ...prev.itemsByGroup, [groupId]: reordered },
        };
      });

      // Salva posicoes no banco
      const updates = orderedIds.map((id, idx) =>
        supabase.from("board_items").update({ position: idx }).eq("id", id),
      );
      await Promise.all(updates);
    },
    [],
  );

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    setBoardData((prev) => {
      if (!prev) return prev;
      const item = prev.items.find((i) => i.id === itemId);
      if (!item) return prev;
      const updatedByGroup = { ...prev.itemsByGroup };
      updatedByGroup[item.group_id] = (
        updatedByGroup[item.group_id] ?? []
      ).filter((i) => i.id !== itemId);
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
        itemsByGroup: updatedByGroup,
      };
    });

    try {
      const { error: err } = await supabase
        .from("board_items")
        .delete()
        .eq("id", itemId);
      if (err) throw err;
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Columns ────────────────────────────────────────────────────────────────

  const addColumn = useCallback(
    async (
      boardId: string,
      name: string,
      type: ColumnType,
      settings: BoardColumnSettings = {},
    ): Promise<BoardColumn | null> => {
      if (!boardData) return null;
      const position = boardData.columns.length;
      try {
        const { data, error: err } = await supabase
          .from("board_columns")
          .insert({
            board_id: boardId,
            name,
            column_type: type,
            settings,
            position,
            is_visible: true,
          })
          .select()
          .single();

        if (err) throw err;
        const column = data as BoardColumn;
        setBoardData((prev) => {
          if (!prev) return prev;
          return { ...prev, columns: [...prev.columns, column] };
        });
        return column;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao criar coluna";
        setError(msg);
        return null;
      }
    },
    [boardData],
  );

  const updateColumn = useCallback(
    async (
      columnId: string,
      updates: Partial<
        Pick<BoardColumn, "name" | "settings" | "width" | "is_visible">
      >,
    ): Promise<boolean> => {
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, ...updates } : c,
          ),
        };
      });
      try {
        const { error: err } = await supabase
          .from("board_columns")
          .update(updates)
          .eq("id", columnId);
        if (err) throw err;
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const deleteColumn = useCallback(
    async (columnId: string): Promise<boolean> => {
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
        };
      });
      try {
        const { error: err } = await supabase
          .from("board_columns")
          .delete()
          .eq("id", columnId);
        if (err) throw err;
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  return {
    boardData,
    loading,
    error,
    fetchBoardBySlug,
    addGroup,
    addItem,
    updateItemName,
    updateItemValue,
    moveItem,
    reorderItems,
    deleteItem,
    addColumn,
    updateColumn,
    deleteColumn,
    updateGroupName,
    toggleGroupCollapsed,
  };
}
