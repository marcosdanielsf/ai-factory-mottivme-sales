import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Megazord TTS ────────────────────────────────────────────────────────────

// Cached voice to avoid switching mid-conversation
let _cachedVoice: SpeechSynthesisVoice | null = null;
let _cachedVoiceListLen = 0;

export function pickMegazordVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Return cached if voice list hasn't changed
  if (_cachedVoice && _cachedVoiceListLen === voices.length) return _cachedVoice;

  // STRICTLY PT-BR voices first — male preferred for Megazord vibe
  const ptBrMale = [
    'Felipe',        // macOS PT-BR male (if available)
    'Marcos',        // some systems
  ];

  const ptBrAny = [
    'Luciana',       // macOS PT-BR female (common, reliable)
  ];

  // 1. Try PT-BR male voices
  for (const name of ptBrMale) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith('pt'));
    if (v) { _cachedVoice = v; _cachedVoiceListLen = voices.length; return v; }
  }

  // 2. Try any PT-BR voice by name
  for (const name of ptBrAny) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith('pt'));
    if (v) { _cachedVoice = v; _cachedVoiceListLen = voices.length; return v; }
  }

  // 3. Any pt-BR voice
  const ptBr = voices.find((v) => v.lang === 'pt-BR');
  if (ptBr) { _cachedVoice = ptBr; _cachedVoiceListLen = voices.length; return ptBr; }

  // 4. Any Portuguese voice
  const pt = voices.find((v) => v.lang.startsWith('pt'));
  if (pt) { _cachedVoice = pt; _cachedVoiceListLen = voices.length; return pt; }

  // 5. Last resort — first available (should never happen)
  _cachedVoice = voices[0];
  _cachedVoiceListLen = voices.length;
  return voices[0];
}

export interface MegazordTTS {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  ttsEnabled: boolean;
  toggleTts: () => void;
}

// Chrome has a bug where speechSynthesis stops after ~15 seconds.
// Workaround: split text into chunks and pause/resume periodically.
function splitIntoChunks(text: string, maxLen = 150): string[] {
  const sentences = text.split(/(?<=[.!?。])\s+/);
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
  return chunks.length > 0 ? chunks : [text];
}

export function useMegazordTTS(): MegazordTTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const queueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);
  const voicesLoadedRef = useRef(false);

  // Pre-load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) voicesLoadedRef.current = true;
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Chrome workaround: periodically resume to prevent freezing
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const processQueue = useCallback(() => {
    if (speakingRef.current || queueRef.current.length === 0) return;

    const text = queueRef.current.shift()!;
    speakingRef.current = true;
    setIsSpeaking(true);

    // Cancel any lingering speech
    window.speechSynthesis.cancel();

    // Small delay after cancel to ensure clean state
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.volume = 1.0;

      // Pick voice FIRST, then adjust pitch/rate based on voice
      const voice = pickMegazordVoice();
      if (voice) {
        utterance.voice = voice;
        // Male voices can go deeper; female voices need subtle adjustment
        const isMale = /felipe|marcos/i.test(voice.name);
        utterance.pitch = isMale ? 0.4 : 0.65;   // deeper for male, slightly low for female
        utterance.rate = isMale ? 0.82 : 0.88;    // slower for male
      } else {
        utterance.pitch = 0.6;
        utterance.rate = 0.85;
      }

      utterance.onend = () => {
        speakingRef.current = false;
        if (queueRef.current.length === 0) {
          setIsSpeaking(false);
        }
        // Process next in queue
        setTimeout(() => processQueue(), 150);
      };

      utterance.onerror = (e) => {
        console.warn('TTS error:', e);
        speakingRef.current = false;
        if (queueRef.current.length === 0) {
          setIsSpeaking(false);
        }
        setTimeout(() => processQueue(), 150);
      };

      window.speechSynthesis.speak(utterance);
    }, 50);
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Clean text for speech
    const clean = text
      .replace(/[*_~`#⬡●✅❌⚠️🔴🟡🟢💰📊🤖]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\$(\d)/g, '$1 dólares')
      .trim();
    if (!clean) return;

    // Split into chunks for Chrome compatibility
    const chunks = splitIntoChunks(clean);
    queueRef.current.push(...chunks);
    processQueue();
  }, [ttsEnabled, processQueue]);

  const stopSpeaking = useCallback(() => {
    queueRef.current = [];
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      if (prev) {
        queueRef.current = [];
        window.speechSynthesis.cancel();
        speakingRef.current = false;
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, toggleTts };
}
