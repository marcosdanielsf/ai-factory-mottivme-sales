'use client';

import { useMemo } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from '@/lib/utils';
import { PanelRight, X, Trash2, Copy, Play } from 'lucide-react';
import type { NodeType } from '@/types/flow';

export function PropertiesPanel() {
  const { nodes, selectedNodeId, deleteNode, updateNode } = useFlowStore();
  const { rightPanelOpen, toggleRightPanel, openSimulatorModal } = useUIStore();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  if (!rightPanelOpen) {
    return (
      <button
        onClick={toggleRightPanel}
        className="absolute right-4 top-4 z-10 p-2 bg-white rounded-lg shadow-lg border hover:bg-gray-50"
      >
        <PanelRight size={20} />
      </button>
    );
  }

  return (
    <div className="w-72 bg-white border-l shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          🔧 Propriedades
        </h2>
        <button
          onClick={toggleRightPanel}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <div className="p-4 space-y-4">
            {/* Node Type Header */}
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ backgroundColor: `${NODE_COLORS[selectedNode.type as NodeType]}15` }}
            >
              <span className="text-xl">
                {NODE_ICONS[selectedNode.type as NodeType]}
              </span>
              <div>
                <div
                  className="font-semibold text-sm"
                  style={{ color: NODE_COLORS[selectedNode.type as NodeType] }}
                >
                  {NODE_LABELS[selectedNode.type as NodeType]}
                </div>
                <div className="text-xs text-gray-500">ID: {selectedNode.id.slice(0, 8)}...</div>
              </div>
            </div>

            {/* Basic Properties */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nome / Label
                </label>
                <input
                  type="text"
                  value={(selectedNode.data as any).label || ''}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      data: { ...selectedNode.data, label: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    X
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position.x)}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Y
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position.y)}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
                  />
                </div>
              </div>

              {/* Type-specific properties */}
              {selectedNode.type === 'mode' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <select
                      value={(selectedNode.data as any).status || 'active'}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          data: { ...selectedNode.data, status: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNode.type === 'mensagem' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Conteúdo
                  </label>
                  <textarea
                    value={(selectedNode.data as any).content || ''}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        data: { ...selectedNode.data, content: e.target.value },
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  />
                </div>
              )}

              {selectedNode.type === 'script' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Roteiro
                  </label>
                  <textarea
                    value={(selectedNode.data as any).content || ''}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        data: { ...selectedNode.data, content: e.target.value },
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t space-y-2">
              <button
                onClick={openSimulatorModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition"
              >
                <Play size={16} />
                Simular Conversa
              </button>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
                  <Copy size={14} />
                  Duplicar
                </button>
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">👆</div>
            <p className="text-sm">Selecione um card para ver suas propriedades</p>
          </div>
        )}
      </div>

      {/* IA Reasoning Section */}
      {selectedNode && (
        <div className="p-4 border-t bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
            🧠 IA Reasoning
          </div>
          <p className="text-xs text-gray-400">
            Critérios que a IA usa para tomar decisões neste ponto do fluxo.
          </p>
        </div>
      )}
    </div>
  );
}
