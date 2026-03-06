import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GHL_BASE_URL, getGHLApiKey } from "./ghl-utils";

/**
 * Proxy for GHL Contact Tags API
 * Route: /api/ghl/contact-tags?contactId=xxx
 * Methods: POST (add tags), DELETE (remove tags)
 * Body: { tags: string[], locationId?: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { contactId } = req.query;
    if (!contactId || typeof contactId !== "string") {
      return res
        .status(400)
        .json({ error: "contactId query param is required" });
    }

    const { tags, locationId } = req.body || {};
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: "tags array is required" });
    }

    const apiKey = await getGHLApiKey(locationId);

    const ghlRes = await fetch(`${GHL_BASE_URL}/contacts/${contactId}/tags`, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ tags }),
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
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
