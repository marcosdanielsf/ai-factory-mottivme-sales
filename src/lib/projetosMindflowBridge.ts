/**
 * Projetos <-> MindFlow Bridge (Bidirecional)
 *
 * Projetos -> MindFlow:
 * - Root node = nome do projeto (ou "Todos Projetos")
 * - Level 1 = colunas de status (Backlog, A Fazer, Em Progresso, Revisao, Concluido)
 * - Level 2 = tasks de cada status
 *
 * MindFlow -> Projetos:
 * - Root node (L0) = ignorado
 * - L1 nodes = mapeados para status columns (label -> status)
 * - L2 nodes = criados como tasks na mottivme_tasks
 */

import { supabase } from "./supabase";
import type {
  CanvasElement,
  NodeData,
} from "../components/mindflow/types/elements";
import type { LayoutType } from "../components/mindflow/types/canvas";
import { NODE_COLORS } from "../components/mindflow/types/canvas";
import type { ProjectTask, Project, TaskStatus } from "../pages/Projetos/types";
import { KANBAN_COLUMNS, PROJECTS } from "../pages/Projetos/types";

const STATUS_TO_MINDFLOW: Record<string, NodeData["status"]> = {
  backlog: "backlog",
  todo: "todo",
  doing: "doing",
  review: "review",
  done: "done",
};

/**
 * Converte tasks do Projetos em CanvasElements para MindFlow.
 */
export function projetosToMindFlow(
  tasks: ProjectTask[],
  project?: Project,
): CanvasElement[] {
  const elements: CanvasElement[] = [];

  const rootLabel = project
    ? `${project.emoji} ${project.name}`
    : "Todos Projetos";
  const rootColor = project?.color ?? NODE_COLORS[0];
  const rootId = "projetos-root";

  // Root node
  elements.push({
    id: rootId,
    type: "node",
    x: 0,
    y: 0,
    data: {
      label: rootLabel,
      color: rootColor,
      status: "doing",
      tasks: [],
      emoji: project?.emoji ?? "📋",
    } as NodeData,
  });

  // Status columns -> L1 nodes
  KANBAN_COLUMNS.forEach((col) => {
    const colTasks = tasks.filter((t) => t.status === col.id);
    if (colTasks.length === 0) return;

    const colNodeId = `status-${col.id}`;
    elements.push({
      id: colNodeId,
      type: "node",
      x: 0,
      y: 0,
      parentId: rootId,
      data: {
        label: `${col.label} (${colTasks.length})`,
        color: col.color,
        status: STATUS_TO_MINDFLOW[col.id] ?? "backlog",
        tasks: [],
      } as NodeData,
    });

    // Tasks -> L2 nodes
    colTasks.forEach((task) => {
      const taskNodeId = `task-${task.id}`;
      const taskProject = PROJECTS.find((p) => p.key === task.project_key);

      elements.push({
        id: taskNodeId,
        type: "node",
        x: 0,
        y: 0,
        parentId: colNodeId,
        data: {
          label: task.title,
          color: taskProject?.color ?? col.color,
          status: STATUS_TO_MINDFLOW[task.status] ?? "backlog",
          tasks: [],
          emoji: taskProject?.emoji,
        } as NodeData,
      });
    });
  });

  return elements;
}

/**
 * Cria MindFlow map no Supabase a partir das tasks do Projetos.
 * Retorna o map ID para navegacao.
 */
export async function createMindFlowFromProjetos(
  tasks: ProjectTask[],
  project?: Project,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");

  const elements = projetosToMindFlow(tasks, project);
  const layout: LayoutType = "topdown";

  const mapTitle = project
    ? `${project.name} (MindFlow)`
    : "Projetos (MindFlow)";

  // Criar map
  const { data: map, error: mapErr } = await supabase
    .from("mindflow_maps")
    .insert({
      title: mapTitle,
      layout,
      user_id: user.id,
    })
    .select()
    .single();

  if (mapErr) throw mapErr;

  // Inserir elements com UUIDs reais
  if (elements.length > 0) {
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

// =============================================
// MindFlow -> Projetos
// =============================================

const LABEL_TO_STATUS: Record<string, TaskStatus> = {
  backlog: "backlog",
  "a fazer": "todo",
  todo: "todo",
  "em progresso": "doing",
  doing: "doing",
  "em andamento": "doing",
  revisao: "review",
  review: "review",
  concluido: "done",
  done: "done",
};

function resolveStatus(label: string): TaskStatus {
  const normalized = label
    .toLowerCase()
    .replace(/\s*\(\d+\)\s*$/, "") // remove "(3)" suffix
    .trim();
  const status = LABEL_TO_STATUS[normalized];
  if (!status) {
    console.warn(
      `[mindFlowToTasks] Label desconhecido: "${label}". Usando "backlog".`,
    );
  }
  return status ?? "backlog";
}

/**
 * Converte nodes do MindFlow em tasks para mottivme_tasks.
 *
 * Estrutura esperada:
 * - L0 (root, sem parentId) = ignorado
 * - L1 (parentId = root) = status columns (label mapeado para backlog/todo/doing/review/done)
 * - L2 (parentId = L1) = tasks
 *
 * Retorna array de Partial<ProjectTask> prontos para insert no Supabase.
 */
export function mindFlowToTasks(
  elements: CanvasElement[],
  projectKey: string = "ai-factory",
): Partial<ProjectTask>[] {
  const nodes = elements.filter((el) => el.type === "node");

  // Identify root nodes (no parentId)
  const roots = nodes.filter((n) => !n.parentId);
  const rootIds = new Set(roots.map((r) => r.id));

  // L1 = direct children of root
  const l1Nodes = nodes.filter((n) => n.parentId && rootIds.has(n.parentId));
  const l1Ids = new Set(l1Nodes.map((n) => n.id));

  // L2 = direct children of L1
  const l2Nodes = nodes.filter((n) => n.parentId && l1Ids.has(n.parentId));

  const tasks: Partial<ProjectTask>[] = [];

  for (const l2 of l2Nodes) {
    const parent = l1Nodes.find((n) => n.id === l2.parentId);
    const parentData = parent?.data as NodeData | undefined;
    const nodeData = l2.data as NodeData;

    const status = parent ? resolveStatus(parentData?.label ?? "") : "backlog";

    tasks.push({
      project_key: projectKey,
      title: nodeData.label,
      status,
      tags: [],
      time_spent_minutes: 0,
    });
  }

  return tasks;
}

/**
 * Cria tasks no Supabase a partir dos nodes do MindFlow.
 * Busca elements do mapa pelo mapId, converte e insere em mottivme_tasks.
 * Retorna quantidade de tasks criadas.
 */
export async function mindFlowToProjetos(
  mapId: string,
  projectKey: string = "ai-factory",
): Promise<number> {
  // Buscar elements do mapa
  const { data: dbElements, error: fetchErr } = await supabase
    .from("mindflow_elements")
    .select("*")
    .eq("map_id", mapId);

  if (fetchErr) throw fetchErr;
  if (!dbElements || dbElements.length === 0) return 0;

  // Converter DB rows para CanvasElement
  const elements: CanvasElement[] = dbElements.map((row: any) => ({
    id: row.id,
    type: row.type,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    zIndex: row.z_index,
    parentId: row.parent_id,
    data: row.data,
  }));

  const tasks = mindFlowToTasks(elements, projectKey);
  if (tasks.length === 0) return 0;

  const { error: insertErr } = await supabase
    .from("mottivme_tasks")
    .insert(tasks);

  if (insertErr) throw insertErr;

  return tasks.length;
}
