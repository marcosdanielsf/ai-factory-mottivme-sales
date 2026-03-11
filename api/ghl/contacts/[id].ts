import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// --- GHL Utils (inline — Vercel nao resolve imports relativos neste projeto) ---
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
const GHL_BASE_URL =
  process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";
const GHL_GLOBAL_KEY = process.env.GHL_API_KEY || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sb: any = null;
function getSb() {
  if (!_sb) _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  return _sb;
}

const keyCache = new Map<string, { key: string; expires: number }>();

async function getGHLApiKey(locationId?: string | null): Promise<string> {
  if (!locationId) return GHL_GLOBAL_KEY;
  const cached = keyCache.get(locationId);
  if (cached && cached.expires > Date.now()) return cached.key;
  try {
    const { data: clients } = await getSb().from("clients").select("metadata");
    if (clients) {
      const match = clients.find(
        (c: any) =>
          c.metadata?.location_id === locationId ||
          c.metadata?.ghl_location_id === locationId,
      );
      const apiKey = match?.metadata?.api_key;
      if (apiKey) {
        keyCache.set(locationId, { key: apiKey, expires: Date.now() + 300000 });
        return apiKey;
      }
    }
  } catch (err) {
    console.warn("[getGHLApiKey] Error:", err);
  }
  return GHL_GLOBAL_KEY;
}
// --- End GHL Utils ---

// Cache simples em memoria (60 segundos para Contact detail)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 60000; // 60 segundos

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { id, locationId } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Contact ID is required" });
    }

    // Check cache
    const cacheKey = `contact:${id}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return res.status(200).json(cached.data);
    }

    const apiKey = await getGHLApiKey(locationId as string | undefined);

    const ghlRes = await fetch(`${GHL_BASE_URL}/contacts/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    if (!ghlRes.ok) {
      const errorBody = await ghlRes.text();
      return res.status(ghlRes.status).json({
        error: "GHL API error",
        status: ghlRes.status,
        detail: errorBody,
      });
    }

    const data = await ghlRes.json();

    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
