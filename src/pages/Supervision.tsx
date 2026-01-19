import React, { useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  SupervisionHeader,
  ConversationList,
  ConversationDetail,
} from '../components/supervision';
import { useSupervisionPanel } from '../hooks/useSupervisionPanel';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useSupervisionActions } from '../hooks/useSupervisionActions';
import { SupervisionConversation } from '../types/supervision';

export const Supervision: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<SupervisionConversation | null>(null);

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
  } = useConversationMessages(selectedConversation?.lead_id || null);

  const {
    executing,
    pauseAI,
    resumeAI,
    markAsScheduled,
    markAsConverted,
    addNote,
    archiveConversation,
  } = useSupervisionActions(() => {
    refetch();
    refetchMessages();
  });

  const handleSelectConversation = useCallback((conversation: SupervisionConversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handlePauseAI = useCallback(async () => {
    if (selectedConversation) {
      await pauseAI(selectedConversation.conversation_id, selectedConversation.lead_id || undefined);
    }
  }, [selectedConversation, pauseAI]);

  const handleResumeAI = useCallback(async () => {
    if (selectedConversation) {
      await resumeAI(selectedConversation.conversation_id);
    }
  }, [selectedConversation, resumeAI]);

  const handleMarkScheduled = useCallback(async (scheduledAt: string, notes?: string) => {
    if (selectedConversation) {
      await markAsScheduled(selectedConversation.conversation_id, scheduledAt, notes);
    }
  }, [selectedConversation, markAsScheduled]);

  const handleMarkConverted = useCallback(async (notes?: string) => {
    if (selectedConversation) {
      await markAsConverted(selectedConversation.conversation_id, notes);
    }
  }, [selectedConversation, markAsConverted]);

  const handleAddNote = useCallback(async (notes: string) => {
    if (selectedConversation) {
      await addNote(selectedConversation.conversation_id, notes);
    }
  }, [selectedConversation, addNote]);

  const handleArchive = useCallback(async () => {
    if (selectedConversation) {
      await archiveConversation(selectedConversation.conversation_id);
      setSelectedConversation(null);
    }
  }, [selectedConversation, archiveConversation]);

  return (
    <div className="h-[calc(100vh-52px)] flex bg-bg-primary">
      {/* Left Panel - Conversation List */}
      <div className="w-[400px] flex flex-col border-r border-border-default bg-bg-secondary">
        <SupervisionHeader
          stats={stats}
          filters={filters}
          onFilterChange={setFilters}
          onRefresh={refetch}
          loading={listLoading}
        />
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.lead_id || null}
          onSelect={handleSelectConversation}
          loading={listLoading}
        />
      </div>

      {/* Right Panel - Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ConversationDetail
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            onClose={handleCloseDetail}
            onPauseAI={handlePauseAI}
            onResumeAI={handleResumeAI}
            onMarkScheduled={handleMarkScheduled}
            onMarkConverted={handleMarkConverted}
            onAddNote={handleAddNote}
            onArchive={handleArchive}
            executing={executing}
          />
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
    </div>
  );
};
