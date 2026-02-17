import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

interface JarvisBootScreenProps {
  onComplete: () => void;
}

type BootPhase = 'matrix' | 'logo' | 'loading' | 'online' | 'fadeout';

const HEX_CHARS = '0123456789ABCDEF';
const COLUMN_COUNT = 12;
const CHARS_PER_COLUMN = 22;

function generateColumn(): string[] {
  return Array.from({ length: CHARS_PER_COLUMN }, () =>
    HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]
  );
}

// ─── Cinematic Intro Sound (Web Audio API) ───────────────────────────────────
function playIntroSound() {
  try {
    const ctx = new AudioContext();

    // 1. Deep bass hit (sub boom)
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(80, ctx.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.5);
    bassGain.gain.setValueAtTime(0.6, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(ctx.currentTime);
    bassOsc.stop(ctx.currentTime + 2);

    // 2. Rising synth pad (cinematic sweep)
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(60, ctx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 2);
    sweepGain.gain.setValueAtTime(0, ctx.currentTime);
    sweepGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
    sweepGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2);
    filter.Q.value = 5;

    sweepOsc.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(ctx.currentTime);
    sweepOsc.stop(ctx.currentTime + 2.5);

    // 3. Hi-hat sparkle (digital texture)
    const bufferSize = ctx.sampleRate * 0.1;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    // Sparkle hits at different times
    [0.3, 0.7, 1.2, 1.6].forEach((time) => {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const hiFilter = ctx.createBiquadFilter();
      source.buffer = noiseBuffer;
      hiFilter.type = 'highpass';
      hiFilter.frequency.value = 8000;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.15);
      source.connect(hiFilter);
      hiFilter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime + time);
      source.stop(ctx.currentTime + time + 0.2);
    });

    // 4. Final "power on" chord (logo reveal)
    const chordFreqs = [130.81, 196, 261.63]; // C3, G3, C4
    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + 1.3);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 1.3 + i * 0.05);
      osc.stop(ctx.currentTime + 3);
    });

    // 5. "SYSTEMS ONLINE" confirmation beep
    const beepOsc = ctx.createOscillator();
    const beepGain = ctx.createGain();
    beepOsc.type = 'sine';
    beepOsc.frequency.value = 880;
    beepGain.gain.setValueAtTime(0, ctx.currentTime + 2.5);
    beepGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 2.55);
    beepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.9);
    beepOsc.connect(beepGain);
    beepGain.connect(ctx.destination);
    beepOsc.start(ctx.currentTime + 2.5);
    beepOsc.stop(ctx.currentTime + 3);

    // Cleanup
    setTimeout(() => ctx.close(), 4000);
  } catch {
    // Web Audio not available — silent fallback
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function JarvisBootScreen({ onComplete }: JarvisBootScreenProps) {
  const [phase, setPhase] = useState<BootPhase>('matrix');
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const completedRef = useRef(false);
  const soundPlayedRef = useRef(false);

  const columns = useMemo(
    () =>
      Array.from({ length: COLUMN_COUNT }, (_, i) => ({
        chars: generateColumn(),
        left: `${6 + i * (88 / (COLUMN_COUNT - 1))}%`,
        duration: 1.5 + Math.random() * 1.5,
        delay: Math.random() * 0.8,
      })),
    []
  );

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setOpacity(0);
    setTimeout(() => onComplete(), 500);
  }, [onComplete]);

  // Play intro sound on first interaction or auto
  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playIntroSound();
    }
  }, []);

  // Phase sequencer — robust with refs
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('logo'), 600));
    timers.push(setTimeout(() => setPhase('loading'), 1600));
    timers.push(setTimeout(() => setProgress(100), 1700));
    timers.push(setTimeout(() => setPhase('online'), 2700));
    timers.push(setTimeout(() => finish(), 3500));

    return () => timers.forEach(clearTimeout);
  }, [finish]);

  return (
    <>
      <style>{`
        @keyframes jarvisFall {
          0% { transform: translateY(-100%); opacity: 0.6; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes jarvisGlow {
          0% { opacity: 0; text-shadow: 0 0 0px #00d4ff; transform: scale(0.9); }
          100% { opacity: 1; text-shadow: 0 0 40px #00d4ff, 0 0 80px rgba(0,212,255,0.5); transform: scale(1); }
        }
        @keyframes jarvisScanLine {
          0% { top: 0%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes jarvisFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes jarvisOnlinePulse {
          0% { text-shadow: 0 0 10px #22c55e; }
          50% { text-shadow: 0 0 30px #22c55e, 0 0 60px rgba(34,197,94,0.4); }
          100% { text-shadow: 0 0 10px #22c55e; }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[200] bg-bg-primary flex items-center justify-center font-mono tracking-widest cursor-pointer select-none"
        onClick={finish}
        style={{
          opacity,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        {/* Skip hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <p className="text-xs text-text-muted/40 tracking-wider animate-pulse">
            click ou mova o mouse para pular
          </p>
        </div>

        {/* Mouse move skip */}
        <div
          className="absolute inset-0 z-10"
          onMouseMove={(e) => {
            // Skip after substantial movement
            if (phase === 'online' || phase === 'loading') {
              finish();
            }
          }}
        />

        {/* Matrix columns */}
        {(phase === 'matrix' || phase === 'logo') &&
          columns.map((col, i) => (
            <div
              key={i}
              className="absolute top-0 flex flex-col items-center text-xs leading-tight"
              style={{
                left: col.left,
                color: '#00d4ff',
                opacity: 0.5,
                animation: `jarvisFall ${col.duration}s linear ${col.delay}s infinite`,
                textShadow: '0 0 8px #00d4ff',
              }}
            >
              {col.chars.map((ch, j) => (
                <span key={j} style={{ opacity: 0.2 + Math.random() * 0.8 }}>
                  {ch}
                </span>
              ))}
            </div>
          ))}

        {/* Center content */}
        {phase !== 'matrix' && (
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo */}
            <div
              className="text-5xl font-bold"
              style={{
                color: '#00d4ff',
                animation: 'jarvisGlow 1s ease-out forwards',
              }}
            >
              ⬡ JARVIS
            </div>

            {/* Scan line on logo */}
            {phase === 'logo' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute left-0 w-full h-[2px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #00d4ff 30%, #00d4ff 70%, transparent 100%)',
                    animation: 'jarvisScanLine 1s linear forwards',
                  }}
                />
              </div>
            )}

            {/* Loading bar */}
            {phase === 'loading' && (
              <div className="flex flex-col items-center gap-4 mt-2">
                <div
                  className="text-sm"
                  style={{
                    animation: 'jarvisFlicker 0.4s ease-in-out infinite',
                    color: '#00d4ff',
                    textShadow: '0 0 10px #00d4ff',
                  }}
                >
                  INITIALIZING SYSTEMS...
                </div>
                <div className="w-72 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: '#00d4ff',
                      boxShadow: '0 0 15px #00d4ff, 0 0 30px rgba(0,212,255,0.3)',
                      transition: 'width 1s ease-out',
                    }}
                  />
                </div>
              </div>
            )}

            {/* SYSTEMS ONLINE */}
            {phase === 'online' && (
              <div
                className="text-lg font-bold tracking-[0.4em] mt-2"
                style={{
                  color: '#22c55e',
                  animation: 'jarvisOnlinePulse 0.8s ease-in-out infinite',
                }}
              >
                ✓ SYSTEMS ONLINE
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default JarvisBootScreen;
export { JarvisBootScreen };
