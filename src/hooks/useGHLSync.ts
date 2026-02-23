import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ghlClient } from '../services/ghl/ghlClient';

// Mapeamento meeting_status -> tag GHL (mesmo padrao do StatusCenter)
const MEETING_TAG_MAP: Record<string, string | null> = {
  cancelado: 'cancelado',
  no_show: 'no-show',
  compareceu: 'compareceu',
  fechado: 'converteu',
};

// Mapeamento meeting_status -> opportunity status
const MEETING_OPP_MAP: Record<string, string | null> = {
  cancelado: 'lost',
  no_show: null,
  compareceu: null,
  fechado: 'won',
};

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
  syncAddTag: (params: {
    contactId?: string;
    locationId: string;
    tags: string[];
  }) => Promise<boolean>;
  syncRemoveTag: (params: {
    contactId?: string;
    locationId: string;
    tags: string[];
  }) => Promise<boolean>;
}

/**
 * Hook para sincronizar dados com o GHL via ghlClient.
 * Usa o mesmo padrao do StatusCenter (addContactTags + updateOpportunity).
 *
 * Todas as operacoes sao NON-BLOCKING:
 * - Falha de sync nao bloqueia a UI
 * - Erros sao logados no console mas nao propagados ao usuario
 */
export const useGHLSync = (): UseGHLSyncReturn => {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const syncMeetingStatus = useCallback(
    async (params: {
      sessionId: string;
      locationId: string;
      contactId?: string;
      meetingStatus: string;
      notes?: string;
    }): Promise<boolean> => {
      const token = session?.access_token;
      if (!token || !params.contactId || !params.locationId) {
        console.warn('[GHLSync] Skipping: missing token, contactId or locationId');
        return false;
      }

      try {
        setSyncing(true);
        setError(null);

        console.log('[GHLSync] Syncing meeting status via ghlClient:', params.meetingStatus);

        // 1. Add tag no contato
        const tag = MEETING_TAG_MAP[params.meetingStatus];
        if (tag) {
          await ghlClient.addContactTags(
            params.contactId,
            [tag],
            token,
            params.locationId
          );
        }

        // 2. Update opportunity status (won/lost) se aplicavel
        const oppStatus = MEETING_OPP_MAP[params.meetingStatus];
        if (oppStatus) {
          const opp = await ghlClient.findOpportunityByContact(
            params.locationId,
            params.contactId,
            token
          );
          if (opp) {
            await ghlClient.updateOpportunity(
              opp.id,
              { status: oppStatus, locationId: params.locationId },
              token
            );
          }
        }

        console.log(`[GHLSync] Meeting status synced: tag=${tag || '-'}, opp=${oppStatus || '-'}`);
        return true;
      } catch (err: any) {
        console.warn('[GHLSync] Sync failed (non-blocking):', err.message);
        setError(err.message);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [session?.access_token]
  );

  const syncLeadSource = useCallback(
    async (params: {
      sessionId: string;
      locationId: string;
      contactId?: string;
      leadSource: string;
    }): Promise<boolean> => {
      const token = session?.access_token;
      if (!token || !params.contactId || !params.locationId) {
        console.warn('[GHLSync] Skipping lead source sync: missing token, contactId or locationId');
        return false;
      }

      try {
        setSyncing(true);
        setError(null);

        // Add tag com a fonte do lead
        await ghlClient.addContactTags(
          params.contactId,
          [`fonte-${params.leadSource}`],
          token,
          params.locationId
        );

        console.log(`[GHLSync] Lead source synced: tag=fonte-${params.leadSource}`);
        return true;
      } catch (err: any) {
        console.warn('[GHLSync] Lead source sync failed (non-blocking):', err.message);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [session?.access_token]
  );

  const syncAddTag = useCallback(
    async (params: {
      contactId?: string;
      locationId: string;
      tags: string[];
    }): Promise<boolean> => {
      const token = session?.access_token;
      if (!token || !params.contactId || !params.locationId) {
        console.warn('[GHLSync] Skipping syncAddTag: missing token, contactId or locationId');
        return false;
      }

      try {
        setSyncing(true);
        setError(null);

        await ghlClient.addContactTags(
          params.contactId,
          params.tags,
          token,
          params.locationId
        );

        console.log(`[GHLSync] Tags added: ${params.tags.join(', ')}`);
        return true;
      } catch (err: any) {
        console.warn('[GHLSync] syncAddTag failed (non-blocking):', err.message);
        setError(err.message);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [session?.access_token]
  );

  const syncRemoveTag = useCallback(
    async (params: {
      contactId?: string;
      locationId: string;
      tags: string[];
    }): Promise<boolean> => {
      const token = session?.access_token;
      if (!token || !params.contactId || !params.locationId) {
        console.warn('[GHLSync] Skipping syncRemoveTag: missing token, contactId or locationId');
        return false;
      }

      try {
        setSyncing(true);
        setError(null);

        await ghlClient.removeContactTags(
          params.contactId,
          params.tags,
          token,
          params.locationId
        );

        console.log(`[GHLSync] Tags removed: ${params.tags.join(', ')}`);
        return true;
      } catch (err: any) {
        console.warn('[GHLSync] syncRemoveTag failed (non-blocking):', err.message);
        setError(err.message);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [session?.access_token]
  );

  return { syncing, error, syncMeetingStatus, syncLeadSource, syncAddTag, syncRemoveTag };
};
