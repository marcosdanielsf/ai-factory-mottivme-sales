import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Cartesia TTS + Web Audio API (with AnalyserNode for 3D head) ─────────────

const CARTESIA_API_URL = 'https://api.cartesia.ai/tts/bytes';
const CARTESIA_API_KEY = import.meta.env.VITE_CARTESIA_API_KEY || '';
const CARTESIA_VOICE_ID = import.meta.env.VITE_CARTESIA_VOICE_ID || '';
const CARTESIA_MODEL = 'sonic';

export interface MegazordTTS {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  ttsEnabled: boolean;
  toggleTts: () => void;
  analyser: AnalyserNode | null;
}

// ─── Cartesia API Call ────────────────────────────────────────────────────────

async function cartesiaTTS(text: string): Promise<ArrayBuffer | null> {
  if (!CARTESIA_API_KEY || !CARTESIA_VOICE_ID) return null;

  try {
    const response = await fetch(CARTESIA_API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': CARTESIA_API_KEY,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: CARTESIA_MODEL,
        transcript: text,
        voice: { mode: 'id', id: CARTESIA_VOICE_ID },
        output_format: {
          container: 'wav',
          encoding: 'pcm_f32le',
          sample_rate: 24000,
        },
        language: 'pt',
      }),
    });

    if (!response.ok) {
      console.warn('Cartesia TTS error:', response.status);
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    console.warn('Cartesia TTS fetch error:', err);
    return null;
  }
}

// ─── Text Cleaning ────────────────────────────────────────────────────────────

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*_~`#⬡●✅❌⚠️🔴🟡🟢💰📊🤖]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\$(\d+)/g, '$1 dólares')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .trim();
}

function splitIntoChunks(text: string, maxLen = 500): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

// ─── Web Speech Fallback ──────────────────────────────────────────────────────

function webSpeechFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.pitch = 0.6;
    utterance.rate = 0.88;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang === 'pt-BR') || voices.find((v) => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMegazordTTS(): MegazordTTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const abortRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  // Web Audio API refs — persist across renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);

  // Initialize AudioContext + AnalyserNode once
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass({ sampleRate: 24000 });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    analyser.connect(ctx.destination);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    setAnalyserState(analyser);

    return () => {
      ctx.close().catch(() => {});
    };
  }, []);

  // Play audio buffer through AudioContext + AnalyserNode
  const playAudioBuffer = useCallback((arrayBuffer: ArrayBuffer): Promise<void> => {
    return new Promise(async (resolve) => {
      const ctx = audioContextRef.current;
      const analyser = analyserRef.current;
      if (!ctx || !analyser) { resolve(); return; }

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      try {
        // Decode audio data
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser); // Route through analyser → destination
        currentSourceRef.current = source;

        source.onended = () => {
          currentSourceRef.current = null;
          resolve();
        };

        source.start(0);
      } catch (err) {
        console.warn('Audio decode/play error:', err);
        currentSourceRef.current = null;
        resolve();
      }
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    setIsSpeaking(true);

    while (queueRef.current.length > 0 && !abortRef.current) {
      const text = queueRef.current.shift()!;

      // Try Cartesia → play through Web Audio API (feeds AnalyserNode)
      const audioData = await cartesiaTTS(text);

      if (audioData && !abortRef.current) {
        await playAudioBuffer(audioData);
      } else if (!abortRef.current) {
        await webSpeechFallback(text);
      }
    }

    processingRef.current = false;
    setIsSpeaking(false);
  }, [playAudioBuffer]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled) return;
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    abortRef.current = false;
    const chunks = splitIntoChunks(clean);
    queueRef.current.push(...chunks);

    if (!processingRef.current) {
      processQueue();
    }
  }, [ttsEnabled, processQueue]);

  const stopSpeaking = useCallback(() => {
    abortRef.current = true;
    queueRef.current = [];

    // Stop current Web Audio source
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch {}
      currentSourceRef.current = null;
    }

    // Also cancel Web Speech fallback
    window.speechSynthesis?.cancel();

    processingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, toggleTts, analyser: analyserState };
}

// Keep for backward compat
export function pickMegazordVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang === 'pt-BR') || voices.find((v) => v.lang.startsWith('pt')) || voices[0] || null;
}
