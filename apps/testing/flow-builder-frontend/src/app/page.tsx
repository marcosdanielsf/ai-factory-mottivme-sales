'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { ComponentsPanel } from '@/components/panels/ComponentsPanel';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { useFlowStore } from '@/stores/flowStore';
import { Save, Download, Play, Undo, Redo } from 'lucide-react';

// Dados de exemplo para demonstração
const DEMO_FLOW = {
  id: 'demo-flow',
  name: 'SDR Inbound Flow',
  description: 'Flow de exemplo',
  nodes: [
    {
      id: 'node-1',
      type: 'mode' as const,
      position: { x: 100, y: 150 },
      data: {
        label: 'SDR Inbound',
        mode_name: 'sdr_inbound',
        status: 'active',
        etapas: ['Ativação', 'Qualificação', 'Pitch', 'Transição'],
        stats: { conversations: 234, conversionRate: 67 },
      },
    },
    {
      id: 'node-2',
      type: 'mode' as const,
      position: { x: 500, y: 100 },
      data: {
        label: 'Scheduler',
        mode_name: 'scheduler',
        status: 'active',
        etapas: ['Contexto', 'Oferta', 'Confirmação'],
      },
    },
    {
      id: 'node-3',
      type: 'mode' as const,
      position: { x: 500, y: 300 },
      data: {
        label: 'Objection Handler',
        mode_name: 'objection_handler',
        status: 'active',
        etapas: ['Validar', 'Explorar', 'Resolver'],
      },
    },
    {
      id: 'node-4',
      type: 'mode' as const,
      position: { x: 900, y: 150 },
      data: {
        label: 'Concierge',
        mode_name: 'concierge',
        status: 'active',
        etapas: ['Acolhimento', 'Dúvidas', 'Fechamento'],
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'node-1', target: 'node-2', type: 'default' as const, animated: true },
    { id: 'e1-3', source: 'node-1', target: 'node-3', type: 'conditional' as const, label: 'objeção?' },
    { id: 'e2-4', source: 'node-2', target: 'node-4', type: 'default' as const, animated: true },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function FlowBuilderPage() {
  const { setFlow, currentFlow, undo, redo, isSaving } = useFlowStore();

  // Carrega flow de demonstração
  useEffect(() => {
    setFlow(DEMO_FLOW);
  }, [setFlow]);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🎨 Flow Builder
            </h1>
            {currentFlow && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 font-medium">{currentFlow.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={undo}
                className="px-3 py-2 hover:bg-gray-100 transition"
                title="Desfazer (Ctrl+Z)"
              >
                <Undo size={18} className="text-gray-600" />
              </button>
              <button
                onClick={redo}
                className="px-3 py-2 hover:bg-gray-100 transition border-l"
                title="Refazer (Ctrl+Y)"
              >
                <Redo size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Actions */}
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
              <Save size={18} />
              <span className="text-sm">{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
              <Download size={18} />
              <span className="text-sm">Exportar</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
              <Play size={18} />
              <span className="text-sm">Simular</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Components */}
          <ComponentsPanel />

          {/* Canvas */}
          <div className="flex-1 relative">
            <FlowCanvas />
          </div>

          {/* Right Panel - Properties */}
          <PropertiesPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
