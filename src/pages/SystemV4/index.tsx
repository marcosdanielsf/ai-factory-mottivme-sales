import React, { useState, createContext, useContext } from 'react';
import {
  Cpu, Bot, Webhook, GitBranch, Database, Shield, BarChart3,
  ChevronDown, ChevronRight, FileText, Zap, Eye, Clock,
  Lock, AlertTriangle, CheckCircle2, Settings2, Layers, Loader2
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import {
  type AgentConfig, type HookConfig, type WorkflowConfig,
  type ConstitutionArticle, type SystemStats, type MemoryFile,
} from './data';

// ============================================
// DATA CONTEXT (alimentado pelo hook)
// ============================================
interface SystemData {
  agents: AgentConfig[];
  hooks: HookConfig[];
  workflows: WorkflowConfig[];
  memoryFiles: MemoryFile[];
  memoryCategories: { name: string; count: number }[];
  constitution: ConstitutionArticle[];
  systemStats: SystemStats;
}

const SystemDataContext = createContext<SystemData>(null!);
const useSystemData = () => useContext(SystemDataContext);

// ============================================
// MODEL BADGE
// ============================================
const modelColors = {
  opus: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  sonnet: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  haiku: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const ModelBadge: React.FC<{ model: 'opus' | 'sonnet' | 'haiku' }> = ({ model }) => {
  const c = modelColors[model];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text} border ${c.border}`}>
      {model}
    </span>
  );
};

// ============================================
// SEVERITY BADGE
// ============================================
const severityConfig = {
  'NON-NEGOTIABLE': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', icon: Lock },
  'MUST': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: AlertTriangle },
  'SHOULD': { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', icon: CheckCircle2 },
};

const SeverityBadge: React.FC<{ severity: ConstitutionArticle['severity'] }> = ({ severity }) => {
  const c = severityConfig[severity];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text} border ${c.border}`}>
      <Icon size={12} />
      {severity}
    </span>
  );
};

