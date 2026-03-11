'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { ModeNodeData } from '@/types/flow';

export const ModeNode = memo(function ModeNode({ data, selected }: NodeProps) {
  const nodeData = data as ModeNodeData;

  return (
    <BaseNode type="mode" label={nodeData.label} selected={selected}>
      {/* Status */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">Status:</span>
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            nodeData.status === 'active' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              nodeData.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          {nodeData.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Etapas */}
      {nodeData.etapas && nodeData.etapas.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">
            Etapas: {nodeData.etapas.length}
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {nodeData.etapas.map((etapa, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {etapa}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {nodeData.stats && (
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t">
          <span className="flex items-center gap-1">
            ⚡ {nodeData.stats.conversations} conversas
          </span>
          <span>|</span>
          <span>{nodeData.stats.conversionRate}% conversão</span>
        </div>
      )}
    </BaseNode>
  );
});
