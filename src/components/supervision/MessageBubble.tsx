import React from 'react';
import { Bot, User, Instagram, MessageCircle, Mail } from 'lucide-react';
import { SupervisionMessage } from '../../types/supervision';

const getChannelIcon = (channel: string | null) => {
  switch (channel?.toLowerCase()) {
    case 'instagram':
    case 'ig':
      return <Instagram size={12} className="text-pink-400" />;
    case 'whatsapp':
    case 'wa':
      return <MessageCircle size={12} className="text-green-400" />;
    case 'email':
      return <Mail size={12} className="text-blue-400" />;
    default:
      return null;
  }
};

const getChannelLabel = (channel: string | null): string | null => {
  switch (channel?.toLowerCase()) {
    case 'instagram':
    case 'ig':
      return 'Instagram';
    case 'whatsapp':
    case 'wa':
      return 'WhatsApp';
    case 'email':
      return 'E-mail';
    default:
      return null;
  }
};

interface MessageBubbleProps {
  message: SupervisionMessage;
  isMobile?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMobile = false }) => {
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const formatTime = (dateStr: string): string => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1.5 bg-bg-hover/50 border border-border-default/30 rounded-full text-[11px] text-text-muted text-center max-w-[90%]">
          {message.content}
        </div>
      </div>
    );
  }

  const channelIcon = message.channel && message.channel !== 'unknown' ? getChannelIcon(message.channel) : null;
  const channelLabel = message.channel && message.channel !== 'unknown' ? getChannelLabel(message.channel) : null;
  const hasFooter = !!(channelIcon || (message.sentiment_score !== null && !isAssistant && !isMobile));

  return (
    <div className={`flex mb-3 ${isAssistant ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-xl p-3
          ${isAssistant
            ? 'bg-accent-primary/5 border border-accent-primary/20 rounded-tr-sm'
            : 'bg-bg-primary/50 border border-border-default/40 rounded-tl-sm'
          }
        `}
      >
        {/* Header: avatar + sender label + time */}
        <div className={`flex items-center gap-1.5 mb-1.5 ${isAssistant ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-1 ${isAssistant ? 'flex-row-reverse' : ''}`}>
            {isAssistant ? (
              <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
                <Bot size={11} className="text-accent-primary" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-bg-hover flex items-center justify-center shrink-0">
                <User size={11} className="text-text-secondary" />
              </div>
            )}
            <span
              className={`text-[11px] font-medium ${
                isAssistant ? 'text-accent-primary/70' : 'text-text-secondary'
              }`}
            >
              {isAssistant ? 'Assistente IA' : 'Contato'}
            </span>
          </div>
          <span className="text-[11px] text-text-muted ml-auto pl-2">
            {formatTime(message.created_at)}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-text-primary whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Footer: channel + sentiment */}
        {hasFooter && (
          <div
            className={`flex items-center gap-2 mt-2 pt-1.5 border-t border-border-default/20 ${
              isAssistant ? 'justify-end' : 'justify-start'
            }`}
          >
            {channelIcon && (
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                {channelIcon}
                {channelLabel && <span>{channelLabel}</span>}
              </span>
            )}
            {message.sentiment_score !== null && !isAssistant && !isMobile && (
              <span
                className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium
                  ${
                    message.sentiment_score > 0.7
                      ? 'bg-green-500/15 text-green-400'
                      : message.sentiment_score > 0.4
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-red-500/15 text-red-400'
                  }
                `}
              >
                {Math.round(message.sentiment_score * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
