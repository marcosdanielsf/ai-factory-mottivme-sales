// Customer Journey Map — domain types
// Generated from Phase 9 schema (09-01-PLAN.md)
// All timestamps are ISO 8601 strings (timestamptz -> string in JS)

export type CjmEventType =
  | "stage_change"
  | "sla_breached"
  | "touchpoint_fired"
  | "journey_completed"
  | "manual_note";

export type CjmSlaStatus = "ok" | "warning" | "breach";

export interface CjmEvent {
  id: string;
  location_id: string;
  contact_id: string;
  pipeline_id: string;
  stage_key: string;
  from_stage: string | null;
  to_stage: string;
  event_type: CjmEventType;
  source_event_id: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export interface CjmStageConfig {
  id: string;
  location_id: string;
  pipeline_id: string;
  pipeline_name: string;
  stage_id: string;
  stage_name: string;
  stage_order: number;
  color: string | null;
  icon: string | null;
  owner_name: string | null;
  tools: string[] | null;
  description: string | null;
  sla_hours: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CjmJourneyState {
  id: string;
  location_id: string;
  contact_id: string;
  pipeline_id: string;
  current_stage: string;
  entered_stage_at: string;
  sla_status: CjmSlaStatus;
  last_event_at: string | null;
  updated_at: string;
}

export interface CjmTouchpoint {
  id: string;
  location_id: string;
  pipeline_id: string;
  stage_id: string;
  name: string;
  description: string | null;
  tool: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface CjmPipelineFlowRow {
  location_id: string;
  pipeline_id: string;
  pipeline_name: string;
  current_stage: string;
  stage_name: string;
  stage_order: number;
  color: string | null;
  owner_name: string | null;
  sla_hours: number | null;
  contact_count: number;
  avg_hours_in_stage: number;
  sla_breach_count: number;
  sla_warning_count: number;
}

export interface CjmSlaStatusRow {
  location_id: string;
  contact_id: string;
  pipeline_id: string;
  pipeline_name: string;
  current_stage: string;
  stage_name: string;
  sla_hours: number | null;
  sla_status: CjmSlaStatus;
  entered_stage_at: string;
  hours_in_stage: number;
  hours_overdue: number;
}

// Convenience type for journey state joined with stage config (Phase 10+)
export interface CjmJourneyStateFull extends CjmJourneyState {
  stage_config: CjmStageConfig | null;
}

// Phase 10 — Visual Journey Map types

export interface CjmBroadcastPayload {
  contact_id: string;
  pipeline_id: string;
  stage_key: string;
  from_stage: string | null;
  to_stage: string;
  occurred_at: string;
  contact_name?: string;
}

export interface CjmClientPosition {
  contact_id: string;
  contact_name: string;
  pipeline_id: string;
  current_stage: string;
  entered_stage_at: string;
  sla_status: CjmSlaStatus;
  hours_in_stage: number;
}

export interface PipelineMapData {
  pipeline_id: string;
  pipeline_name: string;
  stages: Array<CjmPipelineFlowRow & { clients: CjmClientPosition[] }>;
}

export type CjmTab = "map" | "analytics" | "sla" | "editor";
