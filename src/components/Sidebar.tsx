import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronDown,
  ChevronRight,
  Settings,
  Box,
  Phone,
  PhoneCall,
  Workflow,
  PhoneOutgoing,
  Users,
  Database,
  TestTube2,
  RefreshCw,
  BookOpen,
  ExternalLink,
  LogOut,
  DollarSign,
  Trophy,
  Eye,
  BarChart3,
  LayoutDashboard,
  Megaphone,
  FileText,
  X,
  Send,
  PanelLeftClose,
  PanelLeft,
  CalendarCheck,
  Sparkles,
  ScrollText,
  CheckCircle,
  Target,
  TrendingUp,
  Video,
  Plus,
  UsersRound,
  Calendar,
  Calculator,
  Bot,
  BookMarked,
  Wallet,
  Network,
  Palette,
  Brain,
  Activity,
  Swords,
  Layers,
  FolderKanban,
  Cpu,
  LucideIcon,
  Search,
  Globe,
  Rocket,
  MapPin,
  Building2,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, Permissions } from '../hooks/usePermissions';
import { AccountSwitcher } from './AccountSwitcher';
import { useAccount } from '../contexts/AccountContext';
import { useLocations } from '../hooks/useLocations';
import { useAiosContextHealth } from '../hooks/aios/useAiosContextHealth';

// ============================================
// TIPOS
// ============================================

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SubItemConfig {
  icon: LucideIcon;
  label: string;
  to: string;
}

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  to: string;
  permission?: keyof Permissions;
  badge?: string;
  subItems?: SubItemConfig[];
}

interface NavSection {
  title: string;
  permission?: keyof Permissions; // Se a seção inteira requer permissão
  items: NavItemConfig[];
}

// ============================================
// CONFIGURAÇÃO DE NAVEGAÇÃO
// ============================================

