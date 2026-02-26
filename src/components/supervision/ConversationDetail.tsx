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
  UserCheck,
  XCircle,
  Pencil,
  Radio,
  Tag,
  Plus,
} from 'lucide-react';
import {
  SupervisionConversation,
  SupervisionMessage,
  supervisionStatusConfig,
  LostReason,
  MeetingStatus,
  meetingStatusConfig,
  leadSourceConfig,
  LeadSource,
} from '../../types/supervision';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { QualityIndicator } from './QualityBadge';
import { QualityFlagsList } from './QualityFlagsList';
import { useQualityFlags, useQualitySummary } from '../../hooks/useQualityFlags';
import { LostReasonModal } from './LostReasonModal';
import { MeetingStatusModal } from './MeetingStatusModal';
import { useAccount } from '../../contexts/AccountContext';

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
  onMarkAsLost?: (reason: string, notes?: string) => void;
  onUpdateMeetingStatus?: (status: string, notes?: string) => void;
  onUpdateLeadSource?: (source: string) => void;
  executing: boolean;
  // Props para envio de mensagens
  onSendMessage: (message: string) => Promise<boolean>;
  sendingMessage: boolean;
  sendError: string | null;
  onClearSendError: () => void;
  // Tags GHL
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  contactTags?: string[];
  contactTagsLoading?: boolean;
  // Mobile
  isMobile?: boolean;
}

