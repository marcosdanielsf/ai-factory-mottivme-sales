import React, { useState, useRef, useCallback } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Send,
  Crown,
  X,
  ZoomIn,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const BRAND_ID = "96ca4177-502e-4a13-a087-37c0156f6e8d";

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

// ─── 3D Tilt Card ────────────────────────────────────────────────
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

    // Tilt: max 15deg
    const tiltX = ((y - centerY) / centerY) * -12;
    const tiltY = ((x - centerX) / centerX) * 12;

    // Glare position
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: tiltX, y: tiltY });
    setGlare({ x: glareX, y: glareY, opacity: 0.15 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
    setIsHovering(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
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
        {/* Glare overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(201,169,110,${glare.opacity}), transparent 60%)`,
            transition: isHovering ? "none" : "opacity 0.4s",
          }}
        />

        {/* Selection badge */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-[#C9A96E] flex items-center justify-center shadow-lg animate-[scaleIn_0.3s_ease-out]">
            <Check size={16} className="text-[#0D0D14]" />
          </div>
        )}

        {/* Zoom button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoom();
          }}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
          style={{ opacity: isHovering ? 1 : 0 }}
        >
          <ZoomIn size={14} className="text-white/80" />
        </button>

        {/* Image */}
        <div
          className={`relative bg-[#0A0A10] ${
            logo.aspect === "wide"
              ? "aspect-[16/9]"
              : logo.aspect === "tall"
                ? "aspect-[3/4]"
                : "aspect-square"
          }`}
        >
          <img
            src={logo.imageUrl}
            alt={logo.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-2"
            style={{
              transform: `translateZ(20px)`,
              transition: "transform 0.3s",
            }}
          />
        </div>

        {/* Info */}
        <div className="p-4 bg-[#0A0A10]/80">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isSelected
                  ? "bg-[#C9A96E]/20 text-[#C9A96E]"
                  : "bg-white/5 text-white/30"
              }`}
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

// ─── Zoom Modal ──────────────────────────────────────────────────
const ZoomModal: React.FC<{
  logo: LogoOption;
  onClose: () => void;
}> = ({ logo, onClose }) => {
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

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controls */}
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
          title="Resetar zoom"
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

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
        <span className="text-white/60 text-xs font-mono">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Logo name */}
      <div className="absolute top-4 left-4 z-50">
        <p className="text-[#C9A96E] font-medium text-sm">{logo.name}</p>
        <p className="text-white/40 text-xs">{logo.concept}</p>
      </div>

      {/* Image */}
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

// ─── Main Component ──────────────────────────────────────────────
export const LogoApproval: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [zoomLogo, setZoomLogo] = useState<LogoOption | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedLogo = LOGO_OPTIONS.find((l) => l.id === selected);

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

      // Notificacao via DB trigger (pg_net → Telegram) — token server-side only
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao enviar";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const chosen = selectedLogo;
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
            <span className="text-[#C9A96E] font-medium">{chosen?.name}</span>
          </p>
          {chosen && (
            <img
              src={chosen.imageUrl}
              alt={chosen.name}
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

  return (
    <div className="min-h-screen bg-[#0D0D14]">
      {/* Zoom Modal */}
      {zoomLogo && (
        <ZoomModal logo={zoomLogo} onClose={() => setZoomLogo(null)} />
      )}

      {/* Header with MEDPRIME branding */}
      <div className="sticky top-0 z-20 bg-[#0D0D14]/95 backdrop-blur-md border-b border-[#7A2E3B]/20">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7A2E3B]/20 flex items-center justify-center">
                <Crown size={20} className="text-[#C9A96E]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  <span className="text-[#C9A96E]">MEDPRIME</span> — Aprovacao
                  de Logo
                </h1>
                <p className="text-white/40 text-sm">
                  Dr. Luiz Augusto Jr &amp; Dra. Carolina Simonato
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[#C9A96E]/40 text-[10px] font-medium tracking-[0.2em] uppercase">
                Medicina de excelencia
              </p>
              <p className="text-[#7A2E3B]/60 text-[10px] font-medium tracking-[0.2em] uppercase">
                Carreira de impacto
              </p>
            </div>
          </div>
        </div>
        {/* Marsala accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-[#7A2E3B] via-[#C9A96E] to-[#7A2E3B]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Instructions */}
        <div className="mb-8 p-4 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/10">
          <p className="text-white/60 text-sm">
            <span className="text-[#C9A96E] font-medium">Como funciona:</span>{" "}
            Passe o mouse sobre cada logo para ver o efeito 3D. Clique na lupa
            para ampliar com zoom. Clique no card para selecionar. Confirme sua
            escolha no botao abaixo.
          </p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-2 text-white/40 text-sm mb-6 hover:text-white/60 transition-colors"
        >
          {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showAll ? "Recolher" : "Expandir"} todas as opcoes (
          {LOGO_OPTIONS.length})
        </button>

        {/* 3D Grid */}
        {showAll && (
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
        )}

        {/* Selected preview + confirm */}
        {selected && (
          <div className="sticky bottom-0 bg-[#0D0D14]/95 backdrop-blur-md border-t border-white/[0.06] -mx-4 px-4 py-5">
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
      </div>
    </div>
  );
};
