import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  X,
  FileText,
} from "lucide-react";
import {
  useBrandAssets,
  type BrandAssetWithUrl,
} from "../../../hooks/useBrandAssets";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BrandBookViewerProps {
  brandId: string;
}

interface ChapterState {
  asset: BrandAssetWithUrl;
  content: string | null;
  loading: boolean;
  error: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatChapterTitle(name: string): string {
  return name
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[-_]/g, " ") // dashes/underscores → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// Chapter icon by filename keyword
function chapterIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (lower.includes("manual")) return "📖";
  if (lower.includes("paleta") || lower.includes("cor")) return "🎨";
  if (lower.includes("bible") || lower.includes("biblia")) return "📜";
  if (lower.includes("designer") || lower.includes("briefing")) return "✏️";
  if (lower.includes("fonte")) return "🔤";
  if (lower.includes("site") || lower.includes("web")) return "🌐";
  return "📄";
}

// ─── Component ────────────────────────────────────────────────────────────────

export const BrandBookViewer: React.FC<BrandBookViewerProps> = ({
  brandId,
}) => {
  const { assets, loading: assetsLoading } = useBrandAssets(brandId, "manual");

  const [activeIndex, setActiveIndex] = useState(0);
  const [chapters, setChapters] = useState<Map<string, ChapterState>>(
    new Map(),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Use ref to read latest chapters state inside loadChapter without
  // making it a dependency (avoids re-creating the callback on every render)
  const chaptersRef = useRef<Map<string, ChapterState>>(new Map());
  const abortRefs = useRef<Map<string, AbortController>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  // Filter only HTML assets (those are the chapters)
  const htmlAssets = assets.filter(
    (a) => a.format === "html" || a.name.endsWith(".html"),
  );
  const activeAsset = htmlAssets[activeIndex] ?? null;

  // Load chapter HTML content — stable reference (no chapters in deps)
  const loadChapter = useCallback((asset: BrandAssetWithUrl) => {
    const id = asset.id;

    // Already loaded or loading — read from ref (latest state, no stale closure)
    const existing = chaptersRef.current.get(id);
    if (existing && (existing.content !== null || existing.loading)) return;

    // Abort any existing request for this chapter
    abortRefs.current.get(id)?.abort();
    const controller = new AbortController();
    abortRefs.current.set(id, controller);

    setChapters((prev) => {
      const next = new Map(prev);
      next.set(id, { asset, content: null, loading: true, error: false });
      return next;
    });

    fetch(asset.signedUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setChapters((prev) => {
          const next = new Map(prev);
          next.set(id, { asset, content: text, loading: false, error: false });
          return next;
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setChapters((prev) => {
          const next = new Map(prev);
          next.set(id, { asset, content: null, loading: false, error: true });
          return next;
        });
      });
  }, []); // stable — reads state via chaptersRef

  // Load active chapter when it changes
  useEffect(() => {
    if (activeAsset) {
      loadChapter(activeAsset);
    }
  }, [activeAsset?.id, loadChapter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload next chapter in background
  useEffect(() => {
    const next = htmlAssets[activeIndex + 1];
    if (next) loadChapter(next);
  }, [activeIndex, htmlAssets.length, loadChapter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup all aborts on unmount
  useEffect(() => {
    const refs = abortRefs.current;
    return () => {
      refs.forEach((ctrl) => ctrl.abort());
    };
  }, []);

  // Download current chapter
  const handleDownload = useCallback(() => {
    if (!activeAsset) return;
    const chapter = chapters.get(activeAsset.id);
    const content = chapter?.content;

    if (content) {
      const blob = new Blob([content], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeAsset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } else {
      // Fallback: download via direct URL
      window.open(activeAsset.signedUrl, "_blank");
    }
  }, [activeAsset, chapters]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleSelectChapter = useCallback((index: number) => {
    setActiveIndex(index);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // ─── Loading state ───────────────────────────────────────────────────────

  if (assetsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          className="animate-spin"
          size={24}
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>
    );
  }

  if (htmlAssets.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-3"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <BookOpen size={44} className="opacity-40" />
        <p className="text-sm">Nenhum capitulo do manual disponivel.</p>
        <p className="text-xs opacity-60">
          Adicione HTMLs na secao &quot;manual&quot; dos brand assets.
        </p>
      </div>
    );
  }

  const activeChapter = activeAsset ? chapters.get(activeAsset.id) : undefined;

  // ─── Render ──────────────────────────────────────────────────────────────

  const sidebar = (
    <aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: sidebarOpen ? "240px" : "0px",
        minWidth: sidebarOpen ? "240px" : "0px",
        borderRight: `1px solid var(--color-border-default)`,
        background: "var(--color-bg-secondary)",
        transition: "width 200ms ease, min-width 200ms ease",
      }}
    >
      <div
        className="p-3 shrink-0"
        style={{ borderBottom: `1px solid var(--color-border-default)` }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Capitulos
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {htmlAssets.map((asset, index) => {
          const isActive = index === activeIndex;
          const chapter = chapters.get(asset.id);
          const title = formatChapterTitle(asset.name);

          return (
            <button
              key={asset.id}
              onClick={() => handleSelectChapter(index)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background: isActive
                  ? "var(--color-accent-primary)"
                  : "transparent",
                color: isActive ? "#fff" : "var(--color-text-primary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--color-bg-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }
              }}
            >
              <span className="text-base leading-none shrink-0">
                {chapterIcon(asset.name)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-medium truncate">
                  {title}
                </span>
                {asset.size_bytes && (
                  <span
                    className="block text-[10px] mt-0.5"
                    style={{
                      color: isActive
                        ? "rgba(255,255,255,0.7)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {formatFileSize(asset.size_bytes)}
                  </span>
                )}
              </span>
              {chapter?.loading && (
                <Loader2
                  size={12}
                  className="animate-spin shrink-0 opacity-60"
                />
              )}
              {isActive && !chapter?.loading && (
                <ChevronRight size={12} className="shrink-0 opacity-70" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: total */}
      <div
        className="px-3 py-2 shrink-0 text-[10px]"
        style={{
          borderTop: `1px solid var(--color-border-default)`,
          color: "var(--color-text-secondary)",
        }}
      >
        {htmlAssets.length} {htmlAssets.length === 1 ? "capitulo" : "capitulos"}
      </div>
    </aside>
  );

  const toolbar = (
    <div
      className="flex items-center justify-between px-4 py-2.5 shrink-0"
      style={{
        borderBottom: `1px solid var(--color-border-default)`,
        background: "var(--color-bg-secondary)",
      }}
    >
      <div className="flex items-center gap-2">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-accent-primary)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-bg-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-secondary)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <FileText size={16} />
        </button>

        {activeAsset && (
          <span
            className="text-sm font-semibold truncate max-w-[240px]"
            style={{ color: "var(--color-text-primary)" }}
          >
            {formatChapterTitle(activeAsset.name)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={!activeAsset}
          title="Baixar HTML"
          className="p-1.5 rounded-md transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-accent-primary)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-bg-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-secondary)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <Download size={16} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleToggleFullscreen}
          title={isFullscreen ? "Sair do fullscreen" : "Tela cheia"}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-accent-primary)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-bg-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-secondary)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );

  const viewer = (
    <div
      className="flex-1 relative overflow-hidden"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Loading overlay */}
      {activeChapter?.loading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "var(--color-bg-primary)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="animate-spin"
              size={28}
              style={{ color: "var(--color-accent-primary)" }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Carregando capitulo...
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {activeChapter?.error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: "var(--color-bg-primary)" }}
        >
          <BookOpen
            size={40}
            className="opacity-30"
            style={{ color: "var(--color-text-secondary)" }}
          />
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Nao foi possivel carregar este capitulo.
          </p>
          {activeAsset && (
            <a
              href={activeAsset.signedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: "var(--color-accent-primary)",
                color: "#fff",
              }}
            >
              Abrir diretamente
            </a>
          )}
        </div>
      )}

      {/* iframes: one per chapter, hidden when not active (preserves scroll) */}
      {htmlAssets.map((asset, index) => {
        const chapter = chapters.get(asset.id);
        const isVisible = index === activeIndex;
        const hasContent = !!chapter?.content;

        if (!hasContent) return null;

        return (
          <iframe
            key={asset.id}
            srcDoc={chapter.content ?? undefined}
            title={formatChapterTitle(asset.name)}
            sandbox="allow-popups allow-same-origin"
            className="absolute inset-0 w-full h-full border-0"
            style={{
              opacity: isVisible && !chapter.loading ? 1 : 0,
              pointerEvents: isVisible ? "auto" : "none",
              transition: "opacity 150ms ease",
            }}
          />
        );
      })}
    </div>
  );

  // ─── Fullscreen layout ───────────────────────────────────────────────────

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "var(--color-bg-primary)" }}
      >
        {toolbar}
        <div className="flex flex-1 overflow-hidden">
          {sidebar}
          {viewer}
        </div>
      </div>
    );
  }

  // ─── Normal layout ───────────────────────────────────────────────────────

  return (
    <div
      className="rounded-xl overflow-hidden border flex flex-col"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-secondary)",
        height: "80vh",
        minHeight: "480px",
      }}
    >
      {toolbar}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        {viewer}
      </div>
    </div>
  );
};
