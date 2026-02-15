import {
    GHLContactsResponse,
    GHLContact,
    GHLEventsResponse,
    GHLPipelinesResponse,
    GHLOpportunitiesResponse
} from './ghlTypes';

const API_BASE = '/api/ghl';

/**
 * GHL Client Service
 * Proxies requests to our internal /api/ghl/ endpoints.
 * Requires Supabase JWT token for authentication.
 */
export const ghlClient = {

    /**
     * Fetch Pipelines and their stages
     */
    async getPipelines(locationId: string, token: string, signal?: AbortSignal): Promise<GHLPipelinesResponse> {
        const res = await fetch(`${API_BASE}/pipelines?locationId=${locationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch pipelines: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Fetch Opportunities with search/filter
     */
    async getOpportunities(
        params: { locationId: string; status?: string; limit?: number; page?: number },
        token: string,
        signal?: AbortSignal
    ): Promise<GHLOpportunitiesResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('location_id', params.locationId); // Note: proxy expects location_id or locationId
        if (params.status) searchParams.append('status', params.status);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.page) searchParams.append('page', params.page.toString());

        const res = await fetch(`${API_BASE}/opportunities?${searchParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch opportunities: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Fetch Calendar Events
     */
    async getEvents(
        params: { locationId: string; startTime: string; endTime: string },
        token: string,
        signal?: AbortSignal
    ): Promise<GHLEventsResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('locationId', params.locationId);
        searchParams.append('startTime', params.startTime);
        searchParams.append('endTime', params.endTime);

        const res = await fetch(`${API_BASE}/calendar/events?${searchParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch events: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Fetch Contacts
     */
    async getContacts(
        params: { locationId: string; limit?: number; startAfter?: string; query?: string },
        token: string,
        signal?: AbortSignal
    ): Promise<GHLContactsResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('locationId', params.locationId);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.startAfter) searchParams.append('startAfter', params.startAfter);
        if (params.query) searchParams.append('query', params.query);

        const res = await fetch(`${API_BASE}/contacts?${searchParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch contacts: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Fetch Single Contact
     */
    async getContact(
        id: string,
        token: string,
        locationId?: string,
        signal?: AbortSignal
    ): Promise<{ contact: GHLContact }> {
        // If locationId provided, might append to query, but ID is main param
        const url = locationId
            ? `${API_BASE}/contacts/${id}?locationId=${locationId}`
            : `${API_BASE}/contacts/${id}`;

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch contact: ${res.statusText}`);
        }

        return res.json();
    }
};
