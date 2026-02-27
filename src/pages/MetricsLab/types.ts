// Tab 1: Lead Score
export interface LeadScoreRow {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  gasto: number;
  leads: number;
  cpl: number;
  resp_pct: number;
  score: number;
  potencial: 'alto' | 'medio' | 'baixo' | 'desqualificado';
  top_drivers: ScoreDriver[];
  top_detractors: ScoreDriver[];
  thumbnail_url?: string | null;
}

export interface ScoreDriver {
  label: string;
  value: number;
  pct: number;
}

// Tab 2: Criativos ARC
export interface CriativoARC {
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  preview_url: string | null;
  ad_url: string | null;
  hook_rate: number;
  hold_rate: number;
  body_rate: number;
  ctr: number;
  roas: number;
  gasto: number;
  vendas: number;
  benchmark_atencao: boolean;
  benchmark_retencao: boolean;
  benchmark_conversao: boolean;
}

// Tab 3: Funil por Anuncio
export interface FunnelStep {
  key: string;
  label: string;
  value: number;
  cost_metric: number | null;
  cost_label: string | null;
  conversion_rate: number | null;
  trend: number[];
}

export interface FunnelAd {
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  steps: FunnelStep[];
  won_value: number;
  attribution_level?: 'exact' | 'campaign_inferred' | 'unattributed_inferred';
  inferred_leads?: number;
}

// Period comparison deltas
export interface PeriodDeltas {
  spend_delta: number | null;
  impressions_delta: number | null;
  clicks_delta: number | null;
  ctr_delta: number | null;
  cpl_delta: number | null;
  leads_delta: number | null;
}

// P2.4: Heatmap de horarios
export interface HeatmapRow {
  hour_of_day: number;   // 0-23
  day_of_week: number;   // 0=domingo, 6=sabado
  total_leads: number;
  leads_agendou: number;
  leads_won: number;
  conversion_rate: number; // %
}

// P1.2 — Tempo Medio de Conversao (vw_conversion_time_stats)
export interface ConversionTimeStats {
  ad_id: string;
  total_leads: number;
  avg_hours_to_contact: number | null;
  avg_hours_to_schedule: number | null;
  avg_hours_to_won: number | null;
  conversion_rate_schedule: number | null;
  conversion_rate_won: number | null;
}

// P2.2 — Anomaly Detection (vw_ads_anomaly_detection)
export interface AnomalyRow {
  ad_id: string;
  ad_name: string;
  cpl_7d: number;
  cpl_30d: number;
  cpl_delta_pct: number;
  ctr_7d: number;
  ctr_30d: number;
  ctr_delta_pct: number;
  spend_7d: number;
  spend_30d: number;
  is_anomaly: boolean;
}

// Drill-down: leads individuais de um step do funil
export interface FunnelLead {
  unique_id: string;
  contact_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  etapa_funil: string;
  created_at: string;
  responded: boolean | null;
  opp_status: string | null;
  monetary_value: number | null;
}

// Full Funnel Tracking (GHL data per ad)
export interface FunnelTracking {
  ad_id: string;
  attribution_level: 'exact' | 'campaign_inferred' | 'unattributed_inferred';
  total_leads: number;
  novo: number;
  em_contato: number;
  agendou: number;
  no_show: number;
  perdido: number;
  won: number;
  won_value: number;
}

