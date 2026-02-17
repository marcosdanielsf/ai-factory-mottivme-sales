import { useEffect, useState, useRef } from 'react';

interface JarvisMegazordHeadProps {
  active: boolean;
  size?: number;
  idle?: boolean;
}

/**
 * Soundwave-inspired robotic head — detailed SVG with metallic gradients,
 * glowing visor, and speaking animation. Looks 3D via layered gradients & filters.
 */
function JarvisMegazordHead({ active, size = 200, idle = false }: JarvisMegazordHeadProps) {
  const [visible, setVisible] = useState(idle);
  const [mouthPhase, setMouthPhase] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (idle) { setVisible(true); return; }
    if (active) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [active, idle]);

  // Mouth animation
  useEffect(() => {
    if (!active) { setMouthPhase(0); return; }
    let raf: number;
    const animate = () => {
      setMouthPhase(Date.now());
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  // Idle breathing
  useEffect(() => {
    if (!idle || active) return;
    let raf: number;
    const breathe = () => {
      frameRef.current++;
      raf = requestAnimationFrame(breathe);
    };
    raf = requestAnimationFrame(breathe);
    return () => cancelAnimationFrame(raf);
  }, [idle, active]);

  if (!visible) return null;

  const mouthOpenAmount = active ? (Math.sin(mouthPhase * 0.012) * 0.5 + 0.5) * (Math.sin(mouthPhase * 0.008) * 0.3 + 0.7) : 0;
  const mouthHeight = 4 + mouthOpenAmount * 10;
  const visorIntensity = active ? 1 : 0.3;
  const eyeColor = active ? '#ff8800' : '#664400';
  const eyeGlowRadius = active ? 8 : 2;
  const cyanGlow = active ? 1 : 0.2;

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: active
          ? 'drop-shadow(0 0 15px rgba(0,212,255,0.4))'
          : 'drop-shadow(0 0 5px rgba(0,212,255,0.1))',
        transition: 'filter 0.4s ease',
      }}
    >
      <defs>
        {/* Metallic gradients */}
        <linearGradient id="mg-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3a55" />
          <stop offset="40%" stopColor="#1a2540" />
          <stop offset="100%" stopColor="#0d1520" />
        </linearGradient>
        <linearGradient id="mg-mid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a4f6f" />
          <stop offset="50%" stopColor="#263750" />
          <stop offset="100%" stopColor="#1a2a40" />
        </linearGradient>
        <linearGradient id="mg-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8899bb" />
          <stop offset="50%" stopColor="#667799" />
          <stop offset="100%" stopColor="#445577" />
        </linearGradient>
        <linearGradient id="mg-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0d0e0" />
          <stop offset="30%" stopColor="#8899aa" />
          <stop offset="70%" stopColor="#556677" />
          <stop offset="100%" stopColor="#334455" />
        </linearGradient>
        <linearGradient id="mg-visor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cc5500" />
          <stop offset="30%" stopColor="#ff8800" />
          <stop offset="50%" stopColor="#ffaa22" />
          <stop offset="70%" stopColor="#ff8800" />
          <stop offset="100%" stopColor="#cc5500" />
        </linearGradient>
        <linearGradient id="mg-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00eeff" />
          <stop offset="100%" stopColor="#0088aa" />
        </linearGradient>
        <radialGradient id="mg-eye-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
        </radialGradient>

        {/* Filters */}
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <filter id="glow-eye" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={eyeGlowRadius} />
        </filter>
        <filter id="inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite operator="out" in="SourceGraphic" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="normal" />
        </filter>
        <filter id="bevel" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.6" specularExponent="20" result="spec">
            <fePointLight x="100" y="50" z="150" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" />
        </filter>
      </defs>

      {/* ═══ HELMET / CROWN ═══ */}
      {/* Main helmet dome */}
      <path
        d="M100,18 L145,38 L158,65 L155,95 L100,98 L45,95 L42,65 L55,38 Z"
        fill="url(#mg-dark)" stroke="#3a5070" strokeWidth="1" filter="url(#bevel)"
      />
      {/* Center crest */}
      <path
        d="M92,15 L100,5 L108,15 L108,55 L100,58 L92,55 Z"
        fill="url(#mg-mid)" stroke="#4a6080" strokeWidth="0.8"
      />
      {/* Crest tip glow */}
      <rect x="96" y="5" width="8" height="4" rx="1" fill="url(#mg-cyan)" opacity={cyanGlow}>
        {active && <animate attributeName="opacity" values={`${cyanGlow};1;${cyanGlow}`} dur="1.5s" repeatCount="indefinite" />}
      </rect>

      {/* Left horn/antenna */}
      <path
        d="M55,38 L38,22 L32,28 L42,55 Z"
        fill="url(#mg-mid)" stroke="#3a5070" strokeWidth="0.8" filter="url(#bevel)"
      />
      <circle cx="35" cy="25" r="3" fill="url(#mg-cyan)" opacity={cyanGlow}>
        {active && <animate attributeName="opacity" values={`${cyanGlow};1;${cyanGlow}`} dur="2s" repeatCount="indefinite" />}
      </circle>
      {/* Right horn/antenna */}
      <path
        d="M145,38 L162,22 L168,28 L158,55 Z"
        fill="url(#mg-mid)" stroke="#3a5070" strokeWidth="0.8" filter="url(#bevel)"
      />
      <circle cx="165" cy="25" r="3" fill="url(#mg-cyan)" opacity={cyanGlow}>
        {active && <animate attributeName="opacity" values={`${cyanGlow};1;${cyanGlow}`} dur="2s" repeatCount="indefinite" begin="0.5s" />}
      </circle>

      {/* Forehead armor plates */}
      <path
        d="M60,50 L85,42 L88,60 L62,65 Z"
        fill="url(#mg-dark)" stroke="#2a4060" strokeWidth="0.6"
      />
      <path
        d="M140,50 L115,42 L112,60 L138,65 Z"
        fill="url(#mg-dark)" stroke="#2a4060" strokeWidth="0.6"
      />
      {/* Forehead accent lines */}
      <line x1="65" y1="52" x2="82" y2="46" stroke="#00d4ff" strokeWidth="0.8" opacity={cyanGlow * 0.6} />
      <line x1="135" y1="52" x2="118" y2="46" stroke="#00d4ff" strokeWidth="0.8" opacity={cyanGlow * 0.6} />

      {/* ═══ FACE AREA ═══ */}
      {/* Main face plate */}
      <path
        d="M45,95 L155,95 L152,130 L140,155 L120,168 L80,168 L60,155 L48,130 Z"
        fill="url(#mg-dark)" stroke="#3a5070" strokeWidth="1" filter="url(#bevel)"
      />

      {/* ═══ EYE RECESSES ═══ */}
      {/* Left eye socket */}
      <path
        d="M52,88 L90,82 L92,100 L88,108 L50,105 Z"
        fill="#0a1018" stroke="#2a3a55" strokeWidth="0.8"
      />
      {/* Right eye socket */}
      <path
        d="M148,88 L110,82 L108,100 L112,108 L150,105 Z"
        fill="#0a1018" stroke="#2a3a55" strokeWidth="0.8"
      />

      {/* ═══ VISOR / EYES ═══ */}
      {/* Eye glow halos */}
      <ellipse cx="72" cy="96" rx="18" ry="10" fill="url(#mg-eye-glow)" opacity={visorIntensity * 0.5} filter="url(#glow-eye)" />
      <ellipse cx="128" cy="96" rx="18" ry="10" fill="url(#mg-eye-glow)" opacity={visorIntensity * 0.5} filter="url(#glow-eye)" />

      {/* Left eye visor */}
      <path
        d="M55,92 L88,86 L90,98 L86,104 L53,100 Z"
        fill={eyeColor} opacity={visorIntensity} stroke="#ffaa00" strokeWidth="0.5"
      >
        {active && <animate attributeName="opacity" values={`${visorIntensity};${visorIntensity * 0.7};${visorIntensity}`} dur="1.8s" repeatCount="indefinite" />}
      </path>
      {/* Right eye visor */}
      <path
        d="M145,92 L112,86 L110,98 L114,104 L147,100 Z"
        fill={eyeColor} opacity={visorIntensity} stroke="#ffaa00" strokeWidth="0.5"
      >
        {active && <animate attributeName="opacity" values={`${visorIntensity};${visorIntensity * 0.7};${visorIntensity}`} dur="1.8s" repeatCount="indefinite" begin="0.3s" />}
      </path>

      {/* Eye inner bright spots */}
      <ellipse cx="72" cy="95" rx="8" ry="4" fill="#ffcc44" opacity={visorIntensity * 0.6} />
      <ellipse cx="128" cy="95" rx="8" ry="4" fill="#ffcc44" opacity={visorIntensity * 0.6} />

      {/* Center visor bridge */}
      <rect x="90" y="90" width="20" height="8" rx="1" fill="#0a1018" stroke="#2a3a55" strokeWidth="0.5" />
      <line x1="93" y1="94" x2="107" y2="94" stroke="#00d4ff" strokeWidth="0.6" opacity={cyanGlow * 0.5} />

      {/* ═══ NOSE / CENTER ═══ */}
      <path
        d="M96,108 L104,108 L102,128 L98,128 Z"
        fill="url(#mg-light)" stroke="#4a6080" strokeWidth="0.5"
      />

      {/* ═══ CHEEK ARMOR ═══ */}
      {/* Left cheek */}
      <path
        d="M42,98 L52,95 L50,130 L45,135 L35,120 Z"
        fill="url(#mg-mid)" stroke="#3a5070" strokeWidth="0.8" filter="url(#bevel)"
      />
      {/* Right cheek */}
      <path
        d="M158,98 L148,95 L150,130 L155,135 L165,120 Z"
        fill="url(#mg-mid)" stroke="#3a5070" strokeWidth="0.8" filter="url(#bevel)"
      />

      {/* Cheek vents */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <line x1="36" y1={106 + i * 6} x2="48" y2={104 + i * 6} stroke="#00d4ff" strokeWidth="1" opacity={cyanGlow * 0.5} />
          <line x1="164" y1={106 + i * 6} x2="152" y2={104 + i * 6} stroke="#00d4ff" strokeWidth="1" opacity={cyanGlow * 0.5} />
        </g>
      ))}

      {/* ═══ MOUTH / FACEPLATE ═══ */}
      {/* Mouth frame */}
      <path
        d="M70,132 L130,132 L126,150 L74,150 Z"
        fill="#0a1018" stroke="#2a3a55" strokeWidth="0.8"
      />
      {/* Mouth glow bar */}
      <rect
        x="76" y={136} width="48" height={mouthHeight} rx="2"
        fill="url(#mg-visor)"
        opacity={active ? 0.9 : 0.15}
        style={{ transition: 'height 0.08s ease, opacity 0.3s ease' }}
      />
      {/* Mouth grille lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i} x1="78" y1={137 + i * (mouthHeight / 5)} x2="122" y2={137 + i * (mouthHeight / 5)}
          stroke="#00d4ff" strokeWidth="0.6" opacity={active ? 0.5 + mouthOpenAmount * 0.3 : 0.1}
        />
      ))}

      {/* ═══ CHIN ═══ */}
      <path
        d="M74,150 L126,150 L118,168 L108,178 L92,178 L82,168 Z"
        fill="url(#mg-chrome)" stroke="#4a6080" strokeWidth="0.8" filter="url(#bevel)"
      />
      {/* Chin center line */}
      <line x1="100" y1="155" x2="100" y2="175" stroke="#3a5070" strokeWidth="0.8" />
      {/* Chin accent */}
      <path
        d="M92,170 L100,178 L108,170"
        fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity={cyanGlow * 0.4}
      />

      {/* ═══ JAW SIDES ═══ */}
      <path
        d="M48,130 L60,125 L65,155 L55,158 L40,140 Z"
        fill="url(#mg-mid)" stroke="#3a5070" strokeWidth="0.7"
      />
      <path
        d="M152,130 L140,125 L135,155 L145,158 L160,140 Z"
        fill="url(#mg-mid)" stroke="#3a5070" strokeWidth="0.7"
      />

      {/* ═══ NECK ═══ */}
      <path
        d="M75,178 L125,178 L130,200 L70,200 Z"
        fill="url(#mg-dark)" stroke="#2a3a55" strokeWidth="0.8"
      />
      {/* Neck rings */}
      {[0, 1, 2].map(i => (
        <line
          key={i} x1="72" y1={185 + i * 6} x2="128" y2={185 + i * 6}
          stroke="#00d4ff" strokeWidth="0.6" opacity={cyanGlow * 0.3}
        />
      ))}

      {/* ═══ PANEL LINES (detail) ═══ */}
      {/* Helmet panel lines */}
      <line x1="70" y1="35" x2="60" y2="65" stroke="#1a2a40" strokeWidth="0.5" opacity="0.6" />
      <line x1="130" y1="35" x2="140" y2="65" stroke="#1a2a40" strokeWidth="0.5" opacity="0.6" />
      <line x1="80" y1="60" x2="78" y2="82" stroke="#1a2a40" strokeWidth="0.4" opacity="0.5" />
      <line x1="120" y1="60" x2="122" y2="82" stroke="#1a2a40" strokeWidth="0.4" opacity="0.5" />
      {/* Face panel lines */}
      <line x1="65" y1="110" x2="70" y2="132" stroke="#1a2a40" strokeWidth="0.4" opacity="0.4" />
      <line x1="135" y1="110" x2="130" y2="132" stroke="#1a2a40" strokeWidth="0.4" opacity="0.4" />

      {/* ═══ SMALL DETAILS ═══ */}
      {/* Bolts/rivets */}
      {[[55, 45], [145, 45], [40, 110], [160, 110], [65, 160], [135, 160]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#334455" stroke="#4a6080" strokeWidth="0.5" />
      ))}

      {/* Side sensors */}
      <circle cx="38" cy="85" r="4" fill="#0a1018" stroke="#2a3a55" strokeWidth="0.8" />
      <circle cx="38" cy="85" r="2" fill="#00d4ff" opacity={cyanGlow * 0.6}>
        {active && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />}
      </circle>
      <circle cx="162" cy="85" r="4" fill="#0a1018" stroke="#2a3a55" strokeWidth="0.8" />
      <circle cx="162" cy="85" r="2" fill="#00d4ff" opacity={cyanGlow * 0.6}>
        {active && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" begin="0.5s" />}
      </circle>
    </svg>
  );

  // Idle mode: inline
  if (idle) {
    return (
      <div style={{
        opacity: idle && !active ? 0.55 : 1,
        transition: 'opacity 0.5s ease',
        animation: !active ? 'megazordBreathing 3s ease-in-out infinite' : undefined,
      }}>
        <style>{`
          @keyframes megazordBreathing {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 0.65; }
          }
        `}</style>
        {svg}
      </div>
    );
  }

  // Overlay mode
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
      style={{
        animation: active ? 'megazordEnter 0.5s ease-out forwards' : 'megazordExit 0.5s ease-in forwards',
      }}
    >
      <style>{`
        @keyframes megazordEnter { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes megazordExit { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0; } }
      `}</style>
      {svg}
    </div>
  );
}

export default JarvisMegazordHead;
export { JarvisMegazordHead };
