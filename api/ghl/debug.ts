import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const envCheck = {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    GHL_API_BASE_URL: !!process.env.GHL_API_BASE_URL,
    GHL_API_KEY: !!process.env.GHL_API_KEY,
  };

  let supabaseTest = "not tested";
  let clientsQuery = "not tested";

  try {
    const url = process.env.VITE_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_KEY || "";
    const sb = createClient(url, key);
    supabaseTest = "createClient OK";

    const { data, error } = await sb
      .from("clients")
      .select("metadata")
      .limit(2);
    if (error) {
      clientsQuery = `ERROR: ${error.message}`;
    } else {
      const locs = data
        ?.map((c: any) => c.metadata?.location_id)
        .filter(Boolean);
      clientsQuery = `OK - ${data?.length} rows, locations: ${locs?.join(", ")}`;
    }
  } catch (e: any) {
    supabaseTest = `CRASH: ${e.message}`;
  }

  return res.status(200).json({ envCheck, supabaseTest, clientsQuery });
}
