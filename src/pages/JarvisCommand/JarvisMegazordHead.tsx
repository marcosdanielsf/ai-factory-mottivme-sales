import { useEffect, useState } from 'react';

interface JarvisMegazordHeadProps {
  active: boolean;  // true when speaking
  size?: number;    // default 200
  idle?: boolean;   // true = always visible (dimmed when not active)
}

/**
 * Megazord-style robotic head.
 * - idle=true → always rendered (dimmed when !active, glowing when active)
 * - idle=false (default) → overlay that fades in/out only when active
 */
function JarvisMegazordHead({ active, size = 200, idle = false }: JarvisMegazordHeadProps) {
  const [visible, setVisible] = useState(idle);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Fade in/out (only matters for non-idle/overlay mode)
  useEffect(() => {
    if (idle) {
      setVisible(true);
      return;
    }
    if (active) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [active, idle]);

  // Mouth animation while speaking
  useEffect(() => {
    if (!active) {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 180 + Math.random() * 120);
    return () => clearInterval(interval);
  }, [active]);

  if (!visible) return null;

  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Opacity for idle mode: dimmed when not speaking, bright when speaking
  const baseOpacity = idle ? (active ? 1 : 0.35) : 1;
  const eyeFill = active ? '#00d4ff' : 'rgba(0,212,255,0.25)';
  const strokeOpacity = active ? 0.8 : 0.25;

  const svgContent = (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{
        filter: active ? 'drop-shadow(0 0 12px rgba(0,212,255,0.5))' : 'drop-shadow(0 0 4px rgba(0,212,255,0.15))',
        transition: 'filter 0.4s ease, opacity 0.4s ease',
        opacity: baseOpacity,
      }}
    >
      {/* Head outline — angular/geometric shape */}
      <polygon
        points={`
          ${cx},${cy - 85}
          ${cx + 60},${cy - 55}
          ${cx + 70},${cy - 20}
          ${cx + 65},${cy + 30}
          ${cx + 45},${cy + 60}
          ${cx + 20},${cy + 75}
          ${cx - 20},${cy + 75}
          ${cx - 45},${cy + 60}
          ${cx - 65},${cy + 30}
          ${cx - 70},${cy - 20}
          ${cx - 60},${cy - 55}
        `}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2"
        opacity={strokeOpacity}
      />

      {/* Inner head frame */}
      <polygon
        points={`
          ${cx},${cy - 75}
          ${cx + 50},${cy - 48}
          ${cx + 58},${cy - 18}
          ${cx + 54},${cy + 22}
          ${cx + 38},${cy + 48}
          ${cx + 16},${cy + 62}
          ${cx - 16},${cy + 62}
          ${cx - 38},${cy + 48}
          ${cx - 54},${cy + 22}
          ${cx - 58},${cy - 18}
          ${cx - 50},${cy - 48}
        `}
        fill={active ? 'rgba(0,212,255,0.06)' : 'rgba(0,212,255,0.02)'}
        stroke="#00d4ff"
        strokeWidth="1"
        opacity={strokeOpacity * 0.5}
      />

      {/* Forehead crest — V shape */}
      <polyline
        points={`${cx - 40},${cy - 40} ${cx},${cy - 70} ${cx + 40},${cy - 40}`}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2.5"
        opacity={active ? 0.9 : 0.3}
      />

      {/* Left eye */}
      <polygon
        points={`
          ${cx - 38},${cy - 15}
          ${cx - 18},${cy - 22}
          ${cx - 10},${cy - 10}
          ${cx - 20},${cy}
          ${cx - 40},${cy - 5}
        `}
        fill={eyeFill}
        opacity={active ? 1 : 0.5}
        style={{
          animation: active ? 'megazordEyePulse 1.5s ease-in-out infinite' : undefined,
        }}
      />

      {/* Right eye */}
      <polygon
        points={`
          ${cx + 38},${cy - 15}
          ${cx + 18},${cy - 22}
          ${cx + 10},${cy - 10}
          ${cx + 20},${cy}
          ${cx + 40},${cy - 5}
        `}
        fill={eyeFill}
        opacity={active ? 1 : 0.5}
        style={{
          animation: active ? 'megazordEyePulse 1.5s ease-in-out infinite 0.5s' : undefined,
        }}
      />

      {/* Eye glow effect */}
      {active && (
        <>
          <circle cx={cx - 25} cy={cy - 12} r="6" fill="#00d4ff" opacity="0.3">
            <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx + 25} cy={cy - 12} r="6" fill="#00d4ff" opacity="0.3">
            <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
          </circle>
        </>
      )}

      {/* Nose ridge */}
      <line
        x1={cx} y1={cy - 5}
        x2={cx} y2={cy + 18}
        stroke="#00d4ff"
        strokeWidth="1"
        opacity={active ? 0.3 : 0.1}
      />

      {/* Mouth plate */}
      <rect
        x={cx - 25}
        y={cy + 25}
        width={50}
        height={mouthOpen ? 16 : 6}
        rx="2"
        fill={active ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)'}
        stroke="#00d4ff"
        strokeWidth="1.5"
        opacity={active ? 0.9 : 0.3}
        style={{ transition: 'height 0.1s ease' }}
      />

      {/* Mouth lines (grille) */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={cx - 20}
          y1={cy + 29 + i * (mouthOpen ? 5 : 2)}
          x2={cx + 20}
          y2={cy + 29 + i * (mouthOpen ? 5 : 2)}
          stroke="#00d4ff"
          strokeWidth="0.8"
          opacity={active ? 0.6 : 0.15}
          style={{ transition: 'all 0.1s ease' }}
        />
      ))}

      {/* Cheek vents */}
      {[-1, 1].map((dir) => (
        <g key={dir}>
          {[0, 1, 2].map((i) => (
            <line
              key={i}
              x1={cx + dir * 42}
              y1={cy + 10 + i * 6}
              x2={cx + dir * 55}
              y2={cy + 10 + i * 6}
              stroke="#00d4ff"
              strokeWidth="1"
              opacity={active ? 0.3 : 0.1}
            />
          ))}
        </g>
      ))}

      {/* Scan line across face */}
      {active && (
        <rect
          x="0" y={cy - 50}
          width={s}
          height="2"
          fill="#00d4ff"
          opacity="0.15"
          style={{
            animation: 'megazordScanLine 2s linear infinite',
          }}
        />
      )}

      {/* Chin detail */}
      <polyline
        points={`${cx - 15},${cy + 55} ${cx},${cy + 65} ${cx + 15},${cy + 55}`}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="1.5"
        opacity={active ? 0.5 : 0.15}
      />
    </svg>
  );

  // Idle mode: inline SVG, no overlay
  if (idle) {
    return (
      <>
        <style>{`
          @keyframes megazordEyePulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          @keyframes megazordScanLine {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(50%); }
          }
          @keyframes megazordBreathing {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.45; }
          }
        `}</style>
        <div
          style={{
            animation: !active ? 'megazordBreathing 3s ease-in-out infinite' : undefined,
          }}
        >
          {svgContent}
        </div>
      </>
    );
  }

  // Overlay mode: full-screen
  return (
    <>
      <style>{`
        @keyframes megazordEnter {
          0% { transform: scale(0.5) translateY(30px); opacity: 0; }
          50% { transform: scale(1.05) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes megazordExit {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8) translateY(20px); opacity: 0; }
        }
        @keyframes megazordEyePulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes megazordScanLine {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(50%); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
        style={{
          animation: active
            ? 'megazordEnter 0.5s ease-out forwards'
            : 'megazordExit 0.5s ease-in forwards',
        }}
      >
        {/* Backdrop glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: s * 1.5,
            height: s * 1.5,
            background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          }}
        />
        {svgContent}
      </div>
    </>
  );
}

export default JarvisMegazordHead;
export { JarvisMegazordHead };
