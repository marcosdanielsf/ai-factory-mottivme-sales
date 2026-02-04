// Flow Builder - Types

export type NodeType = 'mode' | 'etapa' | 'mensagem' | 'script' | 'decisao' | 'simulacao';
export type EdgeType = 'default' | 'conditional' | 'fallback';
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';
export type MessageRole = 'agent' | 'lead' | 'system';

// ============================================================================
// NODE DATA
// ============================================================================

export interface ModeNodeData {
  label: string;
  mode_name: string;
  status: 'active' | 'inactive';
  etapas: string[];
  prime_directive?: string;
  stats?: {
    conversations: number;
    conversionRate: number;
  };
}

export interface EtapaNodeData {
  label: string;
  objetivo: string;
  tecnicas: string[];
}

export interface MensagemNodeData {
  label: string;
  message_type: MessageRole;
  content: string;
  criterios_ia?: {
    applied: string[];
    detected: string[];
  };
}

export interface ScriptNodeData {
  label: string;
  script_type: 'audio' | 'video' | 'vsl' | 'story';
  duration?: string;
  content: string;
  audio_url?: string;
}

export interface DecisaoNodeData {
  label: string;
  condition: string;
  criterio: string;
  outputs: {
    sim: string;
    nao: string;
  };
}

export interface SimulacaoNodeData {
  label: string;
  lead_name: string;
  persona: string;
  messages: SimulationMessage[];
  status: SimulationStatus;
}

export type FlowNodeData =
  | ModeNodeData
  | EtapaNodeData
  | MensagemNodeData
  | ScriptNodeData
  | DecisaoNodeData
  | SimulacaoNodeData;

// ============================================================================
// FLOW NODE
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: FlowNodeData;
  width?: number;
  height?: number;
}

// ============================================================================
// FLOW EDGE
// ============================================================================

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: EdgeType;
  label?: string;
  animated?: boolean;
}

// ============================================================================
// FLOW
// ============================================================================

export interface CanvasData {
  zoom: number;
  position: Position;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  canvas_data?: CanvasData;
  nodes: FlowNode[];
  edges: FlowEdge[];
  created_at: string;
  updated_at: string;
}

export interface FlowSummary {
  id: string;
  name: string;
  description?: string;
  node_count: number;
  edge_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SIMULATION
// ============================================================================

export interface Persona {
  name: string;
  description: string;
  characteristics: string[];
  pain_points: string[];
  objections: string[];
}

export interface Reasoning {
  applied_techniques: string[];
  detected_intents: string[];
  decision_factors: string[];
  next_action?: string;
}

export interface SimulationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  reasoning?: Reasoning;
}

export interface Simulation {
  id: string;
  flow_id: string;
  persona: Persona;
  messages: SimulationMessage[];
  current_node_id?: string;
  status: SimulationStatus;
  created_at: string;
}

// ============================================================================
// API
// ============================================================================

export interface FlowCreate {
  name: string;
  description?: string;
  client_id?: string;
}

export interface FlowUpdate {
  name?: string;
  description?: string;
  canvas_data?: CanvasData;
}

export interface NodeCreate {
  type: NodeType;
  position: Position;
  data: FlowNodeData;
}

export interface NodeUpdate {
  type?: NodeType;
  position?: Position;
  data?: FlowNodeData;
}

export interface EdgeCreate {
  source: string;
  target: string;
  type?: EdgeType;
  label?: string;
}

export interface SimulationCreate {
  flow_id: string;
  persona: Persona;
  start_node_id?: string;
}

export interface SimulationStep {
  simulation_id: string;
  lead_message: string;
}
