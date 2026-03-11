import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageSquare, Bot, User, Clock, CheckCircle, PauseCircle, Calendar, Instagram } from 'lucide-react';
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
}

// Altura estimada de cada item da lista (aumentado para evitar sobreposição)
const ITEM_HEIGHT = 100;
const ITEM_HEIGHT_MOBILE = 92;

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  loading,
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
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-2.5 md:p-3 mb-2 bg-bg-hover rounded-lg animate-pulse">
            <div className="h-4 bg-border-default rounded w-1/3 mb-2" />
            <div className="h-3 bg-border-default rounded w-2/3 mb-2" />
            <div className="h-3 bg-border-default rounded w-1/2" />
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

  const getStatusIcon = (status: SupervisionStatus) => {
    switch (status) {
      case 'ai_active':
        return <Bot size={12} className="text-green-400" />;
      case 'ai_paused':
        return <PauseCircle size={12} className="text-yellow-400" />;
      case 'manual_takeover':
        return <User size={12} className="text-blue-400" />;
      case 'scheduled':
        return <Calendar size={12} className="text-purple-400" />;
      case 'converted':
        return <CheckCircle size={12} className="text-emerald-400" />;
      default:
        return <Clock size={12} className="text-gray-400" />;
    }
  };

  return (
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
          const statusConfig = supervisionStatusConfig[conversation.supervision_status];
          const qualitySummary = getSummary(conversation.session_id);

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
                onClick={() => onSelect(conversation)}
                className={`
                  p-2.5 md:p-3 mx-2 mb-1 rounded-lg cursor-pointer transition-colors active:bg-bg-hover/80
                  ${isSelected 
                    ? 'bg-accent-primary/10 border border-accent-primary' 
                    : conversation.last_message_role === 'user'
                      ? 'bg-yellow-400/20 hover:bg-yellow-400/25 border border-yellow-400/40'
                      : 'hover:bg-bg-hover border border-transparent'
                  }
                `}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      conversation.last_message_role === 'user' 
                        ? 'bg-yellow-400/20 text-yellow-400 ring-2 ring-yellow-400/50' 
                        : 'bg-bg-hover text-text-primary'
                    }`}>
                      {getContactDisplayName(conversation)[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs md:text-sm font-medium text-text-primary truncate">
                          {getContactDisplayName(conversation)}
                        </p>
                        {/* Link Instagram */}
                        {conversation.instagram_username && (
                          <a
                            href={`https://instagram.com/${conversation.instagram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-pink-400 hover:text-pink-300 transition-colors flex-shrink-0"
                            title={`@${conversation.instagram_username}`}
                          >
                            <Instagram size={12} />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-text-muted truncate">
                        {conversation.contact_phone || conversation.instagram_username || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                    {/* Quality Badge */}
                    <QualityBadge summary={qualitySummary} size="sm" />
                    <span className="text-[10px] md:text-xs text-text-muted">
                      {formatTime(conversation.last_message_at)}
                    </span>
                  </div>
                </div>

                {/* Last Message Preview */}
                <p className="text-[11px] md:text-xs text-text-secondary truncate mb-1.5 md:mb-2 pl-9 md:pl-10">
                  {conversation.last_message_role === 'assistant' && (
                    <span className="text-accent-primary">IA: </span>
                  )}
                  {conversation.last_message?.slice(0, 60)}
                  {(conversation.last_message?.length || 0) > 60 && '...'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pl-9 md:pl-10">
                  <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0">
                    <div className={`flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs ${statusConfig.bgColor}`}>
                      {getStatusIcon(conversation.supervision_status)}
                      <span className={`${statusConfig.color} hidden md:inline`}>{statusConfig.label}</span>
                      <span className={`${statusConfig.color} md:hidden`}>{statusConfig.label.slice(0, 6)}</span>
                    </div>
                    {/* Badge de Canal - esconde no mobile */}
                    {conversation.channel && conversation.channel !== 'unknown' && (
                      <span className={`text-[10px] md:text-xs hidden md:inline ${channelConfig[conversation.channel]?.color || 'text-text-muted'}`}>
                        {channelConfig[conversation.channel]?.label || conversation.channel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-text-muted flex-shrink-0">
                    <span className="flex items-center gap-0.5 md:gap-1">
                      <MessageSquare size={10} />
                      {conversation.message_count}
                    </span>
                    {conversation.client_name && (
                      <span className="items-center gap-1 truncate max-w-[60px] md:max-w-[100px] hidden md:flex">
                        <Bot size={10} />
                        {conversation.client_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
