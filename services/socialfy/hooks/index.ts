// ============================================================================
// Hooks Index - Socialfy Platform
// ============================================================================

// AgenticOS Leads
export {
  useLeads,
  useLeadById,
  useLeadStats,
  type Lead,
  type UseLeadsOptions,
  type UseLeadsReturn,
  type UseLeadByIdReturn,
  type LeadStats,
  type UseLeadStatsReturn,
} from './useLeads';

// Tenants
export {
  useTenants,
  useTenantById,
  useTenantDropdown,
  type Tenant,
  type TenantDetail,
  type UseTenantsOptions,
  type UseTenantsReturn,
  type UseTenantByIdReturn,
  type TenantOption,
  type UseTenantDropdownReturn,
} from './useTenants';

// Form Validation
export { useFormValidation } from './useFormValidation';

// Metrics
export { useMetrics } from './useMetrics';

// Instagram Search
export {
  useInstagramSearch,
  type InstagramProfile,
  type SearchResult,
  type SearchState,
} from './useInstagramSearch';

// Supabase Data (Growth OS)
export {
  useSupabaseData,
  type UIMetric,
  type UICampaign,
  type UILead,
  type UIPipelineCard,
  type UIAccount,
  type UIAgent,
  type UIConversation,
  type UIFunnelData,
} from './useSupabaseData';

// AgenticOS Campaigns
export {
  useCampaigns,
  useCampaignById,
  type Campaign,
  type CampaignConfig,
  type CampaignStats,
  type CampaignResponse,
} from './useCampaigns';

// AgenticOS Stats
export {
  useAgenticOSStats,
  type AgenticOSStats,
  type UseAgenticOSStatsReturn,
} from './useAgenticOSStats';

// AgenticOS Accounts
export {
  useAgenticOSAccounts,
  type AgenticOSAccount,
  type AgenticOSAccountsResponse,
  type UseAgenticOSAccountsReturn,
} from './useAgenticOSAccounts';

// System Health
export {
  useSystemHealth,
  getHealthStatusColor,
  getHealthStatusText,
  type HealthStatus,
  type SystemHealth,
  type UseSystemHealthReturn,
} from './useSystemHealth';

// Instagram Accounts (with session management)
export {
  useInstagramAccounts,
  type InstagramAccount,
  type CreateAccountParams,
  type UseInstagramAccountsReturn,
} from './useInstagramAccounts';
