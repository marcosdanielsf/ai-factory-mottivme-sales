import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGHLApiKey, GHL_BASE_URL } from "./ghl-utils";

// Cache simples em memoria (60 segundos para Opportunities)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 60000;

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
    const { locationId, status, limit, page, pipelineId, pipelineStageId } =
      req.query;
    const locId = locationId || req.query.location_id;

    if (!locId || typeof locId !== "string") {
      return res.status(400).json({ error: "location_id is required" });
    }

    const params = new URLSearchParams();
    params.append("location_id", locId);
    if (status && typeof status === "string") params.append("status", status);
    if (limit && typeof limit === "string") params.append("limit", limit);
    if (page && typeof page === "string") params.append("page", page);
    if (pipelineId && typeof pipelineId === "string")
      params.append("pipeline_id", pipelineId);
    if (pipelineStageId && typeof pipelineStageId === "string")
      params.append("pipeline_stage_id", pipelineStageId);

    const queryString = params.toString();

    // Check cache
    const cacheKey = `opportunities:${queryString}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return res.status(200).json(cached.data);
    }

    // Use location-specific PIT token
    const apiKey = await getGHLApiKey(locId);

    const ghlRes = await fetch(
      `${GHL_BASE_URL}/opportunities/search?${queryString}`,
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

    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
