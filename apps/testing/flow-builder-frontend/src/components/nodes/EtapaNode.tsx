'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { EtapaNodeData } from '@/types/flow';

export const EtapaNode = memo(function EtapaNode({ data, selected }: NodeProps) {
  const nodeData = data as EtapaNodeData;

  return (
    <BaseNode type="etapa" label={nodeData.label} selected={selected}>
      {/* Objetivo */}
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-medium">Objetivo:</span> {nodeData.objetivo}
      </p>

      {/* Técnicas */}
      {nodeData.tecnicas && nodeData.tecnicas.length > 0 && (
        <div>
          <span className="text-xs text-gray-500">Técnicas:</span>
          <ul className="mt-1 space-y-0.5">
            {nodeData.tecnicas.map((tecnica, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                <span className="text-green-500">•</span>
                {tecnica}
              </li>
            ))}
          </ul>
        </div>
      )}
    </BaseNode>
  );
});
