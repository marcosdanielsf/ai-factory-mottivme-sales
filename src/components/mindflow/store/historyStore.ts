import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

const MAX_SNAPSHOTS = 50;

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

interface HistoryStore {
  past: Snapshot[];
  future: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;

  /** Call BEFORE a mutation with current nodes/edges */
  saveSnapshot: (nodes: Node[], edges: Edge[]) => void;
  /** Undo: pops from past, pushes current to future, returns previous snapshot */
  undo: (currentNodes: Node[], currentEdges: Edge[]) => Snapshot | null;
  /** Redo: pops from future, pushes current to past, returns next snapshot */
  redo: (currentNodes: Node[], currentEdges: Edge[]) => Snapshot | null;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  saveSnapshot: (nodes, edges) => {
    const past = [
      ...get().past,
      { nodes: structuredClone(nodes), edges: structuredClone(edges) },
    ];
    if (past.length > MAX_SNAPSHOTS) past.shift();
    set({
      past,
      future: [],
      canUndo: true,
      canRedo: false,
    });
  },

  undo: (currentNodes, currentEdges) => {
    const { past } = get();
    if (past.length === 0) return null;
    const snapshot = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const newFuture = [
      ...get().future,
      {
        nodes: structuredClone(currentNodes),
        edges: structuredClone(currentEdges),
      },
    ];
    set({
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: true,
    });
    return snapshot;
  },

  redo: (currentNodes, currentEdges) => {
    const { future } = get();
    if (future.length === 0) return null;
    const snapshot = future[future.length - 1];
    const newFuture = future.slice(0, -1);
    const newPast = [
      ...get().past,
      {
        nodes: structuredClone(currentNodes),
        edges: structuredClone(currentEdges),
      },
    ];
    set({
      past: newPast,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
    return snapshot;
  },
}));
