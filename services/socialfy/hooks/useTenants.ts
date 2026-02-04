import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// Types - Tenant ICP Config
// ============================================================================

export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  is_active: boolean;
}

export interface TenantDetail extends Tenant {
  icp_keywords?: string[];
  icp_negative_keywords?: string[];
  min_followers?: number;
  max_followers?: number;
  require_business?: boolean;
  require_public?: boolean;
  scoring_weights?: {
    followers: number;
    engagement: number;
    bio_match: number;
    business_account: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UseTenantsOptions {
  onlyActive?: boolean;
}

export interface UseTenantsReturn {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook - useTenants
// ============================================================================

export function useTenants(options: UseTenantsOptions = {}): UseTenantsReturn {
  const { onlyActive = true } = options;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('tenant_icp_config')
        .select('tenant_id, tenant_name, is_active')
        .order('tenant_name', { ascending: true });

      // Filter by active status
      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Transform data
      const transformedTenants: Tenant[] = (data || []).map((row: any) => ({
        tenant_id: row.tenant_id,
        tenant_name: row.tenant_name || row.tenant_id,
        is_active: row.is_active ?? true,
      }));

      setTenants(transformedTenants);

    } catch (err: any) {
      console.error('[useTenants] Error fetching tenants:', err);
      setError(err.message || 'Falha ao carregar tenants');
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    refetch: fetchTenants,
  };
}

// ============================================================================
// Hook - useTenantById (single tenant detail)
// ============================================================================

export interface UseTenantByIdReturn {
  tenant: TenantDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTenantById(tenantId: string | null): UseTenantByIdReturn {
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = useCallback(async () => {
    if (!tenantId) {
      setTenant(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('tenant_icp_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (data) {
        setTenant({
          tenant_id: data.tenant_id,
          tenant_name: data.tenant_name || data.tenant_id,
          is_active: data.is_active ?? true,
          icp_keywords: data.icp_keywords || [],
          icp_negative_keywords: data.icp_negative_keywords || [],
          min_followers: data.min_followers,
          max_followers: data.max_followers,
          require_business: data.require_business,
          require_public: data.require_public,
          scoring_weights: data.scoring_weights,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }

    } catch (err: any) {
      console.error('[useTenantById] Error fetching tenant:', err);
      setError(err.message || 'Falha ao carregar tenant');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return {
    tenant,
    loading,
    error,
    refetch: fetchTenant,
  };
}

// ============================================================================
// Hook - useTenantDropdown (simplified for dropdown usage)
// ============================================================================

export interface TenantOption {
  value: string;
  label: string;
}

export interface UseTenantDropdownReturn {
  options: TenantOption[];
  loading: boolean;
  error: string | null;
}

export function useTenantDropdown(): UseTenantDropdownReturn {
  const { tenants, loading, error } = useTenants({ onlyActive: true });

  const options: TenantOption[] = tenants.map(t => ({
    value: t.tenant_id,
    label: t.tenant_name,
  }));

  return {
    options,
    loading,
    error,
  };
}

export default useTenants;
