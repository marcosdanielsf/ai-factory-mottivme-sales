'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { ScriptNodeData } from '@/types/flow';
import { Play, Copy } from 'lucide-react';

export const ScriptNode = memo(function ScriptNode({ data, selected }: NodeProps) {
  const nodeData = data as ScriptNodeData;

  const typeLabel = {
    audio: '🎵 Áudio',
    video: '🎥 Vídeo',
    vsl: '📺 VSL',
    story: '📱 Story',
  }[nodeData.script_type];

  return (
    <BaseNode type="script" label={nodeData.label} selected={selected}>
      {/* Type & Duration */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{typeLabel}</span>
        {nodeData.duration && (
          <span className="text-xs text-gray-400">⏱ {nodeData.duration}</span>
        )}
      </div>

      {/* Content Preview */}
      <div className="bg-gray-50 rounded p-2 text-sm text-gray-700 line-clamp-3">
        "{nodeData.content}"
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2 pt-2 border-t">
        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition">
          <Play size={12} />
          Preview
        </button>
        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">
          <Copy size={12} />
          Copiar
        </button>
      </div>
    </BaseNode>
  );
});
