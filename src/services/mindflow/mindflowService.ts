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

// ── AI Endpoint ───────────────────────────────────────────────────────────────
// Calls the Vercel Serverless Function at api/mindflow/ai.ts
// In production: /api/mindflow/ai  (Vercel routing)
// In local dev:  same path (Vercel dev server handles it)

const AI_ENDPOINT = "/api/mindflow/ai";

async function callAI<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`AI request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── AI Functions ──────────────────────────────────────────────────────────────

export async function suggestTasks(
  req: Omit<SuggestTasksRequest, "mapId">,
): Promise<SuggestTasksResponse> {
  return callAI<SuggestTasksResponse>({
    action: "suggest-tasks",
    nodeLabel: req.nodeLabel,
    existingTasks: req.existingTasks,
  });
}

export async function expandNode(
  req: Omit<ExpandNodeRequest, "mapId">,
): Promise<ExpandNodeResponse> {
  return callAI<ExpandNodeResponse>({
    action: "expand-node",
    nodeLabel: req.nodeLabel,
    existingChildren: req.existingChildren,
  });
}

export async function explainNode(
  req: Omit<ExplainNodeRequest, "mapId">,
): Promise<ExplainNodeResponse> {
  return callAI<ExplainNodeResponse>({
    action: "explain",
    nodeLabel: req.nodeLabel,
    nodeContext: req.nodeContext,
  });
}

export async function runCopilot(
  req: Omit<CopilotRequest, "mapId">,
): Promise<CopilotResponse> {
  return callAI<CopilotResponse>({
    action: "copilot",
    text: req.text,
    layout: req.layout,
  });
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
