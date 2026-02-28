import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { GrowthLead, GrowthLeadsKPIs, CountryBreakdown, SpecialtyBreakdown, GrowthLeadsFilters } from '../pages/GrowthLeads/types';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 400;

export type SortableField = 'created_at' | 'name' | 'country' | 'region' | 'company' | 'title' | 'source_channel';

// Sanitiza input para uso em filtros PostgREST (previne injection via metacaracteres)
export const sanitizeSearch = (value: string): string =>
  value.replace(/[%_().,\\]/g, '').trim();

export const useGrowthLeads = () => {
  const [kpis, setKpis] = useState<GrowthLeadsKPIs>({ total: 0, withEmail: 0, withWhatsapp: 0, withLinkedin: 0, withInstagram: 0, enrichmentRate: 0, noContact: 0 });
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [countryBreakdown, setCountryBreakdown] = useState<CountryBreakdown[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyBreakdown[]>([]);
  const [leads, setLeads] = useState<GrowthLead[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortableField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [filters, setFilters] = useState<GrowthLeadsFilters>({
    countries: [],
    regions: [],
    search: '',
    enrichmentStatus: 'all',
    specialty: '',
    dateRange: { startDate: null, endDate: null },
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, DEBOUNCE_MS);
  }, []);

  // Stable date strings for useCallback deps (avoid re-fetch on Date ref change)
  const dateFrom = filters.dateRange.startDate?.toISOString() ?? '';
  const dateTo = filters.dateRange.endDate?.toISOString() ?? '';

  // Fetch KPIs + charts (runs on mount and filter changes)
  const fetchKPIsAndCharts = useCallback(async () => {
    if (!isSupabaseConfigured()) { setError('Supabase não configurado'); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);

      // KPIs: 7 parallel head-only queries (select 'id' to minimize planner work)
      const baseQuery = () => {
        let q = supabase.from('growth_leads').select('id', { count: 'exact', head: true });
        if (filters.countries.length > 0) q = q.in('country', filters.countries);
        if (filters.regions.length > 0) q = q.in('region', filters.regions);
        if (dateFrom) q = q.gte('created_at', dateFrom);
        if (dateTo) q = q.lte('created_at', dateTo);
        return q;
      };

      const [rTotal, rEmail, rWhatsapp, rLinkedin, rInstagram, rEnriched, rNoContact] = await Promise.all([
        baseQuery(),
        baseQuery().not('email', 'is', null),
        baseQuery().not('whatsapp', 'is', null),
        baseQuery().not('linkedin_url', 'is', null),
        baseQuery().not('instagram_username', 'is', null),
        baseQuery().or('email.not.is.null,whatsapp.not.is.null,instagram_username.not.is.null'),
        baseQuery().is('email', null).is('whatsapp', null).is('instagram_username', null).is('linkedin_url', null),
      ]);

      const total = rTotal.count ?? 0;
      const withEmail = rEmail.count ?? 0;
      const withWhatsapp = rWhatsapp.count ?? 0;
      const withLinkedin = rLinkedin.count ?? 0;
      const withInstagram = rInstagram.count ?? 0;
      const enriched = rEnriched.count ?? 0;
      const noContact = rNoContact.count ?? 0;

      setKpis({
        total,
        withEmail,
        withWhatsapp,
        withLinkedin,
        withInstagram,
        enrichmentRate: total > 0 ? (enriched / total) * 100 : 0,
        noContact,
      });

      // Charts: RPCs
      const countryParam = filters.countries.length === 1 ? filters.countries[0] : null;
      const [rCountry, rSpecialty] = await Promise.all([
        supabase.rpc('growth_leads_country_breakdown'),
        supabase.rpc('growth_leads_top_specialties', { p_limit: 15, p_country: countryParam }),
      ]);

      if (rCountry.error) throw new Error(rCountry.error.message);
      if (rSpecialty.error) throw new Error(rSpecialty.error.message);

      let countryData = (rCountry.data ?? []) as CountryBreakdown[];
      if (filters.countries.length > 0) {
        countryData = countryData.filter(c => filters.countries.includes(c.country));
      }
      setCountryBreakdown(countryData);
      setSpecialties((rSpecialty.data ?? []) as SpecialtyBreakdown[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filters.countries, filters.regions, dateFrom, dateTo]);

  // Fetch available regions (once on mount — static data)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.rpc('growth_leads_regions').then(({ data, error: err }) => {
      if (!err && data) {
        setAvailableRegions((data as { region: string }[]).map(r => r.region));
      }
    });
  }, []);

  // Fetch table (runs on page/search/filter/sort changes)
  const fetchTable = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      setLoadingTable(true);

      let query = supabase
        .from('growth_leads')
        .select('id,name,phone,email,linkedin_url,whatsapp,instagram_username,company,region,country,title,source_channel,created_at,custom_fields', { count: 'exact' });

      // Country filter
      if (filters.countries.length > 0) {
        query = query.in('country', filters.countries);
      }

      // Region filter
      if (filters.regions.length > 0) {
        query = query.in('region', filters.regions);
      }

      // Date range filter
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      // Search (sanitized to prevent PostgREST filter injection)
      const safe = sanitizeSearch(debouncedSearch);
      if (safe) {
        query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%,title.ilike.%${safe}%`);
      }

      // Enrichment filter
      if (filters.enrichmentStatus === 'enriched') {
        query = query.or('email.not.is.null,whatsapp.not.is.null,instagram_username.not.is.null');
      } else if (filters.enrichmentStatus === 'no_contact') {
        query = query.is('email', null).is('whatsapp', null).is('instagram_username', null).is('linkedin_url', null);
      }

      // Specialty filter (uses 'title' column)
      if (filters.specialty) {
        query = query.eq('title', filters.specialty);
      }

      // Sort + pagination
      query = query.order(sortField, { ascending: sortAsc });
      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, error: qErr, count } = await query;
      if (qErr) throw new Error(qErr.message);

      setLeads((data ?? []) as GrowthLead[]);
      setTotalRows(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tabela');
    } finally {
      setLoadingTable(false);
    }
  }, [filters.countries, filters.regions, filters.enrichmentStatus, filters.specialty, debouncedSearch, dateFrom, dateTo, page, sortField, sortAsc]);

  useEffect(() => { fetchKPIsAndCharts(); }, [fetchKPIsAndCharts]);
  useEffect(() => { fetchTable(); }, [fetchTable]);

  const toggleSort = useCallback((field: SortableField) => {
    if (field === sortField) {
      setSortAsc(a => !a);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setPage(0);
  }, [sortField]);

  const updateFilters = useCallback((partial: Partial<GrowthLeadsFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
    setPage(0);
  }, []);

  const totalPages = useMemo(() => Math.ceil(totalRows / PAGE_SIZE), [totalRows]);

  const refetch = useCallback(() => {
    fetchKPIsAndCharts();
    fetchTable();
  }, [fetchKPIsAndCharts, fetchTable]);

  return {
    kpis,
    countryBreakdown,
    specialties,
    leads,
    totalRows,
    page,
    totalPages,
    loading,
    loadingTable,
    error,
    filters,
    sortField,
    sortAsc,
    availableRegions,
    setPage,
    toggleSort,
    updateFilters,
    updateSearch,
    refetch,
  };
};
