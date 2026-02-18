import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_BASE_URL = process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY || '';

// Cache simples em memoria (60 segundos para Opportunities)
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
        const { locationId, status, limit, page } = req.query;

        // Note: GHL API uses location_id for opportunities/search, but we can standardize on locationId param for our proxy
        // and map it to the correct query param for GHL.
        // However, the example schema in AGENTS.md says: GET /opportunities/search?location_id={id}
        // So let's accept location_id OR locationId to be safe, but enforce one.

        // Actually, let's look at `req.query`. If the client sends `location_id`, we use it.
        // But for consistency with other endpoints, we might want to support `locationId`.
        // Let's check what `api/ghl/opportunities.ts` instructions said:
        // "Criar api/ghl/opportunities.ts — proxy GET /opportunities/search"
        // Params: location_id, status, limit, page.

        const locId = locationId || req.query.location_id;

        if (!locId || typeof locId !== 'string') {
            return res.status(400).json({ error: 'location_id is required' });
        }

        // Prepare query params
        const params = new URLSearchParams();
        params.append('location_id', locId);
        if (status && typeof status === 'string') params.append('status', status);
        if (limit && typeof limit === 'string') params.append('limit', limit);
        if (page && typeof page === 'string') params.append('page', page);

        const queryString = params.toString();

        // Check cache
        const cacheKey = `opportunities:${queryString}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return res.status(200).json(cached.data);
        }

        // Chamar GHL API
        const ghlRes = await fetch(`${GHL_BASE_URL}/opportunities/search?${queryString}`, {
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
