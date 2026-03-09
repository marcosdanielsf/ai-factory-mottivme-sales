export type ThemeVariableKey =
  | "bg-primary"
  | "bg-secondary"
  | "bg-tertiary"
  | "bg-hover"
  | "text-primary"
  | "text-secondary"
  | "text-muted"
  | "border-default"
  | "border-hover"
  | "accent-primary"
  | "accent-success"
  | "accent-warning"
  | "accent-error";

export interface ThemeOverrides extends Partial<
  Record<ThemeVariableKey, string>
> {
  "favicon-url"?: string;
  "page-title"?: string;
}

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
  theme_overrides: ThemeOverrides | null;
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
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============ BRAND STRATEGY ============

export type BrandArchetype =
  | "innocent"
  | "explorer"
  | "sage"
  | "hero"
  | "outlaw"
  | "magician"
  | "everyman"
  | "lover"
  | "jester"
  | "caregiver"
  | "creator"
  | "ruler";

export interface BrandStrategy {
  id: string;
  location_id: string;
  user_id: string;
  archetype: BrandArchetype;
  archetype_score: number;
  personality_sincerity: number;
  personality_excitement: number;
  personality_competence: number;
  personality_sophistication: number;
  personality_ruggedness: number;
  tone_formal_casual: number;
  tone_serious_playful: number;
  tone_respectful_irreverent: number;
  tone_enthusiastic_matter_of_fact: number;
  positioning_target: string;
  positioning_category: string;
  positioning_differentiator: string;
  positioning_reason: string;
  positioning_statement: string;
  tagline: string;
  tagline_alternatives: string[];
  status: "draft" | "complete";
  wizard_step: number;
  created_at: string;
  updated_at: string;
}
