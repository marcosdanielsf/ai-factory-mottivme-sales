import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  let result = "not tested";
  try {
    const key = await getGHLApiKey("x7XafRxWaLa0EheQcaGS");
    result = `OK - base=${GHL_BASE_URL}, key=${key ? key.substring(0, 8) + "..." : "EMPTY"}`;
  } catch (e: any) {
    result = `ERROR: ${e.message}`;
  }
  return res.status(200).json({ result });
}
