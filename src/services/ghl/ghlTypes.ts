export interface GHLContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  dateAdded: string;
  attributionSource?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
  };
}

export interface GHLContactsResponse {
  contacts: GHLContact[];
  meta?: {
    total?: number;
    startAfterId?: string;
    startAfter?: number;
    nextPageUrl?: string;
  };
}

export interface GHLEvent {
  id: string;
  title: string;
  appointmentStatus:
    | "new"
    | "confirmed"
    | "cancelled"
    | "showed"
    | "noshow"
    | "invalid";
  startTime: string;
  endTime: string;
  contactId: string;
  calendarId: string;
}

export interface GHLEventsResponse {
  events: GHLEvent[];
}

export interface GHLPipelineStage {
  id: string;
  name: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
}

export interface GHLPipelinesResponse {
  pipelines: GHLPipeline[];
}

export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  status: "open" | "won" | "lost" | "abandoned" | "all";
  contactId: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  lastStatusChangeAt?: string;
  source?: string;
  tags?: string[];
}

export interface GHLOpportunitiesResponse {
  opportunities: GHLOpportunity[];
  meta?: {
    total?: number;
    nextPageUrl?: string;
    startAfterId?: string;
  };
}
