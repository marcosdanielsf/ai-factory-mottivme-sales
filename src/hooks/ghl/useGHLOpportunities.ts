import { useState, useEffect, useCallback } from 'react';
import { ghlClient } from '../../services/ghl/ghlClient';
import { GHLOpportunity } from '../../services/ghl/ghlTypes';
import { useAuth } from '../../contexts/AuthContext';

interface UseGHLOpportunitiesProps {
    locationId: string;
    status?: string;
    limit?: number;
}

export function useGHLOpportunities({ locationId, status, limit = 100 }: UseGHLOpportunitiesProps) {
    const { session } = useAuth();
    const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOpportunities = useCallback(async () => {
        if (!session?.access_token || !locationId) return;

        const controller = new AbortController();

        try {
            setLoading(true);
            const data = await ghlClient.getOpportunities(
                { locationId, status, limit },
                session.access_token,
                controller.signal
            );
            setOpportunities(data.opportunities);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.error('Error fetching opportunities:', err);
            setError('Failed to load opportunities');
        } finally {
            setLoading(false);
        }

        return () => controller.abort();
    }, [locationId, status, limit, session?.access_token]);

    useEffect(() => {
        const cleanup = fetchOpportunities();
        return () => {
            cleanup.then(abort => abort && abort());
        };
    }, [fetchOpportunities]);

    return { opportunities, loading, error, refetch: fetchOpportunities };
}
