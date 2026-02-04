// @ai-factory/types - Shared TypeScript Types

// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Common entity types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Agent types
export interface Agent extends BaseEntity {
  name: string;
  description?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  is_active: boolean;
}

// Lead types
export interface Lead extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  score?: number;
  metadata?: Json;
}

// Conversation types
export interface Conversation extends BaseEntity {
  lead_id: string;
  agent_id: string;
  channel: "whatsapp" | "instagram" | "email" | "phone";
  status: "active" | "paused" | "closed";
  messages_count: number;
}

// Message types
export interface Message extends BaseEntity {
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Json;
}
