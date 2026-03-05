import { Position, type Node, type Edge } from "@xyflow/react";
import type { LayoutType } from "../types/canvas";

const NODE_W = 200;
const NODE_H = 100;

// ── Dagre (Top-Down / Left-Right / Tree) ──────────────────────────────────────
async function getDagreLayout(
  nodes: Node[],
  edges: Edge[],
  rankdir: "TB" | "LR" = "TB",
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const dagre = (await import("@dagrejs/dagre")).default;
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, nodesep: 60, ranksep: 100, edgesep: 30 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const isHorizontal = rankdir === "LR";
  const layoutedNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── ELK (Fishbone / Timeline) ─────────────────────────────────────────────────
async function getElkLayout(
  nodes: Node[],
  edges: Edge[],
  options: Record<string, string> = {},
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
  const elk = new ELK();

  const defaultOptions: Record<string, string> = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": "100",
    "elk.spacing.nodeNode": "80",
    ...options,
  };

  const graph = {
    id: "root",
    layoutOptions: defaultOptions,
    children: nodes.map((n) => ({ id: n.id, width: NODE_W, height: NODE_H })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph);

  const layoutedNodes = nodes.map((n) => {
    const en = result.children?.find((c) => c.id === n.id);
    if (!en) return n;
    return { ...n, position: { x: en.x ?? 0, y: en.y ?? 0 } };
  });

  return { nodes: layoutedNodes, edges };
}

// ── d3-hierarchy Radial ────────────────────────────────────────────────────────
async function getRadialLayout(
  nodes: Node[],
  edges: Edge[],
  width = 1200,
  height = 800,
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const d3 = await import("d3-hierarchy");

  // Find root (node with no incoming edges)
  const targets = new Set(edges.map((e) => e.target));
  const rootId = nodes.find((n) => !targets.has(n.id))?.id ?? nodes[0]?.id;
  if (!rootId) return { nodes, edges };

  // Build hierarchy map
  const childMap = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!childMap.has(e.source)) childMap.set(e.source, []);
    childMap.get(e.source)!.push(e.target);
  });

  interface HNode {
    id: string;
    children?: HNode[];
  }
  const buildTree = (id: string): HNode => ({
    id,
    children: (childMap.get(id) ?? []).map(buildTree),
  });

  const root = d3.hierarchy(buildTree(rootId));
  const radius = Math.min(width, height) / 2 - 120;

  const treeLayout = d3
    .tree<HNode>()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

  treeLayout(root);

  const posMap = new Map<string, { x: number; y: number }>();
  root.descendants().forEach((d) => {
    const angle = d.x ?? 0;
    const r = d.y ?? 0;
    posMap.set(d.data.id, {
      x: width / 2 + r * Math.cos(angle - Math.PI / 2) - NODE_W / 2,
      y: height / 2 + r * Math.sin(angle - Math.PI / 2) - NODE_H / 2,
    });
  });

  const layoutedNodes = nodes.map((n) => {
    const pos = posMap.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });

  return { nodes: layoutedNodes, edges };
}

// ── Edge type per layout ───────────────────────────────────────────────────────
export function getEdgeTypeForLayout(layout: LayoutType): string {
  switch (layout) {
    case "radial":
      return "default"; // bezier — organic
    case "topdown":
    case "tree":
      return "smoothstep";
    case "leftright":
      return "smoothstep";
    case "fishbone":
    case "timeline":
      return "straight";
    default:
      return "default";
  }
}

// ── Main dispatcher ────────────────────────────────────────────────────────────
export async function applyLayout(
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType,
  canvasWidth = 1200,
  canvasHeight = 800,
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (!nodes.length) return { nodes, edges };

  switch (layout) {
    case "radial":
      return getRadialLayout(nodes, edges, canvasWidth, canvasHeight);

    case "topdown":
      return getDagreLayout(nodes, edges, "TB");

    case "leftright":
      return getDagreLayout(nodes, edges, "LR");

    case "tree":
      return getDagreLayout(nodes, edges, "TB");

    case "fishbone":
      return getElkLayout(nodes, edges, {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      });

    case "timeline":
      return getElkLayout(nodes, edges, {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.layered.spacing.nodeNodeBetweenLayers": "120",
        "elk.spacing.nodeNode": "60",
      });

    default:
      return { nodes, edges };
  }
}

// ── v4 data -> React Flow nodes/edges converter ────────────────────────────────
export interface V4Node {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  parent: string | null;
  status: string;
  tasks: unknown[];
  emoji?: string;
}

export function v4ToReactFlow(v4Nodes: V4Node[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = v4Nodes.map((n) => ({
    id: n.id,
    type: "mindMapNode",
    position: { x: n.x, y: n.y },
    data: {
      label: n.label,
      color: n.color,
      status: n.status,
      tasks: n.tasks,
      emoji: n.emoji,
      parentId: n.parent,
    },
    parentId: n.parent ?? undefined,
  }));

  const edges: Edge[] = v4Nodes
    .filter((n) => n.parent !== null)
    .map((n) => ({
      id: `${n.parent}-${n.id}`,
      source: n.parent!,
      target: n.id,
      type: "default",
    }));

  return { nodes, edges };
}
