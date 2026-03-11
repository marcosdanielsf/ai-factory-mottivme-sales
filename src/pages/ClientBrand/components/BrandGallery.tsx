import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Download,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import {
  useBrandAssets,
  type BrandAssetWithUrl,
} from "../../../hooks/useBrandAssets";

interface BrandGalleryProps {
  brandId: string;
  sections: string[];
  tabLabels: Record<string, string>;
  gridCols?: string;
  primaryColor: string;
}

const IMAGE_FORMATS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "ico",
  "bmp",
  "tiff",
]);

function isImage(format: string | null | undefined): boolean {
  if (!format) return false;
  const clean = format.toLowerCase().replace(/^\./, "").trim();
  return IMAGE_FORMATS.has(clean);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

interface PreviewModalProps {
  asset: BrandAssetWithUrl;
  assets: BrandAssetWithUrl[];
  onClose: () => void;
  onNavigate: (asset: BrandAssetWithUrl) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  asset,
  assets,
  onClose,
  onNavigate,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const currentIndex = assets.findIndex((a) => a.id === asset.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < assets.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(assets[currentIndex - 1]);
  }, [hasPrev, assets, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(assets[currentIndex + 1]);
  }, [hasNext, assets, currentIndex, onNavigate]);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [asset.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, handlePrev, handleNext]);

  const handleDownload = async () => {
    try {
      const response = await fetch(asset.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = asset.name.includes(".") ? "" : `.${asset.format}`;
      a.download = `${asset.name}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(asset.signedUrl, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      {/* Backdrop blur layer */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      {/* Modal container */}
      <div
        className="relative z-10 flex flex-col"
        style={{
          maxWidth: "min(900px, 96vw)",
          maxHeight: "96vh",
          animation: "modal-enter 0.18s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-t-2xl"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            borderTop: "1px solid var(--color-border-default)",
            borderLeft: "1px solid var(--color-border-default)",
            borderRight: "1px solid var(--color-border-default)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-bg-tertiary)",
                color: "var(--color-text-muted)",
              }}
            >
              .{asset.format}
            </span>
            <span
              className="text-sm font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
              title={asset.name}
            >
              {asset.name}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {asset.size_bytes && (
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {formatBytes(asset.size_bytes)}
              </span>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ backgroundColor: "var(--color-accent-primary)" }}
              title="Download"
            >
              <Download size={13} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--color-text-muted)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
              }}
              title="Fechar (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            minHeight: 320,
            maxHeight: "75vh",
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-border-default)",
            borderBottom: "none",
            backgroundImage:
              "linear-gradient(45deg, var(--color-bg-tertiary) 25%, transparent 25%), linear-gradient(-45deg, var(--color-bg-tertiary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-bg-tertiary) 75%), linear-gradient(-45deg, transparent 75%, var(--color-bg-tertiary) 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          {/* Prev button */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-3 z-10 p-2 rounded-full transition-all"
              style={{
                backgroundColor: "rgba(0,0,0,0.55)",
                color: "white",
                opacity: hasPrev ? 1 : 0.3,
              }}
              title="Anterior (←)"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Image */}
          {isImage(asset.format) && !imgError ? (
            <>
              {!imgLoaded && (
                <Loader2
                  size={28}
                  className="animate-spin absolute"
                  style={{ color: "var(--color-text-muted)" }}
                />
              )}
              <img
                key={asset.id}
                src={asset.signedUrl}
                alt={asset.name}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  maxHeight: "74vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                  padding: "24px",
                  opacity: imgLoaded ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
              />
            </>
          ) : (
            <div
              className="flex flex-col items-center gap-3 py-16 px-8"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="text-5xl font-mono font-bold opacity-30">
                .{asset.format}
              </span>
              <span className="text-sm">
                Preview nao disponivel para este formato
              </span>
            </div>
          )}

          {/* Next button */}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-3 z-10 p-2 rounded-full transition-all"
              style={{
                backgroundColor: "rgba(0,0,0,0.55)",
                color: "white",
                opacity: hasNext ? 1 : 0.3,
              }}
              title="Proximo (→)"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Bottom bar — counter + keyboard hint */}
        <div
          className="flex items-center justify-between px-5 py-2.5 rounded-b-2xl"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {currentIndex + 1} / {assets.length}
          </span>
          {asset.description && (
            <span
              className="text-xs truncate mx-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {asset.description}
            </span>
          )}
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← → navegar · ESC fechar
          </span>
        </div>
      </div>

      <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  formats: string[];
  selectedFormat: string;
  search: string;
  total: number;
  filtered: number;
  onFormatChange: (f: string) => void;
  onSearchChange: (s: string) => void;
  primaryColor: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  formats,
  selectedFormat,
  search,
  total,
  filtered,
  onFormatChange,
  onSearchChange,
  primaryColor,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(debounced), 250);
    return () => clearTimeout(timer);
  }, [debounced, onSearchChange]);

  const hasFilter = selectedFormat !== "" || search !== "";

  return (
    <div
      className="flex flex-wrap items-center gap-3 py-3 px-4 rounded-xl"
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[160px]">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Buscar por nome..."
          value={debounced}
          onChange={(e) => setDebounced(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none transition-colors"
          style={{
            backgroundColor: "var(--color-bg-tertiary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-default)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = primaryColor;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-default)";
          }}
        />
        {debounced && (
          <button
            onClick={() => {
              setDebounced("");
              onSearchChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Format pills */}
      {formats.length > 1 && (
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: "var(--color-text-muted)" }} />
          <button
            onClick={() => onFormatChange("")}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
            style={
              selectedFormat === ""
                ? { backgroundColor: primaryColor, color: "white" }
                : {
                    backgroundColor: "var(--color-bg-tertiary)",
                    color: "var(--color-text-secondary)",
                  }
            }
          >
            Todos
          </button>
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => onFormatChange(fmt === selectedFormat ? "" : fmt)}
              className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium uppercase transition-all"
              style={
                selectedFormat === fmt
                  ? { backgroundColor: primaryColor, color: "white" }
                  : {
                      backgroundColor: "var(--color-bg-tertiary)",
                      color: "var(--color-text-muted)",
                    }
              }
            >
              {fmt}
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <span
        className="text-[11px] ml-auto shrink-0"
        style={{
          color: hasFilter
            ? "var(--color-text-secondary)"
            : "var(--color-text-muted)",
        }}
      >
        {hasFilter && filtered !== total ? (
          <>
            <span style={{ color: primaryColor, fontWeight: 600 }}>
              {filtered}
            </span>{" "}
            de {total}
          </>
        ) : (
          <>
            {total} {total === 1 ? "arquivo" : "arquivos"}
          </>
        )}
      </span>
    </div>
  );
};

// ─── BrandGallery ─────────────────────────────────────────────────────────────

export const BrandGallery: React.FC<BrandGalleryProps> = ({
  brandId,
  sections,
  tabLabels,
  gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  primaryColor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState(sections[0]);
  const [preview, setPreview] = useState<BrandAssetWithUrl | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedFormat, setSelectedFormat] = useState("");
  const [search, setSearch] = useState("");

  const { assets, loading } = useBrandAssets(brandId, activeSubTab);

  const handleImageError = useCallback((assetId: string) => {
    setFailedImages((prev) => new Set(prev).add(assetId));
  }, []);

  // Reset filters when changing sub-tab
  const handleSubTabChange = useCallback((sec: string) => {
    setActiveSubTab(sec);
    setSelectedFormat("");
    setSearch("");
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, BrandAssetWithUrl[]> = {};
    for (const a of assets) {
      const key = a.section;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [assets]);

  const sectionAssets = grouped[activeSubTab] ?? assets;

  // Available formats for the current section
  const availableFormats = useMemo(() => {
    const fmts = new Set<string>();
    for (const a of sectionAssets) {
      if (a.format) fmts.add(a.format.toLowerCase().replace(/^\./, ""));
    }
    return Array.from(fmts).sort();
  }, [sectionAssets]);

  // Filtered assets
  const currentAssets = useMemo(() => {
    let list = sectionAssets;
    if (selectedFormat) {
      list = list.filter(
        (a) => a.format?.toLowerCase().replace(/^\./, "") === selectedFormat,
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return list;
  }, [sectionAssets, selectedFormat, search]);

  // Only image assets are previewable
  const previewableAssets = useMemo(
    () => currentAssets.filter((a) => isImage(a.format)),
    [currentAssets],
  );

  const handleOpenPreview = useCallback((asset: BrandAssetWithUrl) => {
    if (isImage(asset.format)) setPreview(asset);
  }, []);

  const handleNavigate = useCallback((asset: BrandAssetWithUrl) => {
    setPreview(asset);
  }, []);

  const showFilters = sectionAssets.length > 4;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      {sections.length > 1 && (
        <div
          className="flex gap-2 pb-2"
          style={{ borderBottom: "1px solid var(--color-border-default)" }}
        >
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => handleSubTabChange(sec)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                activeSubTab === sec
                  ? { backgroundColor: primaryColor, color: "white" }
                  : {
                      color: "var(--color-text-secondary)",
                    }
              }
              onMouseEnter={(e) => {
                if (activeSubTab !== sec) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-bg-tertiary)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeSubTab !== sec) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-secondary)";
                }
              }}
            >
              {tabLabels[sec] || sec}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar — only when there are enough assets */}
      {!loading && showFilters && (
        <FilterBar
          formats={availableFormats}
          selectedFormat={selectedFormat}
          search={search}
          total={sectionAssets.length}
          filtered={currentAssets.length}
          onFormatChange={setSelectedFormat}
          onSearchChange={setSearch}
          primaryColor={primaryColor}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="animate-spin"
            size={24}
            style={{ color: "var(--color-text-muted)" }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && currentAssets.length === 0 && (
        <div
          className="text-center py-16 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {search || selectedFormat
            ? "Nenhum arquivo corresponde aos filtros."
            : "Nenhum arquivo nesta secao."}
        </div>
      )}

      {/* Grid */}
      {!loading && currentAssets.length > 0 && (
        <div className={`grid ${gridCols} gap-4`}>
          {currentAssets.map((asset) => {
            const canPreview =
              isImage(asset.format) && !failedImages.has(asset.id);

            return (
              <div
                key={asset.id}
                className="group relative rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  border: "1px solid var(--color-border-default)",
                  backgroundColor: "var(--color-bg-secondary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    `${primaryColor}55`;
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-1px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    `0 4px 20px ${primaryColor}18`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--color-border-default)";
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                {/* Preview area */}
                <div
                  className="aspect-square flex items-center justify-center p-4 cursor-pointer"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-bg-tertiary) 60%, transparent)",
                  }}
                  onClick={() => handleOpenPreview(asset)}
                >
                  <div>
                    {canPreview && asset.signedUrl ? (
                      <img
                        src={asset.signedUrl}
                        alt={asset.name}
                        className="max-h-full max-w-full object-contain"
                        style={{ maxHeight: 120 }}
                        loading="lazy"
                        onError={() => handleImageError(asset.id)}
                      />
                    ) : (
                      <div
                        className="text-xs uppercase font-mono font-bold"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        .{asset.format}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--color-text-primary)" }}
                    title={asset.name}
                  >
                    {asset.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[10px] font-mono uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {asset.format}
                    </span>
                    {asset.size_bytes && (
                      <>
                        <span style={{ color: "var(--color-border-default)" }}>
                          ·
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatBytes(asset.size_bytes)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {canPreview && (
                    <button
                      onClick={() => handleOpenPreview(asset)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.65)",
                        color: "white",
                      }}
                      title="Visualizar"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <a
                    href={asset.signedUrl}
                    download={asset.name}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.65)",
                      color: "white",
                    }}
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          asset={preview}
          assets={previewableAssets}
          onClose={() => setPreview(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};
