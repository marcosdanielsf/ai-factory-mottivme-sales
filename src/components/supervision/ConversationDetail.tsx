import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Phone,
  Bot,
  Pause,
  Play,
  Calendar,
  CheckCircle,
  Archive,
  StickyNote,
  Loader2,
  MapPin,
  Copy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react';
import {
  SupervisionConversation,
  SupervisionMessage,
  supervisionStatusConfig,
} from '../../types/supervision';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { QualityIndicator } from './QualityBadge';
import { QualityFlagsList } from './QualityFlagsList';
import { useQualityFlags, useQualitySummary } from '../../hooks/useQualityFlags';

interface ConversationDetailProps {
  conversation: SupervisionConversation;
  messages: SupervisionMessage[];
  loading: boolean;
  onClose: () => void;
  onPauseAI: () => void;
  onResumeAI: () => void;
  onMarkScheduled: (scheduledAt: string, notes?: string) => void;
  onMarkConverted: (notes?: string) => void;
  onAddNote: (notes: string) => void;
  onArchive: () => void;
  executing: boolean;
  // Props para envio de mensagens
  onSendMessage: (message: string) => Promise<boolean>;
  sendingMessage: boolean;
  sendError: string | null;
  onClearSendError: () => void;
  // Mobile
  isMobile?: boolean;
}

// Helper: obtém nome de exibição do contato com fallbacks
const getContactDisplayName = (conversation: SupervisionConversation): string => {
  // 1. Nome do contato (prioridade)
  if (conversation.contact_name?.trim()) return conversation.contact_name;

  // 2. Usuário do Instagram
  if (conversation.instagram_username?.trim()) return `@${conversation.instagram_username}`;

  // 3. Telefone (formatado)
  if (conversation.contact_phone?.trim()) {
    const phone = conversation.contact_phone;
    if (phone.startsWith('+55') && phone.length > 12) {
      return `(${phone.slice(3, 5)}) ${phone.slice(5, 10)}-${phone.slice(10)}`;
    }
    return phone;
  }

  // 4. Email (última opção antes de "Desconhecido")
  if (conversation.contact_email?.trim()) {
    const email = conversation.contact_email;
    return email.split('@')[0];
  }

  // 5. Extrair nome da primeira mensagem (fallback inteligente)
  if (conversation.last_message) {
    const msg = conversation.last_message;
    const nameMatch = msg.match(/^(Oi|Olá|Ola|Bom dia|Boa tarde|Boa noite|Fala|Eae),?\s*([A-Z][a-z]+)/i);
    if (nameMatch) return nameMatch[1];
    const firstWord = msg.split(/\s/)[0];
    if (firstWord && firstWord.length < 20) return firstWord;
  }

  return 'Desconhecido';
};

