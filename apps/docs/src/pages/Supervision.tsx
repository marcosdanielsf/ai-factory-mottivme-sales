import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  SupervisionHeader,
  ConversationList,
  ConversationDetail,
} from '../components/supervision';
import { useSupervisionPanel } from '../hooks/useSupervisionPanel';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useSupervisionActions } from '../hooks/useSupervisionActions';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { useSupervisionRealtime, useConversationRealtime } from '../hooks/useSupervisionRealtime';
import { useSendMessage } from '../hooks/useSendMessage';
import { useIsMobile } from '../hooks/useMediaQuery';
import { SupervisionConversation } from '../types/supervision';

export const Supervision: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<SupervisionConversation | null>(null);

  // Detecta se é mobile
  const isMobile = useIsMobile();

  // Ref para selectedConversation - estabiliza callbacks do realtime
  const selectedConversationRef = useRef<SupervisionConversation | null>(null);

  // Sincroniza ref com state
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

  // Opcoes de filtros (Fase 2)
  const { options: filterOptions, loading: filterOptionsLoading } = useFilterOptions();

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

  // Hook para envio de mensagens manuais
  const {
    sending: sendingMessage,
    error: sendError,
    sendMessage,
    clearError: clearSendError,
  } = useSendMessage(() => {
    // Callback de sucesso - refetch mensagens
    refetchMessages();
  });

  // Real-time: atualiza lista de conversas quando há mudanças
  useSupervisionRealtime({
    onNewMessage: useCallback(() => {
      // Nova mensagem em qualquer conversa - atualiza lista
      refetch();
    }, [refetch]),
    onConversationUpdate: useCallback(() => {
      refetch();
    }, [refetch]),
    onSupervisionStateChange: useCallback((payload) => {
      // Estado de supervisão mudou - atualiza lista
      refetch();
      // Usa ref para evitar re-criar callback quando selectedConversation muda
      const current = selectedConversationRef.current;
      if (current && payload.new?.session_id === current.session_id) {
        // Atualiza conversa selecionada com novos dados
        setSelectedConversation((prev) =>
          prev ? { ...prev, ai_enabled: payload.new?.ai_enabled, supervision_status: payload.new?.status } : null
        );
      }
    }, [refetch]), // Removido selectedConversation das deps!
    enabled: true,
  });

  // Real-time: atualiza mensagens da conversa selecionada
  useConversationRealtime(
    selectedConversation?.session_id || null,
    useCallback(() => {
      // Nova mensagem na conversa selecionada - refetch imediato
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

  // Layout Mobile: mostra lista OU detalhe (não ambos)
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-52px)] flex flex-col bg-bg-primary">
        {selectedConversation ? (
          // Mobile: Detalhe da conversa (fullscreen)
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
            onSendMessage={handleSendMessage}
            sendingMessage={sendingMessage}
            sendError={sendError}
            onClearSendError={clearSendError}
            isMobile={true}
          />
        ) : (
          // Mobile: Lista de conversas (fullscreen)
          <>
            <SupervisionHeader
              stats={stats}
              filters={filters}
              onFilterChange={setFilters}
              onRefresh={refetch}
              loading={listLoading}
              filterOptions={filterOptions}
              isMobile={true}
            />
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.session_id || null}
              onSelect={handleSelectConversation}
              loading={listLoading}
            />
          </>
        )}
      </div>
    );
  }

  // Layout Desktop: side-by-side
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
          filterOptions={filterOptions}
          isMobile={false}
        />
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.session_id || null}
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
            onSendMessage={handleSendMessage}
            sendingMessage={sendingMessage}
            sendError={sendError}
            onClearSendError={clearSendError}
            isMobile={false}
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
