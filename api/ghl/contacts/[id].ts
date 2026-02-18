import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_BASE_URL = process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY || '';

// Cache simples em memoria (60 segundos para Contact detail)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 60000; // 60 segundos

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.query;
        // Vercel routes logic: api/ghl/contacts/[id].ts -> req.query.id exists.

        // Also expect locationId for consistency?
        const { locationId } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Contact ID is required' });
        }

        // NOTE: Sending locationId might be good for context if the API supports it, though usually ID is enough.
        // If we want to use locationId for cache key separation (in case same ID somehow exists in diff locations? Unlikely for GHL UUIDs).
        // Let's use it in cache key if present.

        // Check cache
        const cacheKey = `contact:${id}`; // ID should be globally unique
        const cached = cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return res.status(200).json(cached.data);
        }

        // Chamar GHL API
        // Endpoint: /contacts/:id
        const ghlRes = await fetch(`${GHL_BASE_URL}/contacts/${id}`, {
            headers: {
                Authorization: `Bearer ${GHL_API_KEY}`,
                Version: '2021-07-28',
                Accept: 'application/json',
            },
        });

        if (!ghlRes.ok) {
            const errorBody = await ghlRes.text();
            return res.status(ghlRes.status).json({
                error: 'GHL API error',
                status: ghlRes.status,
                detail: errorBody,
            });
        }

        const data = await ghlRes.json();

        // Salvar no cache
        cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
