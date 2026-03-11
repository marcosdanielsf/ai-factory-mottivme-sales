import React, { useState, useRef, useCallback } from "react";
import {
  Check,
  Send,
  Crown,
  X,
  ZoomIn,
  RotateCcw,
  Loader2,
  Play,
  Palette,
  BookOpen,
  Shirt,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const BRAND_ID = "96ca4177-502e-4a13-a087-37c0156f6e8d";

// ─── Brand Colors ───────────────────────────────────────────────
const BRAND_COLORS = [
  { name: "Marsala", hex: "#7A2E3B", role: "Primary" },
  { name: "Gold", hex: "#C9A96E", role: "Secondary" },
  { name: "Navy Profundo", hex: "#0A1A3A", role: "Dark Accent" },
  { name: "Almost Black", hex: "#050D1A", role: "Background" },
  { name: "Cream", hex: "#F5F0E8", role: "Light" },
];

const BRAND_FONTS = [
  { name: "Cormorant Garamond", role: "Display / Titulos", sample: "MEDPRIME" },
  {
    name: "Inter",
    role: "Body / Texto corrido",
    sample: "Medicina de excelencia.",
  },
];

// ─── Logo Options ───────────────────────────────────────────────
interface LogoOption {
  id: string;
  name: string;
  concept: string;
  imageUrl: string;
  aspect: "wide" | "square" | "tall";
}

const LOGO_OPTIONS: LogoOption[] = [
  {
    id: "v3-01",
    name: "Royal Crest",
    concept: "Escudo marsala com coroa + louros gold",
    imageUrl: "/logo-approval/01-royal-crest.jpg",
    aspect: "wide",
  },
  {
    id: "v3-02",
    name: "Gold Foil Emboss",
    concept: "Hot stamp em couro preto — fotorrealista",
    imageUrl: "/logo-approval/02-gold-foil-emboss.jpg",
    aspect: "wide",
  },
  {
    id: "v3-03",
    name: "Monogram Seal",
    concept: "Medalha 3D com MP cursivo + DNA",
    imageUrl: "/logo-approval/03-monogram-seal.jpg",
    aspect: "square",
  },
  {
    id: "v3-04",
    name: "Architectural Minimal",
    concept: "M em linhas finas gold — ultra sofisticado",
    imageUrl: "/logo-approval/04-architectural-minimal.jpg",
    aspect: "wide",
  },
  {
    id: "v3-05",
    name: "3D Gold Badge",
    concept: "Emblema metalico 3D com caduceu",
    imageUrl: "/logo-approval/05-3d-gold-badge.jpg",
    aspect: "square",
  },
  {
    id: "v3-06",
    name: "Vertical Prestige",
    concept: "Hexagono marsala + dividers + tagline",
    imageUrl: "/logo-approval/06-vertical-prestige.jpg",
    aspect: "tall",
  },
  {
    id: "v3-07",
    name: "Duo-Tone Modern",
    concept: "Hexagono split marsala/dark + wordmark",
    imageUrl: "/logo-approval/07-duo-tone-modern.jpg",
    aspect: "wide",
  },
  {
    id: "v3-08",
    name: "Luxury Stationery",
    concept: "Mockup completo — pasta, cartao, selo, timbrado",
    imageUrl: "/logo-approval/08-luxury-stationery.jpg",
    aspect: "wide",
  },
  {
    id: "v1-01",
    name: "Horizontal Classic",
    concept: "Escudo marsala + wordmark serif elegante",
    imageUrl: "/logo-approval/v1-horizontal.jpg",
    aspect: "wide",
  },
  {
    id: "v1-02",
    name: "Crest Ornamental",
    concept: "Hexagono com caduceu + ornamentos gold",
    imageUrl: "/logo-approval/v1-simbolo.jpg",
    aspect: "square",
  },
  {
    id: "v1-03",
    name: "Gold Tagline",
    concept: "Escudo gold + MEDPRIME + tagline completa",
    imageUrl: "/logo-approval/v1-tagline.jpg",
    aspect: "tall",
  },
  {
    id: "v1-04",
    name: "Light Background",
    concept: "Versao cream para impressos e papelaria",
    imageUrl: "/logo-approval/v1-light.jpg",
    aspect: "wide",
  },
];

// ─── Showcase Items ─────────────────────────────────────────────
interface ShowcaseItem {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  description: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "01",
    title: "Premium T-Shirt",
    imageUrl: "/showcase/01-camiseta-masc.jpg",
    videoUrl: "/showcase/01-camiseta-masc.mp4",
    description: "Camiseta premium preta com logo MEDPRIME bordada",
  },
  {
    id: "02",
    title: "Marsala Hoodie",
    imageUrl: "/showcase/02-hoodie-fem.jpg",
    videoUrl: "/showcase/02-hoodie-fem.mp4",
    description: "Hoodie marsala com logo MEDPRIME gold",
  },
  {
    id: "03",
    title: "Bomber Jacket",
    imageUrl: "/showcase/03-bomber-masc.jpg",
    videoUrl: "/showcase/03-bomber-masc.mp4",
    description: "Bomber jacket premium com patch M gold",
  },
  {
    id: "04",
    title: "Polo Premium",
    imageUrl: "/showcase/04-polo-fem.jpg",
    videoUrl: "/showcase/04-polo-fem.mp4",
    description: "Polo cream com logo bordada + portfolio",
  },
  {
    id: "05",
    title: "Blazer Executivo",
    imageUrl: "/showcase/05-blazer-masc.jpg",
    videoUrl: "/showcase/05-blazer-masc.mp4",
    description: "Blazer charcoal com pin M gold na lapela",
  },
  {
    id: "06",
    title: "Scrubs Premium",
    imageUrl: "/showcase/06-scrubs-premium.jpg",
    videoUrl: "/showcase/06-scrubs-premium.mp4",
    description: "Scrubs marsala com piping gold — duo",
  },
  {
    id: "07",
    title: "Kit Acessorios",
    imageUrl: "/showcase/07-caneca-caderno.jpg",
    description: "Caneca, caderno couro, caneta gold, porta-cracha",
  },
  {
    id: "08",
    title: "Welcome Kit",
    imageUrl: "/showcase/08-welcome-kit.jpg",
    description: "Kit de boas-vindas premium MEDPRIME",
  },
];