const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { icon: Home, label: 'Control Tower', to: '/', permission: 'canAccessDashboard' },
      {
        icon: Bot, label: 'JARVIS', to: '/jarvis', permission: 'canAccessDashboard', subItems: [
          { icon: Bot, label: 'Command', to: '/jarvis' },
          { icon: Brain, label: 'Memória', to: '/jarvis/memory' },
          { icon: FolderKanban, label: 'Projetos', to: '/jarvis/projects' },
          { icon: Settings, label: 'Config', to: '/jarvis/config' },
        ]
      },
    ]
  },
  {
    title: 'SALES OS',
    items: [
      { icon: BarChart3, label: 'Sales Ops', to: '/sales-ops', permission: 'canAccessDashboard' },
      { icon: Eye, label: 'Supervisão IA', to: '/supervision', permission: 'canAccessSupervision' },
      {
        icon: PhoneCall, label: 'Cold Calls', to: '/cold-calls', permission: 'canAccessCalls', subItems: [
          { icon: LayoutDashboard, label: 'Dashboard', to: '/cold-calls' },
          { icon: PhoneOutgoing, label: 'Nova Ligação', to: '/cold-calls/new' },
          { icon: Megaphone, label: 'Campanhas', to: '/cold-calls/campaigns' },
          { icon: FileText, label: 'Prompts', to: '/cold-calls/prompts' },
        ]
      },
      {
        icon: Target, label: 'Prospecção', to: '/prospector', permission: 'canAccessCalls', subItems: [
          { icon: LayoutDashboard, label: 'Dashboard', to: '/prospector' },
          { icon: Users, label: 'Fila', to: '/prospector/queue' },
          { icon: FileText, label: 'Templates', to: '/prospector/templates' },
          { icon: TrendingUp, label: 'Analytics', to: '/prospector/analytics' },
          { icon: Search, label: 'LinkedIn Posts', to: '/leadgen/linkedin-posts' },
          { icon: Globe, label: 'LinkedIn Search', to: '/leadgen/linkedin-search' },
          { icon: Rocket, label: 'Apollo Scraper', to: '/leadgen/apollo' },
          { icon: MapPin, label: 'GMaps Search', to: '/leadgen/gmaps' },
          { icon: Users, label: 'Leads People', to: '/leadgen/leads-people' },
          { icon: Building2, label: 'Leads Company', to: '/leadgen/leads-company' },
        ]
      },
      {
        icon: Video, label: 'Video Producer', to: '/video-producer', permission: 'canAccessCalls', subItems: [
          { icon: LayoutDashboard, label: 'Dashboard', to: '/video-producer' },
          { icon: Plus, label: 'Novo Vídeo', to: '/video-producer/new' },
        ]
      },
      {
        icon: Layers, label: 'Operações', to: '/operacoes', permission: 'canAccessAgendamentos', subItems: [
          { icon: CalendarCheck, label: 'Agendamentos', to: '/agendamentos' },
          { icon: CheckCircle, label: 'Central de Status', to: '/status' },
          { icon: Megaphone, label: 'Social Selling', to: '/social-selling' },
          { icon: Calculator, label: 'Planejamento', to: '/planejamento' },
          { icon: FolderKanban, label: 'Projetos', to: '/projetos' },
          { icon: Workflow, label: 'Hub Ops', to: '/workflows' },
          { icon: ClipboardCheck, label: 'Auditoria n8n', to: '/n8n-audit' },
        ]
      },
      {
        icon: ExternalLink, label: 'GHL', to: '/ghl', permission: 'canAccessAgendamentos', subItems: [
          { icon: TrendingUp, label: 'Vendas', to: '/ghl/pipeline' },
          { icon: Calendar, label: 'Agenda', to: '/ghl/agenda' },
          { icon: Users, label: 'Leads', to: '/ghl/leads' },
        ]
      },
    ]
  },
  {
    title: 'AI FACTORY',
    permission: 'canAccessPromptEditor',
    items: [
      { icon: Box, label: 'Prompt Studio', to: '/prompt-studio', permission: 'canAccessPromptEditor' },
      {
        icon: TestTube2, label: 'Qualidade', to: '/qualidade', permission: 'canAccessPromptEditor', subItems: [
          { icon: TestTube2, label: 'Testes & Qualidade', to: '/validacao' },
          { icon: RefreshCw, label: 'Reflection Loop', to: '/reflection-loop' },
          { icon: Sparkles, label: 'Evolução Agente', to: '/evolution' },
        ]
      },
      {
        icon: Database, label: 'Dados', to: '/dados', permission: 'canAccessPromptEditor', subItems: [
          { icon: Send, label: 'Follow-ups', to: '/follow-ups' },
          { icon: ScrollText, label: 'Logs de Conversa', to: '/logs' },
          { icon: Database, label: 'Artifacts & Docs', to: '/knowledge-base' },
        ]
      },
      { icon: Palette, label: 'Brand Assets', to: '/brand', permission: 'canAccessBrand' },
      { icon: Layers, label: 'Agent Tools', to: '/agent-tools', permission: 'canAccessPromptEditor' },
      { icon: Bot, label: 'Squad AI', to: '/squad-ai', permission: 'canAccessPromptEditor' },
    ]
  },
  {
    title: 'AIOS',
    permission: 'canAccessAios',
    items: [
      {
        icon: Bot, label: 'Produção', to: '/aios/producao', permission: 'canAccessAios', subItems: [
          { icon: Bot, label: 'Agentes', to: '/aios/agents' },
          { icon: BookMarked, label: 'Stories', to: '/aios/stories' },
          { icon: CheckCircle, label: 'Tasks', to: '/aios/tasks' },
          { icon: Wallet, label: 'Custos', to: '/aios/costs' },
          { icon: Network, label: 'Squads', to: '/aios/squads' },
        ]
      },
      {
        icon: Brain, label: 'Inteligência', to: '/aios/inteligencia', permission: 'canAccessAios', subItems: [
          { icon: Palette, label: 'Experts', to: '/aios/experts' },
          { icon: Activity, label: 'Synapse', to: '/aios/synapse' },
          { icon: Swords, label: 'Arena', to: '/aios/arena' },
        ]
      },
      { icon: Palette, label: 'Content Studio', to: '/content-studio', permission: 'canAccessAios' },
      { icon: Video, label: 'Content Pipeline', to: '/content-pipeline', permission: 'canAccessAios' },
    ]
  },
  {
    title: 'SISTEMA',
    permission: 'canViewAllClients',
    items: [
      { icon: Cpu, label: 'System v4', to: '/system-v4', permission: 'canViewAllClients' },
      { icon: Trophy, label: 'Performance Clientes', to: '/performance', permission: 'canViewAllClients' },
      { icon: DollarSign, label: 'Custos por Cliente', to: '/custos', permission: 'canViewAllClients' },
      { icon: Settings, label: 'Configurações', to: '/configuracoes', permission: 'canAccessConfiguracoes' },
      { icon: UsersRound, label: 'Usuários', to: '/usuarios', permission: 'canManageUsers' },
      { icon: Users, label: 'Squads RPG', to: '/team-rpg', permission: 'canManageAgents' },
    ]
  },
];

