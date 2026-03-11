import { useState, useEffect } from 'react';
import { ghlClient } from '../../services/ghl/ghlClient';
import { GHLPipeline } from '../../services/ghl/ghlTypes';
import { useAuth } from '../../contexts/AuthContext';

export function useGHLPipelines(locationId: string) {
    const { session } = useAuth();
    const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        async function fetchPipelines() {
            if (!session?.access_token || !locationId) return;

            try {
                setLoading(true);
                const data = await ghlClient.getPipelines(
                    locationId,
                    session.access_token,
                    controller.signal
                );
                if (mounted) {
                    setPipelines(data.pipelines);
                    setError(null);
                }
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                console.error('Error fetching pipelines:', err);
                if (mounted) setError('Failed to load pipelines');
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchPipelines();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [locationId, session?.access_token]);

    return { pipelines, loading, error };
}
