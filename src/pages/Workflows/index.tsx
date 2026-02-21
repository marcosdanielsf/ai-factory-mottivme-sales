import React, { useState, useMemo, useEffect } from 'react';
import {
  Megaphone,
  TrendingUp,
  Wallet,
  Settings,
  Bot,
  Users,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
  Circle,
  Workflow,
  Link2,
  File,
  Key,
  Star,
  RefreshCw,
  Clock,
  Globe,
  BookOpen,
  GitBranch,
  Wrench,
  LayoutDashboard,
  LucideIcon,
  ClipboardCheck,
  Sparkles,
  Target,
  Zap,
  Code,
  Palette,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { N8nAudit } from '../N8nAudit';
import { sectors, getTotalWorkflows, getActiveWorkflows } from './data';
import { skillSectors, getTotalSkills } from './skills-data';
import type { SkillSector, SkillItem } from './skills-data';
import type { Sector, SubSector, WorkflowItem, ResourceType, ResourceLink } from './data';
import { useN8nWorkflows } from '../../hooks/useN8nWorkflows';

// ============================================
// CONSTANTS
// ============================================

const FAVORITES_KEY = 'mottivme_workflow_favorites';

const sectorIcons: Record<string, LucideIcon> = {
  Megaphone, TrendingUp, Wallet, Settings, Bot, Users,
};

const typeIcons: Record<ResourceType, LucideIcon> = {
  workflow: Workflow, link: Link2, file: File, api_key: Key,
};

const resourceTypeIcons: Record<string, LucideIcon> = {
  doc: BookOpen, dashboard: LayoutDashboard, api: Globe, tool: Wrench, repo: GitBranch,
};

const skillSectorIcons: Record<string, LucideIcon> = {
  Target, Megaphone, Bot, Zap, Code, Palette, FileText, Settings,
};

// ============================================
// HOOKS
// ============================================

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggle = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return { favorites, toggle };
}

// ============================================
// COMPONENTES
// ============================================

const StatusDot = ({ status, live }: { status: 'on' | 'off'; live?: boolean }) => (
  <div className="relative">
    <Circle
      size={8}
      className={`flex-shrink-0 ${
        status === 'on' ? 'fill-emerald-400 text-emerald-400' : 'fill-zinc-600 text-zinc-600'
      }`}
    />
    {live && status === 'on' && (
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-50" />
    )}
  </div>
);

const ResourceBadge = ({ resource }: { resource: ResourceLink }) => {
  const Icon = resourceTypeIcons[resource.type] || Globe;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
    >
      <Icon size={12} />
      {resource.label}
      <ExternalLink size={10} className="opacity-50" />
    </a>
  );
};

const TimeAgo = ({ date }: { date: string }) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let text = '';
  if (mins < 1) text = 'agora';
  else if (mins < 60) text = `${mins}min`;
  else if (hours < 24) text = `${hours}h`;
  else text = `${days}d`;

  return (
    <span className="text-[10px] text-text-muted flex items-center gap-1" title={new Date(date).toLocaleString('pt-BR')}>
      <Clock size={10} />
      {text}
    </span>
  );
};

const ResourceItem = ({
  item,
  isFav,
  onToggleFav,
  liveStatus,
  lastExec,
}: {
  item: WorkflowItem;
  isFav: boolean;
  onToggleFav: () => void;
  liveStatus?: boolean;
  lastExec?: string;
}) => {
  const TypeIcon = typeIcons[item.type];
  const displayStatus = liveStatus !== undefined ? (liveStatus ? 'on' : 'off') : item.status;

  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors">
      <button
        onClick={onToggleFav}
        className={`flex-shrink-0 transition-colors ${
          isFav ? 'text-amber-400' : 'text-transparent group-hover:text-zinc-600'
        }`}
        title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
      </button>
      <StatusDot status={displayStatus} live={liveStatus !== undefined} />
      <TypeIcon size={14} className="text-text-muted flex-shrink-0" />
      <span className="text-sm text-text-primary truncate flex-1">{item.name}</span>
      {lastExec && <TimeAgo date={lastExec} />}
      {item.tags?.map((tag) => (
        <span
          key={tag}
          className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted"
        >
          {tag}
        </span>
      ))}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-tertiary transition-all"
          title="Abrir no n8n"
        >
          <ExternalLink size={14} className="text-text-muted" />
        </a>
      )}
    </div>
  );
};

