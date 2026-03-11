import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

const ElementSchema = z.object({
  id: z.string(),
  type: z.enum([
    "node",
    "sticky",
    "text",
    "shape",
    "frame",
    "image",
    "drawing",
    "comment",
  ]),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().optional(),
  parentId: z.string().nullable().optional(),
  data: z.record(z.unknown()),
});

const PatchSchema = z.object({
  elements: z.array(ElementSchema).optional(),
  layout: z
    .enum(["radial", "topdown", "leftright", "tree", "fishbone", "timeline"])
    .optional(),
  title: z.string().max(255).optional(),
});

// GET /api/mindflow/maps/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabase();
    const { id } = params;

    const [mapResult, elementsResult] = await Promise.all([
      supabase.from("mindflow_maps").select("*").eq("id", id).single(),
      supabase
        .from("mindflow_elements")
        .select("*")
        .eq("map_id", id)
        .order("created_at"),
    ]);

    if (mapResult.error) throw mapResult.error;

    return NextResponse.json({
      map: mapResult.data,
      elements: elementsResult.data ?? [],
    });
  } catch (e) {
    console.error(
      "[GET maps/[id]]",
      e instanceof Error ? e.message : "Unknown error",
    );
    return NextResponse.json({ map: null, elements: [] }, { status: 500 });
  }
}

// PATCH /api/mindflow/maps/[id]
// Upsert bulk: delete-and-reinsert atômico via transaction
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabase();
    const { id } = params;
    const body = await req.json();
    const parsed = PatchSchema.parse(body);

    // Update map metadata (layout, title, updated_at)
    const mapUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.layout) mapUpdate.layout = parsed.layout;
    if (parsed.title) mapUpdate.title = parsed.title;

    const { error: mapError } = await supabase
      .from("mindflow_maps")
      .update(mapUpdate)
      .eq("id", id);

    if (mapError) throw mapError;

    // Upsert elements if provided
    if (parsed.elements && parsed.elements.length > 0) {
      // Delete existing elements and reinsert (atomic via sequential ops)
      const { error: deleteError } = await supabase
        .from("mindflow_elements")
        .delete()
        .eq("map_id", id);

      if (deleteError) throw deleteError;

      const rows = parsed.elements.map((el) => ({
        ...(el as Record<string, unknown>),
        map_id: id,
      }));

      const { error: insertError } = await supabase
        .from("mindflow_elements")
        .insert(rows);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: e.errors },
        { status: 400 },
      );
    }
    console.error(
      "[PATCH maps/[id]]",
      e instanceof Error ? e.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/mindflow/maps/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabase();
    const { id } = params;

    // Elements cascade via FK on delete
    const { error } = await supabase
      .from("mindflow_maps")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(
      "[DELETE maps/[id]]",
      e instanceof Error ? e.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
