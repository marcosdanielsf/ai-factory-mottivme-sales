/**
 * Board ↔ MindFlow Bridge
 *
 * Conversao bidirecional entre Board Engine (groups/items) e MindFlow (RF nodes/edges).
 */

import { supabase } from "./supabase";
import type { BoardData, StatusLabel } from "../types/board";
import { DEFAULT_STATUS_LABELS } from "../types/board";
import type {
  CanvasElement,
  NodeData,
} from "../components/mindflow/types/elements";
import type { LayoutType } from "../components/mindflow/types/canvas";
import { NODE_COLORS } from "../components/mindflow/types/canvas";

// ── Board → MindFlow ──────────────────────────────────────────────────────────

/**
 * Converte BoardData em CanvasElements para o MindFlow.
 *
 * Estrutura:
 * - Board name → root node (nivel 0)
 * - Groups → nodes nivel 1 (filhos do root)
 * - Items → nodes nivel 2 (filhos do group)
 *
 * Status do item (primeira coluna status) define a cor do node.
 */
export function boardToMindFlow(boardData: BoardData): CanvasElement[] {
  const { board, groups, itemsByGroup, columns } = boardData;

  const elements: CanvasElement[] = [];

  // Encontrar coluna de status (se existir)
  const statusCol = columns.find((c) => c.column_type === "status");
  const statusLabels: StatusLabel[] =
    statusCol?.settings?.labels ?? DEFAULT_STATUS_LABELS;

  // Root node (o board)
  const rootId = `board-${board.id}`;
  elements.push({
    id: rootId,
    type: "node",
    x: 0,
    y: 0,
    data: {
      label: board.name,
      color: board.color ?? NODE_COLORS[0],
      status: "doing",
      tasks: [],
      emoji: board.icon ?? "📋",
    } as NodeData,
  });

  // Groups → nivel 1
  const sortedGroups = [...groups].sort((a, b) => a.position - b.position);
  sortedGroups.forEach((group, gi) => {
    const groupNodeId = `group-${group.id}`;
    elements.push({
      id: groupNodeId,
      type: "node",
      x: 0,
      y: 0,
      parentId: rootId,
      data: {
        label: group.name,
        color: group.color || NODE_COLORS[gi % NODE_COLORS.length],
        status: "todo",
        tasks: [],
      } as NodeData,
    });

    // Items → nivel 2
    const groupItems = (itemsByGroup[group.id] ?? []).sort(
      (a, b) => a.position - b.position,
    );
    groupItems.forEach((item) => {
      const itemNodeId = `item-${item.id}`;

      // Determinar cor pelo status do item
      let itemColor = group.color || NODE_COLORS[gi % NODE_COLORS.length];
      let itemStatus: NodeData["status"] = "backlog";

      if (statusCol && item.values) {
        const statusVal = item.values.find((v) => v.column_id === statusCol.id);
        if (statusVal?.value_text) {
          const matched = statusLabels.find(
            (sl) =>
              sl.id === statusVal.value_text ||
              sl.label === statusVal.value_text,
          );
          if (matched) {
            itemColor = matched.color;
            // Mapear status label para MindFlow status
            itemStatus = mapStatusLabel(matched.id);
          }
        }
      }

      elements.push({
        id: itemNodeId,
        type: "node",
        x: 0,
        y: 0,
        parentId: groupNodeId,
        data: {
          label: item.name,
          color: itemColor,
          status: itemStatus,
          tasks: [],
        } as NodeData,
      });
    });
  });

  return elements;
}

// ── Type Guards ───────────────────────────────────────────────────────────────

function getNodeLabel(el: CanvasElement): string {
  const data = el.data as Record<string, unknown>;
  return typeof data?.label === "string" ? data.label : "Sem titulo";
}

function getNodeStatus(el: CanvasElement): string {
  const data = el.data as Record<string, unknown>;
  return typeof data?.status === "string" ? data.status : "backlog";
}

