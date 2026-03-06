import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const GHL_BASE_URL =
  process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";
export const GHL_GLOBAL_KEY = process.env.GHL_API_KEY || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Cache em memoria (5 min) — evita query repetida
const keyCache = new Map<string, { key: string; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Busca API key (PIT) do cliente pela location_id.
 * Tabela clients: location_id (coluna) ou metadata->ghl_location_id (JSONB).
 * ~15 clientes, busca todos e filtra em JS (simples e confiavel).
 */
export async function getGHLApiKey(
  locationId?: string | null,
): Promise<string> {
  if (!locationId) return GHL_GLOBAL_KEY;

  // Check cache
  const cached = keyCache.get(locationId);
  if (cached && cached.expires > Date.now()) return cached.key;

  try {
    const { data: clients } = await supabaseAdmin
      .from("clients")
      .select("metadata");

    if (clients) {
      const match = clients.find(
        (c: any) =>
          c.metadata?.location_id === locationId ||
          c.metadata?.ghl_location_id === locationId,
      );

      const apiKey = match?.metadata?.api_key;
      if (apiKey) {
        keyCache.set(locationId, {
          key: apiKey,
          expires: Date.now() + CACHE_TTL,
        });
        return apiKey;
      }
    }
  } catch (err) {
    console.warn("[getGHLApiKey] Error:", err);
  }

  return GHL_GLOBAL_KEY;
}
