import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, LayoutList, Columns3, BarChart3 } from 'lucide-react';
import {
  SupervisionHeader,
  ConversationList,
  ConversationDetail,
  SupervisionKanban,
  SupervisionMetrics,
} from '../components/supervision';
import { useSupervisionPanel } from '../hooks/useSupervisionPanel';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useSupervisionActions } from '../hooks/useSupervisionActions';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { useSupervisionRealtime, useConversationRealtime } from '../hooks/useSupervisionRealtime';
import { useSendMessage } from '../hooks/useSendMessage';
import { useSavedFilters } from '../hooks/useSavedFilters';
import { useIsMobile } from '../hooks/useMediaQuery';
import { SupervisionConversation, SupervisionStatus } from '../types/supervision';
import { SavedFiltersPanel } from '../components/supervision/SavedFiltersPanel';

type ViewMode = 'list' | 'kanban' | 'metrics';

export const Supervision: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<SupervisionConversation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const isMobile = useIsMobile();
  const selectedConversationRef = useRef<SupervisionConversation | null>(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const {
    conversations,
    loading: listLoading,
    filters,
    setFilters,
    refetch,
    stats,
  } = useSupervisionPanel();

  const {
    messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useConversationMessages(selectedConversation?.session_id || null);

  const { options: filterOptions, loading: filterOptionsLoading } = useFilterOptions();

  const {
    executing,
    pauseAI,
    resumeAI,
    markAsScheduled,
    markAsConverted,
    addNote,
    archiveConversation,
    markAsLost,
    updateMeetingStatus,
    updateLeadSource,
  } = useSupervisionActions(() => {
    refetch();
    refetchMessages();
  });

  const {
    sending: sendingMessage,
    error: sendError,
    sendMessage,
    clearError: clearSendError,
  } = useSendMessage(() => {
    refetchMessages();
  });

  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();

  // Real-time
  useSupervisionRealtime({
    onNewMessage: useCallback(() => {
      refetch();
    }, [refetch]),
    onConversationUpdate: useCallback(() => {
      refetch();
    }, [refetch]),
    onSupervisionStateChange: useCallback((payload) => {
      refetch();
      const current = selectedConversationRef.current;
      if (current && payload.new?.session_id === current.session_id) {
        setSelectedConversation((prev) =>
          prev
            ? { ...prev, ai_enabled: payload.new?.ai_enabled, supervision_status: payload.new?.status }
            : null
        );
      }
    }, [refetch]),
    enabled: true,
  });

  useConversationRealtime(
    selectedConversation?.session_id || null,
    useCallback(() => {
      refetchMessages();
    }, [refetchMessages])
  );

  const handleSelectConversation = useCallback((conversation: SupervisionConversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handlePauseAI = useCallback(async () => {
    const current = selectedConversationRef.current;
    if (current) {
      await pauseAI(current.session_id, current.location_id || undefined);
    }
  }, [pauseAI]);

  const handleResumeAI = useCallback(async () => {
    const current = selectedConversationRef.current;
    if (current) {
      await resumeAI(current.session_id);
    }
  }, [resumeAI]);

  const handleMarkScheduled = useCallback(async (scheduledAt: string, notes?: string) => {
    const current = selectedConversationRef.current;
    if (current) {
      await markAsScheduled(current.session_id, scheduledAt, notes);
    }
  }, [markAsScheduled]);

  const handleMarkConverted = useCallback(async (notes?: string) => {
    const current = selectedConversationRef.current;
    if (current) {
      await markAsConverted(current.session_id, notes);
    }
  }, [markAsConverted]);

  const handleAddNote = useCallback(async (notes: string) => {
    const current = selectedConversationRef.current;
    if (current) {
      await addNote(current.session_id, notes);
    }
  }, [addNote]);

  const handleArchive = useCallback(async () => {
    const current = selectedConversationRef.current;
    if (current) {
      await archiveConversation(current.session_id);
      setSelectedConversation(null);
    }
  }, [archiveConversation]);

  const handleMarkAsLost = useCallback(async (reason: string, notes?: string) => {
    const current = selectedConversationRef.current;
    if (current) {
      await markAsLost(current.session_id, reason, notes);
    }
  }, [markAsLost]);

  const handleUpdateMeetingStatus = useCallback(async (meetingStatus: string, notes?: string) => {
    const current = selectedConversationRef.current;
    if (current) {
      await updateMeetingStatus(current.session_id, meetingStatus, notes);
    }
  }, [updateMeetingStatus]);

  const handleUpdateLeadSource = useCallback(async (source: string) => {
    const current = selectedConversationRef.current;
    if (current) {
      await updateLeadSource(current.session_id, source);
    }
  }, [updateLeadSource]);

  const handleSendMessage = useCallback(async (message: string): Promise<boolean> => {
    const current = selectedConversationRef.current;
    if (!current) return false;
    return await sendMessage({
      sessionId: current.session_id,
      locationId: current.location_id || '',
      contactId: current.contact_id || undefined,
      message,
      channel: (current.channel as 'instagram' | 'whatsapp' | 'sms' | 'email') || 'instagram',
    });
  }, [sendMessage]);

  const handleKanbanStatusChange = useCallback(
    async (sessionId: string, newStatus: SupervisionStatus) => {
      if (newStatus === 'converted') {
        await markAsConverted(sessionId);
      } else if (newStatus === 'archived') {
        await archiveConversation(sessionId);
      } else {
        const { supabase } = await import('../lib/supabase');
        await supabase
          .from('supervision_states')
          .upsert(
            {
              session_id: sessionId,
              status: newStatus,
              ai_enabled: newStatus === 'ai_active',
              updated_by: 'user',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'session_id' }
          );
        refetch();
      }
    },
    [markAsConverted, archiveConversation, refetch]
  );

  // View Toggle Component
  const ViewToggle = () => (
    <div className="flex bg-bg-hover rounded-lg p-0.5">
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-accent-primary text-white'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        title="Lista"
      >
        <LayoutList size={14} />
      </button>
      <button
        onClick={() => setViewMode('kanban')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'kanban'
            ? 'bg-accent-primary text-white'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        title="Kanban"
      >
        <Columns3 size={14} />
      </button>
      <button
        onClick={() => setViewMode('metrics')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'metrics'
            ? 'bg-accent-primary text-white'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        title="Metricas"
      >
        <BarChart3 size={14} />
      </button>
    </div>
  );

  const detailProps = {
    conversation: selectedConversation!,
    messages,
    loading: messagesLoading,
    onClose: handleCloseDetail,
    onPauseAI: handlePauseAI,
    onResumeAI: handleResumeAI,
    onMarkScheduled: handleMarkScheduled,
    onMarkConverted: handleMarkConverted,
    onAddNote: handleAddNote,
    onArchive: handleArchive,
    onMarkAsLost: handleMarkAsLost,
    onUpdateMeetingStatus: handleUpdateMeetingStatus,
    onUpdateLeadSource: handleUpdateLeadSource,
    executing,
    onSendMessage: handleSendMessage,
    sendingMessage,
    sendError,
    onClearSendError: clearSendError,
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-bg-primary">
        {selectedConversation ? (
          <ConversationDetail {...detailProps} isMobile={true} />
        ) : (
          <>
            <SupervisionHeader
              stats={stats}
              filters={filters}
              onFilterChange={setFilters}
              onRefresh={refetch}
              loading={listLoading}
              filterOptions={filterOptions}
              isMobile={true}
              viewToggle={<ViewToggle />}
            />
            {savedFilters.length > 0 && viewMode !== 'metrics' && (
              <div className="px-3">
                <SavedFiltersPanel
                  savedFilters={savedFilters}
                  currentFilters={filters}
                  onApply={setFilters}
                  onSave={saveFilter}
                  onDelete={deleteFilter}
                />
              </div>
            )}
            {viewMode === 'list' && (
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversation?.session_id || null}
                onSelect={handleSelectConversation}
                loading={listLoading}
              />
            )}
            {viewMode === 'kanban' && (
              <SupervisionKanban
                conversations={conversations}
                onSelect={handleSelectConversation}
                onStatusChange={handleKanbanStatusChange}
                selectedId={selectedConversation?.session_id || null}
              />
            )}
            {viewMode === 'metrics' && (
              <SupervisionMetrics conversations={conversations} />
            )}
          </>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-full flex bg-bg-primary">
      {/* Left Panel — only visible in list mode */}
      {viewMode === 'list' && (
        <div className="w-[400px] flex flex-col border-r border-border-default bg-bg-secondary">
          <SupervisionHeader
            stats={stats}
            filters={filters}
            onFilterChange={setFilters}
            onRefresh={refetch}
            loading={listLoading}
            filterOptions={filterOptions}
            isMobile={false}
            viewToggle={<ViewToggle />}
          />
          <div className="px-3">
            <SavedFiltersPanel
              savedFilters={savedFilters}
              currentFilters={filters}
              onApply={setFilters}
              onSave={saveFilter}
              onDelete={deleteFilter}
            />
          </div>
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.session_id || null}
            onSelect={handleSelectConversation}
            loading={listLoading}
          />
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b border-border-default bg-bg-secondary flex items-center gap-3">
            <ViewToggle />
            <h1 className="text-base font-semibold text-text-primary">Supervisao IA - Kanban</h1>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <SupervisionKanban
              conversations={conversations}
              onSelect={handleSelectConversation}
              onStatusChange={handleKanbanStatusChange}
              selectedId={selectedConversation?.session_id || null}
            />
            {selectedConversation && (
              <div className="w-[400px] border-l border-border-default shrink-0">
                <ConversationDetail {...detailProps} isMobile={false} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics View */}
      {viewMode === 'metrics' && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b border-border-default bg-bg-secondary flex items-center gap-3">
            <ViewToggle />
            <h1 className="text-base font-semibold text-text-primary">Supervisao IA - Metricas</h1>
          </div>
          <SupervisionMetrics conversations={conversations} />
        </div>
      )}

      {/* List View — right panel */}
      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ConversationDetail {...detailProps} isMobile={false} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-bg-secondary">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} className="text-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-text-muted max-w-xs">
                  Escolha uma conversa na lista para visualizar as mensagens e realizar acoes
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
