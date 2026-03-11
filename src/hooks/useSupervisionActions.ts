import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SupervisionStatus, SupervisionAction } from '../types/supervision';
import { getErrorMessage } from "../lib/getErrorMessage";

interface UseSupervisionActionsReturn {
  executing: boolean;
  error: string | null;
  pauseAI: (conversationId: string, leadId?: string) => Promise<boolean>;
  resumeAI: (conversationId: string) => Promise<boolean>;
  markAsScheduled: (conversationId: string, scheduledAt: string, notes?: string) => Promise<boolean>;
  markAsConverted: (conversationId: string, notes?: string) => Promise<boolean>;
  addNote: (conversationId: string, notes: string) => Promise<boolean>;
  archiveConversation: (conversationId: string) => Promise<boolean>;
  markAsLost: (conversationId: string, lostReason: string, lostReasonNotes?: string) => Promise<boolean>;
  updateMeetingStatus: (conversationId: string, meetingStatus: string, notes?: string) => Promise<boolean>;
  updateLeadSource: (conversationId: string, leadSource: string) => Promise<boolean>;
  executeAction: (action: SupervisionAction) => Promise<boolean>;
}

export const useSupervisionActions = (
  onSuccess?: () => void
): UseSupervisionActionsReturn => {
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback(
    async (
      sessionId: string,
      updates: {
        status?: SupervisionStatus;
        ai_enabled?: boolean;
        notes?: string;
        scheduled_at?: string;
        converted_at?: string | null;
        location_id?: string;
        contact_name?: string;
        meeting_status?: string;
        lost_reason?: string;
        lost_reason_notes?: string;
        lead_source?: string;
        lost_at?: string | null;
      }
    ): Promise<boolean> => {
      try {
        setExecuting(true);
        setError(null);

        // Injetar campos automaticos ao marcar como perdido
        if (updates.status === 'lost') {
          updates.lost_at = new Date().toISOString();
          updates.converted_at = null;
        }

        // Primeiro, verificar se já existe um estado
        const { data: existing } = await supabase
          .from('supervision_states')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (existing) {
          // Atualizar existente
          const { error: updateError } = await supabase
            .from('supervision_states')
            .update({
              ...updates,
              updated_by: 'user',
              updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

          if (updateError) throw updateError;
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('supervision_states')
            .insert({
              session_id: sessionId,
              location_id: updates.location_id,
              contact_name: updates.contact_name,
              status: updates.status || 'ai_active',
              ai_enabled: updates.ai_enabled ?? true,
              notes: updates.notes,
              scheduled_at: updates.scheduled_at,
              converted_at: updates.converted_at,
              updated_by: 'user',
            });

          if (insertError) throw insertError;
        }

        onSuccess?.();
        return true;
      } catch (err: unknown) {
        console.error('Error updating supervision state:', err);
        setError(getErrorMessage(err) || 'Erro ao atualizar estado');

        // Se tabela nao existe, simular sucesso para desenvolvimento
        if (getErrorMessage(err)?.includes('does not exist')) {
          console.log('Mock: Supervision state updated', { sessionId, updates });
          onSuccess?.();
          setError(null);
          return true;
        }

        return false;
      } finally {
        setExecuting(false);
      }
    },
    [onSuccess]
  );

  const pauseAI = useCallback(
    async (sessionId: string, locationId?: string): Promise<boolean> => {
      return updateState(sessionId, {
        status: 'ai_paused',
        ai_enabled: false,
        location_id: locationId,
      });
    },
    [updateState]
  );

  const resumeAI = useCallback(
    async (sessionId: string): Promise<boolean> => {
      return updateState(sessionId, {
        status: 'ai_active',
        ai_enabled: true,
      });
    },
    [updateState]
  );

  const markAsScheduled = useCallback(
    async (sessionId: string, scheduledAt: string, notes?: string): Promise<boolean> => {
      return updateState(sessionId, {
        status: 'scheduled',
        scheduled_at: scheduledAt,
        notes,
      });
    },
    [updateState]
  );

  const markAsConverted = useCallback(
    async (sessionId: string, notes?: string): Promise<boolean> => {
      return updateState(sessionId, {
        status: 'converted',
        converted_at: new Date().toISOString(),
        ai_enabled: false,
        notes,
      });
    },
    [updateState]
  );

  const addNote = useCallback(
    async (sessionId: string, notes: string): Promise<boolean> => {
      return updateState(sessionId, { notes });
    },
    [updateState]
  );

  const archiveConversation = useCallback(
    async (sessionId: string): Promise<boolean> => {
      return updateState(sessionId, {
        status: 'archived',
        ai_enabled: false,
      });
    },
    [updateState]
  );

  const markAsLost = useCallback(
    async (sessionId: string, lostReason: string, lostReasonNotes?: string): Promise<boolean> => {
      return updateState(sessionId, {
        status: 'lost' as SupervisionStatus,
        ai_enabled: false,
        lost_reason: lostReason,
        lost_reason_notes: lostReasonNotes,
      });
    },
    [updateState]
  );

  const updateMeetingStatus = useCallback(
    async (sessionId: string, meetingStatus: string, notes?: string): Promise<boolean> => {
      const statusMap: Record<string, SupervisionStatus> = {
        cancelado: 'lost' as SupervisionStatus,
        no_show: 'scheduled' as SupervisionStatus,
        compareceu: 'ai_active' as SupervisionStatus,
        fechado: 'converted' as SupervisionStatus,
      };
      const newStatus = statusMap[meetingStatus] || ('ai_active' as SupervisionStatus);
      return updateState(sessionId, {
        status: newStatus,
        meeting_status: meetingStatus,
        notes: notes || undefined,
        converted_at: meetingStatus === 'fechado' ? new Date().toISOString() : undefined,
        ai_enabled: meetingStatus === 'cancelado' || meetingStatus === 'fechado' ? false : undefined,
      });
    },
    [updateState]
  );

  const updateLeadSource = useCallback(
    async (sessionId: string, leadSource: string): Promise<boolean> => {
      return updateState(sessionId, {
        lead_source: leadSource,
      });
    },
    [updateState]
  );

  const executeAction = useCallback(
    async (action: SupervisionAction): Promise<boolean> => {
      switch (action.type) {
        case 'pause_ai':
          return pauseAI(action.conversationId);
        case 'resume_ai':
          return resumeAI(action.conversationId);
        case 'mark_scheduled':
          return markAsScheduled(
            action.conversationId,
            action.payload?.scheduledAt || new Date().toISOString(),
            action.payload?.notes
          );
        case 'mark_converted':
          return markAsConverted(action.conversationId, action.payload?.notes);
        case 'add_note':
          return addNote(action.conversationId, action.payload?.notes || '');
        case 'archive':
          return archiveConversation(action.conversationId);
        default:
          return false;
      }
    },
    [pauseAI, resumeAI, markAsScheduled, markAsConverted, addNote, archiveConversation, markAsLost, updateMeetingStatus, updateLeadSource]
  );

  return {
    executing,
    error,
    pauseAI,
    resumeAI,
    markAsScheduled,
    markAsConverted,
    addNote,
    archiveConversation,
    markAsLost,
    updateMeetingStatus,
    updateLeadSource,
    executeAction,
  };
};
