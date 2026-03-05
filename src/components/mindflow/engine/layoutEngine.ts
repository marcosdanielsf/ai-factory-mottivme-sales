import { Position, type Node, type Edge } from "@xyflow/react";
import type { LayoutType } from "../types/canvas";

// ── Node dimensions (generous to avoid overlap — rendered nodes with tasks are ~220px)
const NODE_W = 220;
const NODE_H = 64;

// ── Helpers ─────────────────────────────────────────────────────────────────
function buildChildMap(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!map.has(e.source)) map.set(e.source, []);
    map.get(e.source)!.push(e.target);
  });
  return map;
}

function findRootId(nodes: Node[], edges: Edge[]): string {
  const targets = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !targets.has(n.id))?.id ?? nodes[0]?.id;
}

// ── 1. ORGANOGRAMA (Top-Down — XMind style) ─────────────────────────────────
// Bottom-up subtree width calculation, parent centered over children
async function getOrgChartLayout(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const rootId = findRootId(nodes, edges);
  const childMap = buildChildMap(edges);
  const posMap = new Map<string, { x: number; y: number }>();

  const H_GAP = 40; // gap between siblings (wider to prevent overlap)
  const V_GAP = 80; // gap between levels

  // Bottom-up: compute subtree width, then position top-down
  const subtreeWidth = (nodeId: string): number => {
    const children = childMap.get(nodeId) ?? [];
    if (children.length === 0) return NODE_W;
    const childrenWidth = children.reduce((sum, c) => sum + subtreeWidth(c), 0);
    return childrenWidth + H_GAP * (children.length - 1);
  };

  // Position nodes: parent is centered over its children span
  const place = (nodeId: string, centerX: number, y: number) => {
    const children = childMap.get(nodeId) ?? [];

    if (children.length === 0) {
      posMap.set(nodeId, { x: centerX - NODE_W / 2, y });
      return;
    }

    // Compute total children span
    const childWidths = children.map((c) => subtreeWidth(c));
    const totalWidth =
      childWidths.reduce((a, b) => a + b, 0) + H_GAP * (children.length - 1);

    // Place parent centered
    posMap.set(nodeId, { x: centerX - NODE_W / 2, y });

    // Place children left-to-right, centered under parent
    let childX = centerX - totalWidth / 2;
    children.forEach((childId, i) => {
      const cw = childWidths[i];
      const childCenter = childX + cw / 2;
      place(childId, childCenter, y + NODE_H + V_GAP);
      childX += cw + H_GAP;
    });
  };

  const rootWidth = subtreeWidth(rootId);
  place(rootId, rootWidth / 2, 0);

  const layoutedNodes = nodes.map((n) => {
    const pos = posMap.get(n.id);
    if (!pos) return n;
    return {
      ...n,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      position: { x: pos.x, y: pos.y },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── 2. ARVORE (Indented tree — file explorer style) ─────────────────────────
async function getTreeLayout(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const rootId = findRootId(nodes, edges);
  const childMap = buildChildMap(edges);
  const posMap = new Map<string, { x: number; y: number }>();

  const H_INDENT = 180;
  const V_GAP = 8;
  let currentY = 0;

  const layoutNode = (nodeId: string, depth: number) => {
    posMap.set(nodeId, { x: depth * H_INDENT, y: currentY });
    currentY += NODE_H + V_GAP;
    const children = childMap.get(nodeId) ?? [];
    children.forEach((childId) => layoutNode(childId, depth + 1));
  };

  layoutNode(rootId, 0);

  const layoutedNodes = nodes.map((n) => {
    const pos = posMap.get(n.id);
    if (!pos) return n;
    return {
      ...n,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: { x: pos.x, y: pos.y },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── 3. LOGICA (Left-to-Right — compact dagre) ──────────────────────────────
async function getLogicLayout(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const dagre = (await import("@dagrejs/dagre")).default;
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 16,
    ranksep: 100,
    edgesep: 10,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const layoutedNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── 4. MAPA DE IDEIAS (Radial — compact) ───────────────────────────────────
async function getRadialLayout(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const rootId = findRootId(nodes, edges);
  if (!rootId) return { nodes, edges };

  const childMap = buildChildMap(edges);
  const posMap = new Map<string, { x: number; y: number; angle: number }>();

  // Count all descendants for weight-based angle distribution
  const countDesc = (id: string): number => {
    const ch = childMap.get(id) ?? [];
    return ch.reduce((s, c) => s + 1 + countDesc(c), 0);
  };

  posMap.set(rootId, { x: -NODE_W / 2, y: -NODE_H / 2, angle: 0 });

  const FIRST_RADIUS = 180;
  const RADIUS_INC = 140;

  const placeChildren = (
    parentId: string,
    startAngle: number,
    sweep: number,
    radius: number,
  ) => {
    const children = childMap.get(parentId) ?? [];
    if (children.length === 0) return;

    // Weight-based distribution: bigger subtrees get more angle
    const weights = children.map((c) => 1 + countDesc(c));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let angle = startAngle;
    children.forEach((childId, i) => {
      const childSweep = (weights[i] / totalWeight) * sweep;
      const childAngle = angle + childSweep / 2;

      const x = radius * Math.cos(childAngle) - NODE_W / 2;
      const y = radius * Math.sin(childAngle) - NODE_H / 2;
      posMap.set(childId, { x, y, angle: childAngle });

      placeChildren(childId, angle, childSweep, radius + RADIUS_INC);
      angle += childSweep;
    });
  };

  placeChildren(rootId, 0, Math.PI * 2, FIRST_RADIUS);

  const layoutedNodes = nodes.map((n) => {
    const p = posMap.get(n.id);
    if (!p) return n;

    let sp: Position;
    let tp: Position;

    if (n.id === rootId) {
      sp = Position.Right;
      tp = Position.Left;
    } else {
      const cosA = Math.cos(p.angle);
      const sinA = Math.sin(p.angle);
      if (Math.abs(cosA) > Math.abs(sinA)) {
        sp = cosA > 0 ? Position.Right : Position.Left;
        tp = cosA > 0 ? Position.Left : Position.Right;
      } else {
        sp = sinA > 0 ? Position.Bottom : Position.Top;
        tp = sinA > 0 ? Position.Top : Position.Bottom;
      }
    }

    return {
      ...n,
      position: { x: p.x, y: p.y },
      sourcePosition: sp,
      targetPosition: tp,
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── 5. ESPINHA DE PEIXE (Ishikawa) ─────────────────────────────────────────
async function getFishboneLayout(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const rootId = findRootId(nodes, edges);
  if (!rootId) return { nodes, edges };

  const childMap = buildChildMap(edges);
  const directChildren = childMap.get(rootId) ?? [];

  const posMap = new Map<
    string,
    { x: number; y: number; sp: Position; tp: Position }
  >();

  const SUB_Y_GAP = NODE_H + 12;
  const CAUSE_Y_OFFSET = 140;
  const spineY = 0;

  // Dynamic spacing: each cause column is wide enough for its sub-causes
  const causeSpacings = directChildren.map((childId) => {
    const subCount = (childMap.get(childId) ?? []).length;
    return Math.max(NODE_W + 40, NODE_W + subCount * 10);
  });

  const spineLength = causeSpacings.reduce((a, b) => a + b, 0) || NODE_W * 2;

  // Root (effect) at the RIGHT end of the spine
  posMap.set(rootId, {
    x: spineLength + 80,
    y: spineY,
    sp: Position.Left,
    tp: Position.Left,
  });

  // Place causes along the spine, alternating above/below
  let cumulativeX = 0;
  directChildren.forEach((childId, i) => {
    const isAbove = i % 2 === 0;
    const x = spineLength - cumulativeX - causeSpacings[i] / 2;
    const y = spineY + (isAbove ? -CAUSE_Y_OFFSET : CAUSE_Y_OFFSET);
    cumulativeX += causeSpacings[i];

    posMap.set(childId, {
      x,
      y,
      sp: isAbove ? Position.Bottom : Position.Top,
      tp: isAbove ? Position.Bottom : Position.Top,
    });

    // Sub-causes stack vertically, offset left for diagonal feel
    const subChildren = childMap.get(childId) ?? [];
    subChildren.forEach((subId, j) => {
      const subY = isAbove ? y - (j + 1) * SUB_Y_GAP : y + (j + 1) * SUB_Y_GAP;
      posMap.set(subId, {
        x: x - 30 - j * 15,
        y: subY,
        sp: isAbove ? Position.Bottom : Position.Top,
        tp: isAbove ? Position.Bottom : Position.Top,
      });
    });
  });

  const layoutedNodes = nodes.map((n) => {
    const p = posMap.get(n.id);
    if (!p) return n;
    return {
      ...n,
      position: { x: p.x, y: p.y },
      sourcePosition: p.sp,
      targetPosition: p.tp,
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── 6. LINHA DO TEMPO (Timeline) ────────────────────────────────────────────
async function getTimelineLayout(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const rootId = findRootId(nodes, edges);
  if (!rootId) return { nodes, edges };

  const childMap = buildChildMap(edges);
  const directChildren = childMap.get(rootId) ?? [];

  const posMap = new Map<
    string,
    { x: number; y: number; sp: Position; tp: Position }
  >();

  const BASE_H_SPACING = NODE_W + 60;
  const V_OFFSET = 130;
  const SUB_Y_GAP = NODE_H + 12;
  const axisY = 0;

  // Root at the left as the timeline origin
  posMap.set(rootId, {
    x: 0,
    y: axisY,
    sp: Position.Right,
    tp: Position.Left,
  });

  // Dynamic horizontal spacing based on sub-children count
  let cumulativeX = BASE_H_SPACING;
  directChildren.forEach((childId, i) => {
    const isAbove = i % 2 === 0;
    const subChildren = childMap.get(childId) ?? [];
    const subHeight = subChildren.length * SUB_Y_GAP;
    const dynamicVOffset = Math.max(V_OFFSET, subHeight + NODE_H);

    const y = axisY + (isAbove ? -dynamicVOffset : dynamicVOffset);

    posMap.set(childId, {
      x: cumulativeX,
      y,
      sp: Position.Right,
      tp: isAbove ? Position.Bottom : Position.Top,
    });

    // Sub-events stack vertically, slightly indented
    subChildren.forEach((subId, j) => {
      const subY = isAbove ? y - (j + 1) * SUB_Y_GAP : y + (j + 1) * SUB_Y_GAP;
      posMap.set(subId, {
        x: cumulativeX + 20,
        y: subY,
        sp: Position.Right,
        tp: isAbove ? Position.Bottom : Position.Top,
      });
    });

    cumulativeX += BASE_H_SPACING;
  });

  const layoutedNodes = nodes.map((n) => {
    const p = posMap.get(n.id);
    if (!p) return n;
    return {
      ...n,
      position: { x: p.x, y: p.y },
      sourcePosition: p.sp,
      targetPosition: p.tp,
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── Edge type per layout ────────────────────────────────────────────────────
export function getEdgeTypeForLayout(layout: LayoutType): string {
  switch (layout) {
    case "topdown":
      return "ortho";
    case "tree":
      return "ortho";
    case "leftright":
      return "ortho";
    case "radial":
      return "default"; // bezier curves for radial
    case "fishbone":
      return "straight";
    case "timeline":
      return "ortho";
    default:
      return "ortho";
  }
}

// ── Main dispatcher ─────────────────────────────────────────────────────────
export async function applyLayout(
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType,
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (!nodes.length) return { nodes, edges };

  const edgeType = getEdgeTypeForLayout(layout);
  const typedEdges = edges.map((e) => ({ ...e, type: edgeType }));

  let result: { nodes: Node[]; edges: Edge[] };

  switch (layout) {
    case "radial":
      result = await getRadialLayout(nodes, typedEdges);
      break;
    case "topdown":
      result = await getOrgChartLayout(nodes, typedEdges);
      break;
    case "leftright":
      result = await getLogicLayout(nodes, typedEdges);
      break;
    case "tree":
      result = await getTreeLayout(nodes, typedEdges);
      break;
    case "fishbone":
      result = await getFishboneLayout(nodes, typedEdges);
      break;
    case "timeline":
      result = await getTimelineLayout(nodes, typedEdges);
      break;
    default:
      result = { nodes, edges: typedEdges };
  }

  return result;
}

// ── v4 data -> React Flow nodes/edges converter ─────────────────────────────
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
  }));

  const edges: Edge[] = v4Nodes
    .filter((n) => n.parent !== null)
    .map((n) => ({
      id: `${n.parent}-${n.id}`,
      source: n.parent!,
      target: n.id,
      type: "ortho",
    }));

  return { nodes, edges };
}
