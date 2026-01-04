import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2, Volume2, Send, MessageSquare, Sparkles } from 'lucide-react';

// Audio Utility Functions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AISupportWidgetProps {
  currentPage?: string;
  agentContext?: {
    agentId: string;
    agentName: string;
  };
}

const SUGGESTED_TOPICS = [
  'Como editar prompts?',
  'O que é Reflection Loop?',
  'Como classificar leads?',
  'Explicar os scores'
];

const AISupportWidget: React.FC<AISupportWidgetProps> = ({ currentPage, agentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Audio refs
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const PLAYBACK_RATE = 1.1; // Slightly faster

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isVoiceMode) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isVoiceMode]);

  const getSystemInstruction = () => {
    const baseInstruction = `Você é o Assistente de Suporte da MOTTIVME Sales, uma IA que ajuda a equipe interna.

Seu papel é:
1. Explicar como funciona cada feature do dashboard
2. Ajudar a entender métricas e scores
3. Guiar sobre processos de vendas e leads
4. Tirar dúvidas sobre o Reflection Loop e auto-melhoria
5. Explicar como usar o Prompt Studio

Regras:
- Seja direto e objetivo, respostas curtas
- Use linguagem informal mas profissional
- Se não souber algo, diga que vai verificar
- Sugira ações práticas quando possível
- Fale em português brasileiro`;

    const contextInfo = currentPage
      ? `\n\nO usuário está na página: ${currentPage}`
      : '';

    const agentInfo = agentContext
      ? `\nAgente selecionado: ${agentContext.agentName}`
      : '';

    return baseInstruction + contextInfo + agentInfo;
  };

  const cleanup = () => {
    sessionPromiseRef.current?.then(s => {
      try { s.close(); } catch (e) {}
    });
    streamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    sourcesRef.current.clear();

    streamRef.current = null;
    scriptProcessorRef.current = null;
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
    sessionPromiseRef.current = null;

    setIsConnected(false);
    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
  };

  const startVoiceSession = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const { GoogleGenAI, Modality } = await import('@google/genai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setError('API Key não configurada');
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
          systemInstruction: getSystemInstruction(),
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsConnected(true);
            setIsVoiceMode(true);

            const source = audioContextInRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              setIsSpeaking(true);
              const ctx = audioContextOutRef.current;

              try {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.playbackRate.value = PLAYBACK_RATE;
                source.connect(ctx.destination);

                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                  }
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration / PLAYBACK_RATE;
                sourcesRef.current.add(source);
              } catch (e) {
                console.error('Audio decode error:', e);
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e: any) => {
            console.error('Voice error:', e);
            setError('Erro na conexão de voz');
            cleanup();
          },
          onclose: () => {
            cleanup();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error('Failed to start voice:', err);
      setError(err.message || 'Erro ao iniciar voz');
      setIsConnecting(false);
    }
  };

  const stopVoiceSession = () => {
    cleanup();
    setIsVoiceMode(false);
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setError('API Key não configurada');
        setIsTyping(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: getSystemInstruction() }] },
          { role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar a equipe.' }] },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: userMessage.content }] }
        ]
      });

      const responseText = result.response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Text chat error:', err);
      setError('Erro ao enviar mensagem');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputText(topic);
    setTimeout(() => handleSendText(), 100);
  };

  const handleClose = () => {
    cleanup();
    setIsOpen(false);
    setIsVoiceMode(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-[100] rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110
          ${isOpen ? 'bg-accent-primary text-white' : 'bg-bg-secondary border border-border-default text-accent-primary hover:border-accent-primary'}
        `}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[99] w-[380px] bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300" style={{ maxHeight: '70vh' }}>

          {/* Header */}
          <div className="bg-bg-tertiary p-4 border-b border-border-default">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                  <MessageSquare className="text-accent-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary text-sm">AI Support</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">MOTTIVME Sales</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isVoiceMode && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">Voz ativa</span>
                  </div>
                )}
              </div>
            </div>

            {currentPage && (
              <div className="mt-2 text-[10px] text-text-muted">
                Página: <span className="text-accent-primary">{currentPage}</span>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px] bg-bg-primary">
            {messages.length === 0 && !isVoiceMode && (
              <div className="text-center py-6">
                <p className="text-text-muted text-sm mb-4">Como posso ajudar?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleSuggestedTopic(topic)}
                      className="text-xs bg-bg-secondary text-text-secondary hover:text-accent-primary px-3 py-1.5 rounded-lg border border-border-default hover:border-accent-primary transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary border border-border-default text-text-primary'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Voice Mode Visualizer */}
            {isVoiceMode && (
              <div className="flex flex-col items-center py-6">
                <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                  <div className={`absolute inset-0 bg-accent-primary/20 rounded-full transition-all duration-300 ${isSpeaking ? 'animate-ping scale-150 opacity-40' : 'scale-100 opacity-0'}`} />
                  <div className={`absolute inset-0 bg-accent-primary/30 rounded-full transition-all duration-200 ${isSpeaking ? 'scale-125' : 'scale-100'}`} />
                  <div className={`relative z-10 bg-accent-primary rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${isSpeaking ? 'w-16 h-16' : 'w-14 h-14'}`}>
                    {isSpeaking ? (
                      <Volume2 className="text-white w-7 h-7" />
                    ) : (
                      <Mic className="text-white w-6 h-6" />
                    )}
                  </div>
                </div>
                <p className="text-text-muted text-xs uppercase tracking-wider">
                  {isSpeaking ? 'Falando...' : 'Ouvindo...'}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border-default bg-bg-secondary">
            {error && (
              <div className="mb-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Voice Toggle */}
              <button
                onClick={isVoiceMode ? stopVoiceSession : startVoiceSession}
                disabled={isConnecting}
                className={`p-2.5 rounded-lg transition-colors ${
                  isVoiceMode
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-muted hover:text-accent-primary hover:bg-bg-tertiary/80'
                } ${isConnecting ? 'opacity-50' : ''}`}
                title={isVoiceMode ? 'Desativar voz' : 'Ativar voz'}
              >
                {isConnecting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isVoiceMode ? (
                  <MicOff size={18} />
                ) : (
                  <Mic size={18} />
                )}
              </button>

              {/* Text Input */}
              <div className="flex-1 flex items-center bg-bg-tertiary rounded-lg border border-border-default focus-within:border-accent-primary transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isVoiceMode ? 'Modo voz ativo...' : 'Digite sua dúvida...'}
                  disabled={isVoiceMode}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || isVoiceMode || isTyping}
                  className="p-2 text-text-muted hover:text-accent-primary disabled:opacity-30 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISupportWidget;
