import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertTriangle, X } from 'lucide-react';

interface MessageComposerProps {
  onSend: (message: string) => Promise<boolean>;
  sending: boolean;
  error: string | null;
  onClearError: () => void;
  disabled?: boolean;
  placeholder?: string;
  isAIActive?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  sending,
  error,
  onClearError,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  isAIActive = true,
}) => {
  const [message, setMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    // Se IA ativa, mostrar aviso antes de enviar
    if (isAIActive && !showWarning) {
      setShowWarning(true);
      return;
    }

    const success = await onSend(message.trim());
    if (success) {
      setMessage('');
      setShowWarning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cancelWarning = () => {
    setShowWarning(false);
  };

  const confirmSend = async () => {
    const success = await onSend(message.trim());
    if (success) {
      setMessage('');
      setShowWarning(false);
    }
  };

  return (
    <div className="border-t border-border-default bg-bg-primary p-3 md:p-4">
      {/* Warning Modal */}
      {showWarning && (
        <div className="mb-3 p-2.5 md:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs md:text-sm text-yellow-200 font-medium">
                A IA será pausada automaticamente
              </p>
              <p className="text-xs text-yellow-300/70 mt-1 hidden md:block">
                Ao enviar uma mensagem manual, a IA será desativada para esta conversa.
                Você poderá reativá-la depois.
              </p>
              <div className="flex gap-2 mt-2 md:mt-3">
                <button
                  onClick={cancelWarning}
                  className="px-3 py-1.5 text-xs bg-bg-hover text-text-secondary rounded-lg hover:bg-bg-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSend}
                  disabled={sending}
                  className="px-3 py-1.5 text-xs bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {sending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span className="hidden md:inline">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span className="md:hidden">Pausar e Enviar</span>
                      <span className="hidden md:inline">Pausar IA e Enviar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2.5 md:p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-xs md:text-sm text-red-300 truncate">{error}</span>
          </div>
          <button onClick={onClearError} className="text-red-400 hover:text-red-300 flex-shrink-0 ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 md:gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-bg-secondary border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '100px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      {/* Helper Text - desktop only */}
      <div className="mt-2 hidden md:flex items-center justify-between text-xs text-text-muted">
        <span>
          {isAIActive ? (
            <span className="text-yellow-400">IA ativa - enviar pausará automaticamente</span>
          ) : (
            <span className="text-green-400">IA pausada - modo manual ativo</span>
          )}
        </span>
        <span>Enter para enviar, Shift+Enter para quebra de linha</span>
      </div>

      {/* Mobile Helper - simplified */}
      <div className="mt-1.5 flex md:hidden items-center justify-center text-[10px] text-text-muted">
        {isAIActive ? (
          <span className="text-yellow-400/80">⚠️ IA ativa</span>
        ) : (
          <span className="text-green-400/80">✓ Modo manual</span>
        )}
      </div>
    </div>
  );
};