function getNodeColor(el: CanvasElement): string {
  const data = el.data as Record<string, unknown>;
  return typeof data?.color === "string" ? data.color : NODE_COLORS[0];
}

function getNodeEmoji(el: CanvasElement): string | undefined {
  const data = el.data as Record<string, unknown>;
  return typeof data?.emoji === "string" ? data.emoji : undefined;
}

function mapStatusLabel(statusId: string): NodeData["status"] {
  const map: Record<string, NodeData["status"]> = {
    todo: "todo",
    inprogress: "doing",
    done: "done",
    stuck: "review",
    backlog: "backlog",
  };
  return map[statusId] ?? "backlog";
}

// ── MindFlow → Board ──────────────────────────────────────────────────────────

/**
 * Converte CanvasElements do MindFlow em estrutura Board.
 *
 * Lógica:
 * - Root node (sem parentId) → nome do Board
 * - Nivel 1 nodes (parentId === root) → Groups
 * - Nivel 2+ nodes → Items no group pai
 */
export async function mindFlowToBoard(
  elements: CanvasElement[],
  mapTitle: string,
): Promise<string> {
  // Identificar root (primeiro node sem parentId)
  const nodeElements = elements.filter((el) => el.type === "node");
  const root = nodeElements.find((el) => !el.parentId);
  if (!root) throw new Error("Nenhum node raiz encontrado no MindFlow");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");

  // 1. Criar board
  const boardName = getNodeLabel(root) || mapTitle;
  const boardSlug =
    boardName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36);

  const { data: board, error: boardErr } = await supabase
    .from("boards")
    .insert({
      name: boardName,
      slug: boardSlug,
      description: `Importado do MindFlow: ${mapTitle}`,
      owner_id: user.id,
      icon: getNodeEmoji(root) ?? "🧠",
      color: getNodeColor(root),
      settings: {},
    })
    .select()
    .single();

  if (boardErr) throw boardErr;

  // 2. Criar coluna de status padrão
  const { data: statusCol, error: colErr } = await supabase
    .from("board_columns")
    .insert({
      board_id: board.id,
      name: "Status",
      column_type: "status",
      settings: { labels: DEFAULT_STATUS_LABELS },
      position: 0,
      is_visible: true,
    })
    .select()
    .single();

  if (colErr) throw colErr;

  // 3. Identificar nodes nivel 1 (groups)
  const level1 = nodeElements.filter((el) => el.parentId === root.id);

  // Se não tem nivel 1, criar um grupo "Geral" com todos os nodes como items
  if (level1.length === 0) {
    const { data: group } = await supabase
      .from("board_groups")
      .insert({
        board_id: board.id,
        name: "Geral",
        color: NODE_COLORS[0],
        position: 0,
        collapsed: false,
      })
      .select()
      .single();

    if (group) {
      // Todos os nodes (exceto root) viram items
      const otherNodes = nodeElements.filter((el) => el.id !== root.id);
      await insertItemsFromNodes(otherNodes, board.id, group.id, statusCol.id);
    }

    return boardSlug;
  }

  // 4. Criar groups e items
  for (let gi = 0; gi < level1.length; gi++) {
    const groupNode = level1[gi];

    const { data: group, error: groupErr } = await supabase
      .from("board_groups")
      .insert({
        board_id: board.id,
        name: getNodeLabel(groupNode),
        color: getNodeColor(groupNode) || NODE_COLORS[gi % NODE_COLORS.length],
        position: gi,
        collapsed: false,
      })
      .select()
      .single();

    if (groupErr || !group) continue;

    // Nodes nivel 2+ (filhos deste group, recursivo flatten)
    const childNodes = collectDescendants(nodeElements, groupNode.id);
    await insertItemsFromNodes(childNodes, board.id, group.id, statusCol.id);
  }

  return boardSlug;
}

function collectDescendants(
  elements: CanvasElement[],
  parentId: string,
): CanvasElement[] {
  const direct = elements.filter((el) => el.parentId === parentId);
  const all: CanvasElement[] = [];
  for (const child of direct) {
    all.push(child);
    all.push(...collectDescendants(elements, child.id));
  }
  return all;
}