// ─── Section Header ─────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  id: string;
}> = ({ icon: Icon, title, subtitle, id }) => (
  <div id={id} className="pt-16 pb-8 scroll-mt-20">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-lg bg-[#7A2E3B]/15 flex items-center justify-center">
        <Icon size={18} className="text-[#C9A96E]" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-white/40 text-sm">{subtitle}</p>
      </div>
    </div>
    <div className="h-px bg-gradient-to-r from-[#7A2E3B]/40 via-[#C9A96E]/20 to-transparent mt-4" />
  </div>
);

// ─── 3D Tilt Card ───────────────────────────────────────────────
const TiltCard: React.FC<{
  logo: LogoOption;
  isSelected: boolean;
  onSelect: () => void;
  onZoom: () => void;
}> = ({ logo, isSelected, onSelect, onZoom }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTilt({
      x: ((y - centerY) / centerY) * -12,
      y: ((x - centerX) / centerX) * 12,
    });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
    setIsHovering(false);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
      onClick={onSelect}
      className="cursor-pointer"
      style={{ perspective: "800px" }}
    >
      <div
        className={`relative rounded-xl overflow-hidden transition-all border-2 ${
          isSelected
            ? "border-[#C9A96E] shadow-[0_0_40px_rgba(201,169,110,0.2)]"
            : "border-white/[0.06] hover:border-white/15"
        }`}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transition: isHovering
            ? "transform 0.1s ease-out"
            : "transform 0.4s ease-out, border-color 0.3s, box-shadow 0.3s",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(201,169,110,${glare.opacity}), transparent 60%)`,
            transition: isHovering ? "none" : "opacity 0.4s",
          }}
        />
        {isSelected && (
          <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-[#C9A96E] flex items-center justify-center shadow-lg">
            <Check size={16} className="text-[#0D0D14]" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoom();
          }}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
          style={{ opacity: isHovering ? 1 : 0 }}
        >
          <ZoomIn size={14} className="text-white/80" />
        </button>
        <div
          className={`relative bg-[#0A0A10] ${logo.aspect === "wide" ? "aspect-[16/9]" : logo.aspect === "tall" ? "aspect-[3/4]" : "aspect-square"}`}
        >
          <img
            src={logo.imageUrl}
            alt={logo.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-2"
            style={{ transform: "translateZ(20px)" }}
          />
        </div>
        <div className="p-4 bg-[#0A0A10]/80">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-[#C9A96E]/20 text-[#C9A96E]" : "bg-white/5 text-white/30"}`}
            >
              {logo.id}
            </span>
            <p
              className={`font-medium text-sm ${isSelected ? "text-[#C9A96E]" : "text-white/80"}`}
            >
              {logo.name}
            </p>
          </div>
          <p className="text-white/35 text-xs mt-1">{logo.concept}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Zoom Modal ─────────────────────────────────────────────────
const ZoomModal: React.FC<{ logo: LogoOption; onClose: () => void }> = ({
  logo,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(5, z - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [zoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <span className="text-white/40 text-xs mr-2">
          Scroll = zoom | Arraste para mover
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetView();
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <RotateCcw size={16} className="text-white/70" />
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-white/70" />
        </button>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
        <span className="text-white/60 text-xs font-mono">
          {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="absolute top-4 left-4 z-50">
        <p className="text-[#C9A96E] font-medium text-sm">{logo.name}</p>
        <p className="text-white/40 text-xs">{logo.concept}</p>
      </div>
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in",
        }}
      >
        <img
          src={logo.imageUrl}
          alt={logo.name}
          className="max-w-[85vw] max-h-[85vh] object-contain select-none"
          draggable={false}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isPanning ? "none" : "transform 0.2s ease-out",
          }}
          onClick={() => {
            if (zoom <= 1) setZoom(2.5);
            else resetView();
          }}
        />
      </div>
    </div>
  );
};

// ─── Product Card (Video-on-Hover) ──────────────────────────────
const ProductCard: React.FC<{ item: ShowcaseItem }> = ({ item }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const showVideo = isHovered && item.videoUrl && videoReady;

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-[#C9A96E]/40 hover:shadow-[0_0_30px_rgba(201,169,110,0.08)] transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-[3/4] relative bg-[#0A0A10] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showVideo ? "opacity-0" : "opacity-100"}`}
        />
        {item.videoUrl && (
          <video
            ref={videoRef}
            src={item.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            onCanPlay={() => setVideoReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showVideo ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {item.videoUrl && !isHovered && (
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={14} className="text-white/80 ml-0.5" />
          </div>
        )}
      </div>
      <div className="p-3 bg-[#0A0A10]/80">
        <p className="text-white/90 font-medium text-sm">{item.title}</p>
        <p className="text-white/35 text-xs mt-0.5 line-clamp-1">
          {item.description}
        </p>
      </div>
    </div>
  );
};

// ─── Navigation ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "logos", label: "Logos", icon: Crown },
  { id: "showcase", label: "Merchandise", icon: Shirt },
  { id: "paleta", label: "Paleta", icon: Palette },
  { id: "manual", label: "Manual", icon: BookOpen },
];

// ═══════════════════════════════════════════════════════════════
// MAIN: Brand Experience Page
// ═══════════════════════════════════════════════════════════════
export const LogoApproval: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [zoomLogo, setZoomLogo] = useState<LogoOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedLogo = LOGO_OPTIONS.find((l) => l.id === selected);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
  };

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { error } = await supabase.from("brand_logo_approvals").insert({
        brand_id: BRAND_ID,
        logo_id: selected,
        logo_name: selectedLogo?.name || selected,
        comment: comment || null,
        metadata: {
          concept: selectedLogo?.concept,
          imageUrl: selectedLogo?.imageUrl,
        },
      });
      if (error) throw new Error(error.message);
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Success Screen ─────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#C9A96E]/20 flex items-center justify-center mx-auto">
            <Check size={32} className="text-[#C9A96E]" />
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Aprovacao Registrada!
          </h2>
          <p className="text-white/50">
            Voce escolheu:{" "}
            <span className="text-[#C9A96E] font-medium">
              {selectedLogo?.name}
            </span>
          </p>
          {selectedLogo && (
            <img
              src={selectedLogo.imageUrl}
              alt={selectedLogo.name}
              className="rounded-xl mx-auto max-h-64 object-contain"
            />
          )}
          {comment && (
            <p className="text-white/30 text-sm italic">
              &ldquo;{comment}&rdquo;
            </p>
          )}
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-[#C9A96E]/60 text-xs font-medium tracking-wider uppercase">
              Proximo passo
            </p>
            <p className="text-white/40 text-sm mt-1">
              Nossa equipe vai aplicar a logo escolhida em todos os materiais da
              marca. Voce sera notificado quando estiver pronto.
            </p>
          </div>
          <p className="text-white/20 text-xs">
            MEDPRIME &mdash; Medicina de excelencia. Carreira de impacto.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main Page ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0D14]">
      {zoomLogo && (
        <ZoomModal logo={zoomLogo} onClose={() => setZoomLogo(null)} />
      )}

      {/* ── Sticky Nav ────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#0D0D14]/95 backdrop-blur-md border-b border-[#7A2E3B]/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7A2E3B]/20 flex items-center justify-center">
              <Crown size={18} className="text-[#C9A96E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">
                <span className="text-[#C9A96E]">MEDPRIME</span>
              </p>
              <p className="text-white/30 text-[11px]">Brand Experience</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/5 rounded-lg transition-colors"
              >
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-[#7A2E3B] via-[#C9A96E] to-[#7A2E3B]" />
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7A2E3B]/10 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-12 text-center relative">
          <p className="text-[#C9A96E]/50 text-[10px] font-medium tracking-[0.3em] uppercase mb-4">
            Identidade Visual Premium
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            MEDPRIME
          </h1>
          <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto">
            Medicina de excelencia. Carreira de impacto.
          </p>
          <p className="text-white/25 text-sm mt-3">
            Dr. Luiz Augusto Jr &amp; Dra. Carolina Simonato
          </p>
          <button
            onClick={() => scrollTo("logos")}
            className="mt-8 mx-auto flex flex-col items-center gap-1 text-[#C9A96E]/40 hover:text-[#C9A96E]/70 transition-colors"
          >
            <span className="text-xs">Explorar</span>
            <ChevronDown size={16} className="animate-bounce" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* ══ SECTION 1: Logo Approval ══════════════════ */}
        <SectionHeader
          id="logos"
          icon={Crown}
          title="Escolha sua Logo"
          subtitle="Selecione a opcao que melhor representa a MEDPRIME. Passe o mouse para efeito 3D, clique na lupa para zoom."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {LOGO_OPTIONS.map((logo) => (
            <TiltCard
              key={logo.id}
              logo={logo}
              isSelected={selected === logo.id}
              onSelect={() => {
                setSelected(logo.id);
                setConfirmed(false);
              }}
              onZoom={() => setZoomLogo(logo)}
            />
          ))}
        </div>

        {/* Selection bar */}
        {selected && (
          <div className="sticky bottom-0 z-20 bg-[#0D0D14]/95 backdrop-blur-md border-t border-[#C9A96E]/20 -mx-4 px-4 py-5">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={selectedLogo?.imageUrl || ""}
                  alt="Selected"
                  className="w-20 h-14 object-contain rounded-lg bg-[#0A0A10] border border-white/10 p-1"
                />
                <div className="flex-1">
                  <p className="text-white/90 font-medium text-sm">
                    {selectedLogo?.name}
                  </p>
                  <p className="text-white/40 text-xs">
                    {selectedLogo?.concept}
                  </p>
                </div>
              </div>
              {submitError && (
                <p className="text-red-400 text-xs mb-2">{submitError}</p>
              )}
              {!confirmed ? (
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-[#C9A96E] text-[#0D0D14] font-semibold text-sm hover:bg-[#D4B87A] transition-colors"
                >
                  Confirmar escolha
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comentario opcional (ex: 'gostei mas queria sem a coroa', 'perfeito!')"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/40 resize-none"
                    rows={2}
                    maxLength={500}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#C9A96E] text-[#0D0D14] font-semibold text-sm hover:bg-[#D4B87A] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar aprovacao
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SECTION 2: Merchandise Showcase ═══════════ */}
        <SectionHeader
          id="showcase"
          icon={Shirt}
          title="Merchandise Premium"
          subtitle="Colecao exclusiva de vestuario e materiais. Passe o mouse para ver em movimento."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {SHOWCASE_ITEMS.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>

        {/* ══ SECTION 3: Paleta de Cores ═══════════════ */}
        <SectionHeader
          id="paleta"
          icon={Palette}
          title="Paleta de Cores"
          subtitle="Cores oficiais da identidade visual MEDPRIME"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {BRAND_COLORS.map((color) => (
            <div
              key={color.hex}
              className="rounded-xl overflow-hidden border border-white/[0.06]"
            >
              <div
                className="h-24 sm:h-32"
                style={{ backgroundColor: color.hex }}
              />
              <div className="p-3 bg-[#0A0A10]/80">
                <p className="text-white/80 font-medium text-sm">
                  {color.name}
                </p>
                <p className="text-white/30 text-xs font-mono">{color.hex}</p>
                <p className="text-[#C9A96E]/40 text-[10px] uppercase tracking-wider mt-1">
                  {color.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fonts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {BRAND_FONTS.map((font) => (
            <div
              key={font.name}
              className="rounded-xl border border-white/[0.06] p-5 bg-[#0A0A10]/40"
            >
              <p className="text-[#C9A96E]/50 text-[10px] uppercase tracking-wider mb-2">
                {font.role}
              </p>
              <p
                className="text-white/80 text-2xl mb-1"
                style={{
                  fontFamily:
                    font.name === "Cormorant Garamond"
                      ? "'Cormorant Garamond', serif"
                      : "'Inter', sans-serif",
                }}
              >
                {font.sample}
              </p>
              <p className="text-white/30 text-xs font-mono">{font.name}</p>
            </div>
          ))}
        </div>

        {/* ══ SECTION 4: Manual da Marca ═══════════════ */}
        <SectionHeader
          id="manual"
          icon={BookOpen}
          title="Manual da Marca"
          subtitle="Documentos oficiais da identidade visual"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {[
            {
              title: "Brand Bible",
              desc: "Guia completo da identidade visual",
              icon: "bible",
            },
            {
              title: "Manual de Uso",
              desc: "Regras de aplicacao do logo",
              icon: "manual",
            },
            {
              title: "Paleta Detalhada",
              desc: "Cores, gradientes e combinacoes",
              icon: "paleta",
            },
            {
              title: "Briefing Criativo",
              desc: "Conceito e diretrizes da marca",
              icon: "briefing",
            },
            {
              title: "Guia de Fontes",
              desc: "Tipografia e hierarquia visual",
              icon: "fontes",
            },
            {
              title: "Guia de Sites",
              desc: "Diretrizes para presenca digital",
              icon: "sites",
            },
          ].map((doc) => (
            <div
              key={doc.icon}
              className="rounded-xl border border-white/[0.06] p-5 bg-[#0A0A10]/40 hover:border-[#C9A96E]/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen size={16} className="text-[#C9A96E]/60" />
                <p className="text-white/80 font-medium text-sm">{doc.title}</p>
              </div>
              <p className="text-white/30 text-xs">{doc.desc}</p>
              <p className="text-[#C9A96E]/40 text-[10px] uppercase tracking-wider mt-3">
                Disponivel apos aprovacao da logo
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#0A0A10]/40">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-[#C9A96E]/40 text-xs font-medium tracking-wider">
              MEDPRIME
            </p>
            <p className="text-white/20 text-[11px]">
              Medicina de excelencia. Carreira de impacto.
            </p>
          </div>
          <p className="text-white/15 text-[10px]">
            Powered by MOTTIVME AI Factory
          </p>
        </div>
      </div>
    </div>
  );
};