// Helper: cor do avatar baseada no primeiro caractere do nome
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-orange-600',
    'bg-teal-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-rose-600',
  ];
  const charCode = (name || 'A').charCodeAt(0);
  return colors[charCode % colors.length];
};

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
  onMarkAsLost,
  onUpdateMeetingStatus,
  onUpdateLeadSource,
  executing,
  onSendMessage,
  sendingMessage,
  sendError,
  onClearSendError,
  onAddTag,
  onRemoveTag,
  contactTags = [],
  contactTagsLoading = false,
  isMobile = false,
}) => {
  // Feature #16: permissao por perfil
  const { isClientUser } = useAccount();

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [showMeetingStatusModal, setShowMeetingStatusModal] = useState(false);
  const [showLeadSourceDropdown, setShowLeadSourceDropdown] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const leadSourceRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

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

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
      if (leadSourceRef.current && !leadSourceRef.current.contains(event.target as Node)) {
        setShowLeadSourceDropdown(false);
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

  const handleMarkLost = (reason: LostReason, notes?: string) => {
    onMarkAsLost?.(reason, notes);
    setShowLostReasonModal(false);
  };

  const handleMeetingStatus = (status: MeetingStatus, notes?: string) => {
    onUpdateMeetingStatus?.(status, notes);
    setShowMeetingStatusModal(false);
  };

  const handleAddTagSubmit = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (contactTags.includes(tag)) {
      setTagInput('');
      return;
    }
    onAddTag?.(tag);
    setTagInput('');
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary">
      {/* Header — compact single bar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-border-default ${isMobile ? 'sticky top-0 z-10 bg-bg-secondary' : ''}`}>
        {/* Botão Voltar - Mobile */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 hover:bg-bg-hover rounded-lg text-text-secondary shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        
        <div className={`${isMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${getAvatarColor(getContactDisplayName(conversation))}`}>
          {getContactDisplayName(conversation)[0]?.toUpperCase() || '?'}
        </div>

        {/* Name + Client inline */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-text-primary truncate text-sm">
              {getContactDisplayName(conversation)}
            </h2>
            <span className="text-text-muted text-[10px] hidden md:inline">•</span>
            <span className="text-text-muted text-xs truncate hidden md:inline">{conversation.client_name || 'Cliente'}</span>
          </div>
        </div>

        {/* Right: AI toggle + actions menu + close */}
        <div className="flex items-center gap-1 shrink-0">
          {/* AI toggle pill */}
          {isAIActive ? (
            <button
              onClick={onPauseAI}
              disabled={executing}
              className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-full text-xs transition-colors disabled:opacity-50"
              title="Pausar IA"
            >
              {executing ? <Loader2 size={12} className="animate-spin" /> : <Pause size={12} />}
              <span className="hidden md:inline">Pausar</span>
            </button>
          ) : (
            <button
              onClick={onResumeAI}
              disabled={executing}
              className="flex items-center gap-1 px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-full text-xs transition-colors disabled:opacity-50"
              title="Retomar IA"
            >
              {executing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              <span className="hidden md:inline">Retomar</span>
            </button>
          )}

          {/* Status pill */}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>

          {/* Actions menu (both mobile and desktop) */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted"
            >
              <MoreVertical size={16} />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-20 overflow-hidden">
                {/* Copy IDs */}
                {!isMobile && conversation.location_id && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(conversation.location_id || '');
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-text-muted hover:bg-bg-hover"
                  >
                    <Copy size={13} />
                    <span className="font-mono truncate">Loc: {conversation.location_id.slice(0, 12)}…</span>
                  </button>
                )}
                {!isMobile && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(conversation.session_id);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-text-muted hover:bg-bg-hover"
                  >
                    <Copy size={13} />
                    <span className="font-mono">Session: #{conversation.session_id.slice(0, 8)}</span>
                  </button>
                )}
                {!isMobile && <div className="border-t border-border-default" />}
                <button
                  onClick={() => {
                    setShowScheduleModal(true);
                    setShowActionsMenu(false);
                  }}
                  disabled={executing || conversation.supervision_status === 'scheduled'}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-purple-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <Calendar size={15} />
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
                  <CheckCircle size={15} />
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
                  <StickyNote size={15} />
                  Nota
                </button>
                <button
                  onClick={() => {
                    setShowMeetingStatusModal(true);
                    setShowActionsMenu(false);
                  }}
                  disabled={executing}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-blue-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <UserCheck size={15} />
                  Status Reuniao
                </button>
                <button
                  onClick={() => {
                    setShowLostReasonModal(true);
                    setShowActionsMenu(false);
                  }}
                  disabled={executing}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-bg-hover disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Marcar Perdido
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
                  <Archive size={15} />
                  Arquivar
                </button>
              </div>
            )}
          </div>

          {/* Fechar - apenas desktop */}
          {!isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Notes + Scheduled + Meeting Status + Lead Source — compact inline banners */}
      {(conversation.supervision_notes || conversation.scheduled_at || conversation.meeting_status || onUpdateLeadSource) && (
        <div className="flex gap-2 px-3 py-1.5 border-b border-border-default/50 text-xs flex-wrap">
          {conversation.supervision_notes && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded text-blue-400 truncate flex-1 min-w-0">
              <StickyNote size={11} className="shrink-0" />
              <span className="truncate">{conversation.supervision_notes}</span>
            </div>
          )}
          {conversation.scheduled_at && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 rounded text-purple-400 shrink-0">
              <Calendar size={11} />
              <span>{new Date(conversation.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {conversation.meeting_status && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded shrink-0 ${meetingStatusConfig[conversation.meeting_status as MeetingStatus]?.bgColor || 'bg-blue-500/10'} ${meetingStatusConfig[conversation.meeting_status as MeetingStatus]?.color || 'text-blue-400'}`}>
              <UserCheck size={11} />
              <span>Reuniao: {meetingStatusConfig[conversation.meeting_status as MeetingStatus]?.label || conversation.meeting_status}</span>
            </div>
          )}
          {/* Lead Source — read-only para clientes (Feature #16), editavel para gestores */}
          {(onUpdateLeadSource || conversation.lead_source) && (
            <div className="relative shrink-0" ref={leadSourceRef}>
              {/* Cliente: pill read-only com tooltip */}
              {isClientUser ? (
                conversation.lead_source ? (
                  <span
                    title="Somente gestores podem alterar a fonte"
                    className="flex items-center gap-1 px-2 py-1 bg-accent-primary/10 rounded text-accent-primary cursor-default"
                  >
                    <Radio size={11} className="shrink-0" />
                    <span>{leadSourceConfig[conversation.lead_source as LeadSource]?.label || conversation.lead_source}</span>
                  </span>
                ) : null
              ) : (
                /* Gestor/Admin: dropdown editavel */
                <>
                  {conversation.lead_source ? (
                    <button
                      onClick={() => setShowLeadSourceDropdown(v => !v)}
                      className="flex items-center gap-1 px-2 py-1 bg-accent-primary/10 rounded text-accent-primary hover:bg-accent-primary/20 transition-colors"
                    >
                      <Radio size={11} className="shrink-0" />
                      <span>{leadSourceConfig[conversation.lead_source as LeadSource]?.label || conversation.lead_source}</span>
                      <Pencil size={9} className="opacity-60" />
                    </button>
                  ) : (
                    onUpdateLeadSource && (
                      <button
                        onClick={() => setShowLeadSourceDropdown(v => !v)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
                      >
                        <Radio size={11} />
                        <span>Definir Fonte</span>
                      </button>
                    )
                  )}
                  {showLeadSourceDropdown && onUpdateLeadSource && (
                    <div className="absolute z-20 top-full left-0 mt-1 w-52 bg-bg-secondary border border-border-default rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {Object.entries(leadSourceConfig).map(([value, cfg]) => (
                        <button
                          key={value}
                          onClick={() => {
                            onUpdateLeadSource(value);
                            setShowLeadSourceDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-hover cursor-pointer transition-colors ${
                            conversation.lead_source === value
                              ? 'text-accent-primary bg-accent-primary/5'
                              : 'text-text-secondary'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tags GHL — sync bidirecional */}
      {(contactTags.length > 0 || contactTagsLoading || (!isClientUser && onAddTag)) && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border-default/50 flex-wrap">
          <Tag size={11} className="text-text-muted shrink-0" />
          {contactTagsLoading ? (
            <Loader2 size={11} className="animate-spin text-text-muted" />
          ) : (
            <>
              {contactTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-medium"
                >
                  {tag}
                  {!isClientUser && onRemoveTag && (
                    <button
                      onClick={() => onRemoveTag(tag)}
                      className="hover:text-blue-200 transition-colors ml-0.5"
                      aria-label={`Remover tag ${tag}`}
                    >
                      <X size={9} />
                    </button>
                  )}
                </span>
              ))}
              {!isClientUser && onAddTag && (
                <div className="flex items-center gap-1">
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagSubmit();
                      }
                    }}
                    placeholder="Nova tag..."
                    className="h-5 px-1.5 bg-bg-primary border border-border-default rounded text-[10px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 w-20"
                  />
                  <button
                    onClick={handleAddTagSubmit}
                    disabled={!tagInput.trim()}
                    className="flex items-center justify-center w-5 h-5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Adicionar tag"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Quality Issues — compact collapsible */}
      {qualitySummary && qualitySummary.total_unresolved > 0 && (
        <div className="px-3 py-1">
          <button
            onClick={() => setShowQualityPanel(!showQualityPanel)}
            className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded text-xs text-red-400 hover:bg-red-500/15 transition-all"
          >
            <AlertTriangle size={12} />
            <span>{qualitySummary.total_unresolved} problema(s)</span>
            {showQualityPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showQualityPanel && (
            <div className="mt-1 p-2 bg-bg-primary border border-border-default rounded-lg">
              <QualityFlagsList flags={qualityFlags} loading={flagsLoading} onResolve={resolveFlag} />
            </div>
          )}
        </div>
      )}

      {/* Quality OK indicator — hidden when no problems (saves space) */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 bg-bg-primary/30">
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
            {messages.map((message, index) => {
              const elements: React.ReactNode[] = [];

              // Date separator logic
              const currentDate = new Date(message.created_at);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;

              const isNewDay =
                !prevDate || currentDate.toDateString() !== prevDate.toDateString();

              if (isNewDay) {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                let dateLabel: string;
                if (currentDate.toDateString() === today.toDateString()) {
                  dateLabel = 'Hoje';
                } else if (currentDate.toDateString() === yesterday.toDateString()) {
                  dateLabel = 'Ontem';
                } else {
                  dateLabel = currentDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year:
                      currentDate.getFullYear() !== today.getFullYear()
                        ? 'numeric'
                        : undefined,
                  });
                }

                elements.push(
                  <div
                    key={`date-${message.message_id}`}
                    className="flex items-center gap-3 my-4"
                  >
                    <div className="flex-1 h-px bg-border-default/30" />
                    <span className="text-[11px] text-text-muted font-medium px-2">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-border-default/30" />
                  </div>
                );
              }

              // Channel context banner — show when channel changes
              const prevChannel = prevMessage?.channel;
              const currentChannel = message.channel;
              const channelChanged =
                currentChannel &&
                currentChannel !== 'unknown' &&
                currentChannel !== prevChannel;

              if (channelChanged && index > 0) {
                const channelColors: Record<string, string> = {
                  instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                  ig: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                  whatsapp: 'bg-green-500/10 text-green-400 border-green-500/20',
                  wa: 'bg-green-500/10 text-green-400 border-green-500/20',
                  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                };
                const channelNames: Record<string, string> = {
                  instagram: 'Instagram',
                  ig: 'Instagram',
                  whatsapp: 'WhatsApp',
                  wa: 'WhatsApp',
                  email: 'E-mail',
                };
                const colorClass =
                  channelColors[currentChannel.toLowerCase()] ||
                  'bg-bg-hover text-text-muted border-border-default/30';
                const channelName =
                  channelNames[currentChannel.toLowerCase()] || currentChannel;

                elements.push(
                  <div
                    key={`channel-${message.message_id}`}
                    className="flex justify-center my-3"
                  >
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${colorClass}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{channelName}</span>
                    </div>
                  </div>
                );
              }

              elements.push(
                <MessageBubble
                  key={message.message_id}
                  message={message}
                  isMobile={isMobile}
                />
              );

              return (
                <React.Fragment key={`group-${message.message_id}`}>
                  {elements}
                </React.Fragment>
              );
            })}
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

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={showLostReasonModal}
        onClose={() => setShowLostReasonModal(false)}
        onConfirm={handleMarkLost}
        executing={executing}
        isMobile={isMobile}
      />

      {/* Meeting Status Modal */}
      <MeetingStatusModal
        isOpen={showMeetingStatusModal}
        onClose={() => setShowMeetingStatusModal(false)}
        onConfirm={handleMeetingStatus}
        executing={executing}
        isMobile={isMobile}
      />
    </div>
  );
};
