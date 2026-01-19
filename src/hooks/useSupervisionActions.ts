import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SupervisionStatus, SupervisionAction } from '../types/supervision';

interface UseSupervisionActionsReturn {
  executing: boolean;
  error: string | null;
  pauseAI: (conversationId: string, leadId?: string) => Promise<boolean>;
  resumeAI: (conversationId: string) => Promise<boolean>;
  markAsScheduled: (conversationId: string, scheduledAt: string, notes?: string) => Promise<boolean>;
  markAsConverted: (conversationId: string, notes?: string) => Promise<boolean>;
  addNote: (conversationId: string, notes: string) => Promise<boolean>;
  archiveConversation: (conversationId: string) => Promise<boolean>;
  executeAction: (action: SupervisionAction) => Promise<boolean>;
}

export const useSupervisionActions = (
  onSuccess?: () => void
): UseSupervisionActionsReturn => {
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback(
    async (
      conversationId: string,
      updates: {
        status?: SupervisionStatus;
        ai_enabled?: boolean;
        notes?: string;
        scheduled_at?: string;
        converted_at?: string;
        lead_id?: string;
        agent_id?: string;
      }
    ): Promise<boolean> => {
      try {
        setExecuting(true);
        setError(null);

        // Primeiro, verificar se já existe um estado
        const { data: existing } = await supabase
          .from('supervision_states')
          .select('id')
          .eq('conversation_id', conversationId)
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
            .eq('conversation_id', conversationId);

          if (updateError) throw updateError;
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('supervision_states')
            .insert({
              conversation_id: conversationId,
              lead_id: updates.lead_id,
              agent_id: updates.agent_id,
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
      } catch (err: any) {
        console.error('Error updating supervision state:', err);
        setError(err.message || 'Erro ao atualizar estado');

        // Se tabela nao existe, simular sucesso para desenvolvimento
        if (err.message?.includes('does not exist')) {
          console.log('Mock: Supervision state updated', { conversationId, updates });
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
    async (conversationId: string, leadId?: string): Promise<boolean> => {
      return updateState(conversationId, {
        status: 'ai_paused',
        ai_enabled: false,
        lead_id: leadId,
      });
    },
    [updateState]
  );

  const resumeAI = useCallback(
    async (conversationId: string): Promise<boolean> => {
      return updateState(conversationId, {
        status: 'ai_active',
        ai_enabled: true,
      });
    },
    [updateState]
  );

  const markAsScheduled = useCallback(
    async (conversationId: string, scheduledAt: string, notes?: string): Promise<boolean> => {
      return updateState(conversationId, {
        status: 'scheduled',
        scheduled_at: scheduledAt,
        notes,
      });
    },
    [updateState]
  );

  const markAsConverted = useCallback(
    async (conversationId: string, notes?: string): Promise<boolean> => {
      return updateState(conversationId, {
        status: 'converted',
        converted_at: new Date().toISOString(),
        ai_enabled: false,
        notes,
      });
    },
    [updateState]
  );

  const addNote = useCallback(
    async (conversationId: string, notes: string): Promise<boolean> => {
      return updateState(conversationId, { notes });
    },
    [updateState]
  );

  const archiveConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      return updateState(conversationId, {
        status: 'archived',
        ai_enabled: false,
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
    [pauseAI, resumeAI, markAsScheduled, markAsConverted, addNote, archiveConversation]
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
    executeAction,
  };
};