const SubSectorCard = ({
  subSector,
  favorites,
  onToggleFav,
  liveStatuses,
}: {
  subSector: SubSector;
  favorites: Set<string>;
  onToggleFav: (id: string) => void;
  liveStatuses: Map<string, { active: boolean; lastExecution?: string }>;
}) => {
  const [expanded, setExpanded] = useState(true);
  const activeCount = subSector.items.filter((i) => {
    const live = liveStatuses.get(i.id);
    return live ? live.active : i.status === 'on';
  }).length;

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-bg-secondary hover:bg-bg-hover transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-text-muted" />
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-text-primary">{subSector.name}</span>
          <span className="text-xs text-text-muted ml-2">{subSector.description}</span>
        </div>
        <span className="text-xs text-text-muted">
          <span className="text-emerald-400">{activeCount}</span>/{subSector.items.length}
        </span>
      </button>
      {expanded && (
        <div>
          {/* Resources section */}
          {subSector.resources && subSector.resources.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-border-default/50 bg-bg-primary/50">
              {subSector.resources.map((r) => (
                <ResourceBadge key={r.url} resource={r} />
              ))}
            </div>
          )}
          {/* Workflow items */}
          <div className="divide-y divide-border-default/50">
            {subSector.items.map((item) => {
              const live = liveStatuses.get(item.id);
              return (
                <ResourceItem
                  key={item.id}
                  item={item}
                  isFav={favorites.has(item.id)}
                  onToggleFav={() => onToggleFav(item.id)}
                  liveStatus={live?.active}
                  lastExec={live?.lastExecution}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// STATS CARDS
// ============================================

const StatsCards = ({ liveStatuses }: { liveStatuses: Map<string, { active: boolean }> }) => {
  const stats = sectors.map((s) => {
    const total = getTotalWorkflows(s);
    const active = s.subSectors.reduce(
      (acc, sub) =>
        acc +
        sub.items.filter((i) => {
          const live = liveStatuses.get(i.id);
          return live ? live.active : i.status === 'on';
        }).length,
      0
    );
    const Icon = sectorIcons[s.icon] || Workflow;
    return { ...s, total, active, Icon };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div
          key={s.id}
          className="bg-bg-secondary border border-border-default rounded-lg p-3 space-y-1"
        >
          <div className="flex items-center gap-2">
            <s.Icon size={14} style={{ color: s.color }} />
            <span className="text-xs font-medium text-text-secondary truncate">{s.name}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-text-primary">{s.active}</span>
            <span className="text-xs text-text-muted">/ {s.total}</span>
          </div>
          <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${s.total > 0 ? (s.active / s.total) * 100 : 0}%`,
                backgroundColor: s.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// SECTOR TAB
// ============================================

const SectorTab = ({
  sector,
  isActive,
  onClick,
  liveStatuses,
}: {
  sector: Sector;
  isActive: boolean;
  onClick: () => void;
  liveStatuses: Map<string, { active: boolean }>;
}) => {
  const Icon = sectorIcons[sector.icon] || Workflow;
  const total = getTotalWorkflows(sector);
  const active = sector.subSectors.reduce(
    (acc, sub) =>
      acc +
      sub.items.filter((i) => {
        const live = liveStatuses.get(i.id);
        return live ? live.active : i.status === 'on';
      }).length,
    0
  );

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        isActive
          ? 'bg-text-primary text-bg-primary shadow-sm'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
      }`}
    >
      <Icon size={16} />
      <span>{sector.name}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-white/20' : 'bg-bg-tertiary'
        }`}
      >
        {active}/{total}
      </span>
    </button>
  );
};

// ============================================
// SKILLS CATALOG
// ============================================

const SkillCard = ({ skill, onCopy }: { skill: SkillItem; onCopy: (slug: string) => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`/sl ${skill.slug}`);
    setCopied(true);
    onCopy(skill.slug);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-bg-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">{skill.nome}</span>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-tertiary transition-all"
            title={`Copiar: /sl ${skill.slug}`}
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-text-muted" />}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{skill.descricao}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {skill.keywords.slice(0, 4).map((kw) => (
            <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const SkillSectorCard = ({ sector, searchQuery }: { sector: SkillSector; searchQuery: string }) => {
  const [expanded, setExpanded] = useState(true);
  const Icon = skillSectorIcons[sector.icone] || Sparkles;

  const filteredSkills = searchQuery
    ? sector.skills.filter(
        (s) =>
          s.nome.toLowerCase().includes(searchQuery) ||
          s.descricao.toLowerCase().includes(searchQuery) ||
          s.keywords.some((k) => k.toLowerCase().includes(searchQuery))
      )
    : sector.skills;

  if (searchQuery && filteredSkills.length === 0) return null;

  const handleCopy = (_slug: string) => {};

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-bg-secondary hover:bg-bg-hover transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-text-muted" />
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
        <Icon size={16} style={{ color: sector.cor }} />
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-text-primary">{sector.nome}</span>
        </div>
        <span className="text-xs text-text-muted">
          {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
        </span>
      </button>
      {expanded && (
        <div className="divide-y divide-border-default/50">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} onCopy={handleCopy} />
          ))}
        </div>
      )}
    </div>
  );
};

const SkillsCatalog = () => {
  const [skillSearch, setSkillSearch] = useState('');
  const q = skillSearch.toLowerCase().trim();
  const totalSkills = getTotalSkills();

  const matchCount = q
    ? skillSectors.reduce(
        (acc, s) =>
          acc +
          s.skills.filter(
            (sk) =>
              sk.nome.toLowerCase().includes(q) ||
              sk.descricao.toLowerCase().includes(q) ||
              sk.keywords.some((k) => k.toLowerCase().includes(q))
          ).length,
        0
      )
    : totalSkills;

  return (
    <div className="space-y-4">
      {/* Skills header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-text-primary">
            {totalSkills} skills em {skillSectors.length} setores
          </span>
          <span className="text-xs text-text-muted">
            &middot; Use <code className="px-1 py-0.5 rounded bg-bg-tertiary text-amber-400 text-[10px]">/sl nome</code> no Claude Code
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary w-full sm:w-56"
          />
        </div>
      </div>

      {q && (
        <p className="text-xs text-text-muted">
          {matchCount} resultado{matchCount !== 1 ? 's' : ''} para &ldquo;{skillSearch}&rdquo;
        </p>
      )}

      {/* Sector stats grid */}
      {!q && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {skillSectors.map((s) => {
            const Icon = skillSectorIcons[s.icone] || Sparkles;
            return (
              <div key={s.id} className="bg-bg-secondary border border-border-default rounded-lg p-2.5 text-center space-y-1">
                <Icon size={16} style={{ color: s.cor }} className="mx-auto" />
                <p className="text-xs font-medium text-text-secondary truncate">{s.nome}</p>
                <p className="text-lg font-semibold text-text-primary">{s.skills.length}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Sector cards */}
      {skillSectors.map((sector) => (
        <SkillSectorCard key={sector.id} sector={sector} searchQuery={q} />
      ))}

      {q && matchCount === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          Nenhuma skill encontrada para &ldquo;{skillSearch}&rdquo;
        </div>
      )}
    </div>
  );
};

// ============================================
// PAGINA PRINCIPAL
// ============================================

// Tab especial para "Todos", "Favoritos", "Auditoria" e "Skills"
type SpecialTab = 'all' | 'favorites' | 'audit' | 'skills';

export const Workflows: React.FC = () => {
  const [activeSector, setActiveSector] = useState<string | SpecialTab>(sectors[0].id);
  const [search, setSearch] = useState('');
  const { favorites, toggle: toggleFav } = useFavorites();

  // n8n live status — usa key do localStorage ou null
  const [apiKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mottivme_n8n_api_key');
    } catch {
      return null;
    }
  });
  const { statuses: liveStatuses, loading: liveLoading, error: liveError, refresh } = useN8nWorkflows(apiKey);

  // Busca global — mostra resultados de TODOS os setores
  const isGlobalSearch = search.trim().length > 0;
  const q = search.toLowerCase();

  const globalResults = useMemo(() => {
    if (!isGlobalSearch) return [];
    return sectors.flatMap((sector) =>
      sector.subSectors.flatMap((sub) =>
        sub.items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              item.tags?.some((t) => t.toLowerCase().includes(q))
          )
          .map((item) => ({ ...item, sectorName: sector.name, subSectorName: sub.name }))
      )
    );
  }, [isGlobalSearch, q]);

  // Favoritos — items de todos os setores
  const favItems = useMemo(() => {
    if (activeSector !== 'favorites') return [];
    return sectors.flatMap((sector) =>
      sector.subSectors.flatMap((sub) =>
        sub.items
          .filter((item) => favorites.has(item.id))
          .map((item) => ({ ...item, sectorName: sector.name, subSectorName: sub.name }))
      )
    );
  }, [activeSector, favorites]);

  // Filtered sub-sectors (tab normal)
  const currentSector = sectors.find((s) => s.id === activeSector);
  const filteredSubSectors = useMemo(() => {
    if (!currentSector) return [];
    if (!search.trim()) return currentSector.subSectors;
    return currentSector.subSectors
      .map((sub) => ({
        ...sub,
        items: sub.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.tags?.some((t) => t.toLowerCase().includes(q))
        ),
      }))
      .filter((sub) => sub.items.length > 0);
  }, [currentSector, search, q]);

  // Stats globais
  const totalAll = sectors.reduce((acc, s) => acc + getTotalWorkflows(s), 0);
  const activeAll = sectors.reduce((acc, s) => acc + getActiveWorkflows(s), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Workflow size={22} />
            Hub Operacional
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {activeAll} workflows ativos de {totalAll} total &middot; {sectors.length} setores
            {liveStatuses.size > 0 && (
              <span className="ml-2 text-emerald-400">
                &middot; Live sync ({liveStatuses.size})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {apiKey && (
            <button
              onClick={refresh}
              disabled={liveLoading}
              className="p-2 rounded-lg bg-bg-secondary border border-border-default hover:bg-bg-hover transition-colors disabled:opacity-50"
              title="Atualizar status do n8n"
            >
              <RefreshCw size={16} className={`text-text-muted ${liveLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar em todos os setores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary w-full sm:w-72"
            />
          </div>
        </div>
      </div>

      {/* Live error */}
      {liveError && (
        <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
          n8n: {liveError}
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards liveStatuses={liveStatuses} />

      {/* Sector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {sectors.map((sector) => (
          <SectorTab
            key={sector.id}
            sector={sector}
            isActive={activeSector === sector.id}
            onClick={() => { setActiveSector(sector.id); setSearch(''); }}
            liveStatuses={liveStatuses}
          />
        ))}
        {/* Favoritos tab */}
        <button
          onClick={() => { setActiveSector('favorites'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSector === 'favorites'
              ? 'bg-amber-400 text-zinc-900 shadow-sm'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
          }`}
        >
          <Star size={16} />
          <span>Favoritos</span>
          {favorites.size > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeSector === 'favorites' ? 'bg-white/30' : 'bg-bg-tertiary'
            }`}>
              {favorites.size}
            </span>
          )}
        </button>
        {/* Auditoria tab */}
        <button
          onClick={() => { setActiveSector('audit'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSector === 'audit'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
          }`}
        >
          <ClipboardCheck size={16} />
          <span>Auditoria</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            activeSector === 'audit' ? 'bg-white/30' : 'bg-red-500/20 text-red-400'
          }`}>
            12
          </span>
        </button>
        {/* Skills tab */}
        <button
          onClick={() => { setActiveSector('skills'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSector === 'skills'
              ? 'bg-amber-400 text-zinc-900 shadow-sm'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
          }`}
        >
          <Sparkles size={16} />
          <span>Skills</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            activeSector === 'skills' ? 'bg-white/30' : 'bg-amber-400/20 text-amber-400'
          }`}>
            {getTotalSkills()}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Skills tab content */}
        {activeSector === 'skills' ? (
          <SkillsCatalog />
        ) : activeSector === 'audit' ? (
          <N8nAudit />
        ) : isGlobalSearch ? (
          globalResults.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              Nenhum workflow encontrado para &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div className="border border-border-default rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-bg-secondary border-b border-border-default">
                <span className="text-sm font-medium text-text-primary">
                  {globalResults.length} resultado{globalResults.length !== 1 ? 's' : ''} em todos os setores
                </span>
              </div>
              <div className="divide-y divide-border-default/50">
                {globalResults.map((item) => {
                  const live = liveStatuses.get(item.id);
                  return (
                    <div key={item.id} className="flex items-center">
                      <div className="flex-1">
                        <ResourceItem
                          item={item}
                          isFav={favorites.has(item.id)}
                          onToggleFav={() => toggleFav(item.id)}
                          liveStatus={live?.active}
                          lastExec={live?.lastExecution}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted pr-3 hidden sm:block">
                        {item.sectorName} &rsaquo; {item.subSectorName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : activeSector === 'favorites' ? (
          favItems.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              Nenhum favorito ainda. Clique na estrela ao lado de um workflow para fixar.
            </div>
          ) : (
            <div className="border border-border-default rounded-lg overflow-hidden">
              <div className="divide-y divide-border-default/50">
                {favItems.map((item) => {
                  const live = liveStatuses.get(item.id);
                  return (
                    <div key={item.id} className="flex items-center">
                      <div className="flex-1">
                        <ResourceItem
                          item={item}
                          isFav={true}
                          onToggleFav={() => toggleFav(item.id)}
                          liveStatus={live?.active}
                          lastExec={live?.lastExecution}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted pr-3 hidden sm:block">
                        {item.sectorName} &rsaquo; {item.subSectorName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Normal sector view */
          filteredSubSectors.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              Nenhum workflow encontrado
            </div>
          ) : (
            filteredSubSectors.map((sub) => (
              <SubSectorCard
                key={sub.id}
                subSector={sub}
                favorites={favorites}
                onToggleFav={toggleFav}
                liveStatuses={liveStatuses}
              />
            ))
          )
        )}
      </div>

      {/* Footer — API key config */}
      {!apiKey && (
        <div className="text-center py-4 border-t border-border-default">
          <p className="text-xs text-text-muted">
            Para status live e ultima execucao, configure a API key do n8n no localStorage:
          </p>
          <code className="text-[10px] text-text-muted mt-1 block">
            localStorage.setItem('mottivme_n8n_api_key', 'sua-key')
          </code>
        </div>
      )}
    </div>
  );
};

export default Workflows;
