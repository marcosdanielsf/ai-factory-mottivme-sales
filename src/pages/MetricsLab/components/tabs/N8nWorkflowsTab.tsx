import React, { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Fluxo Principal', url: 'https://cliente-a1.mentorfy.io/workflow/HXWGWQFBY4KVfY64' },
  { label: 'Sync Opportunities', url: 'https://cliente-a1.mentorfy.io/workflow/NxQAZPOaQyHUWCd9' },
  { label: 'Follow Up Eterno', url: 'https://cliente-a1.mentorfy.io/workflow/3Yx6JniDrQw4KBCi' },
  { label: 'Cost Tracking', url: 'https://cliente-a1.mentorfy.io/workflow/GWKl5KuXAdeu4BLr' },
  { label: 'IG Auto-Reply', url: 'https://cliente-a1.mentorfy.io/workflow/0uj7VAuyIPLHVbJt' },
];

const N8N_BASE_URL = 'https://cliente-a1.mentorfy.io';

export const N8nWorkflowsTab: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      {/* Normal layout */}
      <div className={isFullscreen ? 'hidden' : 'space-y-3'}>
        {/* Quick links */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-text-muted">Acesso rapido:</span>
          {QUICK_LINKS.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-bg-secondary border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
            >
              <ExternalLink size={10} className="flex-shrink-0" />
              {link.label}
            </a>
          ))}
          <button
            onClick={() => setIsFullscreen(true)}
            className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-bg-secondary border border-border-default text-text-muted hover:text-text-primary transition-colors"
            title="Tela cheia"
          >
            <Maximize2 size={12} />
            Expandir
          </button>
        </div>

        {/* iframe */}
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <iframe
            src={N8N_BASE_URL}
            title="n8n Workflows"
            className="w-full"
            style={{ height: 'calc(100vh - 260px)', minHeight: '500px', border: 'none' }}
          />
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          {/* Fullscreen header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-secondary flex-shrink-0">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-text-muted">Acesso rapido:</span>
              {QUICK_LINKS.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-bg-primary border border-border-default text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ExternalLink size={10} />
                  {link.label}
                </a>
              ))}
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border-default text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
              title="Sair de tela cheia"
            >
              <Minimize2 size={12} />
              Fechar
            </button>
          </div>

          {/* iframe fullscreen */}
          <iframe
            src={N8N_BASE_URL}
            title="n8n Workflows (fullscreen)"
            className="flex-1 w-full"
            style={{ border: 'none' }}
          />
        </div>
      )}
    </>
  );
};
