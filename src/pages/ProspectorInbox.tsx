/**
 * ProspectorInbox.tsx
 * LinkedIn Inbox - Layout estilo WhatsApp/Telegram com 2 painéis
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Inbox,
  Search,
  RefreshCw,
  Star,
  Send,
  Bot,
  ExternalLink,
  Tag,
  Check,
  X,
  Edit2,
  MessageSquare,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useLinkedInInbox,
  useConversationMessages,
  LPConversation,
  LPMessage,
  ConversationFilter,
} from '../hooks/useLinkedInInbox';

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

/** Retorna as iniciais do nome (máx 2 letras) */
const getInitials = (name?: string | null): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
};

/** Formata data relativa de forma legível */
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Ontem';
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: false });
};

/** Formata timestamp completo de mensagem */
const formatMessageTime = (dateStr: string): string => {
  return format(new Date(dateStr), "dd/MM 'às' HH:mm", { locale: ptBR });
};

/** Cor do badge de temperatura */
const tempColor = (temp?: string) => {
  switch (temp) {
    case 'hot':  return 'text-[#ef4444]';
    case 'warm': return 'text-[#f97316]';
    case 'cold': return 'text-[#58a6ff]';
    case 'dead': return 'text-[#8b949e]';
    default:     return 'text-[#8b949e]';
  }
};

const tempLabel = (temp?: string) => {
  switch (temp) {
    case 'hot':  return '🔥 Hot';
    case 'warm': return '☀️ Warm';
    case 'cold': return '❄️ Cold';
    case 'dead': return '💀 Dead';
    default:     return '';
  }
};

// ═══════════════════════════════════════════════════════════════════════
// AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
}

