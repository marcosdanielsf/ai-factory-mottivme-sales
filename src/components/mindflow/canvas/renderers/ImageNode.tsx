
import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import type { ImageData } from "../../types/elements";

export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
  const imgData = data as unknown as ImageData;
  const { url, alt, objectFit } = imgData;

  return (
    <>
      <NodeResizer
        color="#6EE7F7"
        isVisible={selected}
        minWidth={80}
        minHeight={80}
        keepAspectRatio
        lineStyle={{ borderColor: "#6EE7F7" }}
        handleStyle={{ borderColor: "#6EE7F7", backgroundColor: "#07070f" }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#6EE7F7", border: "none", width: 6, height: 6 }}
      />

      <div
        className="rounded-xl overflow-hidden transition-all duration-150 w-full h-full"
        style={{
          border: `2px solid ${selected ? "#6EE7F7" : "rgba(110,231,247,0.3)"}`,
          backgroundColor: "rgba(110,231,247,0.05)",
          boxShadow: selected
            ? "0 0 0 2px rgba(110,231,247,0.25), 0 8px 32px rgba(110,231,247,0.12)"
            : "0 2px 8px rgba(0,0,0,0.4)",
          minWidth: 80,
          minHeight: 80,
        }}
      >
        {url ? (
          <img
            src={url}
            alt={alt ?? "Image"}
            className="w-full h-full pointer-events-none"
            style={{ objectFit: objectFit ?? "contain" }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
            Sem imagem
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#6EE7F7", border: "none", width: 6, height: 6 }}
      />
    </>
  );
});

ImageNode.displayName = "ImageNode";
