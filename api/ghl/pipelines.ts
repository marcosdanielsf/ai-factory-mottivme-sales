import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_BASE_URL = process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY || '';

// Cache simples em memoria (1 hora para Pipelines)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 3600000; // 1 hora

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
        const { locationId } = req.query;
        if (!locationId || typeof locationId !== 'string') {
            return res.status(400).json({ error: 'locationId is required' });
        }

        // Check cache
        const cacheKey = `pipelines:${locationId}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return res.status(200).json(cached.data);
        }

        // Chamar GHL API
        const ghlRes = await fetch(`${GHL_BASE_URL}/opportunities/pipelines?locationId=${locationId}`, {
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
