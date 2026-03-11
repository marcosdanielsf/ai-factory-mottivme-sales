import { useRef, useEffect, useState, useCallback } from 'react';
import { Bot, User, MessageSquare, Send } from 'lucide-react';
import { useSandboxChat, AgentMode } from '../../hooks/useSandboxChat';
import { SandboxToolbar } from './SandboxToolbar';
import { SandboxPersonaSelector } from './SandboxPersonaSelector';
import { useToast } from '../../hooks/useToast';

interface SandboxChatProps {
  agentVersionId: string;
  locationId: string;
  isPanel?: boolean;
}

export function SandboxChat({ agentVersionId, locationId, isPanel = false }: SandboxChatProps) {
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    loading,
    currentMode,
    totalTokens,
    sessions,
    sendMessage,
    saveSession,
    loadSession,
    listSessions,
    clearMessages,
    setMode,
  } = useSandboxChat({ agentVersionId, locationId });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    listSessions();
  }, [listSessions]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return;
    const content = inputValue;
    setInputValue('');
    setSelectedPersona(null);
    await sendMessage(content);
  }, [inputValue, loading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePersonaSelect = (message: string) => {
    setInputValue(message);
    setSelectedPersona(message);
    textareaRef.current?.focus();
  };

  const handleSave = async () => {
    try {
      await saveSession();
      showToast('Sessão salva com sucesso!', 'success');
      await listSessions();
    } catch {
      showToast('Erro ao salvar sessão', 'error');
    }
  };

  const handleLoad = async (id: string) => {
    await loadSession(id);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex flex-col bg-zinc-900 ${isPanel ? 'h-full' : 'h-[600px]'} overflow-hidden`}>
      {/* Toolbar */}
      <SandboxToolbar
        currentMode={currentMode}
        onModeChange={(mode: AgentMode) => setMode(mode)}
        onSave={handleSave}
        onClear={clearMessages}
        onLoadSession={handleLoad}
        sessions={sessions}
        tokenCount={totalTokens}
      />

      {/* Persona selector */}
      <SandboxPersonaSelector
        onSelect={handlePersonaSelect}
        selectedPersona={selectedPersona}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={40} className="text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500">Envie uma mensagem para testar o agente</p>
            <p className="text-xs text-zinc-600 mt-1">Use as personas acima para simular leads reais</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.role === 'system') {
              return (
                <div key={index} className="flex justify-center">
                  <span className="text-[11px] text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isUser = msg.role === 'user';

            return (
              <div
                key={index}
                className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-teal-200" />
                  </div>
                )}

                <div className={`max-w-[78%] ${isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'} overflow-hidden`}>
                  <div
                    className={`px-3 py-1 text-[10px] font-medium flex items-center gap-1.5 ${
                      isUser ? 'bg-blue-700/80 text-blue-200' : 'bg-teal-800/80 text-teal-300'
                    }`}
                  >
                    <span>{isUser ? 'Lead' : 'Agente'}</span>
                    <span className="ml-auto opacity-60">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`px-3 py-2.5 text-sm whitespace-pre-wrap break-words leading-relaxed ${
                      isUser ? 'bg-blue-600/90 text-white' : 'bg-teal-700/90 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                    <User size={14} className="text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-teal-200" />
            </div>
            <div className="rounded-2xl rounded-bl-sm overflow-hidden">
              <div className="px-3 py-1 text-[10px] font-medium bg-teal-800/80 text-teal-300">
                Agente
              </div>
              <div className="px-4 py-3 bg-teal-700/90">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-zinc-700 bg-zinc-900 shrink-0">
        <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 focus-within:border-blue-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem como lead... (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
          Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