// ============================================
// AGENTS PANEL
// ============================================
const AgentsPanel: React.FC = () => {
  const { agents } = useSystemData();
  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {agents.map((agent: AgentConfig) => (
      <div key={agent.id} className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{agent.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">{agent.id}</p>
          </div>
          <ModelBadge model={agent.model} />
        </div>
        <p className="text-xs text-text-secondary mb-4 leading-relaxed">{agent.role}</p>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Permissoes</p>
            <div className="flex flex-wrap gap-1">
              {agent.permissions.map((p) => (
                <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${
                  p === 'Write' || p === 'Edit' ? 'bg-orange-500/15 text-orange-400' :
                  p === 'Bash' ? 'bg-red-500/15 text-red-400' :
                  'bg-bg-tertiary text-text-muted'
                }`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Dominios</p>
            <div className="flex flex-wrap gap-1">
              {agent.domains.map((d) => (
                <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
  );
};

// ============================================
// HOOKS PANEL
// ============================================
const hookEventIcons: Record<string, typeof Zap> = {
  PreToolCall: Shield,
  PostToolCall: Zap,
};

const hookTypeColors: Record<string, string> = {
  guard: 'border-l-red-500',
  loader: 'border-l-blue-500',
  monitor: 'border-l-amber-500',
  scheduler: 'border-l-green-500',
};

const HooksPanel: React.FC = () => {
  const { hooks } = useSystemData();
  const events = [...new Set(hooks.map((h) => h.event))];

  return (
    <div className="space-y-6">
      {events.map((event) => {
        const EventIcon = hookEventIcons[event] || Zap;
        const eventHooks = hooks.filter((h) => h.event === event);
        return (
          <div key={event}>
            <div className="flex items-center gap-2 mb-3">
              <EventIcon size={16} className="text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">{event}</h3>
              <span className="text-xs text-text-muted">({eventHooks.length})</span>
            </div>
            <div className="space-y-2">
              {eventHooks.map((hook: HookConfig) => (
                <div
                  key={hook.id}
                  className={`bg-bg-secondary border border-border-default rounded-lg p-4 border-l-4 ${hookTypeColors[hook.type] || 'border-l-gray-500'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-text-primary">{hook.name}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
                      {hook.type}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{hook.description}</p>
                  <p className="text-[10px] text-text-muted mt-2 font-mono">{hook.command}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// WORKFLOWS PANEL
// ============================================
const WorkflowsPanel: React.FC = () => {
  const { workflows } = useSystemData();
  return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {workflows.map((wf: WorkflowConfig) => (
      <div key={wf.id} className="bg-bg-secondary border border-border-default rounded-xl p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-semibold text-text-primary">{wf.name}</h3>
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
            {wf.phases.length} fases
          </span>
        </div>
        <p className="text-xs text-text-secondary mb-4">{wf.trigger}</p>
        <div className="space-y-2">
          {wf.phases.map((phase) => (
            <div key={phase.step} className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bg-tertiary text-text-muted text-xs flex items-center justify-center font-medium">
                {phase.step}
              </span>
              <span className="text-xs text-text-primary flex-1">{phase.name}</span>
              <span className="text-[10px] text-text-muted hidden sm:inline">{phase.agent}</span>
              <ModelBadge model={phase.model} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
  );
};

// ============================================
// MEMORY PANEL
// ============================================
const MemoryPanel: React.FC = () => {
  const { memoryFiles, memoryCategories } = useSystemData();
  const tier1Files = memoryFiles.filter((f) => f.tier === 1);
  const tier2Files = memoryFiles.filter((f) => f.tier === 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tier 1 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-text-primary">Tier 1 — Sempre Carregado</h3>
        </div>
        <div className="space-y-2">
          {tier1Files.map((f) => (
            <div key={f.path} className="bg-bg-secondary border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-text-primary">{f.category}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  tier-1
                </span>
              </div>
              <p className="text-xs text-text-secondary">{f.description}</p>
              <p className="text-[10px] text-text-muted mt-1 font-mono">{f.path}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2 + Categorias */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-text-primary">Tier 2 — Sob Demanda</h3>
        </div>
        <div className="space-y-2 mb-6">
          {tier2Files.map((f) => (
            <div key={f.path} className="bg-bg-secondary border border-border-default rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-primary font-medium">{f.description}</p>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">{f.path}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted flex-shrink-0 ml-2">
                {f.category}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Categorias do Index</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {memoryCategories.map((cat) => (
            <div key={cat.name} className="bg-bg-secondary border border-border-default rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-text-primary">{cat.name}</span>
              <span className="text-xs font-semibold text-accent-primary">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// CONSTITUTION PANEL
// ============================================
const ConstitutionPanel: React.FC = () => {
  const { constitution } = useSystemData();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {constitution.map((article: ConstitutionArticle) => {
        const isOpen = expanded === article.number;
        return (
          <div key={article.number} className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : article.number)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-tertiary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-text-muted w-8">Art. {article.number}</span>
                <h3 className="text-sm font-semibold text-text-primary">{article.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={article.severity} />
                {isOpen ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-border-default pt-3 space-y-2">
                  {article.rules.map((rule) => (
                    <div key={rule} className="flex items-start gap-2">
                      <span className="text-accent-primary mt-0.5 flex-shrink-0">
                        <CheckCircle2 size={12} />
                      </span>
                      <p className="text-xs text-text-secondary leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// STATS PANEL
// ============================================
const StatsPanel: React.FC = () => {
  const { agents, hooks, workflows, systemStats } = useSystemData();
  const stats = [
    { label: 'Agentes', value: systemStats.agents, icon: Bot, color: 'text-purple-400' },
    { label: 'Hooks', value: systemStats.hooks, icon: Webhook, color: 'text-blue-400' },
    { label: 'Workflows', value: systemStats.workflows, icon: GitBranch, color: 'text-green-400' },
    { label: 'Fases Total', value: systemStats.workflowPhases, icon: Layers, color: 'text-amber-400' },
    { label: 'Memory Files', value: systemStats.memoryFiles, icon: Database, color: 'text-cyan-400' },
    { label: 'Artigos', value: systemStats.constitutionArticles, icon: Shield, color: 'text-red-400' },
    { label: 'Skills', value: systemStats.skills, icon: Settings2, color: 'text-orange-400' },
    { label: 'Modos PBM', value: systemStats.pbmModes, icon: Zap, color: 'text-pink-400' },
  ];

  const components = [
    { name: 'Agentes', items: agents.map((a) => `${a.name} (${a.model})`).join(', ') },
    { name: 'Hooks', items: hooks.map((h) => h.name).join(', ') },
    { name: 'Workflows', items: workflows.map((w) => `${w.name} (${w.phases.length} fases)`).join(', ') },
    { name: 'Modos PBM', items: 'sdr_inbound, social_seller_instagram, followuper, concierge, scheduler, rescheduler, objection_handler, reativador_base, customersuccess' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
              <Icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Components Table */}
      <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Componentes do Sistema</h3>
        </div>
        <div className="divide-y divide-border-default">
          {components.map((comp) => (
            <div key={comp.name} className="px-5 py-3">
              <p className="text-xs font-medium text-text-primary mb-1">{comp.name}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{comp.items}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Versao do Sistema</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-text-muted">Versao</p>
            <p className="text-text-primary font-medium">v4.0</p>
          </div>
          <div>
            <p className="text-text-muted">Data</p>
            <p className="text-text-primary font-medium">2026-02-19</p>
          </div>
          <div>
            <p className="text-text-muted">CLAUDE.md</p>
            <p className="text-text-primary font-medium">78 linhas (reduzido de 370)</p>
          </div>
          <div>
            <p className="text-text-muted">Constitution</p>
            <p className="text-text-primary font-medium">v1.0 — 7 artigos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TABS CONFIG
// ============================================
type TabId = 'agentes' | 'hooks' | 'workflows' | 'memory' | 'constituicao' | 'sistema';

const tabs: { id: TabId; label: string; icon: typeof Bot }[] = [
  { id: 'agentes', label: 'Agentes', icon: Bot },
  { id: 'hooks', label: 'Hooks', icon: Webhook },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'constituicao', label: 'Constituicao', icon: Shield },
  { id: 'sistema', label: 'Sistema', icon: BarChart3 },
];

const panelMap: Record<TabId, React.FC> = {
  agentes: AgentsPanel,
  hooks: HooksPanel,
  workflows: WorkflowsPanel,
  memory: MemoryPanel,
  constituicao: ConstitutionPanel,
  sistema: StatsPanel,
};

// ============================================
// MAIN PAGE
// ============================================
const SystemV4: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('agentes');
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const isMobile = useIsMobile();
  const { data, loading, source } = useSystemConfig();

  const activeTabData = tabs.find((t) => t.id === activeTab);
  const ActiveIcon = activeTabData?.icon || Cpu;
  const ActivePanel = panelMap[activeTab];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <SystemDataContext.Provider value={data}>
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Cpu size={24} className="text-accent-primary" />
          <h1 className="text-xl font-bold text-text-primary">System v4.0</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
            deployed
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            source === 'supabase'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {source === 'supabase' ? 'Supabase' : 'Static'}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Configuracao completa do sistema de desenvolvimento MOTTIVME
        </p>
      </div>

      {/* Tabs */}
      {isMobile ? (
        <div className="relative">
          <button
            onClick={() => setShowTabDropdown(!showTabDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-bg-secondary border border-border-default rounded-lg text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <ActiveIcon size={18} className="text-accent-primary" />
              {activeTabData?.label}
            </span>
            <ChevronDown size={18} className={`transition-transform ${showTabDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showTabDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-20 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowTabDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2 border-b border-border-default overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Panel Content */}
      <ActivePanel />
    </div>
    </SystemDataContext.Provider>
  );
};

export default SystemV4;
