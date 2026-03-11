'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '@/components/nodes';
import { useFlowStore } from '@/stores/flowStore';
import { useUIStore } from '@/stores/uiStore';
import { NODE_COLORS } from '@/lib/utils';
import { generateId } from '@/lib/utils';

export function FlowCanvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addEdge: addEdgeToStore,
    updateNodePosition,
    selectNode,
    selectedNodeId,
  } = useFlowStore();

  const { showGrid, showMinimap } = useUIStore();

  // Convert store nodes to React Flow format
  const rfNodes = useMemo(() =>
    nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: node.id === selectedNodeId,
    })),
    [nodes, selectedNodeId]
  );

  // Convert store edges to React Flow format
  const rfEdges = useMemo(() =>
    edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type === 'conditional' ? 'smoothstep' : 'default',
      label: edge.label,
      animated: edge.animated || edge.type === 'default',
      style: {
        stroke: edge.type === 'fallback' ? '#EF4444' : '#64748B',
        strokeWidth: 2,
      },
    })),
    [edges]
  );

  // Handle node position change
  const onNodesChange = useCallback((changes: any) => {
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position) {
        updateNodePosition(change.id, change.position);
      }
    });
  }, [updateNodePosition]);

  // Handle new connection
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      addEdgeToStore({
        id: generateId(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        type: 'default',
        animated: true,
      });
    }
  }, [addEdgeToStore]);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Minimap node color
  const nodeColor = useCallback((node: Node) => {
    return NODE_COLORS[node.type as keyof typeof NODE_COLORS] || '#64748B';
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#E2E8F0"
          />
        )}

        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bg-white !shadow-lg !rounded-lg !border"
        />

        {showMinimap && (
          <MiniMap
            position="bottom-right"
            nodeColor={nodeColor}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="!bg-white !shadow-lg !rounded-lg !border"
          />
        )}

        {/* Toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <div className="bg-white rounded-lg shadow-lg border px-3 py-1.5 text-sm text-gray-600">
            {nodes.length} nodes • {edges.length} edges
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
