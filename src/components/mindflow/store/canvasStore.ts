
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { CanvasElement, CanvasOperation } from "../types/elements";
import type { LayoutType, Viewport } from "../types/canvas";
import { useHistoryStore } from "./historyStore";

let _uid = 1000;
const uid = () => `n${_uid++}`;

interface CanvasStore {
  // State
  elements: CanvasElement[];
  layout: LayoutType;
  viewport: Viewport;

  // Element actions
  addElement: (el: Omit<CanvasElement, "id">) => string;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;

  // Layout & viewport
  setLayout: (layout: LayoutType) => void;
  setViewport: (viewport: Viewport) => void;

  // Batch ops (for AI)
  batchUpdate: (ops: CanvasOperation[]) => void;
  replaceAll: (elements: CanvasElement[]) => void;

  // Derived helpers
  getElementById: (id: string) => CanvasElement | undefined;
  getChildren: (parentId: string) => CanvasElement[];
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    elements: [],
    layout: "radial",
    viewport: { x: 0, y: 0, zoom: 1 },

    addElement: (el) => {
      const id = uid();
      const newEl: CanvasElement = { ...el, id };
      set((s) => ({ elements: [...s.elements, newEl] }));
      useHistoryStore.getState().push(get().elements);
      return id;
    },

    updateElement: (id, patch) => {
      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id ? { ...el, ...patch } : el,
        ),
      }));
      useHistoryStore.getState().push(get().elements);
    },

    deleteElement: (id) => {
      // Delete element and all its descendants
      const allIds = new Set<string>();
      const collect = (targetId: string) => {
        allIds.add(targetId);
        get()
          .elements.filter((el) => el.parentId === targetId)
          .forEach((child) => collect(child.id));
      };
      collect(id);
      set((s) => ({ elements: s.elements.filter((el) => !allIds.has(el.id)) }));
      useHistoryStore.getState().push(get().elements);
    },

    moveElement: (id, x, y) => {
      // No history push during drag — push on mouseUp via historyStore.push directly
      set((s) => ({
        elements: s.elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
      }));
    },

    setLayout: (layout) => {
      set({ layout });
    },

    setViewport: (viewport) => {
      set({ viewport });
    },

    batchUpdate: (ops) => {
      set((s) => {
        let elements = [...s.elements];
        for (const op of ops) {
          if (op.op === "add" && op.element) {
            elements = [...elements, op.element];
          } else if (op.op === "update" && op.id && op.patch) {
            elements = elements.map((el) =>
              el.id === op.id ? { ...el, ...op.patch } : el,
            );
          } else if (op.op === "delete" && op.id) {
            elements = elements.filter((el) => el.id !== op.id);
          } else if (op.op === "move" && op.id && op.patch) {
            elements = elements.map((el) =>
              el.id === op.id
                ? { ...el, x: op.patch!.x ?? el.x, y: op.patch!.y ?? el.y }
                : el,
            );
          }
        }
        return { elements };
      });
      useHistoryStore.getState().push(get().elements);
    },

    replaceAll: (elements) => {
      set({ elements });
      useHistoryStore.getState().push(elements);
    },

    getElementById: (id) => get().elements.find((el) => el.id === id),

    getChildren: (parentId) =>
      get().elements.filter((el) => el.parentId === parentId),
  })),
);
