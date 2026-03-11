import { useState, useEffect, useCallback } from 'react';
import { ghlClient } from '../../services/ghl/ghlClient';
import { GHLContact } from '../../services/ghl/ghlTypes';
import { useAuth } from '../../contexts/AuthContext';

interface UseGHLContactsProps {
    locationId: string;
    limit?: number;
    query?: string;
}

export function useGHLContacts({ locationId, limit = 50, query }: UseGHLContactsProps) {
    const { session } = useAuth();
    const [contacts, setContacts] = useState<GHLContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [startAfter, setStartAfter] = useState<string | undefined>(undefined);

    const fetchContacts = useCallback(async (reset = false, signal?: AbortSignal) => {
        if (!session?.access_token || !locationId) return;

        try {
            setLoading(true);
            const currentStartAfter = reset ? undefined : startAfter;

            const data = await ghlClient.getContacts(
                { locationId, limit, query, startAfter: currentStartAfter },
                session.access_token,
                signal
            );

            if (reset) {
                setContacts(data.contacts);
            } else {
                setContacts(prev => [...prev, ...data.contacts]);
            }

            // Update pagination cursor
            if (data.meta?.startAfterId) {
                setStartAfter(data.meta.startAfterId);
                setHasMore(true);
            } else if (data.meta?.startAfter) {
                setStartAfter(data.meta.startAfter.toString());
                setHasMore(true);
            } else {
                setStartAfter(undefined);
                setHasMore(false);
            }

            // Also if contacts < limit, probably no more
            if (data.contacts.length < limit) {
                setHasMore(false);
            }

            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.error('Error fetching contacts:', err);
            setError('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    }, [locationId, limit, query, session?.access_token, startAfter]);

    // Initial load or when query changes
    useEffect(() => {
        const controller = new AbortController();
        // Reset and fetch
        setStartAfter(undefined);
        fetchContacts(true, controller.signal);

        return () => controller.abort();
    }, [locationId, query, limit, session?.access_token]);
    // Note: excluding fetchContacts from dep array to avoid infinite loop if not careful, 
    // but better to include it and ensure fetchContacts identity is stable or logic is correct.
    // Actually, fetchContacts depends on startAfter which changes. 
    // So we should NOT include fetchContacts in this useEffect which is for RESETTING.
    // We need a separate ref or logic to handle "reset".

    // Actually, the simplest way is to have a useEffect that triggers on query/location change 
    // and calls an internal fetch function that resets state.

    return { contacts, loading, error, hasMore, loadMore: () => fetchContacts(false), refetch: () => fetchContacts(true) };
}
