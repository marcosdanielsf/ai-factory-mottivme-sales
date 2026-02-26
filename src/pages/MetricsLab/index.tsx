import React, { useState } from 'react';
import { FlaskConical, Target, Triangle, TrendingDown, Workflow, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { LeadScoreTab } from './components/tabs/LeadScoreTab';
import { CriativosARCTab } from './components/tabs/CriativosARCTab';
import { FunilPorAnuncioTab } from './components/tabs/FunilPorAnuncioTab';
import { N8nWorkflowsTab } from './components/tabs/N8nWorkflowsTab';
import { useMetricsLab } from '../../hooks/useMetricsLab';
import type { TabKey } from './types';

const TABS: { id: TabKey; label: string; icon: React.FC<{ className?: string; size?: number }> }[] = [
  { id: 'lead-score',     label: 'Lead Score',       icon: Target },
  { id: 'criativos-arc',  label: 'Criativos ARC',    icon: Triangle },
  { id: 'funil-anuncio',  label: 'Funil por Anuncio', icon: TrendingDown },
  { id: 'n8n-workflows',  label: 'n8n Workflows',    icon: Workflow },
];

export const MetricsLab: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('lead-score');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const { leadScoreRows, criativosARC, funnelAds, loading, error, accounts } =
    useMetricsLab(selectedAccount);

  return (
    <div className="bg-[var(--bg-primary)]">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur border-b border-[var(--border-default)]">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)]">Metrics Lab</h1>
                <p className="text-xs text-[var(--text-muted)]">Inspirado em VK Metrics</p>
              </div>
            </div>

            {/* Account filter */}
            {accounts.length > 0 && (
              <div className="relative flex-shrink-0">
                <select
                  value={selectedAccount ?? ''}
                  onChange={(e) => setSelectedAccount(e.target.value || null)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
                >
                  <option value="">Todas as contas</option>
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 md:mx-6 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>Erro ao carregar dados reais — exibindo dados de exemplo. ({error})</span>
          </div>
        )}

        {/* Tab Bar */}
        <div className="px-4 md:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-[var(--text-muted)] text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Carregando dados...</span>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div className="p-4 md:p-6">
          {tab === 'lead-score' && (
            <LeadScoreTab rows={leadScoreRows} loading={false} />
          )}
          {tab === 'criativos-arc' && (
            <CriativosARCTab criativos={criativosARC} loading={false} />
          )}
          {tab === 'funil-anuncio' && (
            <FunilPorAnuncioTab funnelAds={funnelAds} loading={false} />
          )}
          {tab === 'n8n-workflows' && (
            <N8nWorkflowsTab />
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsLab;
