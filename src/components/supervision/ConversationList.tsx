import React from 'react';
import { MessageSquare, Bot, User, Clock, CheckCircle, PauseCircle, Calendar } from 'lucide-react';
import {
  SupervisionConversation,
  SupervisionStatus,
  supervisionStatusConfig,
} from '../../types/supervision';

interface ConversationListProps {
  conversations: SupervisionConversation[];
  selectedId: string | null;
  onSelect: (conversation: SupervisionConversation) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 mb-2 bg-bg-hover rounded-lg animate-pulse">
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
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <MessageSquare size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary">Nenhuma conversa encontrada</p>
          <p className="text-sm text-text-muted">
            Ajuste os filtros ou aguarde novas conversas
          </p>
        </div>
      </div>
    );
  }

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

  const getStatusIcon = (status: SupervisionStatus) => {
    switch (status) {
      case 'ai_active':
        return <Bot size={14} className="text-green-400" />;
      case 'ai_paused':
        return <PauseCircle size={14} className="text-yellow-400" />;
      case 'manual_takeover':
        return <User size={14} className="text-blue-400" />;
      case 'scheduled':
        return <Calendar size={14} className="text-purple-400" />;
      case 'converted':
        return <CheckCircle size={14} className="text-emerald-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const isSelected = selectedId === conversation.session_id;
        const statusConfig = supervisionStatusConfig[conversation.supervision_status];

        return (
          <div
            key={conversation.conversation_id}
            onClick={() => onSelect(conversation)}
            className={`
              p-3 mx-2 mb-1 rounded-lg cursor-pointer transition-colors
              ${isSelected ? 'bg-accent-primary/10 border border-accent-primary' : 'hover:bg-bg-hover border border-transparent'}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-xs font-semibold text-text-primary">
                  {conversation.contact_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {conversation.contact_name || 'Desconhecido'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {conversation.contact_phone}
                  </p>
                </div>
              </div>
              <div className="text-xs text-text-muted flex items-center gap-1">
                {formatTime(conversation.last_message_at)}
              </div>
            </div>

            {/* Last Message Preview */}
            <p className="text-xs text-text-secondary truncate mb-2 pl-10">
              {conversation.last_message_role === 'assistant' && (
                <span className="text-accent-primary">IA: </span>
              )}
              {conversation.last_message?.slice(0, 80)}
              {(conversation.last_message?.length || 0) > 80 && '...'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pl-10">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bgColor}`}>
                {getStatusIcon(conversation.supervision_status)}
                <span className={statusConfig.color}>{statusConfig.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {conversation.message_count}
                </span>
                {conversation.client_name && (
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <Bot size={12} />
                    {conversation.client_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
