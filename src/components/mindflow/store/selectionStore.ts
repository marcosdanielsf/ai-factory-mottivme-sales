
import { create } from "zustand";
import type { ToolType } from "../types/canvas";

interface SelectionStore {
  selected: string[];
  activeTool: ToolType;
  editingId: string | null;
  hoveredId: string | null;

  selectOne: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  toggleSelect: (id: string) => void;
  setTool: (tool: ToolType) => void;
  startEdit: (id: string) => void;
  commitEdit: () => void;
  setHovered: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionStore>()((set, get) => ({
  selected: [],
  activeTool: "select",
  editingId: null,
  hoveredId: null,

  selectOne: (id) => set({ selected: [id] }),

  selectMany: (ids) => set({ selected: ids }),

  clearSelection: () => set({ selected: [], editingId: null }),

  toggleSelect: (id) => {
    const { selected } = get();
    if (selected.includes(id)) {
      set({ selected: selected.filter((s) => s !== id) });
    } else {
      set({ selected: [...selected, id] });
    }
  },

  setTool: (tool) => set({ activeTool: tool, editingId: null }),

  startEdit: (id) => set({ editingId: id, selected: [id] }),

  commitEdit: () => set({ editingId: null }),

  setHovered: (id) => set({ hoveredId: id }),
}));
