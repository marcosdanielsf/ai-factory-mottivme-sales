import { NextResponse } from "next/server";

// GET /api/mindflow/maps — lista mapas do usuário
export async function GET() {
  // TODO Task #8: implementar com Supabase auth + query
  return NextResponse.json({ maps: [] });
}

// POST /api/mindflow/maps — cria novo mapa
export async function POST() {
  // TODO Task #8: implementar com Supabase insert
  return NextResponse.json({ map: null }, { status: 501 });
}