async function insertItemsFromNodes(
  nodes: CanvasElement[],
  boardId: string,
  groupId: string,
  statusColId: string,
) {
  if (nodes.length === 0) return;

  // Batch insert de todos os items de uma vez
  const itemRows = nodes.map((node, i) => ({
    board_id: boardId,
    group_id: groupId,
    name: getNodeLabel(node),
    position: i,
  }));

  const { data: insertedItems, error: itemsErr } = await supabase
    .from("board_items")
    .insert(itemRows)
    .select("id, position");

  if (itemsErr || !insertedItems) return;

  // Batch insert de status values
  const statusRows = insertedItems
    .map((item) => {
      const node = nodes[item.position];
      if (!node) return null;
      const statusText = reverseMapStatus(getNodeStatus(node));
      if (!statusText) return null;
      return {
        item_id: item.id,
        column_id: statusColId,
        value_text: statusText,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (statusRows.length > 0) {
    await supabase.from("board_item_values").insert(statusRows);
  }
}

function reverseMapStatus(mindflowStatus: string): string | null {
  const map: Record<string, string> = {
    backlog: "backlog",
    todo: "todo",
    doing: "inprogress",
    review: "stuck",
    done: "done",
  };
  return map[mindflowStatus] ?? null;
}

// ── Criar MindFlow Map a partir de Board ──────────────────────────────────────

export async function createMindFlowFromBoard(
  boardData: BoardData,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");

  const elements = boardToMindFlow(boardData);
  const layout: LayoutType = "topdown";

  // Criar map no Supabase
  const { data: map, error: mapErr } = await supabase
    .from("mindflow_maps")
    .insert({
      title: `${boardData.board.name} (MindFlow)`,
      layout,
      user_id: user.id,
    })
    .select()
    .single();

  if (mapErr) throw mapErr;

  // Inserir elements (mapear camelCase → snake_case + gerar UUIDs)
  if (elements.length > 0) {
    // Mapear IDs locais → UUIDs do DB
    const idMap = new Map<string, string>();
    for (const el of elements) {
      idMap.set(el.id, crypto.randomUUID());
    }

    const rows = elements.map((el) => ({
      id: idMap.get(el.id)!,
      map_id: map.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width ?? null,
      height: el.height ?? null,
      rotation: el.rotation ?? 0,
      z_index: el.zIndex ?? 0,
      parent_id: el.parentId ? (idMap.get(el.parentId) ?? null) : null,
      data: el.data,
    }));
    const { error: elErr } = await supabase
      .from("mindflow_elements")
      .insert(rows);

    if (elErr) throw elErr;
  }

  return map.id;
}

// ── Criar Board a partir de MindFlow ──────────────────────────────────────────

export async function createBoardFromMindFlow(mapId: string): Promise<string> {
  // Buscar map e elements
  const [mapRes, elemRes] = await Promise.all([
    supabase.from("mindflow_maps").select("*").eq("id", mapId).single(),
    supabase.from("mindflow_elements").select("*").eq("map_id", mapId),
  ]);

  if (mapRes.error) throw mapRes.error;

  // Mapear snake_case do DB → camelCase do CanvasElement
  const rawRows = elemRes.data ?? [];
  const elements: CanvasElement[] = rawRows.map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      type: row.type as CanvasElement["type"],
      x: (row.x as number) ?? 0,
      y: (row.y as number) ?? 0,
      width: row.width as number | undefined,
      height: row.height as number | undefined,
      rotation: row.rotation as number | undefined,
      zIndex: row.z_index as number | undefined,
      parentId: (row.parent_id as string) ?? null,
      data: row.data as CanvasElement["data"],
    }),
  );
  const mapTitle = mapRes.data?.title ?? "Mapa Mental";

  return mindFlowToBoard(elements, mapTitle);
}
