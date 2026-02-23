import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GHL_BASE_URL, getGHLApiKey } from '../_utils';

// Cache simples em memoria (60 segundos para Contact detail)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 60000; // 60 segundos

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id, locationId } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Contact ID is required' });
        }

        // Check cache
        const cacheKey = `contact:${id}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return res.status(200).json(cached.data);
        }

        const apiKey = await getGHLApiKey(locationId as string | undefined);

        const ghlRes = await fetch(`${GHL_BASE_URL}/contacts/${id}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
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

        cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