// ============================================
// COMPONENTES
// ============================================

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  badge,
  onNavigate,
  isCollapsed = false
}: {
  icon: LucideIcon;
  label: string;
  to: string;
  badge?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  const handleClick = () => {
    if (onNavigate) onNavigate();
  };

  // Collapsed state - show only icon with tooltip
  if (isCollapsed) {
    return (
      <NavLink
        to={to}
        onClick={handleClick}
        className={`
          flex items-center justify-center p-2 mx-2 rounded-md text-sm transition-colors relative group
          ${isActive ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
        `}
        title={label}
      >
        <Icon size={18} />
        {badge && (
          <span className="absolute -top-1 -right-1 bg-accent-primary text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
            {badge}
          </span>
        )}
        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
          {label}
        </div>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors
        ${isActive ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
      `}
    >
      <Icon size={16} />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto bg-accent-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

// ============================================
// SUBMENU EXPANDÍVEL
// ============================================

const SidebarExpandableItem = ({
  icon: Icon,
  label,
  to,
  subItems,
  onNavigate,
  isCollapsed = false,
}: {
  icon: LucideIcon;
  label: string;
  to: string;
  subItems: SubItemConfig[];
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) => {
  const location = useLocation();
  const isAnyChildActive = subItems.some(sub =>
    location.pathname === sub.to || location.pathname.startsWith(sub.to + '/')
  );
  const [isExpanded, setIsExpanded] = useState(isAnyChildActive);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Auto-expand when navigating into this section
  useEffect(() => {
    if (isAnyChildActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isAnyChildActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [subItems]);

  // Collapsed state — show icon only with flyout on hover
  if (isCollapsed) {
    return (
      <div className="relative group mx-2">
        <div
          className={`
            flex items-center justify-center p-2 rounded-md text-sm transition-colors cursor-pointer
            ${isAnyChildActive ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
          `}
          title={label}
        >
          <Icon size={18} />
        </div>
        {/* Flyout submenu */}
        <div className="absolute left-full top-0 ml-2 py-1 bg-bg-tertiary border border-border-default rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
          <div className="px-3 py-1.5 text-xs font-medium text-text-muted border-b border-border-default mb-1">{label}</div>
          {subItems.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = location.pathname === sub.to;
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                onClick={onNavigate}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-sm transition-colors
                  ${isSubActive ? 'text-accent-primary bg-accent-primary/10' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
                `}
              >
                <SubIcon size={14} />
                <span>{sub.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Parent toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors
          ${isAnyChildActive ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
        `}
        style={{ width: 'calc(100% - 16px)' }}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`ml-auto flex-shrink-0 text-text-muted transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Animated submenu */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="pl-4 mt-0.5 space-y-0.5">
          {subItems.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = location.pathname === sub.to;
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                onClick={onNavigate}
                className={`
                  flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors
                  ${isSubActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-secondary'
                  }
                `}
              >
                <SubIcon size={14} className="flex-shrink-0" />
                <span className="truncate">{sub.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, isCollapsed, isSectionExpanded, onToggle }: {
  title: string;
  isCollapsed: boolean;
  isSectionExpanded?: boolean;
  onToggle?: () => void;
}) => {
  if (!title) return null;

  if (isCollapsed) {
    return <div className="pt-2 border-t border-border-default mx-2 mt-2" />;
  }

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between pt-4 pb-1 px-4 text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
    >
      <span>{title}</span>
      <ChevronDown
        size={12}
        className={`transition-transform duration-200 ${isSectionExpanded ? '' : '-rotate-90'}`}
      />
    </button>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const Sidebar = ({
  isMobile = false,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) => {
  const { user, signOut } = useAuth();
  const { hasPermission, role, isAdmin, isClient } = usePermissions();
  const { selectedAccount, selectSubconta, backToAdmin, loading: accountLoading } = useAccount();
  const { locations, loading: locationsLoading } = useLocations();
  const { criticalCount } = useAiosContextHealth();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const isSectionExpanded = (section: NavSection): boolean => {
    if (!section.title) return true;
    if (collapsedSections.has(section.title)) return false;
    return true;
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleNavigate = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    const name = user.user_metadata?.full_name || email.split('@')[0];
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  // Get role label
  const getRoleLabel = () => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      client: 'Cliente',
      recruiter: 'Recrutador'
    };
    return labels[role] || 'Usuário';
  };

  // Badge dinâmico do Synapse (alertas críticos)
  const synapseNavSections = navSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (criticalCount > 0) {
        // Badge no item direto
        if (item.to === '/aios/synapse') {
          return { ...item, badge: String(criticalCount) };
        }
        // Badge no pai se Synapse está nos subItems
        if (item.subItems?.some(sub => sub.to === '/aios/synapse')) {
          return { ...item, badge: String(criticalCount) };
        }
      }
      return item;
    }),
  }));

  // Filtrar seções e itens baseado em permissões
  const filteredSections = synapseNavSections
    .filter(section => {
      // Se a seção tem permissão requerida, verificar
      if (section.permission && !hasPermission(section.permission)) {
        return false;
      }
      // Verificar se pelo menos um item é visível
      return section.items.some(item =>
        !item.permission || hasPermission(item.permission)
      );
    })
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        !item.permission || hasPermission(item.permission)
      )
    }));

  // Classes condicionais para mobile/desktop/collapsed
  const sidebarClasses = isMobile
    ? `fixed left-0 top-0 h-screen w-[280px] bg-bg-secondary border-r border-border-default flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
    }`
    : `${isCollapsed ? 'w-[68px]' : 'w-[260px]'} h-screen bg-bg-secondary border-r border-border-default flex flex-col sticky top-0 transition-all duration-300 ease-in-out`;

  return (
    <aside className={sidebarClasses}>
      {/* Header */}
      <div className={`h-[52px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 border-b border-border-default`}>
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <div className="w-5 h-5 bg-text-primary rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-bg-primary text-xs font-bold">M</span>
          </div>
          {!isCollapsed && <span>MOTTIV.ME</span>}
        </div>
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-hover rounded-md transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        ) : !isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-bg-hover rounded-md transition-colors text-text-muted hover:text-text-primary"
            aria-label="Recolher sidebar"
            title="Recolher sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && !isMobile && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="mx-auto mt-2 p-2 hover:bg-bg-hover rounded-md transition-colors text-text-muted hover:text-text-primary"
          aria-label="Expandir sidebar"
          title="Expandir sidebar"
        >
          <PanelLeft size={18} />
        </button>
      )}

      {/* Account Switcher - só para admins */}
      {isAdmin && (
        <div className={`${isCollapsed ? 'px-2' : 'px-3'} py-2 border-b border-border-default`}>
          <AccountSwitcher
            locations={locations}
            selectedAccount={selectedAccount}
            onSelectAccount={selectSubconta}
            onBackToAdmin={backToAdmin}
            isCollapsed={isCollapsed}
            loading={accountLoading || locationsLoading}
          />
        </div>
      )}

      {/* Role Badge (quando não collapsed e não é admin) */}
      {!isCollapsed && !isAdmin && (
        <div className="mx-4 mt-3 mb-1">
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${isClient
              ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }
          `}>
            {getRoleLabel()}
          </span>
        </div>
      )}

      {/* Nav - Filtrado por permissões */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {filteredSections.map((section, sectionIndex) => {
          const expanded = isSectionExpanded(section);
          return (
            <div key={sectionIndex}>
              <SectionTitle
                title={section.title}
                isCollapsed={isCollapsed}
                isSectionExpanded={expanded}
                onToggle={() => section.title && toggleSection(section.title)}
              />
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {section.items.map((item) => (
                  item.subItems && item.subItems.length > 0 ? (
                    <SidebarExpandableItem
                      key={item.to}
                      icon={item.icon}
                      label={item.label}
                      to={item.to}
                      subItems={item.subItems}
                      onNavigate={handleNavigate}
                      isCollapsed={isCollapsed}
                    />
                  ) : (
                    <SidebarItem
                      key={item.to}
                      icon={item.icon}
                      label={item.label}
                      to={item.to}
                      badge={item.badge}
                      onNavigate={handleNavigate}
                      isCollapsed={isCollapsed}
                    />
                  )
                ))}
              </div>
            </div>
          );
        })}

        {/* Link externo para documentação - só para admins/managers */}
        {hasPermission('canEditPrompts') && (
          isCollapsed ? (
            <a
              href="https://docs-jet-delta.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 mx-2 rounded-md cursor-pointer text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors relative group"
              title="Documentação"
            >
              <BookOpen size={18} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                Documentação
              </div>
            </a>
          ) : (
            <a
              href="https://docs-jet-delta.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              onClick={handleNavigate}
            >
              <BookOpen size={16} />
              <span>Documentação</span>
              <ExternalLink size={12} className="ml-auto opacity-50" />
            </a>
          )
        )}
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-border-default`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-xs font-semibold text-text-primary cursor-pointer hover:bg-bg-tertiary transition-colors relative group"
              title={getDisplayName()}
            >
              {getUserInitials()}
              <div className="absolute left-full ml-2 px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                <div>{getDisplayName()}</div>
                <div className="text-text-muted">{getRoleLabel()}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-bg-hover rounded-md text-text-muted hover:text-accent-error transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-xs font-semibold text-text-primary">
              {getUserInitials()}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-text-primary truncate">{getDisplayName()}</span>
              <span className="text-xs text-text-muted truncate">{getRoleLabel()}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-bg-hover rounded-md text-text-muted hover:text-accent-error transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
