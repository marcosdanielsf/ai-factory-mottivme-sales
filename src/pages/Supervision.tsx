import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, LayoutList, Columns3, BarChart3, CheckSquare, X, ChevronDown, Archive, MoveRight } from 'lucide-react';
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
import { useGHLSync } from '../hooks/useGHLSync';
import { useSavedFilters } from '../hooks/useSavedFilters';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAccount } from '../contexts/AccountContext';
import { useAuth } from '../contexts/AuthContext';
import { ghlClient } from '../services/ghl/ghlClient';
import { SupervisionConversation, SupervisionStatus, supervisionStatusConfig, leadSourceConfig, LeadSource } from '../types/supervision';
import { SavedFiltersPanel } from '../components/supervision/SavedFiltersPanel';
import { LostReasonModal } from '../components/supervision/LostReasonModal';

type ViewMode = 'list' | 'kanban' | 'metrics';

export const Supervision: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<SupervisionConversation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const bulkStatusRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const { isClientUser } = useAccount();
  const { session } = useAuth();
  const selectedConversationRef = useRef<SupervisionConversation | null>(null);

  // Tags do contato GHL
  const [contactTags, setContactTags] = useState<string[]>([]);
  const [contactTagsLoading, setContactTagsLoading] = useState(false);

  // Feature #15: Lead Source Prompt state
  const [showLeadSourcePrompt, setShowLeadSourcePrompt] = useState<{
    sessionId: string;
    pendingAction: 'scheduled' | 'converted';
    scheduledAt?: string;
    notes?: string;
  } | null>(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Fetch tags do contato GHL quando muda a conversa selecionada
  useEffect(() => {
    const contact_id = selectedConversation?.contact_id;
    const location_id = selectedConversation?.location_id;
    const token = session?.access_token;

    if (!contact_id || !location_id || !token) {
      setContactTags([]);
      return;
    }

    let cancelled = false;
    setContactTagsLoading(true);

    ghlClient.getContact(contact_id, token, location_id)
      .then(({ contact }) => {
        if (!cancelled) {
          setContactTags(contact.tags || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[Supervision] Failed to fetch contact tags:', err.message);
          setContactTags([]);
        }
      })
      .finally(() => {
        if (!cancelled) setContactTagsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedConversation?.contact_id, selectedConversation?.location_id, session?.access_token]);

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

  const { syncMeetingStatus, syncLeadSource, syncAddTag, syncRemoveTag } = useGHLSync();

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
    if (!current) return;

    // Feature #15: validar lead_source antes de agendar
    if (!current.lead_source) {
      setShowLeadSourcePrompt({
        sessionId: current.session_id,
        pendingAction: 'scheduled',
        scheduledAt,
        notes,
      });
      return;
    }

    await markAsScheduled(current.session_id, scheduledAt, notes);
  }, [markAsScheduled]);

  const handleMarkConverted = useCallback(async (notes?: string) => {
    const current = selectedConversationRef.current;
    if (!current) return;

    // Feature #15: validar lead_source antes de converter
    if (!current.lead_source) {
      setShowLeadSourcePrompt({
        sessionId: current.session_id,
        pendingAction: 'converted',
        notes,
      });
      return;
    }

    await markAsConverted(current.session_id, notes);
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
    if (!current) return;

    await updateMeetingStatus(current.session_id, meetingStatus, notes);

    // Feature #11: Non-blocking GHL sync (fire-and-forget)
    syncMeetingStatus({
      sessionId: current.session_id,
      locationId: current.location_id || '',
      contactId: current.contact_id || undefined,
      meetingStatus,
      notes,
    });
  }, [updateMeetingStatus, syncMeetingStatus]);

  const handleUpdateLeadSource = useCallback(async (source: string) => {
    const current = selectedConversationRef.current;
    if (!current) return;

    await updateLeadSource(current.session_id, source);

    // Feature #11: Non-blocking GHL sync (fire-and-forget)
    syncLeadSource({
      sessionId: current.session_id,
      locationId: current.location_id || '',
      contactId: current.contact_id || undefined,
      leadSource: source,
    });
  }, [updateLeadSource, syncLeadSource]);

  const handleAddTag = useCallback((tag: string) => {
    const current = selectedConversationRef.current;
    if (!current?.contact_id || !current?.location_id) return;

    // Optimistic update
    setContactTags(prev => [...prev, tag]);

    // Sync to GHL (non-blocking)
    syncAddTag({
      contactId: current.contact_id,
      locationId: current.location_id,
      tags: [tag],
    });
  }, [syncAddTag]);

  const handleRemoveTag = useCallback((tag: string) => {
    const current = selectedConversationRef.current;
    if (!current?.contact_id || !current?.location_id) return;

    // Optimistic update
    setContactTags(prev => prev.filter(t => t !== tag));

    // Sync to GHL (non-blocking)
    syncRemoveTag({
      contactId: current.contact_id,
      locationId: current.location_id,
      tags: [tag],
    });
  }, [syncRemoveTag]);

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

  // Selection handlers
  const handleToggleSelect = useCallback((sessionId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = conversations.map(c => c.session_id);
      const allSelected = allIds.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allIds);
    });
  }, [conversations]);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkStatusOpen(false);
  }, []);

  const handleBulkMoveStatus = useCallback(async (newStatus: SupervisionStatus) => {
    setBulkStatusOpen(false);
    const ids = Array.from(selectedIds);
    for (const sessionId of ids) {
      if (newStatus === 'converted') {
        await markAsConverted(sessionId);
      } else if (newStatus === 'archived') {
        await archiveConversation(sessionId);
      } else if (newStatus === 'ai_active') {
        await resumeAI(sessionId);
      } else if (newStatus === 'ai_paused') {
        await pauseAI(sessionId);
      } else if (newStatus === 'scheduled') {
        await markAsScheduled(sessionId, new Date(Date.now() + 86400000).toISOString());
      }
    }
    refetch();
    handleCancelSelection();
  }, [selectedIds, markAsConverted, archiveConversation, resumeAI, pauseAI, markAsScheduled, refetch, handleCancelSelection]);

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    for (const sessionId of ids) {
      await archiveConversation(sessionId);
    }
    refetch();
    handleCancelSelection();
  }, [selectedIds, archiveConversation, refetch, handleCancelSelection]);

  // Close bulk status dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkStatusRef.current && !bulkStatusRef.current.contains(e.target as Node)) {
        setBulkStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [pendingLostSessionId, setPendingLostSessionId] = useState<string | null>(null);

  const handleKanbanStatusChange = useCallback(
    async (sessionId: string, newStatus: SupervisionStatus) => {
      if (newStatus === 'lost') {
        setPendingLostSessionId(sessionId);
        return;
      }

      // Feature #15: validar lead_source antes de 'scheduled' ou 'converted' no Kanban
      if (newStatus === 'scheduled' || newStatus === 'converted') {
        const conversation = conversations.find(c => c.session_id === sessionId);
        if (conversation && !conversation.lead_source) {
          setShowLeadSourcePrompt({
            sessionId,
            pendingAction: newStatus,
            scheduledAt: newStatus === 'scheduled'
              ? new Date(Date.now() + 86400000).toISOString()
              : undefined,
          });
          return;
        }
      }

      if (newStatus === 'converted') {
        await markAsConverted(sessionId);
      } else if (newStatus === 'archived') {
        await archiveConversation(sessionId);
      } else if (newStatus === 'scheduled') {
        await markAsScheduled(sessionId, new Date(Date.now() + 86400000).toISOString());
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
    [conversations, markAsConverted, markAsScheduled, archiveConversation, refetch]
  );

  const handleKanbanLostConfirm = useCallback(
    async (reason: string, notes?: string) => {
      if (pendingLostSessionId) {
        await markAsLost(pendingLostSessionId, reason, notes);
        setPendingLostSessionId(null);
        refetch();
      }
    },
    [pendingLostSessionId, markAsLost, refetch]
  );

  // Bulk Actions Bar Component
  // Feature #16: isClientUser nao ve botoes de mover status
  const BulkActionsBar = () => (
    <div className="flex items-center gap-2 px-3 py-2 bg-accent-primary/10 border-b border-accent-primary/30 shrink-0">
      <span className="text-xs font-medium text-accent-primary">
        {selectedIds.size} selecionado(s)
      </span>
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Mover Status dropdown — apenas para admins/gestores */}
        {!isClientUser && (
          <div className="relative" ref={bulkStatusRef}>
            <button
              onClick={() => setBulkStatusOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-hover hover:bg-border-default rounded-lg text-xs text-text-secondary transition-colors"
            >
              <MoveRight size={12} />
              <span>Mover Status</span>
              <ChevronDown size={11} className={`transition-transform ${bulkStatusOpen ? 'rotate-180' : ''}`} />
            </button>
            {bulkStatusOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
                {(Object.entries(supervisionStatusConfig) as [SupervisionStatus, typeof supervisionStatusConfig[SupervisionStatus]][]).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => handleBulkMoveStatus(status)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-text-secondary hover:bg-bg-hover transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${config.bgColor}`} />
                    <span className={config.color}>{config.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Arquivar — apenas para admins/gestores */}
        {!isClientUser && (
          <button
            onClick={handleBulkArchive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-hover hover:bg-border-default rounded-lg text-xs text-text-muted transition-colors"
          >
            <Archive size={12} />
            <span>Arquivar</span>
          </button>
        )}
        {/* Cancelar */}
        <button
          onClick={handleCancelSelection}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={12} />
          Cancelar
        </button>
      </div>
    </div>
  );

  // View Toggle Component
  const ViewToggle = () => (
    <div className="flex items-center gap-1">
      {viewMode === 'list' && (
        <button
          onClick={() => selectionMode ? handleCancelSelection() : setSelectionMode(true)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            selectionMode
              ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
              : 'bg-bg-hover text-text-muted hover:text-text-secondary'
          }`}
          title="Selecionar conversas"
        >
          <CheckSquare size={13} />
        </button>
      )}
      <div className="flex bg-bg-hover rounded-lg p-0.5">
        <button
          onClick={() => { setViewMode('list'); handleCancelSelection(); }}
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
          onClick={() => { setViewMode('kanban'); handleCancelSelection(); }}
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
          onClick={() => { setViewMode('metrics'); handleCancelSelection(); }}
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
    </div>
  );

  // Feature #15: handler executado pelo LeadSourcePromptModal apos usuario escolher fonte
  const handleLeadSourcePromptSelect = useCallback(async (source: string) => {
    if (!showLeadSourcePrompt) return;
    const { sessionId, pendingAction, scheduledAt, notes } = showLeadSourcePrompt;

    // 1. Salvar lead source localmente
    await updateLeadSource(sessionId, source);

    // 2. Sync GHL (non-blocking)
    const conversation = conversations.find(c => c.session_id === sessionId);
    syncLeadSource({
      sessionId,
      locationId: conversation?.location_id || '',
      contactId: conversation?.contact_id || undefined,
      leadSource: source,
    });

    // 3. Executar acao pendente
    if (pendingAction === 'scheduled' && scheduledAt) {
      await markAsScheduled(sessionId, scheduledAt, notes);
    } else if (pendingAction === 'converted') {
      await markAsConverted(sessionId, notes);
    }

    setShowLeadSourcePrompt(null);
    refetch();
  }, [showLeadSourcePrompt, updateLeadSource, syncLeadSource, markAsScheduled, markAsConverted, conversations, refetch]);

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
    onAddTag: handleAddTag,
    onRemoveTag: handleRemoveTag,
    contactTags,
    contactTagsLoading,
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
              <>
                {selectionMode && <BulkActionsBar />}
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?.session_id || null}
                  onSelect={handleSelectConversation}
                  loading={listLoading}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                />
              </>
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
              <SupervisionMetrics conversations={conversations} filterOptions={filterOptions} />
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
          {selectionMode && <BulkActionsBar />}
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.session_id || null}
            onSelect={handleSelectConversation}
            loading={listLoading}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
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
          <SupervisionMetrics conversations={conversations} filterOptions={filterOptions} />
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

      {/* Feature #15: Lead Source Prompt Modal — intercepta scheduled/converted sem lead_source */}
      {showLeadSourcePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-xl p-6 max-w-sm mx-4 w-full shadow-2xl border border-border-default">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              Fonte do Lead
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Defina a fonte antes de{' '}
              {showLeadSourcePrompt.pendingAction === 'scheduled' ? 'agendar' : 'converter'}{' '}
              este lead.
            </p>
            <div className="max-h-52 overflow-y-auto space-y-0.5 mb-4 -mx-1 px-1">
              {(Object.entries(leadSourceConfig) as [LeadSource, { label: string }][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleLeadSourcePromptSelect(key)}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLeadSourcePrompt(null)}
              className="w-full py-2 bg-bg-hover text-text-secondary rounded-lg text-sm hover:bg-border-default transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Kanban Lost Reason Modal — intercepta drag para 'lost' */}
      <LostReasonModal
        isOpen={!!pendingLostSessionId}
        onClose={() => setPendingLostSessionId(null)}
        onConfirm={handleKanbanLostConfirm}
        executing={executing}
      />
    </div>
  );
};
