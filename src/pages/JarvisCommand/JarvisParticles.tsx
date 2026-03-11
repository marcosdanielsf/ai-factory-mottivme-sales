import { useMemo } from 'react';

interface JarvisParticlesProps {
  count?: number;
}

interface Particle {
  id: number;
  left: string;
  duration: number;
  delay: number;
  swayX: number;
  size: number;
  blur: boolean;
}

function JarvisParticles({ count = 30 }: JarvisParticlesProps) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        swayX: -20 + Math.random() * 40,
        size: 1.5 + Math.random() * 1.5,
        blur: i % 2 === 0,
      })),
    [count]
  );

  return (
    <>
      <style>{`
        @keyframes particleFloat0 { 0% { transform: translateY(100vh) translateX(0px); opacity: 0; } 10% { opacity: 0.3; } 90% { opacity: 0.3; } 100% { transform: translateY(-20px) translateX(var(--sway-x)); opacity: 0; } }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: 0,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: '#00d4ff',
              filter: p.blur ? 'blur(1px)' : undefined,
              opacity: 0,
              // @ts-expect-error CSS custom property
              '--sway-x': `${p.swayX}px`,
              animation: `particleFloat0 ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default JarvisParticles;
export { JarvisParticles };
