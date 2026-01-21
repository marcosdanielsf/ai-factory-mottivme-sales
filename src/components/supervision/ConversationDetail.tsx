import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  SupervisionConversation,
  SupervisionMessage,
  supervisionStatusConfig,
} from '../../types/supervision';
import { MessageBubble } from './MessageBubble';

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
}

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
}) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

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
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center text-lg font-semibold text-text-primary">
            {conversation.contact_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">
              {conversation.contact_name || 'Desconhecido'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              {conversation.contact_phone && (
                <>
                  <Phone size={12} />
                  <span>{conversation.contact_phone}</span>
                  <span className="mx-1">•</span>
                </>
              )}
              <Bot size={12} />
              <span>{conversation.client_name || 'Cliente'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-hover rounded-lg text-text-muted"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
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

      {/* Notes Display */}
      {conversation.supervision_notes && (
        <div className="mx-4 mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 font-medium mb-1">Nota da Supervisao</p>
          <p className="text-sm text-text-secondary">{conversation.supervision_notes}</p>
        </div>
      )}

      {/* Scheduled Info */}
      {conversation.scheduled_at && (
        <div className="mx-4 mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-purple-400 font-medium mb-1">Agendamento</p>
          <p className="text-sm text-text-secondary">
            {new Date(conversation.scheduled_at).toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-accent-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            Nenhuma mensagem encontrada
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.message_id} message={message} />
          ))
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Adicionar Nota</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Digite sua nota..."
              className="w-full h-32 px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-4 py-2 bg-bg-hover text-text-secondary rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Agendar Contato</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
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
                className="flex-1 px-4 py-2 bg-bg-hover text-text-secondary rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSchedule}
                disabled={!scheduleDate}
                className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg disabled:opacity-50"
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
