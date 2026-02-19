import { useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

const WEBHOOK_BASE = 'https://cliente-a1.mentorfy.io';

export type WebhookAction =
  | 'get_linkedin_leads'
  | 'get_apollo_leads'
  | 'get_gmaps_leads'
  | 'enrich_record'
  | 'enrich_person'
  | 'enrich_company'
  | 'verify_email'
  | 'enrich_socials'
  | 'linkedin_search';

const WEBHOOK_PATHS: Record<WebhookAction, string> = {
  get_linkedin_leads: '/webhook/ec11af9d-ed48-4e98-a65e-5968f7dbfc85',
  get_apollo_leads:   '/webhook/5990f096-b106-4fcd-8847-cf15d151a310',
  get_gmaps_leads:    '/webhook/get-gmaps',
  enrich_record:      '/webhook/07d99d5f-add8-49db-aabf-726ccceba926',
  enrich_person:      '/webhook/b5bdb531-510a-4d02-a206-ecaf36c145b0',
  enrich_company:     '/webhook/78ecec2e-4ced-433e-8533-a910dde74356',
  verify_email:       '/webhook/50286ab4-8291-4256-a221-a3414d93c44f',
  enrich_socials:     '/webhook/4f6df36e-76f2-433e-8169-b77baf2d457f',
  linkedin_search:    '/webhook/f1174c0f-2ea5-4902-92ef-38f6ae31ee5b',
};

export interface WebhookResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface TriggerWebhookOptions {
  recordId?: string;
  payload?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useLeadGenWebhook = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<WebhookResult | null>(null);

  const triggerWebhook = useCallback(async (
    action: WebhookAction,
    options: TriggerWebhookOptions = {}
  ): Promise<WebhookResult> => {
    const { recordId, payload } = options;

    const path = WEBHOOK_PATHS[action];
    const url = new URL(`${WEBHOOK_BASE}${path}`);

    if (recordId) {
      url.searchParams.set('recordId', recordId);
    }

    setLoading(true);
    setLastResult(null);

    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!res.ok) {
        const result: WebhookResult = {
          success: false,
          error: `Erro HTTP ${res.status}: ${res.statusText}`,
        };
        setLastResult(result);
        return result;
      }

      const data = await res.json().catch(() => null);
      const result: WebhookResult = { success: true, data };
      setLastResult(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao disparar webhook';
      const result: WebhookResult = { success: false, error: message };
      setLastResult(result);
      console.error('Error in useLeadGenWebhook:', err);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { triggerWebhook, loading, lastResult };
};
