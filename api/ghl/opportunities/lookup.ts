import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GHL_BASE_URL, getGHLApiKey } from "../ghl-utils";

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
    const { locationId, contactId } = req.query;

    if (!locationId || typeof locationId !== "string") {
      return res.status(400).json({ error: "locationId is required" });
    }
    if (!contactId || typeof contactId !== "string") {
      return res.status(400).json({ error: "contactId is required" });
    }

    const apiKey = await getGHLApiKey(locationId);

    const params = new URLSearchParams();
    params.append("location_id", locationId);
    params.append("contact_id", contactId);
    params.append("status", "open");
    params.append("limit", "1");

    const ghlRes = await fetch(
      `${GHL_BASE_URL}/opportunities/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      },
    );

    if (!ghlRes.ok) {
      const errorBody = await ghlRes.text();
      return res.status(ghlRes.status).json({
        error: "GHL API error",
        status: ghlRes.status,
        detail: errorBody,
      });
    }

    const data = await ghlRes.json();
    const opportunity = data.opportunities?.[0] || null;
    return res.status(200).json({ opportunity });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
