const API_URL = import.meta.env.VITE_ASSEMBLY_LINE_API_URL || 'https://assembly-line-api-production.up.railway.app';

async function getAuthToken(): Promise<string> {
  const { supabase } = await import('./supabase');
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// --- Projects ---

interface CreateProjectResponse {
  project_id: string;
  status: string;
}

export async function createProjectWithBriefing(
  name: string,
  briefing: Record<string, unknown>,
  startPipeline = true,
): Promise<CreateProjectResponse> {
  return request('/contents/projects', {
    method: 'POST',
    body: JSON.stringify({ name, briefing, start_pipeline: startPipeline }),
  });
}

// --- Pipeline ---

export interface PipelineGeneration {
  id: string;
  agent_name: string;
  agent_number: number;
  phase: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  duration_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;
  error_message: string | null;
}

interface PipelineStatusResponse {
  project: {
    id: string;
    status: string;
    progress: number;
    name: string;
  };
  generations: PipelineGeneration[];
}

export async function getPipelineStatus(projectId: string): Promise<PipelineStatusResponse> {
  return request(`/pipeline/status/${projectId}`);
}

// --- Contents ---

export interface AssemblyLineContent {
  id: string;
  project_id: string;
  type: string;
  title: string | null;
  body: string;
  hook: string | null;
  cta: string | null;
  subject: string | null;
  preview_text: string | null;
  status: string;
  approved_at: string | null;
  published_at: string | null;
  generated_by: string | null;
  generation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ListContentsResponse {
  contents: AssemblyLineContent[];
  total: number;
}

export async function listContentsByProject(
  projectId: string,
  filters?: { type?: string; status?: string },
): Promise<ListContentsResponse> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return request(`/contents/by-project/${projectId}${qs ? `?${qs}` : ''}`);
}

interface UpdateContentResponse {
  content: AssemblyLineContent;
}

export async function updateContent(
  contentId: string,
  updates: { status?: string; title?: string; body?: string; hook?: string; cta?: string },
): Promise<UpdateContentResponse> {
  return request(`/contents/${contentId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
