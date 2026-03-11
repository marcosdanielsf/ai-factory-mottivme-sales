import React, { useState, useRef, useCallback } from "react";
import { Play, Filter } from "lucide-react";

interface ShowcaseItem {
  id: string;
  title: string;
  category: "apparel" | "outfits" | "stationery";
  imageUrl: string;
  videoUrl?: string;
  description: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "01",
    title: "Premium T-Shirt",
    category: "apparel",
    imageUrl: "/showcase/01-camiseta-masc.jpg",
    videoUrl: "/showcase/01-camiseta-masc.mp4",
    description: "Camiseta premium preta com logo MEDPRIME bordada",
  },
  {
    id: "02",
    title: "Marsala Hoodie",
    category: "apparel",
    imageUrl: "/showcase/02-hoodie-fem.jpg",
    videoUrl: "/showcase/02-hoodie-fem.mp4",
    description: "Hoodie marsala com logo MEDPRIME gold",
  },
  {
    id: "03",
    title: "Bomber Jacket",
    category: "outfits",
    imageUrl: "/showcase/03-bomber-masc.jpg",
    videoUrl: "/showcase/03-bomber-masc.mp4",
    description: "Bomber jacket premium com patch M gold",
  },
  {
    id: "04",
    title: "Polo Premium",
    category: "outfits",
    imageUrl: "/showcase/04-polo-fem.jpg",
    videoUrl: "/showcase/04-polo-fem.mp4",
    description: "Polo cream com logo bordada + portfolio",
  },
  {
    id: "05",
    title: "Blazer Executivo",
    category: "outfits",
    imageUrl: "/showcase/05-blazer-masc.jpg",
    videoUrl: "/showcase/05-blazer-masc.mp4",
    description: "Blazer charcoal com pin M gold na lapela",
  },
  {
    id: "06",
    title: "Scrubs Premium",
    category: "apparel",
    imageUrl: "/showcase/06-scrubs-premium.jpg",
    videoUrl: "/showcase/06-scrubs-premium.mp4",
    description: "Scrubs marsala com piping gold — duo",
  },
  {
    id: "07",
    title: "Kit Acessorios",
    category: "stationery",
    imageUrl: "/showcase/07-caneca-caderno.jpg",
    description: "Caneca, caderno couro, caneta gold, porta-cracha",
  },
  {
    id: "08",
    title: "Welcome Kit",
    category: "stationery",
    imageUrl: "/showcase/08-welcome-kit.jpg",
    description: "Kit de boas-vindas premium MEDPRIME",
  },
];

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "apparel", label: "Apparel" },
  { key: "outfits", label: "Outfits" },
  { key: "stationery", label: "Stationery" },
] as const;

// ─── Product Card with Video-on-Hover ───────────────────────────
const ProductCard: React.FC<{ item: ShowcaseItem }> = ({ item }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
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
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-white/[0.06] hover:border-[#C9A96E]/40 hover:shadow-[0_0_30px_rgba(201,169,110,0.08)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image / Video Container */}
      <div className="aspect-[3/4] relative bg-[#0A0A10] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            showVideo ? "opacity-0" : "opacity-100"
          }`}
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              showVideo ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Play indicator */}
        {item.videoUrl && !isHovered && (
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={14} className="text-white/80 ml-0.5" />
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full bg-black/40 backdrop-blur-sm text-[#C9A96E] border border-[#C9A96E]/20">
            {item.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-[#0A0A10]/80">
        <p className="text-white/90 font-medium text-sm">{item.title}</p>
        <p className="text-white/35 text-xs mt-1 line-clamp-1">
          {item.description}
        </p>
      </div>
    </div>
  );
};

// ─── Main Showcase Component ────────────────────────────────────
interface BrandShowcaseProps {
  brandId: string;
  primaryColor?: string;
}

export const BrandShowcase: React.FC<BrandShowcaseProps> = ({
  primaryColor = "#C9A96E",
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered =
    activeFilter === "all"
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <div className="min-h-screen rounded-2xl overflow-hidden bg-[#0D0D14]">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Showcase
          </h2>
        </div>
        <p className="text-white/40 text-sm ml-4 pl-px">
          Colecao exclusiva de merchandise e materiais premium
        </p>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-5">
          <Filter size={14} className="text-white/30" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                activeFilter === cat.key
                  ? "bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30"
                  : "bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="text-white/20 text-xs ml-2">
            {filtered.length} {filtered.length === 1 ? "item" : "itens"}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">Nenhum item nesta categoria</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
        <p className="text-white/20 text-xs">
          Gerado por AI — Nano Banana Pro + Gemini Veo 2.0
        </p>
        <p className="text-white/20 text-xs">Hover para ver animacao</p>
      </div>
    </div>
  );
};
