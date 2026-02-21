import { useState, useCallback } from 'react';
import { ContactFilters } from './useAvailableContacts';

// ─── Types ──────────────────────────────────────────────────────────

export interface ImportContactsInput {
  source: 'growth_leads' | 'ghl_tracking';
  filters?: Omit<ContactFilters, 'source' | 'limit'>;
  max_contacts?: number;
  selected_phones?: string[]; // Optional: specific phones to import
}

export interface ImportContactsResult {
  imported: number;
  skipped: number;
  errors: number;
  message: string;
}

interface UseImportContactsReturn {
  importing: boolean;
  result: ImportContactsResult | null;
  error: string | null;
  importContacts: (campaignId: string, input: ImportContactsInput) => Promise<ImportContactsResult | null>;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useImportContacts(): UseImportContactsReturn {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportContactsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importContacts = useCallback(async (
    campaignId: string,
    input: ImportContactsInput
  ): Promise<ImportContactsResult | null> => {
    try {
      setImporting(true);
      setError(null);
      setResult(null);

      const apiUrl = import.meta.env.VITE_PIPECAT_API_URL || '/cold-call-api';

      const response = await fetch(`${apiUrl}/campaign/${campaignId}/import-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao importar contatos: ${response.statusText}`);
      }

      const data: ImportContactsResult = await response.json();
      setResult(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao importar contatos';
      console.error('Error in useImportContacts:', err);
      setError(message);
      return null;
    } finally {
      setImporting(false);
    }
  }, []);

  return {
    importing,
    result,
    error,
    importContacts,
  };
}
