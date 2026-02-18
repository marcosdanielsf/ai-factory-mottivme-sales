import React from 'react';
import { Image, FileText, Palette, BookOpen, Layout, Share2, Crown } from 'lucide-react';
import type { BrandConfig } from '../../../types/brand';

interface BrandOverviewProps {
  brand: BrandConfig;
  assetCounts: Record<string, number>;
  onTabChange: (tab: string) => void;
}

const SECTION_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  logos: { label: 'Logotipos', icon: Crown, description: 'Logos, assinaturas e simbolos' },
  icons: { label: 'Icones', icon: Layout, description: 'Icones e avatares' },
  'social-kit': { label: 'Social Kit', icon: Share2, description: 'Posts, stories e capas' },
  manual: { label: 'Manual', icon: BookOpen, description: 'Manual de marca' },
  docs: { label: 'Documentos', icon: FileText, description: 'Briefings e guias' },
  colors: { label: 'Paleta', icon: Palette, description: 'Cores da marca' },
};

export const BrandOverview: React.FC<BrandOverviewProps> = ({ brand, assetCounts, onTabChange }) => {
  const sections = brand.sections || [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color}40 0%, transparent 60%)`,
          }}
        />
        <div className="relative flex items-center gap-6">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.client_name} className="h-16 w-16 object-contain rounded-lg" />
          ) : (
            <div
              className="h-16 w-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: brand.primary_color }}
            >
              {brand.client_name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{brand.client_name}</h1>
            {brand.client_tagline && (
              <p className="text-text-secondary mt-1">{brand.client_tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const meta = SECTION_META[section];
          if (!meta) return null;
          const count = assetCounts[section] || 0;
          const Icon = meta.icon;

          return (
            <button
              key={section}
              onClick={() => onTabChange(section)}
              className="group text-left p-5 rounded-xl border border-border-default bg-bg-secondary hover:border-accent-primary/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${brand.primary_color}15` }}
                >
                  <Icon size={20} style={{ color: brand.primary_color }} />
                </div>
                {section !== 'colors' && (
                  <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-full">
                    {count} {count === 1 ? 'arquivo' : 'arquivos'}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                {meta.label}
              </h3>
              <p className="text-xs text-text-muted mt-1">{meta.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
