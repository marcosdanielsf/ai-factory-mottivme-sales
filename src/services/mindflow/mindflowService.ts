/**
 * MindFlow Service — substitui as API routes Next.js
 *
 * As funcoes de AI (suggestTasks, expandNode, explain, copilot) precisam de um
 * backend para chamar a Anthropic API (server-side only).
 * TODO: Implementar via Supabase Edge Functions ou backend dedicado.
 *
 * As funcoes de maps (CRUD) usam o Supabase client diretamente.
 */

import { supabase } from "@/lib/supabase";
import type {
  SuggestTasksRequest,
  SuggestTasksResponse,
  ExpandNodeRequest,
  ExpandNodeResponse,
  ExplainNodeRequest,
  ExplainNodeResponse,
  CopilotRequest,
  CopilotResponse,
} from "@/components/mindflow/types/ai";
import type { CanvasElement } from "@/components/mindflow/types/elements";

// ── AI Functions ─────────────────────────────────────────────────────────────
// TODO: Estas funcoes retornam fallback mock por enquanto.
// Para funcionar com IA real, implementar um dos caminhos:
// 1. Supabase Edge Function que chama Anthropic API
// 2. Vercel API route (api/ folder no projeto)
// 3. Backend separado (Railway, etc.)

export async function suggestTasks(
  req: Omit<SuggestTasksRequest, "mapId">,
): Promise<SuggestTasksResponse> {
  // TODO: Substituir por chamada ao backend com Anthropic
  console.warn(
    "[mindflowService] suggestTasks usando fallback mock — backend AI nao configurado",
  );
  return {
    tasks: [
      { text: "Definir escopo", priority: "high" },
      { text: "Pesquisar referencias", priority: "medium" },
      { text: "Documentar decisoes", priority: "low" },
    ],
  };
}

export async function expandNode(
  req: Omit<ExpandNodeRequest, "mapId">,
): Promise<ExpandNodeResponse> {
  // TODO: Substituir por chamada ao backend com Anthropic
  console.warn(
    "[mindflowService] expandNode usando fallback mock — backend AI nao configurado",
  );
  return {
    children: [
      { label: "Sub-topico 1", color: "#6EE7F7" },
      { label: "Sub-topico 2", color: "#A78BFA" },
      { label: "Sub-topico 3", color: "#34D399" },
    ],
  };
}

export async function explainNode(
  req: Omit<ExplainNodeRequest, "mapId">,
): Promise<ExplainNodeResponse> {
  // TODO: Substituir por chamada ao backend com Anthropic
  console.warn(
    "[mindflowService] explainNode usando fallback mock — backend AI nao configurado",
  );
  return {
    explanation: `"${req.nodeLabel}" e um conceito central neste mapa mental, representando uma area de foco importante para o projeto.`,
  };
}

export async function runCopilot(
  req: Omit<CopilotRequest, "mapId">,
): Promise<CopilotResponse> {
  // TODO: Substituir por chamada ao backend com Anthropic
  console.warn(
    "[mindflowService] runCopilot usando fallback mock — backend AI nao configurado",
  );
  return { elements: [] };
}

// ── Maps CRUD (Supabase direto) ─────────────────────────────────────────────

export async function listMaps() {
  const { data, error } = await supabase
    .from("mindflow_maps")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMap(id: string) {
  const [mapResult, elementsResult] = await Promise.all([
    supabase.from("mindflow_maps").select("*").eq("id", id).single(),
    supabase
      .from("mindflow_elements")
      .select("*")
      .eq("map_id", id)
      .order("created_at"),
  ]);

  if (mapResult.error) throw mapResult.error;
  return {
    map: mapResult.data,
    elements: elementsResult.data ?? [],
  };
}

export async function createMap(
  title: string = "Novo Mapa",
  layout: string = "radial",
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");

  const { data, error } = await supabase
    .from("mindflow_maps")
    .insert({ title, layout, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveMap(
  id: string,
  payload: {
    elements?: CanvasElement[];
    layout?: string;
    title?: string;
  },
) {
  // Update map metadata
  const mapUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.layout) mapUpdate.layout = payload.layout;
  if (payload.title) mapUpdate.title = payload.title;

  const { error: mapError } = await supabase
    .from("mindflow_maps")
    .update(mapUpdate)
    .eq("id", id);

  if (mapError) throw mapError;

  // Upsert elements if provided (delete + reinsert)
  if (payload.elements && payload.elements.length > 0) {
    const { error: deleteError } = await supabase
      .from("mindflow_elements")
      .delete()
      .eq("map_id", id);

    if (deleteError) throw deleteError;

    const rows = payload.elements.map((el) => ({
      ...el,
      map_id: id,
    }));

    const { error: insertError } = await supabase
      .from("mindflow_elements")
      .insert(rows);

    if (insertError) throw insertError;
  }

  return { ok: true };
}

export async function deleteMap(id: string) {
  const { error } = await supabase.from("mindflow_maps").delete().eq("id", id);

  if (error) throw error;
  return { ok: true };
}
