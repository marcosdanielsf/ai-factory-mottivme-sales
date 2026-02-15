import { useState, useEffect, useCallback } from 'react';
import { ghlClient } from '../../services/ghl/ghlClient';
import { GHLEvent } from '../../services/ghl/ghlTypes';
import { useAuth } from '../../contexts/AuthContext';
import { DateRange } from '../../components/DateRangePicker';

export function useGHLCalendar(locationId: string, dateRange: DateRange | undefined) {
    const { session } = useAuth();
    const [events, setEvents] = useState<GHLEvent[]>([]);
    const [loading, setLoading] = useState(false); // Initially false until we have a range
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async (signal?: AbortSignal) => {
        if (!session?.access_token || !locationId || !dateRange?.startDate || !dateRange?.endDate) return;

        try {
            setLoading(true);

            // Convert dates to ms timestamp string for API
            const startTime = dateRange.startDate.getTime().toString();
            const endTime = dateRange.endDate.getTime().toString();

            const data = await ghlClient.getEvents(
                { locationId, startTime, endTime },
                session.access_token,
                signal
            );
            setEvents(data.events);
            setError(null);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Error fetching calendar events:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, [locationId, dateRange, session?.access_token]);

    useEffect(() => {
        const controller = new AbortController();

        if (dateRange?.startDate && dateRange?.endDate) {
            fetchEvents(controller.signal);
        } else {
            setEvents([]);
        }

        return () => controller.abort();
    }, [fetchEvents, dateRange]);

    return { events, loading, error, refetch: fetchEvents };
}
