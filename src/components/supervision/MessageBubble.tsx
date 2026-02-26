import React from 'react';
import { Bot, User, Instagram, MessageCircle, Mail, Check } from 'lucide-react';
import { SupervisionMessage } from '../../types/supervision';

const getChannelLabel = (channel: string | null): { label: string; icon: React.ReactNode } | null => {
  switch (channel?.toLowerCase()) {
    case 'instagram':
    case 'ig':
      return { label: 'Instagram', icon: <Instagram size={11} /> };
    case 'whatsapp':
    case 'wa':
      return { label: 'WhatsApp', icon: <MessageCircle size={11} /> };
    case 'email':
      return { label: 'E-mail', icon: <Mail size={11} /> };
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
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Hoje ${time}`;
    if (isYesterday) return `Ontem ${time}`;
    return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`;
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-1.5 bg-bg-hover/50 border border-border-default/30 rounded-full text-[11px] text-text-muted text-center max-w-[85%]">
          {message.content}
        </div>
      </div>
    );
  }

  const channel = message.channel && message.channel !== 'unknown' ? getChannelLabel(message.channel) : null;

  return (
    <div className={`flex items-end gap-2 mb-4 ${isAssistant ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar LEFT for lead messages */}
      {!isAssistant && (
        <div
          className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0`}
        >
          <User size={isMobile ? 14 : 16} className="text-slate-300" />
        </div>
      )}

      <div
        className={`${isMobile ? 'max-w-[80%]' : 'max-w-[75%]'} overflow-hidden ${
          isAssistant ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
        }`}
      >
        {/* Header strip — colored banner with time + channel */}
        <div
          className={`px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 ${
            isAssistant ? 'bg-teal-800/80 text-teal-200' : 'bg-slate-600/80 text-slate-300'
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {channel && (
            <>
              <span className="opacity-60">•</span>
              {channel.icon}
              <span>{channel.label}</span>
            </>
          )}
          {isAssistant && (
            <>
              <Check size={11} className="ml-auto opacity-70" />
              <span className="opacity-70">Entregue</span>
            </>
          )}
        </div>

        {/* Message content */}
        <div
          className={`px-3 py-2.5 ${
            isAssistant ? 'bg-teal-700/90 text-white' : 'bg-slate-700/80 text-slate-100'
          }`}
        >
          {message.sentiment_score !== null && !isAssistant && !isMobile && (
            <span
              className={`inline-block mb-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                message.sentiment_score > 0.7
                  ? 'bg-green-500/20 text-green-300'
                  : message.sentiment_score > 0.4
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {Math.round(message.sentiment_score * 100)}%
            </span>
          )}
          <p
            className={`${
              isMobile ? 'text-[13px]' : 'text-sm'
            } whitespace-pre-wrap break-words leading-relaxed`}
          >
            {message.content}
          </p>
        </div>
      </div>

      {/* Avatar RIGHT for bot messages */}
      {isAssistant && (
        <div
          className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0`}
        >
          <Bot size={isMobile ? 14 : 16} className="text-teal-200" />
        </div>
      )}
    </div>
  );
};
