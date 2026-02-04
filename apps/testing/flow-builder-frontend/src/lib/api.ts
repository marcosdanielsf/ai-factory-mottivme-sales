// Flow Builder API Client

const API_BASE = '/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// FLOWS
// ============================================================================

import type {
  Flow,
  FlowSummary,
  FlowCreate,
  FlowUpdate,
  FlowNode,
  NodeCreate,
  NodeUpdate,
  FlowEdge,
  EdgeCreate,
  Simulation,
  SimulationCreate,
  SimulationStep,
} from '@/types/flow';

export const flowsAPI = {
  list: (clientId?: string) =>
    fetchAPI<FlowSummary[]>(
      `/flows${clientId ? `?client_id=${clientId}` : ''}`
    ),

  get: (id: string) =>
    fetchAPI<Flow>(`/flows/${id}`),

  create: (data: FlowCreate) =>
    fetchAPI<Flow>('/flows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: FlowUpdate) =>
    fetchAPI<Flow>(`/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchAPI<void>(`/flows/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// NODES
// ============================================================================

export const nodesAPI = {
  list: (flowId: string) =>
    fetchAPI<FlowNode[]>(`/flows/${flowId}/nodes`),

  create: (flowId: string, data: NodeCreate) =>
    fetchAPI<FlowNode>(`/flows/${flowId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (flowId: string, nodeId: string, data: NodeUpdate) =>
    fetchAPI<FlowNode>(`/flows/${flowId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (flowId: string, nodeId: string) =>
    fetchAPI<void>(`/flows/${flowId}/nodes/${nodeId}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// EDGES
// ============================================================================

export const edgesAPI = {
  list: (flowId: string) =>
    fetchAPI<FlowEdge[]>(`/flows/${flowId}/edges`),

  create: (flowId: string, data: EdgeCreate) =>
    fetchAPI<FlowEdge>(`/flows/${flowId}/edges`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (flowId: string, edgeId: string) =>
    fetchAPI<void>(`/flows/${flowId}/edges/${edgeId}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// SIMULATION
// ============================================================================

export const simulateAPI = {
  create: (data: SimulationCreate) =>
    fetchAPI<Simulation>('/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  step: (data: SimulationStep) =>
    fetchAPI<Simulation>('/simulate/step', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    fetchAPI<Simulation>(`/simulate/${id}`),

  getReasoning: (id: string) =>
    fetchAPI<any[]>(`/simulate/${id}/reasoning`),
};
