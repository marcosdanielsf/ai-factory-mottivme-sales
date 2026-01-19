import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, X, Volume2, MessageSquare } from 'lucide-react';

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

interface AISupportVoiceProps {
  currentPage?: string;
  agentContext?: {
    agentId: string;
    agentName: string;
  };
}

const AISupportVoice: React.FC<AISupportVoiceProps> = ({ currentPage, agentContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // System instruction dinâmica baseada no contexto
  const getSystemInstruction = () => {
    const baseInstruction = `Você é o Assistente de Suporte da MOTTIVME Sales, uma IA que ajuda a equipe interna a entender processos e usar o sistema.

Seu papel é:
1. Explicar como funciona cada feature do dashboard
2. Ajudar a entender métricas e scores
3. Guiar sobre processos de vendas e leads
4. Tirar dúvidas sobre o Reflection Loop e auto-melhoria
5. Explicar como usar o Prompt Studio

Regras:
- Seja direto e objetivo
- Use linguagem informal mas profissional
- Se não souber algo, diga que vai verificar
- Sugira ações práticas quando possível
- Fale em português brasileiro`;

    const contextInfo = currentPage
      ? `\n\nO usuário está atualmente na página: ${currentPage}`
      : '';

    const agentInfo = agentContext
      ? `\nContexto do agente selecionado: ${agentContext.agentName} (ID: ${agentContext.agentId})`
      : '';

    return baseInstruction + contextInfo + agentInfo;
  };

  const toggleAssistant = async () => {
    if (isActive) {
      cleanup();
      setIsActive(false);
      return;
    }

    setIsConnecting(true);
    try {
      // Importação dinâmica do Google GenAI
      const { GoogleGenAI, Modality } = await import('@google/genai');

      // API Key do ambiente - configurar em .env como VITE_GEMINI_API_KEY
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        console.error('GEMINI_API_KEY não configurada');
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }, // Voz diferente para o suporte
          },
          systemInstruction: getSystemInstruction(),
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setIsListening(true);

            const source = audioContextInRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);

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
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('AI Support Error:', e);
            cleanup();
          },
          onclose: () => {
            cleanup();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start AI support:', err);
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    sessionPromiseRef.current?.then(s => s.close());
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsListening(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {/* Painel expandido quando ativo */}
      {isActive && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 max-w-[280px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-accent-primary" size={16} />
              <span className="text-xs font-medium text-text-primary">AI Support</span>
            </div>
            <button
              onClick={toggleAssistant}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <Volume2 className="text-accent-primary animate-pulse" size={20} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-secondary"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Ouvindo...</p>
              <p className="text-[10px] text-text-muted">Fale sua dúvida</p>
            </div>
          </div>

          {currentPage && (
            <div className="mt-3 pt-3 border-t border-border-default">
              <p className="text-[10px] text-text-muted">
                Contexto: <span className="text-accent-primary">{currentPage}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={toggleAssistant}
        disabled={isConnecting}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative group
          ${isActive
            ? 'bg-accent-primary text-white scale-95'
            : 'bg-bg-secondary border border-border-default text-text-primary hover:border-accent-primary hover:text-accent-primary hover:scale-105'
          }
          ${isConnecting ? 'opacity-70' : ''}
        `}
      >
        {isConnecting ? (
          <Loader2 className="animate-spin" size={24} />
        ) : isActive ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}

        {/* Tooltip */}
        {!isActive && !isConnecting && (
          <span className="absolute right-16 bg-bg-tertiary text-text-primary text-xs py-2 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border-default shadow-lg">
            Assistente de Voz
          </span>
        )}

        {/* Pulse animation quando inativo */}
        {!isActive && !isConnecting && (
          <span className="absolute inset-0 rounded-full bg-accent-primary/20 animate-ping" />
        )}
      </button>
    </div>
  );
};

export default AISupportVoice;