const Avatar = ({ name, avatarUrl, size = 'md' }: AvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-[#58a6ff]/20 border border-[#58a6ff]/30 flex items-center justify-center flex-shrink-0 font-semibold text-[#58a6ff]`}>
      {getInitials(name)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// CONVERSATION ITEM (Painel Esquerdo)
// ═══════════════════════════════════════════════════════════════════════

interface ConversationItemProps {
  conversation: LPConversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const c = conversation;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-[#21262d] hover:bg-[#161b22] ${
        isSelected ? 'bg-[#1f2937] border-l-2 border-l-[#58a6ff]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar name={c.lead_name} avatarUrl={c.lead_avatar_url} />
        {c.is_starred && (
          <span className="absolute -top-1 -right-1 text-[#f97316] text-[10px]">⭐</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-medium text-white truncate max-w-[150px]">{c.lead_name}</span>
          <span className="text-[10px] text-[#8b949e] flex-shrink-0 ml-1">
            {formatRelativeTime(c.last_message_at)}
          </span>
        </div>
        {c.lead_headline && (
          <p className="text-[10px] text-[#58a6ff] truncate mb-0.5">{c.lead_headline}</p>
        )}
        <p className="text-xs text-[#8b949e] truncate">{c.last_message_preview || '…'}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
        {c.unread_count > 0 && (
          <span className="min-w-[18px] h-[18px] bg-[#58a6ff] rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
            {c.unread_count > 99 ? '99+' : c.unread_count}
          </span>
        )}
        {c.ai_pending && (
          <span className="text-[10px] bg-[#a371f7]/20 border border-[#a371f7]/30 text-[#a371f7] rounded px-1">🤖</span>
        )}
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE COMPONENT (Painel Direito)
// ═══════════════════════════════════════════════════════════════════════

interface MessageBubbleProps {
  message: LPMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.sender === 'me';

  return (
    <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
            isMe
              ? 'bg-[#1f6feb] text-white rounded-br-sm'
              : 'bg-[#21262d] text-[#e6edf3] rounded-bl-sm border border-[#30363d]'
          }`}
        >
          {message.content}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#8b949e]">{formatMessageTime(message.created_at)}</span>
          {message.is_ai_generated && (
            <span className="text-[10px] bg-[#a371f7]/20 border border-[#a371f7]/30 text-[#a371f7] rounded px-1">🤖 AI</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// AI SUGGESTION BANNER
// ═══════════════════════════════════════════════════════════════════════

interface AISuggestionBannerProps {
  suggestion: string;
  score?: number;
  temperature?: string;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  loading?: boolean;
}

const AISuggestionBanner = ({
  suggestion, score, temperature, onApprove, onEdit, onReject, loading
}: AISuggestionBannerProps) => (
  <div className="mx-4 mb-3 bg-[#a371f7]/10 border border-[#a371f7]/30 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <Bot size={14} className="text-[#a371f7]" />
      <span className="text-xs font-semibold text-[#a371f7]">
        🤖 Resposta sugerida pela IA
        {score !== undefined && ` (score: ${score}`}
        {temperature && score !== undefined && ` | ${tempLabel(temperature)})`}
        {score !== undefined && temperature === undefined && ')'}
      </span>
    </div>
    <p className="text-sm text-[#e6edf3] mb-3 leading-relaxed">{suggestion}</p>
    <div className="flex items-center gap-2">
      <button
        onClick={onApprove}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3fb950]/20 hover:bg-[#3fb950]/30 border border-[#3fb950]/40 text-[#3fb950] rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        <Check size={12} />✅ Enviar
      </button>
      <button
        onClick={onEdit}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#58a6ff]/10 hover:bg-[#58a6ff]/20 border border-[#58a6ff]/30 text-[#58a6ff] rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        <Edit2 size={12} />✏️ Editar
      </button>
      <button
        onClick={onReject}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        <X size={12} />❌ Rejeitar
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════

const EmptyChat = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
    <div className="w-16 h-16 bg-[#58a6ff]/10 rounded-full flex items-center justify-center">
      <MessageSquare size={32} className="text-[#58a6ff]" />
    </div>
    <div>
      <p className="text-base font-medium text-white mb-1">Selecione uma conversa para começar</p>
      <p className="text-sm text-[#8b949e]">Escolha uma conversa no painel esquerdo</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ProspectorInbox = () => {
  const { conversations, loading, syncing, syncInbox, toggleStar } = useLinkedInInbox();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSuggestionRejected, setAiSuggestionRejected] = useState(false);

  const { messages, loading: msgsLoading, sending, generatingAI, sendMessage, generateAIResponse } =
    useConversationMessages(selectedId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Selected conversation object
  const selectedConv = conversations.find(c => c.id === selectedId) || null;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset AI suggestion when conversation changes
  useEffect(() => {
    setAiSuggestion(null);
    setAiSuggestionRejected(false);
    setInputText('');
  }, [selectedId]);

  // Set AI suggestion from conversation's pending suggestion
  useEffect(() => {
    if (selectedConv?.ai_pending && selectedConv.ai_suggested_response && !aiSuggestionRejected) {
      setAiSuggestion(selectedConv.ai_suggested_response);
    }
  }, [selectedConv, aiSuggestionRejected]);

  // Filtered & searched conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;

    switch (filter) {
      case 'unanswered':
        result = result.filter(c => c.unread_count > 0);
        break;
      case 'starred':
        result = result.filter(c => c.is_starred);
        break;
      case 'ai_pending':
        result = result.filter(c => c.ai_pending);
        break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.lead_name.toLowerCase().includes(q) ||
        c.lead_headline?.toLowerCase().includes(q) ||
        c.lead_company?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [conversations, filter, search]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // Handlers
  const handleSend = async () => {
    if (!inputText.trim() || !selectedId) return;
    const ok = await sendMessage(selectedId, inputText.trim());
    if (ok) setInputText('');
  };

  const handleGenerateAI = async () => {
    if (!selectedId) return;
    const response = await generateAIResponse(selectedId);
    if (response) setAiSuggestion(response);
  };

  const handleApproveAI = async () => {
    if (!selectedId || !aiSuggestion) return;
    await sendMessage(selectedId, aiSuggestion);
    setAiSuggestion(null);
  };

  const handleEditAI = () => {
    if (aiSuggestion) {
      setInputText(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleRejectAI = () => {
    setAiSuggestion(null);
    setAiSuggestionRejected(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── FILTERS ────────────────────────────────────────────────────────

  const filters: { key: ConversationFilter; label: string }[] = [
    { key: 'all',        label: 'Todas' },
    { key: 'unanswered', label: 'Não respondidas' },
    { key: 'starred',    label: '⭐ Interessados' },
    { key: 'ai_pending', label: '🤖 AI Pendente' },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#0d1117] h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">

        {/* ── PAINEL ESQUERDO ─────────────────────────────────────── */}
        <div className="w-[350px] min-w-[280px] flex-shrink-0 flex flex-col border-r border-[#21262d] bg-[#0d1117]">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#21262d]">
            <div className="flex items-center gap-2">
              <Inbox size={20} className="text-[#58a6ff]" />
              <h1 className="text-base font-semibold text-white">LinkedIn Inbox</h1>
              {totalUnread > 0 && (
                <span className="min-w-[20px] h-[20px] bg-[#58a6ff] rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => syncInbox()}
              disabled={syncing}
              title="Sincronizar inbox"
              className="p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-[#58a6ff]/20 border border-[#58a6ff]/40 text-[#58a6ff]'
                    : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border-b border-[#21262d] animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[#21262d] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#21262d] rounded w-3/4" />
                      <div className="h-2 bg-[#21262d] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <MessageSquare size={32} className="text-[#30363d]" />
                <p className="text-sm text-[#8b949e]">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map(c => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isSelected={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── PAINEL DIREITO (CHAT) ──────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {!selectedConv ? (
            <EmptyChat />
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#21262d] bg-[#0d1117]">
                <Avatar name={selectedConv.lead_name} avatarUrl={selectedConv.lead_avatar_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white truncate">{selectedConv.lead_name}</h2>
                    {selectedConv.ai_temperature && (
                      <span className={`text-[10px] font-medium ${tempColor(selectedConv.ai_temperature)}`}>
                        {tempLabel(selectedConv.ai_temperature)}
                      </span>
                    )}
                  </div>
                  {(selectedConv.lead_headline || selectedConv.lead_company) && (
                    <p className="text-xs text-[#8b949e] truncate">
                      {[selectedConv.lead_headline, selectedConv.lead_company].filter(Boolean).join(' @ ')}
                    </p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleStar(selectedConv.id, selectedConv.is_starred)}
                    title={selectedConv.is_starred ? 'Remover estrela' : 'Marcar como interessado'}
                    className={`p-2 rounded-lg transition-colors hover:bg-[#161b22] ${
                      selectedConv.is_starred ? 'text-[#f97316]' : 'text-[#8b949e] hover:text-[#f97316]'
                    }`}
                  >
                    <Star size={15} fill={selectedConv.is_starred ? 'currentColor' : 'none'} />
                  </button>
                  {selectedConv.lead_linkedin_url && (
                    <a
                      href={selectedConv.lead_linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver perfil no LinkedIn"
                      className="p-2 rounded-lg text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#161b22] transition-colors"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                  {selectedConv.tags && selectedConv.tags.length > 0 && (
                    <div className="flex items-center gap-1 ml-1">
                      <Tag size={12} className="text-[#8b949e]" />
                      {selectedConv.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[#8b949e]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className="h-10 w-48 bg-[#21262d] rounded-lg animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare size={32} className="text-[#30363d]" />
                    <p className="text-sm text-[#8b949e]">Nenhuma mensagem ainda. Comece a conversa!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Suggestion Banner */}
              {aiSuggestion && (
                <AISuggestionBanner
                  suggestion={aiSuggestion}
                  score={selectedConv.ai_score}
                  temperature={selectedConv.ai_temperature}
                  onApprove={handleApproveAI}
                  onEdit={handleEditAI}
                  onReject={handleRejectAI}
                  loading={sending}
                />
              )}

              {/* Message Input */}
              <div className="px-4 pb-4 pt-2 border-t border-[#21262d]">
                <div className="flex items-end gap-2">
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva uma mensagem… (Enter para enviar)"
                    rows={2}
                    className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none resize-none"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending}
                      title="Enviar mensagem"
                      className="p-2.5 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                    <button
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                      title="Gerar resposta com IA"
                      className="p-2.5 bg-[#a371f7]/20 hover:bg-[#a371f7]/30 border border-[#a371f7]/30 hover:border-[#a371f7]/50 text-[#a371f7] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generatingAI ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-1">Enter envia · Shift+Enter nova linha · 🤖 gera com IA</p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProspectorInbox;
