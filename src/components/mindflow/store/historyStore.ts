
import { create } from "zustand";
import type { CanvasElement } from "../types/elements";

const MAX_SNAPSHOTS = 50;

interface HistoryStore {
  snapshots: CanvasElement[][];
  cursor: number;
  canUndo: boolean;
  canRedo: boolean;

  push: (elements: CanvasElement[]) => void;
  undo: () => CanvasElement[] | null;
  redo: () => CanvasElement[] | null;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  snapshots: [],
  cursor: -1,
  canUndo: false,
  canRedo: false,

  push: (elements) => {
    const { snapshots, cursor } = get();
    // Truncate redo history on new action
    const truncated = snapshots.slice(0, cursor + 1);
    const next = [...truncated, [...elements]].slice(-MAX_SNAPSHOTS);
    set({
      snapshots: next,
      cursor: next.length - 1,
      canUndo: next.length > 1,
      canRedo: false,
    });
  },

  undo: () => {
    const { snapshots, cursor } = get();
    if (cursor <= 0) return null;
    const newCursor = cursor - 1;
    set({
      cursor: newCursor,
      canUndo: newCursor > 0,
      canRedo: true,
    });
    return [...snapshots[newCursor]];
  },

  redo: () => {
    const { snapshots, cursor } = get();
    if (cursor >= snapshots.length - 1) return null;
    const newCursor = cursor + 1;
    set({
      cursor: newCursor,
      canUndo: true,
      canRedo: newCursor < snapshots.length - 1,
    });
    return [...snapshots[newCursor]];
  },
}));
