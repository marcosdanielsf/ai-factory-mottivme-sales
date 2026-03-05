import { memo } from "react";
import { BaseEdge, type EdgeProps } from "@xyflow/react";

/**
 * Orthogonal edge — XMind style.
 *
 * For top-down (orgchart):
 *   source bottom → vertical down to midpoint → horizontal to target x → vertical down to target top
 *
 * For left-right (logic/tree):
 *   source right → horizontal to midpoint → vertical to target y → horizontal to target left
 */
export const OrthoEdge = memo(
  ({ sourceX, sourceY, targetX, targetY, style, markerEnd }: EdgeProps) => {
    // Determine orientation: if source is roughly above target → top-down, else left-right
    const dy = Math.abs(targetY - sourceY);
    const dx = Math.abs(targetX - sourceX);
    const isVertical = dy >= dx;

    let path: string;

    if (isVertical) {
      // Top-down: source bottom center → midY → horizontal → target top center
      const midY = sourceY + (targetY - sourceY) / 2;
      path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
    } else {
      // Left-right: source right → midX → vertical → target left
      const midX = sourceX + (targetX - sourceX) / 2;
      path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    }

    return <BaseEdge path={path} style={style} markerEnd={markerEnd} />;
  },
);

OrthoEdge.displayName = "OrthoEdge";
