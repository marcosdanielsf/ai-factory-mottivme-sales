/**
 * LinkedIn Prospector API Client
 * Connects frontend to FastAPI backend at /api/*
 */

const API_BASE = import.meta.env.VITE_PROSPECTOR_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface SearchResult {
  urn_id: string;
  name: string;
  jobtitle?: string;
  location?: string;
  distance?: string;
  public_id?: string;
}

export interface AccountInfo {
  id: string;
  name: string;
  linkedin_url?: string;
  status: 'active' | 'inactive' | 'error';
  daily_invites_remaining?: number;
  daily_messages_remaining?: number;
}

export interface CampaignCreate {
  name: string;
  account_id: string;
  search_keywords?: string;
  search_regions?: string[];
  search_network_depths?: string[];
  invite_message?: string;
  follow_up_messages?: string[];
  daily_invite_limit?: number;
}

export interface SendMessagePayload {
  recipient_urn?: string;
  conversation_id?: string;
  text: string;
}

// ═══════════════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════════════

async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════

export const prospectorApi = {
  // ── Accounts ─────────────────────────────────────────────────────
  getAccounts: () => api<AccountInfo[]>('/api/accounts'),

  createAccount: (data: { name: string; li_at: string; jsessionid: string }) =>
    api('/api/accounts', { method: 'POST', body: JSON.stringify(data) }),

  validateAccount: (accountId: string) =>
    api(`/api/accounts/${accountId}/validate`, { method: 'POST' }),

  // ── Campaigns ────────────────────────────────────────────────────
  getCampaigns: () => api('/api/campaigns'),

  createCampaign: (data: CampaignCreate) =>
    api('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),

  getCampaign: (id: string) => api(`/api/campaigns/${id}`),

  pauseCampaign: (id: string) =>
    api(`/api/campaigns/${id}/pause`, { method: 'POST' }),

  resumeCampaign: (id: string) =>
    api(`/api/campaigns/${id}/resume`, { method: 'POST' }),

  // ── Search ───────────────────────────────────────────────────────
  searchPeople: (params: {
    account_id: string;
    keywords: string;
    regions?: string[];
    network_depths?: string[];
    limit?: number;
  }) => api<SearchResult[]>('/api/search', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  // ── Inbox / Messages ─────────────────────────────────────────────
  getConversations: (accountId: string) =>
    api(`/api/inbox/${accountId}/conversations`),

  getMessages: (accountId: string, conversationId: string) =>
    api(`/api/inbox/${accountId}/conversations/${conversationId}/messages`),

  sendMessage: (accountId: string, data: SendMessagePayload) =>
    api(`/api/inbox/${accountId}/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── AI SDR (Version B) ──────────────────────────────────────────
  getAIConfig: () => api('/api/ai/config'),

  updateAIConfig: (config: Record<string, any>) =>
    api('/api/ai/config', { method: 'PUT', body: JSON.stringify(config) }),

  getAIQueue: () => api('/api/ai/queue'),

  approveAIResponse: (id: string) =>
    api(`/api/ai/queue/${id}/approve`, { method: 'POST' }),

  rejectAIResponse: (id: string) =>
    api(`/api/ai/queue/${id}/reject`, { method: 'POST' }),

  // ── Robot / Automation ───────────────────────────────────────────
  getRobotStatus: () => api('/api/robot/status'),

  startRobot: (accountId: string) =>
    api('/api/robot/start', { method: 'POST', body: JSON.stringify({ account_id: accountId }) }),

  stopRobot: () =>
    api('/api/robot/stop', { method: 'POST' }),

  getRobotLogs: () => api('/api/robot/logs'),

  // ── Leads ────────────────────────────────────────────────────────
  getLeads: (params?: { campaign_id?: string; status?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.campaign_id) searchParams.set('campaign_id', params.campaign_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return api(`/api/leads${qs ? `?${qs}` : ''}`);
  },

  // ── Metrics ──────────────────────────────────────────────────────
  getMetrics: (accountId: string) => api(`/api/metrics/${accountId}`),

  getDashboardMetrics: () => api('/api/metrics/dashboard'),

  // ── Campaign details ─────────────────────────────────────────────
  getCampaignLeads: (campaignId: string) => api(`/api/campaigns/${campaignId}/leads`),

  getCampaignStats: (campaignId: string) => api(`/api/campaigns/${campaignId}/stats`),

  // ── Templates ────────────────────────────────────────────────────
  getTemplates: () => api('/api/templates'),

  createTemplate: (data: Record<string, unknown>) =>
    api('/api/templates', { method: 'POST', body: JSON.stringify(data) }),

  updateTemplate: (id: string, data: Record<string, unknown>) =>
    api(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTemplate: (id: string) =>
    api(`/api/templates/${id}`, { method: 'DELETE' }),

  // ── Account management ───────────────────────────────────────────
  deleteAccount: (id: string) =>
    api(`/api/accounts/${id}`, { method: 'DELETE' }),

  updateAccount: (id: string, data: Record<string, unknown>) =>
    api(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ═══════════════════════════════════════════════════════════════════════
// WEBSOCKET (real-time inbox updates)
// ═══════════════════════════════════════════════════════════════════════

export function createInboxWebSocket(
  onMessage: (data: any) => void,
  onError?: (err: Event) => void,
): WebSocket {
  const wsUrl = API_BASE.replace('http', 'ws') + '/ws/inbox';
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      console.warn('Invalid WS message:', event.data);
    }
  };

  ws.onerror = (err) => {
    console.error('Inbox WS error:', err);
    onError?.(err);
  };

  ws.onclose = () => {
    console.log('Inbox WS closed, reconnecting in 5s...');
    setTimeout(() => createInboxWebSocket(onMessage, onError), 5000);
  };

  return ws;
}
