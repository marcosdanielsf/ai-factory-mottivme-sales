import React, { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';

interface EnrichmentActionsProps {
  recordId: string;
  onTrigger: (action: string, recordId: string) => Promise<void>;
  loading?: boolean;
}

const ENRICHMENT_OPTIONS = [
  { key: 'enrich_record', label: 'Enrich Record' },
  { key: 'enrich_person', label: 'Enrich Person' },
  { key: 'enrich_company', label: 'Enrich Company' },
  { key: 'verify_email', label: 'Verify Email' },
  { key: 'enrich_socials', label: 'Enrich Socials' },
] as const;

type ActionKey = (typeof ENRICHMENT_OPTIONS)[number]['key'];

export default function EnrichmentActions({
  recordId,
  onTrigger,
  loading = false,
}: EnrichmentActionsProps) {
  const [selected, setSelected] = useState<Set<ActionKey>>(new Set());
  const [loadingActions, setLoadingActions] = useState<Set<ActionKey>>(new Set());

  function toggleOption(key: ActionKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleExecute() {
    const actions = Array.from(selected);
    for (const action of actions) {
      setLoadingActions((prev) => new Set(prev).add(action));
      try {
        await onTrigger(action, recordId);
      } finally {
        setLoadingActions((prev) => {
          const next = new Set(prev);
          next.delete(action);
          return next;
        });
      }
    }
    setSelected(new Set());
  }

  const isAnyLoading = loadingActions.size > 0 || loading;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        Enriquecimento
      </p>

      <div className="space-y-2">
        {ENRICHMENT_OPTIONS.map(({ key, label }) => {
          const isLoading = loadingActions.has(key);
          return (
            <label
              key={key}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggleOption(key)}
                  disabled={isAnyLoading}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 rounded border border-border-default bg-bg-tertiary peer-checked:bg-accent-primary peer-checked:border-accent-primary transition-colors" />
                {selected.has(key) && (
                  <svg
                    className="absolute inset-0 w-4 h-4 text-white pointer-events-none"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8l3.5 3.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                {label}
              </span>
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-accent-primary animate-spin flex-shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      <button
        onClick={handleExecute}
        disabled={selected.size === 0 || isAnyLoading}
        className="mt-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-primary hover:bg-accent-primary/80 text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {isAnyLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Executar Selecionados ({selected.size})
          </>
        )}
      </button>
    </div>
  );
}
