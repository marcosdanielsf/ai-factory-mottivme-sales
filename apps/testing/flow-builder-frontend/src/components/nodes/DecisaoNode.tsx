'use client';

import { memo } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { DecisaoNodeData } from '@/types/flow';

export const DecisaoNode = memo(function DecisaoNode({ data, selected }: NodeProps) {
  const nodeData = data as DecisaoNodeData;

  return (
    <div className="relative">
      <BaseNode
        type="decisao"
        label={nodeData.label}
        selected={selected}
        showSourceHandle={false}
      >
        {/* Condition */}
        <div className="bg-yellow-50 rounded p-2 text-sm font-mono text-yellow-800 mb-3">
          {nodeData.condition}
        </div>

        {/* Outputs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs font-medium text-green-600">✓ SIM →</span>
            <span className="text-xs text-gray-600">{nodeData.outputs.sim}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs font-medium text-red-500">✗ NÃO →</span>
            <span className="text-xs text-gray-600">{nodeData.outputs.nao}</span>
          </div>
        </div>

        {/* Critério */}
        {nodeData.criterio && (
          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
            🧠 Critério: {nodeData.criterio}
          </div>
        )}
      </BaseNode>

      {/* Custom handles for yes/no */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ top: '45%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
        style={{ top: '65%' }}
      />
    </div>
  );
});
