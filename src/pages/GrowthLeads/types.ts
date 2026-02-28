export interface GrowthLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
  instagram_username: string | null;
  city: string | null;
  state: string | null;
  country: string;
  title: string | null;
  source_channel: string | null;
  created_at: string;
  custom_fields: Record<string, unknown> | null;
}

export interface GrowthLeadsKPIs {
  total: number;
  withEmail: number;
  withWhatsapp: number;
  withLinkedin: number;
  enrichmentRate: number;
  noContact: number;
}

export interface CountryBreakdown {
  country: string;
  total: number;
  with_email: number;
  with_whatsapp: number;
  with_instagram: number;
  with_linkedin: number;
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
