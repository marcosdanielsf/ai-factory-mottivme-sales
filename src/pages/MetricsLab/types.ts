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
}

// Full Funnel Tracking (GHL data per ad)
export interface FunnelTracking {
  ad_id: string;
  total_leads: number;
  novo: number;
  em_contato: number;
  agendou: number;
  no_show: number;
  perdido: number;
  won: number;
  won_value: number;
}

