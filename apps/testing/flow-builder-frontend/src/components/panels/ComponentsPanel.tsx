'use client';

import { useCallback } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, generateId } from '@/lib/utils';
import type { NodeType, FlowNode } from '@/types/flow';
import { PanelLeft, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const NODE_TYPES: NodeType[] = ['mode', 'etapa', 'mensagem', 'script', 'decisao', 'simulacao'];

const DEFAULT_NODE_DATA: Record<NodeType, any> = {
  mode: {
    label: 'Novo Mode',
    mode_name: 'novo_mode',
    status: 'active',
    etapas: [],
  },
  etapa: {
    label: 'Nova Etapa',
    objetivo: 'Definir objetivo',
    tecnicas: [],
  },
  mensagem: {
    label: 'Nova Mensagem',
    message_type: 'agent',
    content: 'Escreva sua mensagem aqui...',
  },
  script: {
    label: 'Novo Script',
    script_type: 'audio',
    content: 'Escreva o roteiro aqui...',
    duration: '30s',
  },
  decisao: {
    label: 'Nova Decisão',
    condition: 'lead.score > 80',
    criterio: 'Score BANT',
    outputs: { sim: 'Próximo step', nao: 'Outro step' },
  },
  simulacao: {
    label: 'Nova Simulação',
    lead_name: 'Lead Teste',
    persona: 'Cliente padrão',
    messages: [],
    status: 'idle',
  },
};

export function ComponentsPanel() {
  const { addNode, nodes } = useFlowStore();
  const { leftPanelOpen, toggleLeftPanel } = useUIStore();

  const handleAddNode = useCallback((type: NodeType) => {
    // Calculate position based on existing nodes
    const maxX = nodes.length > 0
      ? Math.max(...nodes.map((n) => n.position.x)) + 350
      : 100;
    const avgY = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length
      : 200;

    const newNode: FlowNode = {
      id: generateId(),
      type,
      position: { x: maxX, y: avgY },
      data: { ...DEFAULT_NODE_DATA[type] },
    };

    addNode(newNode);
  }, [addNode, nodes]);

  if (!leftPanelOpen) {
    return (
      <button
        onClick={toggleLeftPanel}
        className="absolute left-4 top-4 z-10 p-2 bg-white rounded-lg shadow-lg border hover:bg-gray-50"
      >
        <PanelLeft size={20} />
      </button>
    );
  }

  return (
    <div className="w-64 bg-white border-r shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          📦 Componentes
        </h2>
        <button
          onClick={toggleLeftPanel}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Node Types */}
      <div className="p-4 space-y-2 flex-1 overflow-y-auto">
        <p className="text-xs text-gray-500 mb-3">
          Clique para adicionar ao canvas:
        </p>

        {NODE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => handleAddNode(type)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border-2 hover:shadow-md transition-all text-left"
            style={{
              borderColor: `${NODE_COLORS[type]}40`,
              backgroundColor: `${NODE_COLORS[type]}08`,
            }}
          >
            <span className="text-xl">{NODE_ICONS[type]}</span>
            <div>
              <div className="font-medium text-gray-800">
                {NODE_LABELS[type]}
              </div>
              <div className="text-xs text-gray-500">
                {type === 'mode' && 'Personalidade do agente'}
                {type === 'etapa' && 'Fase da conversa'}
                {type === 'mensagem' && 'Mensagem de exemplo'}
                {type === 'script' && 'Roteiro áudio/vídeo'}
                {type === 'decisao' && 'Condição de fluxo'}
                {type === 'simulacao' && 'Teste de conversa'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Arraste os cards no canvas para organizar
        </p>
      </div>
    </div>
  );
}
