'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { SimulacaoNodeData } from '@/types/flow';
import { Play } from 'lucide-react';

export const SimulacaoNode = memo(function SimulacaoNode({ data, selected }: NodeProps) {
  const nodeData = data as SimulacaoNodeData;

  const statusLabel = {
    idle: '⏸ Parado',
    running: '▶ Rodando',
    paused: '⏸ Pausado',
    completed: '✓ Concluído',
  }[nodeData.status];

  return (
    <BaseNode type="simulacao" label={nodeData.label} selected={selected}>
      {/* Lead Info */}
      <div className="mb-2">
        <div className="text-sm font-medium text-gray-800">
          Lead: {nodeData.lead_name}
        </div>
        <div className="text-xs text-gray-500">
          Persona: {nodeData.persona}
        </div>
      </div>

      {/* Messages Preview */}
      {nodeData.messages && nodeData.messages.length > 0 && (
        <div className="bg-gray-50 rounded p-2 mb-2 max-h-32 overflow-y-auto">
          {nodeData.messages.slice(-3).map((msg, i) => (
            <div key={i} className="text-xs mb-1">
              <span className={msg.role === 'agent' ? 'text-pink-600' : 'text-gray-600'}>
                {msg.role === 'agent' ? '🤖' : '👤'}
              </span>{' '}
              <span className="text-gray-700 line-clamp-1">{msg.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status & Action */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-gray-500">{statusLabel}</span>
        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-pink-50 text-pink-600 rounded hover:bg-pink-100 transition">
          <Play size={12} />
          Simular
        </button>
      </div>
    </BaseNode>
  );
});
