import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageSquare, Bot, Clock, CheckCircle, PauseCircle, Calendar, Check } from 'lucide-react';
import {
  SupervisionConversation,
  SupervisionStatus,
  supervisionStatusConfig,
  channelConfig,
} from '../../types/supervision';
import { QualityBadge } from './QualityBadge';
import { useQualitySummary } from '../../hooks/useQualityFlags';

interface ConversationListProps {
  conversations: SupervisionConversation[];
  selectedId: string | null;
  onSelect: (conversation: SupervisionConversation) => void;
  loading?: boolean;
  // Selection mode props
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (sessionId: string) => void;
  onSelectAll?: () => void;
}

// Altura estimada de cada item da lista
const ITEM_HEIGHT = 88;
const ITEM_HEIGHT_MOBILE = 80;

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  loading,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
}) => {
  // Ref para o container de scroll
  const parentRef = useRef<HTMLDivElement>(null);

  // Detecta mobile via ref (para virtualização)
  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 768);

  // Extrai session_ids para buscar resumos de qualidade
  const sessionIds = useMemo(
    () => conversations.map(c => c.session_id),
    [conversations]
  );

  // Virtualização - só renderiza itens visíveis
  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobileRef.current ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT,
    overscan: 5, // Renderiza 5 itens extras acima/abaixo
  });

  // Helper: obtém nome de exibição do contato com fallbacks
  const getContactDisplayName = (conversation: SupervisionConversation): string => {
    // 1. Nome do contato (prioridade) - ignora se for "Desconhecido"
    if (conversation.contact_name?.trim() && conversation.contact_name !== 'Desconhecido') {
      return conversation.contact_name;
    }

    // 2. Usuário do Instagram
    if (conversation.instagram_username?.trim()) return `@${conversation.instagram_username}`;

    // 3. Telefone (formatado)
    if (conversation.contact_phone?.trim()) {
      const phone = conversation.contact_phone;
      // Se começar com +55, formata bonitinho
      if (phone.startsWith('+55') && phone.length > 12) {
        return `(${phone.slice(3, 5)}) ${phone.slice(5, 10)}-${phone.slice(10)}`;
      }
      return phone;
    }

    // 4. Email (última opção antes de "Desconhecido")
    if (conversation.contact_email?.trim()) {
      const email = conversation.contact_email;
      return email.split('@')[0]; // Mostra só a parte antes do @
    }

    // TODO: Corrigir view vw_supervision_conversations_v3 para fazer JOIN 
    // com n8n_active_conversation e trazer o lead_name
    return 'Desconhecido';
  };

  // Helper: formata horário considerando UTC
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Busca resumos de qualidade para mostrar badges
  const { getSummary } = useQualitySummary(sessionIds);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-3 py-2.5 border-b border-border-default/20 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-bg-hover flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-bg-hover rounded w-1/3 mb-1.5" />
                <div className="h-2.5 bg-bg-hover rounded w-2/3 mb-1.5" />
                <div className="h-2.5 bg-bg-hover rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 text-center">
        <div>
          <MessageSquare size={40} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-sm md:text-base">Nenhuma conversa encontrada</p>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            Ajuste os filtros ou aguarde novas conversas
          </p>
        </div>
      </div>
    );
  }

  const getStatusDot = (status: SupervisionStatus): string => {
    switch (status) {
      case 'ai_active':      return 'bg-green-400';
      case 'ai_paused':      return 'bg-yellow-400';
      case 'manual_takeover': return 'bg-blue-400';
      case 'scheduled':      return 'bg-purple-400';
      case 'converted':      return 'bg-emerald-400';
      default:               return 'bg-gray-400';
    }
  };

  const allSelected = conversations.length > 0 && conversations.every(c => selectedIds.has(c.session_id));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Select All header — only in selection mode */}
      {selectionMode && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-default/30 bg-bg-secondary shrink-0">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                allSelected
                  ? 'bg-accent-primary border-accent-primary'
                  : 'border-border-default bg-bg-primary'
              }`}
            >
              {allSelected && <Check size={10} className="text-white" strokeWidth={3} />}
            </span>
            <span>{allSelected ? 'Desmarcar todos' : 'Selecionar todos'}</span>
          </button>
          <span className="ml-auto text-xs text-text-muted">{selectedIds.size} selecionado(s)</span>
        </div>
      )}

      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const conversation = conversations[virtualItem.index];
            const isSelected = selectedId === conversation.session_id;
            const isChecked = selectedIds.has(conversation.session_id);
            const statusConfig = supervisionStatusConfig[conversation.supervision_status];
            const qualitySummary = getSummary(conversation.session_id);
            const isWaiting = conversation.last_message_role === 'user';
            const displayName = getContactDisplayName(conversation);

            return (
              <div
                key={conversation.conversation_id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  onClick={() => {
                    if (selectionMode) {
                      onToggleSelect?.(conversation.session_id);
                    } else {
                      onSelect(conversation);
                    }
                  }}
                  className={`
                    h-full px-3 py-2.5 cursor-pointer transition-colors active:bg-bg-hover/80
                    border-b border-border-default/20
                    ${selectionMode && isChecked
                      ? 'bg-accent-primary/8 border-l-2 border-l-accent-primary'
                      : isSelected
                        ? 'bg-accent-primary/8 border-l-2 border-l-accent-primary'
                        : 'hover:bg-bg-hover/50'
                    }
                  `}
                >
                  {/* Row 1: Avatar + Name + Time */}
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox in selection mode, avatar otherwise */}
                    {selectionMode ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect?.(conversation.session_id);
                        }}
                        className={`w-8 h-8 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-accent-primary border-accent-primary'
                            : 'border-border-default bg-bg-primary hover:border-accent-primary'
                        }`}
                      >
                        {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                      </button>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-bg-hover text-text-primary">
                        {displayName[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    {/* Name + time row */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <QualityBadge summary={qualitySummary} size="sm" />
                        {/* Waiting dot indicator */}
                        {isWaiting && (
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                        )}
                        <span className="text-[11px] text-text-muted">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Last message preview */}
                  <p className="text-xs text-text-muted truncate mt-0.5 pl-[42px]">
                    {conversation.last_message_role === 'assistant' && (
                      <span className="text-accent-primary font-medium">IA: </span>
                    )}
                    {(conversation.last_message?.slice(0, 80) || '')}
                    {(conversation.last_message?.length || 0) > 80 && '...'}
                  </p>

                  {/* Row 3: Status + channel + count + client */}
                  <div className="flex items-center gap-2 mt-1.5 pl-[42px]">
                    {/* Status dot + label */}
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(conversation.supervision_status)}`} />
                      <span className={`text-[10px] ${statusConfig.color}`}>
                        <span className="hidden md:inline">{statusConfig.label}</span>
                        <span className="md:hidden">{statusConfig.label.slice(0, 6)}</span>
                      </span>
                    </div>

                    {/* Channel */}
                    {conversation.channel && conversation.channel !== 'unknown' && (
                      <span className={`text-[10px] hidden md:inline ${channelConfig[conversation.channel]?.color || 'text-text-muted'}`}>
                        {channelConfig[conversation.channel]?.label || conversation.channel}
                      </span>
                    )}

                    {/* Message count */}
                    <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                      <MessageSquare size={9} />
                      {conversation.message_count}
                    </span>

                    {/* Client name — right aligned */}
                    {conversation.client_name && (
                      <span className="ml-auto text-[10px] text-text-muted truncate max-w-[80px] hidden md:block">
                        {conversation.client_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
