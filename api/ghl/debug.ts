import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const envCheck = {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
    GHL_API_BASE_URL: !!process.env.GHL_API_BASE_URL,
    GHL_API_KEY: !!process.env.GHL_API_KEY,
  };

  let utilsImport = "not tested";
  let getKeyResult = "not tested";

  try {
    const { getGHLApiKey, GHL_BASE_URL } = await import("./ghl-utils");
    utilsImport = `OK - GHL_BASE_URL=${GHL_BASE_URL}`;

    try {
      const key = await getGHLApiKey("x7XafRxWaLa0EheQcaGS");
      getKeyResult = key ? `OK (${key.substring(0, 8)}...)` : "EMPTY";
    } catch (e: any) {
      getKeyResult = `ERROR: ${e.message}`;
    }
  } catch (e: any) {
    utilsImport = `CRASH: ${e.message}`;
  }

  return res.status(200).json({ envCheck, utilsImport, getKeyResult });
}
