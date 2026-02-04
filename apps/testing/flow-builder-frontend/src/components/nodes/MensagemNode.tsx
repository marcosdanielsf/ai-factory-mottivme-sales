'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { MensagemNodeData } from '@/types/flow';

export const MensagemNode = memo(function MensagemNode({ data, selected }: NodeProps) {
  const nodeData = data as MensagemNodeData;

  const roleLabel = {
    agent: '🤖 Agent Response',
    lead: '👤 Lead Message',
    system: '⚙️ System',
  }[nodeData.message_type];

  return (
    <BaseNode type="mensagem" label={nodeData.label} selected={selected}>
      {/* Type */}
      <div className="text-xs text-gray-500 mb-2">{roleLabel}</div>

      {/* Content */}
      <div className="bg-gray-50 rounded p-2 text-sm text-gray-700 border-l-2 border-purple-400">
        "{nodeData.content}"
      </div>

      {/* Critérios IA */}
      {nodeData.criterios_ia && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            🧠 Critérios IA:
          </div>
          {nodeData.criterios_ia.applied && (
            <div className="flex flex-wrap gap-1 mt-1">
              {nodeData.criterios_ia.applied.map((c, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
});
