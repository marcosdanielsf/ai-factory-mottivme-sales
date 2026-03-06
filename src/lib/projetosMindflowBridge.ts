/**
 * Projetos -> MindFlow Bridge
 *
 * Converte tarefas do Kanban de Projetos (mottivme_tasks) em MindFlow map.
 *
 * Estrutura:
 * - Root node = nome do projeto (ou "Todos Projetos")
 * - Level 1 = colunas de status (Backlog, A Fazer, Em Progresso, Revisao, Concluido)
 * - Level 2 = tasks de cada status
 */

import { supabase } from "./supabase";
import type {
  CanvasElement,
  NodeData,
} from "../components/mindflow/types/elements";
import type { LayoutType } from "../components/mindflow/types/canvas";
import { NODE_COLORS } from "../components/mindflow/types/canvas";
import type { ProjectTask, Project } from "../pages/Projetos/types";
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
