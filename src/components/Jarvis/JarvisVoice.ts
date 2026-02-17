import { useState, useRef, useCallback } from 'react';

// ─── Cartesia TTS ─────────────────────────────────────────────────────────────
//
// Uses Cartesia's Sonic model for high-quality, natural-sounding Portuguese TTS.
// Falls back to Web Speech API if Cartesia key is missing or API fails.
//

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
        voice: {
          mode: 'id',
          id: CARTESIA_VOICE_ID,
        },
        output_format: {
          container: 'wav',
          encoding: 'pcm_f32le',
          sample_rate: 24000,
        },
        language: 'pt',
        // Megazord: slightly slower, deeper feel via speed control
        __experimental_controls: {
          speed: 'slow',
        },
      }),
    });

    if (!response.ok) {
      console.warn('Cartesia TTS error:', response.status, await response.text().catch(() => ''));
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    console.warn('Cartesia TTS fetch error:', err);
    return null;
  }
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

    // Try to find PT-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang === 'pt-BR') || voices.find((v) => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
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

// ─── Split into chunks (Cartesia has a character limit) ──────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMegazordTTS(): MegazordTTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    setIsSpeaking(true);

    while (queueRef.current.length > 0 && !abortRef.current) {
      const text = queueRef.current.shift()!;

      // Try Cartesia first
      const audioData = await cartesiaTTS(text);

      if (audioData && !abortRef.current) {
        // Play Cartesia audio via HTMLAudioElement
        await new Promise<void>((resolve) => {
          const blob = new Blob([audioData], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            resolve();
          };
          audio.play().catch(() => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            resolve();
          });
        });
      } else if (!abortRef.current) {
        // Fallback to Web Speech
        await webSpeechFallback(text);
      }
    }

    processingRef.current = false;
    setIsSpeaking(false);
  }, []);

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

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
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

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, toggleTts };
}

// Keep the export for backward compatibility
export function pickMegazordVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang === 'pt-BR') || voices.find((v) => v.lang.startsWith('pt')) || voices[0] || null;
}
