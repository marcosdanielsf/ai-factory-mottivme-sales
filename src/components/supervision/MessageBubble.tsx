import React from 'react';
import { Bot, User, Instagram, MessageCircle, Mail, Globe } from 'lucide-react';
import { SupervisionMessage } from '../../types/supervision';

const getChannelIcon = (channel: string | null) => {
  switch (channel?.toLowerCase()) {
    case 'instagram':
    case 'ig':
      return <Instagram size={10} className="text-pink-400" />;
    case 'whatsapp':
    case 'wa':
      return <MessageCircle size={10} className="text-green-400" />;
    case 'email':
      return <Mail size={10} className="text-blue-400" />;
    default:
      return <Globe size={10} className="text-gray-400" />;
  }
};

interface MessageBubbleProps {
  message: SupervisionMessage;
  isMobile?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMobile = false }) => {
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  // Formata horário considerando UTC e timezone local
  const formatTime = (dateStr: string): string => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    // Verifica se é UTC e adiciona offset se necessário
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-2 md:px-3 py-1 bg-bg-hover rounded-full text-xs text-text-muted text-center max-w-[90%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 md:gap-2 mb-2 md:mb-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0`}>
          <Bot size={isMobile ? 12 : 16} className="text-accent-primary" />
        </div>
      )}

      <div
        className={`
          ${isMobile ? 'max-w-[80%] px-2.5 py-1.5' : 'max-w-[70%] px-3 py-2'} rounded-2xl
          ${
            isAssistant
              ? 'bg-bg-hover text-text-primary rounded-tl-sm'
              : 'bg-accent-primary text-white rounded-tr-sm'
          }
        `}
      >
        <p className={`${isMobile ? 'text-[13px]' : 'text-sm'} whitespace-pre-wrap break-words`}>
          {message.content}
        </p>
        <div
          className={`
            flex items-center gap-1.5 md:gap-2 mt-1 ${isMobile ? 'text-[10px]' : 'text-xs'}
            ${isAssistant ? 'text-text-muted' : 'text-white/70'}
          `}
        >
          <span>{formatTime(message.created_at)}</span>
          {message.channel && message.channel !== 'unknown' && (
            <span className="flex items-center gap-1">
              {getChannelIcon(message.channel)}
            </span>
          )}
          {message.sentiment_score !== null && isAssistant && !isMobile && (
            <span
              className={`
                px-1.5 py-0.5 rounded text-[10px]
                ${
                  message.sentiment_score > 0.7
                    ? 'bg-green-500/20 text-green-400'
                    : message.sentiment_score > 0.4
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }
              `}
            >
              {Math.round(message.sentiment_score * 100)}%
            </span>
          )}
        </div>
      </div>

      {!isAssistant && (
        <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-bg-hover flex items-center justify-center flex-shrink-0`}>
          <User size={isMobile ? 12 : 16} className="text-text-secondary" />
        </div>
      )}
    </div>
  );
};
