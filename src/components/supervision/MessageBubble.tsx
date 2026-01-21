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
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-bg-hover rounded-full text-xs text-text-muted">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 mb-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-accent-primary" />
        </div>
      )}

      <div
        className={`
          max-w-[70%] px-3 py-2 rounded-2xl
          ${
            isAssistant
              ? 'bg-bg-hover text-text-primary rounded-tl-sm'
              : 'bg-accent-primary text-white rounded-tr-sm'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={`
            flex items-center gap-2 mt-1 text-xs
            ${isAssistant ? 'text-text-muted' : 'text-white/70'}
          `}
        >
          <span>{formatTime(message.created_at)}</span>
          {message.channel && message.channel !== 'unknown' && (
            <span className="flex items-center gap-1">
              {getChannelIcon(message.channel)}
            </span>
          )}
          {message.sentiment_score !== null && isAssistant && (
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
        <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-text-secondary" />
        </div>
      )}
    </div>
  );
};