// Helper: formata horário considerando timezone local
const formatMessageTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversation,
  messages,
  loading,
  onClose,
  onPauseAI,
  onResumeAI,
  onMarkScheduled,
  onMarkConverted,
  onAddNote,
  onArchive,
  executing,
  onSendMessage,
  sendingMessage,
  sendError,
  onClearSendError,
  isMobile = false,
}) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Quality Flags
  const {
    flags: qualityFlags,
    loading: flagsLoading,
    resolveFlag,
  } = useQualityFlags(conversation.session_id);
  const { getSummary } = useQualitySummary([conversation.session_id]);
  const qualitySummary = getSummary(conversation.session_id);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusConfig = supervisionStatusConfig[conversation.supervision_status];
  const isAIActive = conversation.ai_enabled;

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
      setShowNoteModal(false);
    }
  };

  const handleSchedule = () => {
    if (scheduleDate) {
      onMarkScheduled(scheduleDate, scheduleNotes);
      setScheduleDate('');
      setScheduleNotes('');
      setShowScheduleModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary">
      {/* Header */}
      <div className={`flex items-center justify-between p-3 md:p-4 border-b border-border-default ${isMobile ? 'sticky top-0 z-10 bg-bg-secondary' : ''}`}>
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Botão Voltar - Mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-bg-hover rounded-lg text-text-secondary"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-bg-hover flex items-center justify-center text-sm md:text-lg font-semibold text-text-primary flex-shrink-0`}>
            {getContactDisplayName(conversation)[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-text-primary truncate text-sm md:text-base">
              {getContactDisplayName(conversation)}
            </h2>
            <div className="flex items-center gap-2 text-xs md:text-sm text-text-muted">
              {conversation.contact_phone && !isMobile && (
                <>
                  <Phone size={12} />
                  <span>{conversation.contact_phone}</span>
                  <span className="mx-1">•</span>
                </>
              )}
              <Bot size={12} />
              <span className="truncate">{conversation.client_name || 'Cliente'}</span>
            </div>
            {/* Location ID e Session ID - esconde no mobile */}
            {!isMobile && (
              <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                {conversation.location_id && (
                  <button
                    onClick={() => navigator.clipboard.writeText(conversation.location_id || '')}
                    className="flex items-center gap-1 hover:text-accent-primary transition-colors"
                    title="Copiar Location ID"
                  >
                    <MapPin size={10} />
                    <span className="font-mono">{conversation.location_id.slice(0, 12)}...</span>
                    <Copy size={10} />
                  </button>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(conversation.session_id)}
                  className="flex items-center gap-1 hover:text-accent-primary transition-colors"
                  title="Copiar Session ID"
                >
                  <span className="font-mono">#{conversation.session_id.slice(0, 8)}</span>
                  <Copy size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
            {isMobile ? statusConfig.label.slice(0, 8) : statusConfig.label}
          </span>
          {/* Fechar - apenas desktop */}
          {!isMobile && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-hover rounded-lg text-text-muted"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons - Desktop: horizontal / Mobile: menu dropdown */}
      {isMobile ? (
        <div className="flex gap-2 p-2 border-b border-border-default bg-bg-primary">
          {/* Botão principal IA */}
          {isAIActive ? (
            <button
              onClick={onPauseAI}
              disabled={executing}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {executing ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
              Pausar
            </button>
          ) : (
            <button
              onClick={onResumeAI}
              disabled={executing}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {executing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Retomar
            </button>
          )}

          {/* Menu de ações mobile */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 bg-bg-hover hover:bg-border-default rounded-lg text-text-secondary"
            >
              <MoreVertical size={18} />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-border-default rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setShowScheduleModal(true);
                    setShowActionsMenu(false);
                  }}
                  disabled={executing || conversation.supervision_status === 'scheduled'}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-purple-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <Calendar size={16} />
                  Agendar
                </button>
                <button
                  onClick={() => {
                    onMarkConverted();
                    setShowActionsMenu(false);
                  }}
                  disabled={executing || conversation.supervision_status === 'converted'}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-emerald-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Convertido
                </button>
                <button
                  onClick={() => {
                    setShowNoteModal(true);
                    setShowActionsMenu(false);
                  }}
                  disabled={executing}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-blue-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <StickyNote size={16} />
                  Adicionar Nota
                </button>
                <div className="border-t border-border-default" />
                <button
                  onClick={() => {
                    onArchive();
                    setShowActionsMenu(false);
                  }}
                  disabled={executing}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <Archive size={16} />
                  Arquivar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Desktop: botões horizontais
        <div className="flex gap-2 p-3 border-b border-border-default bg-bg-primary">
          {isAIActive ? (
            <button
              onClick={onPauseAI}
              disabled={executing}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {executing ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
              Pausar IA
            </button>
          ) : (
            <button
              onClick={onResumeAI}
              disabled={executing}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {executing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Retomar IA
            </button>
          )}

          <button
            onClick={() => setShowScheduleModal(true)}
            disabled={executing || conversation.supervision_status === 'scheduled'}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Calendar size={16} />
            Agendar
          </button>

          <button
            onClick={() => onMarkConverted()}
            disabled={executing || conversation.supervision_status === 'converted'}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <CheckCircle size={16} />
            Convertido
          </button>

          <button
            onClick={() => setShowNoteModal(true)}
            disabled={executing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <StickyNote size={16} />
            Nota
          </button>

          <button
            onClick={onArchive}
            disabled={executing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-lg text-sm transition-colors disabled:opacity-50 ml-auto"
          >
            <Archive size={16} />
          </button>
        </div>
      )}

      {/* Notes Display */}
      {conversation.supervision_notes && (
        <div className="mx-3 md:mx-4 mt-2 md:mt-3 p-2 md:p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 font-medium mb-1">Nota da Supervisao</p>
          <p className="text-xs md:text-sm text-text-secondary">{conversation.supervision_notes}</p>
        </div>
      )}

      {/* Scheduled Info */}
      {conversation.scheduled_at && (
        <div className="mx-3 md:mx-4 mt-2 md:mt-3 p-2 md:p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-purple-400 font-medium mb-1">Agendamento</p>
          <p className="text-xs md:text-sm text-text-secondary">
            {new Date(conversation.scheduled_at).toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      {/* Quality Issues Panel */}
      {qualitySummary && qualitySummary.total_unresolved > 0 && (
        <div className="mx-3 md:mx-4 mt-2 md:mt-3">
          <button
            onClick={() => setShowQualityPanel(!showQualityPanel)}
            className="w-full flex items-center justify-between p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/15 transition-all"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs md:text-sm font-medium text-red-400">
                {qualitySummary.total_unresolved} problema(s)
              </span>
            </div>
            {showQualityPanel ? (
              <ChevronUp size={14} className="text-red-400" />
            ) : (
              <ChevronDown size={14} className="text-red-400" />
            )}
          </button>

          {showQualityPanel && (
            <div className="mt-2 p-2 md:p-3 bg-bg-primary border border-border-default rounded-lg">
              <QualityFlagsList
                flags={qualityFlags}
                loading={flagsLoading}
                onResolve={resolveFlag}
              />
            </div>
          )}
        </div>
      )}

      {/* Quality OK indicator - esconde no mobile se não tem problemas */}
      {(!qualitySummary || qualitySummary.total_unresolved === 0) && !isMobile && (
        <div className="mx-4 mt-3 px-3 py-2">
          <QualityIndicator summary={qualitySummary} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={28} className="animate-spin text-accent-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            Nenhuma mensagem encontrada
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.message_id} message={message} isMobile={isMobile} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSend={onSendMessage}
        sending={sendingMessage}
        error={sendError}
        onClearError={onClearSendError}
        isAIActive={isAIActive}
        placeholder={isMobile ? "Digite..." : "Digite sua mensagem para o lead..."}
      />

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className={`bg-bg-secondary rounded-t-xl md:rounded-xl p-4 md:p-6 w-full ${isMobile ? 'max-h-[80vh]' : 'max-w-md mx-4'}`}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Adicionar Nota</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Digite sua nota..."
              className="w-full h-32 px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-4 py-2.5 bg-bg-hover text-text-secondary rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-lg disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className={`bg-bg-secondary rounded-t-xl md:rounded-xl p-4 md:p-6 w-full ${isMobile ? 'max-h-[80vh]' : 'max-w-md mx-4'}`}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Agendar Contato</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Notas (opcional)</label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="Observacoes sobre o agendamento..."
                  className="w-full h-20 px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2.5 bg-bg-hover text-text-secondary rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSchedule}
                disabled={!scheduleDate}
                className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-lg disabled:opacity-50"
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
