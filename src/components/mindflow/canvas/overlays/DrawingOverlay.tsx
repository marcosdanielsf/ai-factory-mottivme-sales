
import { useRef, useCallback, useEffect, useState } from "react";
import { useSelectionStore } from "../../store/selectionStore";
import { useCanvasStore } from "../../store/canvasStore";
import type { DrawingData } from "../../types/elements";

// ── Ramer-Douglas-Peucker simplification ─────────────────────────────────────
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number],
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0)
    return Math.sqrt(
      (point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2,
    );
  const u =
    ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) /
    (mag * mag);
  const ix = lineStart[0] + u * dx;
  const iy = lineStart[1] + u * dy;
  return Math.sqrt((point[0] - ix) ** 2 + (point[1] - iy) ** 2);
}

function simplify(
  points: [number, number][],
  epsilon: number,
): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1],
    );
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, maxIdx + 1), epsilon);
    const right = simplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

function pointsToSvgPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  if (points.length === 1)
    return `M ${points[0][0]} ${points[0][1]} L ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d;
}

// ── Quick color picker ───────────────────────────────────────────────────────
const DRAW_COLORS = [
  { color: "#6EE7F7", label: "Cyan" },
  { color: "#A78BFA", label: "Purple" },
  { color: "#F472B6", label: "Pink" },
  { color: "#FBBF24", label: "Yellow" },
];

const STROKE_WIDTHS = [2, 4, 6];

export function DrawingOverlay() {
  const activeTool = useSelectionStore((s) => s.activeTool);
  const isDrawing = activeTool === "draw";

  const svgRef = useRef<SVGSVGElement>(null);
  const isDrawingRef = useRef(false);
  const currentPoints = useRef<[number, number][]>([]);

  const [drawColor, setDrawColor] = useState("#6EE7F7");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [currentPath, setCurrentPath] = useState<string>("");

  const elements = useCanvasStore((s) => s.elements);
  const addElement = useCanvasStore((s) => s.addElement);
  const viewport = useCanvasStore((s) => s.viewport);

  // Get all drawing elements
  const drawings = elements.filter((el) => el.type === "drawing");

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current;
      if (!svg) return [clientX, clientY];
      const rect = svg.getBoundingClientRect();
      // Convert to canvas coordinates accounting for viewport transform
      const x = (clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (clientY - rect.top - viewport.y) / viewport.zoom;
      return [x, y];
    },
    [viewport],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDrawingRef.current = true;
      const pt = screenToCanvas(e.clientX, e.clientY);
      currentPoints.current = [pt];
      setCurrentPath(pointsToSvgPath([pt]));
    },
    [isDrawing, screenToCanvas],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pt = screenToCanvas(e.clientX, e.clientY);
      currentPoints.current.push(pt);
      // Update preview every 3 points for performance
      if (currentPoints.current.length % 3 === 0 || true) {
        setCurrentPath(pointsToSvgPath(currentPoints.current));
      }
    },
    [screenToCanvas],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const points = currentPoints.current;
    if (points.length < 2) {
      setCurrentPath("");
      return;
    }

    // Simplify path
    const simplified = simplify(points, 2);
    const pathStr = pointsToSvgPath(simplified);

    // Calculate bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [px, py] of simplified) {
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }

    // Save as canvas element
    addElement({
      type: "drawing",
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10),
      data: {
        paths: [pathStr],
        color: drawColor,
        strokeWidth,
        opacity: 1,
      } as DrawingData,
    });

    currentPoints.current = [];
    setCurrentPath("");
  }, [addElement, drawColor, strokeWidth]);

  // pointer-events logic
  const pointerEvents = isDrawing ? "auto" : "none";

  return (
    <>
      {/* SVG overlay for drawing */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full z-[50]"
        style={{ pointerEvents }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* Saved drawings */}
          {drawings.map((el) => {
            const dd = el.data as DrawingData;
            return dd.paths.map((p, i) => (
              <path
                key={`${el.id}-${i}`}
                d={p}
                fill="none"
                stroke={dd.color}
                strokeWidth={dd.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={dd.opacity}
              />
            ));
          })}

          {/* Current stroke being drawn */}
          {currentPath && (
            <path
              d={currentPath}
              fill="none"
              stroke={drawColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}
        </g>
      </svg>

      {/* Draw toolbar (color picker + stroke width) — shown when draw tool active */}
      {isDrawing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 bg-[#0d0d1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Colors */}
          {DRAW_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => setDrawColor(c.color)}
              title={c.label}
              className="w-6 h-6 rounded-full cursor-pointer transition-all"
              style={{
                background: c.color,
                border:
                  drawColor === c.color
                    ? "2px solid #fff"
                    : "2px solid transparent",
                boxShadow:
                  drawColor === c.color ? `0 0 8px ${c.color}` : "none",
              }}
            />
          ))}

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Stroke widths */}
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw}
              onClick={() => setStrokeWidth(sw)}
              title={`${sw}px`}
              className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all"
              style={{
                background:
                  strokeWidth === sw ? "rgba(110,231,247,0.15)" : "transparent",
                border:
                  strokeWidth === sw
                    ? "1px solid rgba(110,231,247,0.3)"
                    : "1px solid transparent",
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: sw + 2,
                  height: sw + 2,
                  background: drawColor,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
