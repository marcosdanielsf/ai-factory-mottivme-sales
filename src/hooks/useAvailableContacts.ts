import { useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────

export interface Contact {
  phone: string;
  name: string;
  segmento?: string;
  estado?: string;
  icp_score?: number;
  status?: string;
  contact_id?: string;
  location_id?: string;
}

export interface ContactFilters {
  source: 'growth_leads' | 'ghl_tracking';
  segmento?: string;
  estado?: string;
  icp_score_min?: number;
  status?: string;
  limit?: number;
}

interface UseAvailableContactsReturn {
  contacts: Contact[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchContacts: (filters: ContactFilters) => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useAvailableContacts(): UseAvailableContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (filters: ContactFilters) => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_PIPECAT_API_URL || '/cold-call-api';
      
      // Build query params
      const params = new URLSearchParams();
      params.append('source', filters.source);
      if (filters.segmento) params.append('segmento', filters.segmento);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.icp_score_min !== undefined) params.append('icp_score_min', String(filters.icp_score_min));
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`${apiUrl}/contacts/available?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Erro ao buscar contatos: ${response.statusText}`);
      }

      const data = await response.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar contatos';
      console.error('Error in useAvailableContacts:', err);
      setError(message);
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    contacts,
    total,
    loading,
    error,
    fetchContacts,
  };
}
