'use client';

import { memo, ReactNode } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NODE_COLORS, NODE_ICONS } from '@/lib/utils';
import type { NodeType } from '@/types/flow';

interface BaseNodeProps {
  type: NodeType;
  label: string;
  selected?: boolean;
  children: ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
}

export const BaseNode = memo(function BaseNode({
  type,
  label,
  selected,
  children,
  showSourceHandle = true,
  showTargetHandle = true,
}: BaseNodeProps) {
  const color = NODE_COLORS[type];
  const icon = NODE_ICONS[type];

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg border-2 min-w-[280px] max-w-[320px] transition-all',
        selected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={{ borderColor: color }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-md flex items-center gap-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <span className="text-lg">{icon}</span>
        <span
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color }}
        >
          {type.toUpperCase()}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: `${color}30` }} />

      {/* Content */}
      <div className="p-3">
        <h3 className="font-bold text-gray-800 mb-2">{label}</h3>
        {children}
      </div>

      {/* Handles */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-white"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
});
