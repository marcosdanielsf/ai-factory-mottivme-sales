export interface BrandConfig {
  id: string;
  client_slug: string;
  client_name: string;
  client_tagline: string | null;
  logo_url: string | null;
  storage_prefix: string;
  primary_color: string;
  colors: ColorEntry[];
  fonts: FontEntry[];
  sections: string[];
  location_id: string | null;
}

export interface ColorEntry {
  name: string;
  hex: string;
  rgb: string;
  hsl: string;
}

export interface FontEntry {
  name: string;
  role: string; // 'heading' | 'body'
  url?: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  section: string;
  name: string;
  storage_path: string;
  format: string;
  size_bytes: number | null;
  sort_order: number;
}
