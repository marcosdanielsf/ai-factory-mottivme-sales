import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Mic, MicOff, X, Minus, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { useJarvis, JARVIS_QUICK_ACTIONS } from './JarvisContext';
import type { JarvisVoiceState } from './types';
import { useMegazordTTS } from './JarvisVoice';

// Minimal type for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function hasSpeechRecognition(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

// ─── Loading dots ────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <span className="flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner() {
  const { alerts, dismissAlert } = useJarvis();
  const topAlert = alerts.find((a) => !a.dismissed);
  if (!topAlert) return null;

  const bgMap = {
    critical: 'bg-accent-error/10 border-accent-error/30 text-accent-error',
    high: 'bg-accent-warning/10 border-accent-warning/30 text-accent-warning',
    medium: 'bg-accent-warning/10 border-accent-warning/20 text-accent-warning',
    low: 'bg-bg-tertiary border-border-default text-text-muted',
  };

  return (
    <div className={`mx-3 mb-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${bgMap[topAlert.severity]}`}>
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{topAlert.title}</p>
        <p className="text-text-muted truncate">{topAlert.message}</p>
      </div>
      <button
        onClick={() => dismissAlert(topAlert.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Fechar alerta"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function JarvisPanel() {
  const { messages, sendToJarvis, isProcessing, activeAlertCount, systemContext } = useJarvis();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<JarvisVoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const speechSupported = hasSpeechRecognition();
  const lastSpokenMsgId = useRef<string | null>(null);

  const { speak, stopSpeaking, isSpeaking, ttsEnabled, toggleTts } = useMegazordTTS();

  // Auto-falar última resposta do JARVIS
  useEffect(() => {
    const lastJarvis = [...messages].reverse().find((m) => m.role === 'jarvis' && !m.loading);
    if (lastJarvis && lastJarvis.id !== lastSpokenMsgId.current && lastJarvis.content) {
      lastSpokenMsgId.current = lastJarvis.id;
      speak(lastJarvis.content);
    }
  }, [messages, speak]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText('');
    await sendToJarvis(text);
  }, [inputText, isProcessing, sendToJarvis]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleQuickAction = useCallback(
    async (action: string) => {
      if (isProcessing) return;
      await sendToJarvis(action);
    },
    [isProcessing, sendToJarvis]
  );

  const toggleVoice = useCallback(() => {
    if (!speechSupported) return;

    if (voiceState === 'listening') {
      // Stop
      recognitionRef.current?.stop();
      setVoiceState('idle');
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setVoiceState('idle');
      // Auto-envia o comando de voz direto ao JARVIS
      if (transcript.trim()) {
        sendToJarvis(transcript.trim());
      }
    };

    recognition.onerror = () => {
      setVoiceState('idle');
    };

    recognition.onend = () => {
      setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState('listening');
  }, [voiceState, speechSupported]);

  const hasAlerts = activeAlertCount > 0;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-accent-primary transition-transform hover:scale-105 active:scale-95 ${
          isSpeaking
            ? 'shadow-[0_0_30px_rgba(59,130,246,0.9),0_0_60px_rgba(59,130,246,0.4)] animate-pulse'
            : 'shadow-[0_0_20px_rgba(59,130,246,0.4)]'
        }`}
        aria-label="Abrir JARVIS"
      >
        <Bot className="size-6 text-white" />

        {/* Alert badge */}
        {hasAlerts && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent-error text-[10px] font-bold text-white">
            {activeAlertCount > 9 ? '9+' : activeAlertCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex w-[380px] flex-col rounded-xl border border-accent-primary/20 bg-bg-secondary shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl border-b border-border-default px-4 py-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">🤖 JARVIS</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`size-2 rounded-full ${hasAlerts ? 'bg-accent-error' : 'bg-accent-success'}`}
                />
                <span className="text-xs text-text-muted">
                  {isSpeaking
                    ? '🔊 Falando...'
                    : hasAlerts
                    ? `⚠ ${activeAlertCount} alerta${activeAlertCount > 1 ? 's' : ''}`
                    : 'Sistema OK'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* TTS Toggle */}
              <button
                onClick={isSpeaking ? stopSpeaking : toggleTts}
                className={`rounded p-1 transition-colors ${
                  isSpeaking
                    ? 'text-accent-primary animate-pulse hover:bg-bg-hover'
                    : ttsEnabled
                    ? 'text-accent-primary hover:bg-bg-hover'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`}
                aria-label={isSpeaking ? 'Parar voz' : ttsEnabled ? 'Desativar voz' : 'Ativar voz'}
                title={isSpeaking ? 'Parar voz' : ttsEnabled ? 'Voz ativa (Megazord 🦾)' : 'Ativar voz'}
              >
                {ttsEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                aria-label="Minimizar"
                title="Minimizar"
              >
                <Minus className="size-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Alert Banner */}
          <div className="pt-2">
            <AlertBanner />
          </div>

          {/* Messages area */}
          <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto px-3 py-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="text-2xl">🤖</span>
                <p className="text-xs text-text-muted">
                  Olá! Sou o JARVIS, seu orchestrator central.
                </p>
                <p className="text-xs text-text-muted opacity-70">{systemContext}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'jarvis' && (
                    <span className="mr-2 mt-1 shrink-0 text-sm">🤖</span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.role === 'user'
                        ? 'ml-8 bg-accent-primary/20 text-text-primary'
                        : 'mr-8 bg-bg-tertiary text-text-primary'
                    }`}
                  >
                    {msg.loading ? (
                      <LoadingDots />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t border-border-default px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {JARVIS_QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  disabled={isProcessing}
                  className="shrink-0 cursor-pointer rounded-full bg-bg-tertiary px-3 py-1 text-xs text-text-muted transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-2 rounded-b-xl border-t border-border-default px-3 py-3">
            {/* Mic button */}
            {speechSupported && (
              <button
                onClick={toggleVoice}
                className={`shrink-0 rounded-lg p-2 transition-colors ${
                  voiceState === 'listening'
                    ? 'bg-accent-error/20 text-accent-error'
                    : 'bg-bg-tertiary text-text-muted hover:bg-bg-hover hover:text-text-primary'
                }`}
                aria-label={voiceState === 'listening' ? 'Parar gravação' : 'Iniciar gravação de voz'}
              >
                {voiceState === 'listening' ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao JARVIS..."
              disabled={isProcessing}
              className="flex-1 rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/50 disabled:opacity-50"
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isProcessing}
              className="shrink-0 rounded-lg bg-accent-primary p-2 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
