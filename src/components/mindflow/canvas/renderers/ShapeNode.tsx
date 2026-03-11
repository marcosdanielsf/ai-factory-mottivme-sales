
import { memo } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { ShapeData } from "../../types/elements";

// ── SVG shape renderers ─────────────────────────────────────────────────────────
function RectangleSVG({ fill, stroke, strokeWidth, opacity }: ShapeData) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={100 - strokeWidth}
        height={100 - strokeWidth}
        rx={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    </svg>
  );
}

function CircleSVG({ fill, stroke, strokeWidth, opacity }: ShapeData) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        cx={50}
        cy={50}
        r={50 - strokeWidth / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    </svg>
  );
}

function DiamondSVG({ fill, stroke, strokeWidth, opacity }: ShapeData) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <polygon
        points="50,2 98,50 50,98 2,50"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    </svg>
  );
}

const SHAPE_MAP: Record<string, React.FC<ShapeData>> = {
  rectangle: RectangleSVG,
  circle: CircleSVG,
  diamond: DiamondSVG,
};

// ── ShapeNode ───────────────────────────────────────────────────────────────────
export const ShapeNode = memo(({ data, selected }: NodeProps) => {
  const shapeData = data as unknown as ShapeData;
  const { variant, stroke } = shapeData;

  const ShapeComponent = SHAPE_MAP[variant] ?? RectangleSVG;

  return (
    <>
      <NodeResizer
        color={stroke || "#6EE7F7"}
        isVisible={selected}
        minWidth={40}
        minHeight={40}
      />
      <div
        className="w-full h-full"
        style={{
          filter: selected ? `drop-shadow(0 0 6px ${stroke}60)` : undefined,
        }}
      >
        <ShapeComponent {...shapeData} />
      </div>
    </>
  );
});

ShapeNode.displayName = "ShapeNode";
