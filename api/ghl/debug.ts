import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGHLApiKey, GHL_BASE_URL } from "./ghl-utils";

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
