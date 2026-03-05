import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { useUIStore } from "../store/uiStore";
import type { FrameData, NodeData } from "../types/elements";

interface PresentationModeProps {
  nodes: Node[];
  edges: { source: string; target: string }[];
}

export function PresentationMode({ nodes, edges }: PresentationModeProps) {
  const presentationMode = useUIStore((s) => s.presentationMode);
  const exitPresentation = useUIStore((s) => s.exitPresentation);
  const { setViewport, getViewport } = useReactFlow();

  const [currentSlide, setCurrentSlide] = useState(0);

  // Build slide list: prefer frames, fallback to root-level nodes
  const slides = useMemo(() => {
    const frames = nodes.filter((n) => n.type === "frame");
    if (frames.length > 0) return frames;

    // Find root-level nodes (nodes that are not targets of any edge)
    const targetIds = new Set(edges.map((e) => e.target));
    const rootNodes = nodes.filter(
      (n) => !targetIds.has(n.id) && n.type !== "comment" && n.type !== "text",
    );
    return rootNodes.length > 0 ? rootNodes : nodes.slice(0, 10);
  }, [nodes, edges]);

  // Navigate to a specific slide with smooth animation
  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length) return;
      setCurrentSlide(index);

      const node = slides[index];
      if (!node) return;

      const width =
        (node.style?.width as number) ?? node.measured?.width ?? 200;
      const height =
        (node.style?.height as number) ?? node.measured?.height ?? 100;

      // Calculate zoom to fit the node with padding
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 1.8; // extra space around the node
      const zoomX = vw / (width * padding);
      const zoomY = vh / (height * padding);
      const zoom = Math.min(zoomX, zoomY, 2.5);

      // Center the node
      const x = vw / 2 - (node.position.x + width / 2) * zoom;
      const y = vh / 2 - (node.position.y + height / 2) * zoom;

      setViewport({ x, y, zoom }, { duration: 600 });
    },
    [slides, setViewport],
  );

  // Go to first slide on enter
  useEffect(() => {
    if (presentationMode && slides.length > 0) {
      setCurrentSlide(0);
      // Small delay to let the overlay mount
      setTimeout(() => goToSlide(0), 100);
    }
  }, [presentationMode, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!presentationMode) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitPresentation();
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        const next = Math.min(currentSlide + 1, slides.length - 1);
        goToSlide(next);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = Math.max(currentSlide - 1, 0);
        goToSlide(prev);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    presentationMode,
    currentSlide,
    slides.length,
    goToSlide,
    exitPresentation,
  ]);

  if (!presentationMode || slides.length === 0) return null;

  const slideNode = slides[currentSlide];
  const slideLabel =
    slideNode?.type === "frame"
      ? (slideNode.data as unknown as FrameData).title
      : slideNode?.type === "mindMapNode"
        ? (slideNode.data as NodeData).label
        : `Slide ${currentSlide + 1}`;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ background: "transparent" }}
    >
      {/* Top gradient overlay for controls visibility */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[rgba(7,7,15,0.7)] to-transparent pointer-events-none" />

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[rgba(7,7,15,0.7)] to-transparent pointer-events-none" />

      {/* Controls bar at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
        {/* Slide indicator */}
        <div className="flex items-center gap-3 bg-[rgba(13,13,28,0.95)] border border-white/[0.08] rounded-2xl px-5 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          {/* Prev */}
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Slide counter */}
          <div className="flex items-center gap-2 min-w-[100px] justify-center">
            <span className="text-sm font-bold text-[#6EE7F7]">
              {currentSlide + 1}
            </span>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-sm text-slate-500">{slides.length}</span>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentSlide
                    ? "w-6 h-2 bg-[#6EE7F7]"
                    : "w-2 h-2 bg-white/10 hover:bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/[0.07]" />

          {/* Slide title */}
          <span className="text-xs text-slate-500 max-w-[150px] truncate">
            {slideLabel}
          </span>

          {/* Divider */}
          <div className="w-px h-5 bg-white/[0.07]" />

          {/* Exit */}
          <button
            onClick={exitPresentation}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Sair (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard hint on first slide */}
      {currentSlide === 0 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex items-center gap-3 text-xs text-slate-600 bg-[rgba(13,13,28,0.8)] border border-white/[0.05] rounded-xl px-4 py-2 backdrop-blur-sm">
            <span>
              <code className="text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded mr-1">
                &larr; &rarr;
              </code>
              navegar
            </span>
            <span>
              <code className="text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded mr-1">
                Esc
              </code>
              sair
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
