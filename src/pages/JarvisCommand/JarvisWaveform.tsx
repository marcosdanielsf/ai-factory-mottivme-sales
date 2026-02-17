import { useMemo } from 'react';

interface JarvisWaveformProps {
  active: boolean;
  speaking?: boolean;
  bars?: number;
}

interface BarConfig {
  maxHeight: number;
  duration: number;
  delay: number;
}

function JarvisWaveform({ active, speaking = false, bars = 12 }: JarvisWaveformProps) {
  const barConfigs = useMemo<BarConfig[]>(
    () =>
      Array.from({ length: bars }, (_, i) => ({
        maxHeight: 12 + Math.random() * 16,
        duration: 0.4 + Math.random() * 0.4,
        delay: i * 0.05,
      })),
    [bars]
  );

  const isActive = active || speaking;
  const color = speaking ? '#22c55e' : '#00d4ff';

  return (
    <>
      <style>{`
        @keyframes jarvisWaveBar {
          0%, 100% { height: 4px; }
          50% { height: var(--max-h); }
        }
      `}</style>
      <div
        className="flex items-center justify-center gap-[2px]"
        style={{ width: '80px', height: '32px' }}
      >
        {barConfigs.map((bar, i) => (
          <div
            key={i}
            className="rounded-full transition-colors duration-300"
            style={{
              width: '3px',
              minHeight: '2px',
              height: isActive ? undefined : '2px',
              backgroundColor: isActive ? color : '#3b4252',
              boxShadow: isActive ? `0 0 4px ${color}` : undefined,
              // @ts-expect-error CSS custom property
              '--max-h': `${bar.maxHeight}px`,
              animation: isActive
                ? `jarvisWaveBar ${bar.duration}s ease-in-out ${bar.delay}s infinite`
                : undefined,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default JarvisWaveform;
export { JarvisWaveform };
