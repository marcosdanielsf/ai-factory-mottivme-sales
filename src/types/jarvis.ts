// Tipos base das tabelas Supabase JARVIS

export interface JarvisConversation {
  id: string;
  user_id: string;
  title: string | null;
  project_slug: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface JarvisDbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tokens_used: number;
  cost: number;
  model: string | null;
  intent: string | null;
  project_slug: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface JarvisMemoryItem {
  id: string;
  user_id: string;
  type: 'task' | 'preference' | 'decision' | 'update' | 'fact';
  content: string;
  project_slug: string | null;
  importance: number;
  source: string;
  created_at: string;
  expires_at: string | null;
}

export interface JarvisProject {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'coding' | 'business' | 'content' | 'financial' | 'personal' | 'general';
  path: string | null;
  keywords: string[];
  permissions: { read: boolean; write: boolean; execute: boolean };
  claude_md: string | null;
  model_override: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JarvisBrainConfig {
  id: string;
  user_id: string;
  keyword_confidence: number;
  semantic_confidence: number;
  max_docs_context: number;
  max_conversations_context: number;
  max_memories_context: number;
  default_model: string;
  rate_limit_per_minute: number;
  max_response_length: number;
  confirm_destructive: boolean;
  created_at: string;
  updated_at: string;
}

export interface JarvisStats {
  user_id: string;
  total_conversations: number;
  total_messages: number;
  total_cost: number;
  total_tokens: number;
  total_memories: number;
  active_projects: number;
  memories_tasks: number;
  memories_preferences: number;
  memories_decisions: number;
  memories_updates: number;
  memories_facts: number;
  last_conversation_at: string | null;
  cost_last_30_days: number;
}

// Tipos do Brain Router
export type JarvisIntent = 'query' | 'create' | 'execute' | 'tools';

export interface BrainRouterResult {
  project: JarvisProject | null;
  intent: JarvisIntent;
  confidence: number;
  context: string;
  memories: JarvisMemoryItem[];
}
