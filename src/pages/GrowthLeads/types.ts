export interface GrowthLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  instagram: string | null;
  city: string | null;
  state: string | null;
  country: string;
  specialty: string | null;
  source_channel: string | null;
  created_at: string;
  custom_fields: Record<string, unknown> | null;
}

export interface GrowthLeadsKPIs {
  total: number;
  withEmail: number;
  withWhatsapp: number;
  withWebsite: number;
  enrichmentRate: number;
  noContact: number;
}

export interface CountryBreakdown {
  country: string;
  total: number;
  with_email: number;
  with_whatsapp: number;
  with_instagram: number;
  with_website: number;
  enriched: number;
}

export interface SpecialtyBreakdown {
  specialty: string;
  total: number;
  with_email: number;
  with_whatsapp: number;
}

export interface GrowthLeadsFilters {
  countries: string[];
  search: string;
  enrichmentStatus: 'all' | 'enriched' | 'no_contact';
  specialty: string;
}
