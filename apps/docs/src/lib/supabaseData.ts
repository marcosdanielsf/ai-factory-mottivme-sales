import { supabase } from './supabase';

// Types
export interface AgentVersion {
  id: string;
  agent_name: string;
  slug: string;
  version: string;
  status: string;
  is_active: boolean;
  system_prompt: string | null;
  hyperpersonalization: any;
  validation_score: number | null;
  last_test_score: number | null;
  total_test_runs: number;
  framework_approved: boolean;
  test_report_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  id: string;
  agent_version_id: string;
  overall_score: number;
  completeness: number;
  tone: number;
  engagement: number;
  compliance: number;
  conversion: number;
  strengths: string[];
  weaknesses: string[];
  test_duration_ms: number;
  html_report_url: string | null;
  tested_at: string;
}

export interface DashboardStats {
  totalAgents: number;
  averageScore: number;
  testsRun: number;
  passRate: number;
  leadsProcessed: number;
  conversionRate: number;
  activeCampaigns: number;
}

export interface ScoreHistory {
  date: string;
  score: number;
}

// Fetch all agents from agent_versions table
export async function fetchAllAgents(): Promise<AgentVersion[]> {
  const { data, error } = await supabase
    .from('agent_versions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }

  return data || [];
}

// Fetch single agent by ID
export async function fetchAgentById(id: string): Promise<AgentVersion | null> {
  const { data, error } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching agent:', error);
    return null;
  }

  return data;
}

// Fetch dashboard stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: agents, error } = await supabase
    .from('agent_versions')
    .select('id, last_test_score, validation_score, total_test_runs');

  if (error) {
    console.error('Error fetching stats:', error);
    return {
      totalAgents: 0,
      averageScore: 0,
      testsRun: 0,
      passRate: 0,
      leadsProcessed: 0,
      conversionRate: 0,
      activeCampaigns: 0
    };
  }

  const totalAgents = agents?.length || 0;
  const scores = agents
    ?.map(a => a.last_test_score || a.validation_score)
    .filter((s): s is number => s !== null) || [];

  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const testsRun = agents?.reduce((sum, a) => sum + (a.total_test_runs || 0), 0) || 0;
  const passRate = scores.length > 0
    ? Math.round((scores.filter(s => s >= 8).length / scores.length) * 100)
    : 0;

  return {
    totalAgents,
    averageScore,
    testsRun,
    passRate,
    leadsProcessed: 1247, // TODO: fetch from crm_leads
    conversionRate: 23.5, // TODO: calculate from leads
    activeCampaigns: 3    // TODO: fetch from campaigns
  };
}

// Fetch score history for charts
export async function fetchScoreHistory(days: number = 30): Promise<ScoreHistory[]> {
  const { data: testResults, error } = await supabase
    .from('test_results')
    .select('overall_score, tested_at')
    .order('tested_at', { ascending: true })
    .limit(100);

  if (error || !testResults?.length) {
    // Return mock data if no test results
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i) * 7);
      return {
        date: date.toISOString(),
        score: 7 + Math.random() * 2
      };
    });
  }

  // Group by week
  const weeklyScores: Record<string, number[]> = {};
  testResults.forEach(result => {
    const date = new Date(result.tested_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];

    if (!weeklyScores[key]) weeklyScores[key] = [];
    weeklyScores[key].push(result.overall_score);
  });

  return Object.entries(weeklyScores)
    .map(([date, scores]) => ({
      date,
      score: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .slice(-7);
}

// Fetch test results for an agent
export async function fetchTestResultsByAgent(agentId: string): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('agent_version_id', agentId)
    .order('tested_at', { ascending: false });

  if (error) {
    console.error('Error fetching test results:', error);
    return [];
  }

  return data || [];
}

// Fetch all test results
export async function fetchAllTestResults(limit: number = 20): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select(`
      *,
      agent_versions (
        agent_name,
        version
      )
    `)
    .order('tested_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching test results:', error);
    return [];
  }

  return data || [];
}

// Update agent prompt
export async function updateAgentPrompt(
  agentId: string,
  systemPrompt: string,
  config?: any
): Promise<boolean> {
  const updateData: any = {
    system_prompt: systemPrompt,
    updated_at: new Date().toISOString()
  };

  if (config) {
    updateData.hyperpersonalization = config;
  }

  const { error } = await supabase
    .from('agent_versions')
    .update(updateData)
    .eq('id', agentId);

  if (error) {
    console.error('Error updating agent:', error);
    return false;
  }

  return true;
}

// Create new agent version
export async function createAgentVersion(
  baseAgentId: string,
  newVersion: string,
  notes?: string
): Promise<AgentVersion | null> {
  // First fetch the base agent
  const baseAgent = await fetchAgentById(baseAgentId);
  if (!baseAgent) return null;

  const { data, error } = await supabase
    .from('agent_versions')
    .insert({
      agent_name: baseAgent.agent_name,
      slug: baseAgent.slug,
      version: newVersion,
      status: 'draft',
      is_active: false,
      system_prompt: baseAgent.system_prompt,
      hyperpersonalization: baseAgent.hyperpersonalization,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating version:', error);
    return null;
  }

  return data;
}

// Publish agent version (set as active)
export async function publishAgentVersion(agentId: string): Promise<boolean> {
  const agent = await fetchAgentById(agentId);
  if (!agent) return false;

  // Deactivate all other versions of same agent
  await supabase
    .from('agent_versions')
    .update({ is_active: false, status: 'archived' })
    .eq('slug', agent.slug)
    .neq('id', agentId);

  // Activate this version
  const { error } = await supabase
    .from('agent_versions')
    .update({
      is_active: true,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId);

  if (error) {
    console.error('Error publishing agent:', error);
    return false;
  }

  return true;
}
