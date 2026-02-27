export interface FbAdPerformance {
  id: string;
  ad_id: string;
  ad_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  account_name: string | null;
  location_id: string | null;
  data_relatorio: string;
  impressions: number;
  clicks: number;
  spend: number;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  conversas_iniciadas: number;
  custo_por_conversa: number | null;
  reach: number | null;
  frequency: number | null;
  post_reactions: number | null;
  form_submissions: number | null;
  actions: Array<{ action_type: string; value: string }> | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdsWithLeads {
  ad_id: string;
  ad_name: string | null;
  campaign_name: string | null;
  data_relatorio: string;
  impressions: number;
  clicks: number;
  spend: number;
  cpc: number | null;
  cpm: number | null;
  conversas_iniciadas: number;
  leads_gerados: number;
  leads_agendaram: number;
  custo_por_lead: number | null;
  location_id: string | null;
}

export interface AdsSummaryByDate {
  data_relatorio: string;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversas: number;
  total_reach: number;
  total_reactions: number;
  total_form_submissions: number;
  avg_cpc: number | null;
  avg_cpm: number | null;
  avg_ctr: number | null;
  avg_frequency: number | null;
  ads_count: number;
  location_id: string | null;
}

export interface AdsOverview {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversas: number;
  totalReach: number;
  totalReactions: number;
  totalFormSubmissions: number;
  avgCpc: number;
  avgCpm: number;
  custoPorConversa: number;
  custoPorCadastro: number;
  ctr: number;
}

export interface AdsPeriodDeltas {
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  conversas: number | null;
  reactions: number | null;
  formSubmissions: number | null;
  custoPorConversa: number | null;
  custoPorCadastro: number | null;
}

export interface CampanhaMetrics {
  campaign_name: string;
  campaign_id: string | null;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversas: number;
  totalReach: number;
  totalReactions: number;
  totalFormSubmissions: number;
  avgCpc: number;
  avgCpm: number;
  custoPorConversa: number;
  custoPorCadastro: number;
  ctr: number;
  ads: FbAdPerformance[];
}

export interface AdsetMetrics {
  adset_name: string;
  adset_id: string | null;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversas: number;
  totalReach: number;
  totalReactions: number;
  totalFormSubmissions: number;
  avgCpc: number;
  avgCpm: number;
  custoPorConversa: number;
  custoPorCadastro: number;
  ctr: number;
}

export interface AdAggregate {
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversas: number;
  totalReach: number;
  totalReactions: number;
  totalFormSubmissions: number;
  avgCpc: number;
  avgCpm: number;
  custoPorConversa: number;
  custoPorCadastro: number;
  ctr: number;
}
