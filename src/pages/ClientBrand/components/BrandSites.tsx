import React from 'react';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';
import { useBrandAssets } from '../../../hooks/useBrandAssets';

interface BrandSitesProps {
  brandId: string;
  primaryColor: string;
}

export const BrandSites: React.FC<BrandSitesProps> = ({ brandId, primaryColor }) => {
  const { assets, loading } = useBrandAssets(brandId, 'sites');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <Globe size={40} className="mb-3 opacity-50" />
        <p className="text-sm">Nenhum site cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {assets.map((site) => {
        const meta = (site.metadata || {}) as Record<string, unknown>;
        const url = meta.url as string | undefined;
        const techStack = meta.tech_stack as string[] | undefined;
        const pagesCount = meta.pages_count as number | undefined;

        return (
          <a
            key={site.id}
            href={url || site.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-border-default bg-bg-secondary hover:border-accent-primary/30 transition-all overflow-hidden"
          >
            {/* Color accent bar */}
            <div className="h-1.5" style={{ backgroundColor: primaryColor }} />

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="p-2.5 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Globe size={20} style={{ color: primaryColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">
                      {site.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}
                    </p>
                    {url && (
                      <p className="text-xs text-text-muted truncate mt-0.5">{url}</p>
                    )}
                  </div>
                </div>
                <ExternalLink size={16} className="text-text-muted group-hover:text-accent-primary transition-colors flex-shrink-0 mt-1" />
              </div>

              {site.description && (
                <p className="text-xs text-text-secondary line-clamp-2">{site.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {techStack?.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-bg-tertiary text-text-muted"
                  >
                    {tech}
                  </span>
                ))}
                {pagesCount && (
                  <span className="text-[10px] text-text-muted">
                    {pagesCount} {pagesCount === 1 ? 'pagina' : 'paginas'}
                  </span>
                )}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};
