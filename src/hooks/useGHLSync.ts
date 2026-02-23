import { useCallback, useState } from 'react';

const N8N_WEBHOOK_BASE =
  import.meta.env.VITE_N8N_WEBHOOK_BASE ||
  'https://mottivme.app.n8n.cloud/webhook';

interface UseGHLSyncReturn {
  syncing: boolean;
  error: string | null;
  syncMeetingStatus: (params: {
    sessionId: string;
    locationId: string;
    contactId?: string;
    meetingStatus: string;
    notes?: string;
  }) => Promise<boolean>;
  syncLeadSource: (params: {
    sessionId: string;
    locationId: string;
    contactId?: string;
    leadSource: string;
  }) => Promise<boolean>;
}

/**
 * Hook para sincronizar dados com o GHL via webhooks n8n.
 *
 * Todas as operacoes sao NON-BLOCKING (fire-and-forget):
 * - Falha de sync nao bloqueia a UI
 * - Erros sao logados no console mas nao propagados ao usuario
 *
 * Webhooks:
 * - sync_meeting_status: POST /supervision-sync-meeting
 * - sync_lead_source:    POST /supervision-sync-lead-source
 */
export const useGHLSync = (): UseGHLSyncReturn => {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncMeetingStatus = useCallback(
    async (params: {
      sessionId: string;
      locationId: string;
      contactId?: string;
      meetingStatus: string;
      notes?: string;
    }): Promise<boolean> => {
      try {
        setSyncing(true);
        setError(null);

        console.log('[GHLSync] Syncing meeting status:', params);

        const response = await fetch(
          `${N8N_WEBHOOK_BASE}/supervision-sync-meeting`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync_meeting_status',
              session_id: params.sessionId,
              location_id: params.locationId,
              contact_id: params.contactId,
              meeting_status: params.meetingStatus,
              notes: params.notes,
              timestamp: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          // Non-blocking: log error mas nao falha a acao principal
          console.warn('[GHLSync] Webhook returned', response.status);
          return false;
        }

        console.log('[GHLSync] Meeting status synced successfully');
        return true;
      } catch (err: any) {
        // Non-blocking: falha de GHL sync nao bloqueia a acao de supervisao
        console.warn('[GHLSync] Sync failed (non-blocking):', err.message);
        setError(err.message);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  const syncLeadSource = useCallback(
    async (params: {
      sessionId: string;
      locationId: string;
      contactId?: string;
      leadSource: string;
    }): Promise<boolean> => {
      try {
        setSyncing(true);
        setError(null);

        const response = await fetch(
          `${N8N_WEBHOOK_BASE}/supervision-sync-lead-source`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync_lead_source',
              session_id: params.sessionId,
              location_id: params.locationId,
              contact_id: params.contactId,
              lead_source: params.leadSource,
              timestamp: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          console.warn('[GHLSync] Lead source sync returned', response.status);
          return false;
        }

        return true;
      } catch (err: any) {
        console.warn(
          '[GHLSync] Lead source sync failed (non-blocking):',
          err.message
        );
        return false;
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  return { syncing, error, syncMeetingStatus, syncLeadSource };
};
