import React, { useState, useEffect, useRef, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Inbox,
  UserCog,
  Copy,
  Smartphone,
  FlaskConical,
  Flame,
  Package,
  Server,
  Upload,
  Wrench,
  GripVertical,
  Link2,
  Trash2,
  Pencil,
  ArrowRight,
  MoreHorizontal,
  LayoutGrid,
  Route,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions, Permissions } from "../hooks/usePermissions";
import { AccountSwitcher } from "./AccountSwitcher";
import { useAccount } from "../contexts/AccountContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLocations } from "../hooks/useLocations";
import { useAiosContextHealth } from "../hooks/aios/useAiosContextHealth";
import { useSidebarOrder } from "../hooks/useSidebarOrder";

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
  group?: string; // Grupo visual — primeiro item com esse group renderiza o header
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
  // ─── COCKPIT (no title, always visible) ───
  {
    title: "",
    items: [
      {
        icon: Home,
        label: "Control Tower",
        to: "/",
        permission: "canAccessDashboard",
      },
      {
        icon: Bot,
        label: "JARVIS",
        to: "/jarvis",
        permission: "canAccessDashboard",
        subItems: [
          { icon: Bot, label: "Command", to: "/jarvis" },
          { icon: Brain, label: "Memória", to: "/jarvis/memory" },
          { icon: FolderKanban, label: "Projetos", to: "/jarvis/projects" },
          { icon: Copy, label: "Clone", to: "/jarvis/clone" },
          { icon: Smartphone, label: "WhatsApp", to: "/jarvis/whatsapp" },
          { icon: Settings, label: "Config", to: "/jarvis/config" },
        ],
      },
    ],
  },
  // ─── RECEITA (Obsessão 1: Lucro Extraordinário) ───
  {
    title: "RECEITA",
    items: [
      {
        icon: Layers,
        label: "Sales Hub",
        to: "/sales-hub",
        permission: "canAccessDashboard",
      },
      {
        icon: BarChart3,
        label: "Sales Ops",
        to: "/sales-ops",
        permission: "canAccessDashboard",
      },
      {
        icon: CalendarCheck,
        label: "Agendamentos",
        to: "/agendamentos",
        permission: "canAccessAgendamentos",
      },
      {
        icon: Flame,
        label: "CRM Insights",
        to: "/crm-insights",
        permission: "canAccessAgendamentos",
        subItems: [
          { icon: CalendarCheck, label: "Agendamentos", to: "/agendamentos" },
          { icon: CheckCircle, label: "Central de Status", to: "/status" },
          { icon: Megaphone, label: "Social Selling", to: "/social-selling" },
          { icon: BarChart3, label: "Ads Performance", to: "/ads-performance" },
          { icon: FlaskConical, label: "Metrics Lab", to: "/metrics-lab" },
          { icon: Flame, label: "CRM Insights", to: "/crm-insights" },
          { icon: Calculator, label: "Planejamento", to: "/planejamento" },
          { icon: Target, label: "Metas", to: "/metas" },
          { icon: Sparkles, label: "Kanban Prospect", to: "/kanban-prospect" },
          { icon: FolderKanban, label: "Projetos", to: "/projetos" },
          { icon: LayoutGrid, label: "Boards", to: "/boards" },
          { icon: Workflow, label: "Hub Ops", to: "/workflows" },
          { icon: ClipboardCheck, label: "Auditoria n8n", to: "/n8n-audit" },
          { icon: Server, label: "GHL Ops", to: "/ghl-ops" },
          { icon: Route, label: "Jornada do Cliente", to: "/customer-journey" },
        ],
      },
      {
        icon: ExternalLink,
        label: "GHL",
        to: "/ghl",
        permission: "canAccessAgendamentos",
        subItems: [
          {
            icon: BarChart3,
            label: "Sales Dashboard",
            to: "/ghl/sales-dashboard",
          },
          { icon: TrendingUp, label: "Vendas", to: "/ghl/pipeline" },
          { icon: Calendar, label: "Agenda", to: "/ghl/agenda" },
          { icon: Users, label: "Leads", to: "/ghl/leads" },
        ],
      },
    ],
  },
  // ─── AQUISIÇÃO (O que alimenta Receita) ───
  // Ordem: Canais ativos → Canais passivos → Gestão de leads → Análise
  {
    title: "AQUISIÇÃO",
    items: [
      // --- Outbound (você vai atrás) ---
      {
        icon: Target,
        label: "Prospecção",
        to: "/prospector",
        permission: "canAccessCalls",
        subItems: [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            to: "/prospector",
            group: "Geral",
          },
          { icon: Bot, label: "AI SDR", to: "/prospector/ai", group: "Geral" },
          {
            icon: Users,
            label: "Fila de Leads",
            to: "/prospector/queue",
            group: "Geral",
          },
          {
            icon: Inbox,
            label: "Inbox",
            to: "/prospector/inbox",
            group: "LinkedIn",
          },
          {
            icon: UserCog,
            label: "Contas",
            to: "/prospector/accounts",
            group: "LinkedIn",
          },
          {
            icon: Activity,
            label: "Prospector",
            to: "/prospector/ig-prospector",
            group: "Instagram",
          },
          {
            icon: BarChart3,
            label: "Crescimento",
            to: "/prospector/ig-growth",
            group: "Instagram",
          },
          {
            icon: Search,
            label: "LinkedIn Posts",
            to: "/leadgen/linkedin-posts",
            group: "Scrapers",
          },
          {
            icon: Globe,
            label: "LinkedIn Search",
            to: "/leadgen/linkedin-search",
            group: "Scrapers",
          },
          {
            icon: Rocket,
            label: "Apollo",
            to: "/leadgen/apollo",
            group: "Scrapers",
          },
          {
            icon: MapPin,
            label: "Google Maps",
            to: "/leadgen/gmaps",
            group: "Scrapers",
          },
          {
            icon: Users,
            label: "People",
            to: "/leadgen/leads-people",
            group: "Base de Leads",
          },
          {
            icon: Building2,
            label: "Companies",
            to: "/leadgen/leads-company",
            group: "Base de Leads",
          },
          {
            icon: FileText,
            label: "Templates",
            to: "/prospector/templates",
            group: "Base de Leads",
          },
          {
            icon: TrendingUp,
            label: "Analytics",
            to: "/prospector/analytics",
            group: "Métricas",
          },
        ],
      },
      {
        icon: PhoneCall,
        label: "Cold Calls",
        to: "/cold-calls",
        permission: "canAccessCalls",
        subItems: [
          { icon: LayoutDashboard, label: "Dashboard", to: "/cold-calls" },
          { icon: PhoneOutgoing, label: "Nova Ligação", to: "/cold-calls/new" },
          { icon: Megaphone, label: "Campanhas", to: "/cold-calls/campaigns" },
          { icon: FileText, label: "Prompts", to: "/cold-calls/prompts" },
        ],
      },
      // --- Inbound (lead vem até você) ---
      {
        icon: Megaphone,
        label: "Social Selling",
        to: "/social-selling",
        permission: "canAccessAgendamentos",
      },
      {
        icon: BarChart3,
        label: "Ads Performance",
        to: "/ads-performance",
        permission: "canAccessAgendamentos",
      },
      // --- Gestão e Análise ---
      {
        icon: Sparkles,
        label: "Kanban Prospect",
        to: "/kanban-prospect",
        permission: "canAccessAgendamentos",
      },
      {
        icon: FlaskConical,
        label: "Metrics Lab",
        to: "/metrics-lab",
        permission: "canAccessAgendamentos",
      },
    ],
  },
  // ─── ENTREGA (Obsessão 2: Entrega Extraordinária) ───
  // Ordem: Monitorar performance → Configurar agentes → Recursos do agente
  {
    title: "ENTREGA",
    items: [
      // --- Monitoramento (olhar todo dia) ---
      {
        icon: Eye,
        label: "Supervisão IA",
        to: "/supervision",
        permission: "canAccessSupervision",
      },
      {
        icon: Users,
        label: "Atendentes",
        to: "/atendentes",
        permission: "canAccessSupervision",
      },
      {
        icon: CheckCircle,
        label: "Central de Status",
        to: "/status",
        permission: "canAccessAgendamentos",
      },
      // --- Construir e ajustar agentes ---
      {
        icon: Box,
        label: "Prompt Studio",
        to: "/prompt-studio",
        permission: "canAccessPromptEditor",
      },
      {
        icon: TestTube2,
        label: "Qualidade",
        to: "/qualidade",
        permission: "canAccessPromptEditor",
        subItems: [
          { icon: TestTube2, label: "Testes & Qualidade", to: "/validacao" },
          { icon: RefreshCw, label: "Reflection Loop", to: "/reflection-loop" },
          { icon: Sparkles, label: "Evolução Agente", to: "/evolution" },
        ],
      },
      {
        icon: Bot,
        label: "Squad AI",
        to: "/squad-ai",
        permission: "canAccessPromptEditor",
      },
      // --- Recursos do agente ---
      {
        icon: Search,
        label: "RAG Multimodal",
        to: "/rag",
        permission: "canAccessPromptEditor",
      },
      {
        icon: Package,
        label: "Catálogo",
        to: "/produtos",
        permission: "canAccessPromptEditor",
      },
      {
        icon: Layers,
        label: "Agent Tools",
        to: "/agent-tools",
        permission: "canAccessPromptEditor",
      },
      {
        icon: Eye,
        label: "Agent Preview",
        to: "/agent-preview",
        permission: "canAccessPromptEditor",
      },
      {
        icon: Palette,
        label: "Brand Assets",
        to: "/brand",
        permission: "canAccessBrand",
      },
    ],
  },
  // ─── INTELIGÊNCIA (Cérebro do sistema) ───
  // Ordem: Base de conhecimento → Criação de conteúdo → IA avançada → Dados
  {
    title: "INTELIGÊNCIA",
    permission: "canAccessPromptEditor",
    items: [
      // --- Base de conhecimento ---
      {
        icon: Brain,
        label: "Mega Brain",
        to: "/brain",
        permission: "canAccessPromptEditor",
        subItems: [
          { icon: Upload, label: "Ingestão", to: "/brain/ingest" },
          { icon: Users, label: "Entidades", to: "/brain/entities" },
          { icon: Cpu, label: "DNA", to: "/brain/dna" },
          { icon: Sparkles, label: "Skills", to: "/brain/skills" },
          { icon: Activity, label: "Saúde", to: "/brain/health" },
          { icon: Swords, label: "Conclave", to: "/brain/conclave" },
        ],
      },
      {
        icon: Network,
        label: "MindFlow",
        to: "/mindflow",
        permission: "canAccessPromptEditor",
      },
      {
        icon: FileText,
        label: "FormFlow",
        to: "/formflow",
        permission: "canAccessPromptEditor",
      },
      // --- Criação de conteúdo ---
      {
        icon: Palette,
        label: "Content Studio",
        to: "/content-studio",
        permission: "canAccessAios",
      },
      {
        icon: Video,
        label: "Content Pipeline",
        to: "/content-pipeline",
        permission: "canAccessAios",
      },
      {
        icon: Video,
        label: "Video Producer",
        to: "/video-producer",
        permission: "canAccessCalls",
        subItems: [
          { icon: LayoutDashboard, label: "Dashboard", to: "/video-producer" },
          { icon: Plus, label: "Novo Vídeo", to: "/video-producer/new" },
        ],
      },
      // --- IA avançada ---
      {
        icon: Palette,
        label: "Experts",
        to: "/aios/experts",
        permission: "canAccessAios",
      },
      {
        icon: Activity,
        label: "Synapse",
        to: "/aios/synapse",
        permission: "canAccessAios",
      },
      {
        icon: Swords,
        label: "Arena",
        to: "/aios/arena",
        permission: "canAccessAios",
      },
      // --- Dados e logs ---
      {
        icon: Database,
        label: "Dados",
        to: "/dados",
        permission: "canAccessPromptEditor",
        subItems: [
          { icon: Send, label: "Follow-ups", to: "/follow-ups" },
          { icon: ScrollText, label: "Logs de Conversa", to: "/logs" },
          { icon: Database, label: "Artifacts & Docs", to: "/knowledge-base" },
        ],
      },
    ],
  },
  // ─── OPERAÇÕES (Obsessão 3: Gestão Classe Mundial) ───
  // Ordem: Gestão de projetos → Infraestrutura técnica → Auditorias
  {
    title: "OPERAÇÕES",
    items: [
      // --- Gestão de projetos ---
      {
        icon: FolderKanban,
        label: "Projetos",
        to: "/projetos",
        permission: "canAccessAgendamentos",
      },
      {
        icon: LayoutGrid,
        label: "Boards",
        to: "/boards",
        permission: "canAccessAgendamentos",
      },
      {
        icon: Calculator,
        label: "Planejamento",
        to: "/planejamento",
        permission: "canAccessAgendamentos",
      },
      {
        icon: Target,
        label: "Metas",
        to: "/metas",
        permission: "canAccessAgendamentos",
      },
      // --- Infraestrutura (workflows, integrações) ---
      {
        icon: Workflow,
        label: "Hub Ops",
        to: "/workflows",
        permission: "canAccessAgendamentos",
      },
      {
        icon: Server,
        label: "GHL Ops",
        to: "/ghl-ops",
        permission: "canAccessAgendamentos",
      },
      {
        icon: Bot,
        label: "AIOS",
        to: "/aios/producao",
        permission: "canAccessAios",
        subItems: [
          { icon: Bot, label: "Agentes", to: "/aios/agents" },
          { icon: BookMarked, label: "Stories", to: "/aios/stories" },
          { icon: CheckCircle, label: "Tasks", to: "/aios/tasks" },
          { icon: Wallet, label: "Custos", to: "/aios/costs" },
          { icon: Network, label: "Squads", to: "/aios/squads" },
        ],
      },
      // --- Auditorias e monitoramento ---
      {
        icon: ClipboardCheck,
        label: "Auditoria n8n",
        to: "/n8n-audit",
        permission: "canAccessAgendamentos",
      },
      {
        icon: ClipboardCheck,
        label: "Auditoria Agente",
        to: "/agent-audit",
        permission: "canAccessPromptEditor",
      },
      {
        icon: Wrench,
        label: "Ferramentas IA",
        to: "/tool-monitor",
        permission: "canAccessPromptEditor",
      },
    ],
  },
  // ─── IMOBILIÁRIA (Vertical específica) ───
  {
    title: "IMOBILIÁRIA",
    items: [
      {
        icon: Building2,
        label: "Imobiliária",
        to: "/imobiliaria",
        subItems: [
          { icon: LayoutDashboard, label: "Painel", to: "/imobiliaria" },
          { icon: Building2, label: "Catálogo", to: "/imobiliaria/catalogo" },
          { icon: Users, label: "Leads", to: "/imobiliaria/leads" },
          { icon: Calendar, label: "Visitas", to: "/imobiliaria/visitas" },
          { icon: Package, label: "Indicações", to: "/imobiliaria/indicacoes" },
        ],
      },
    ],
  },
  // ─── SISTEMA (Obsessão 4: Caixa + Admin) ───
  {
    title: "SISTEMA",
    permission: "canViewAllClients",
    items: [
      {
        icon: Flame,
        label: "4 Obsessões",
        to: "/obsessoes",
        permission: "canViewAllClients",
      },
      {
        icon: DollarSign,
        label: "Unit Economics",
        to: "/unit-economics",
        permission: "canViewAllClients",
      },
      {
        icon: Activity,
        label: "Health Score",
        to: "/health-score",
        permission: "canViewAllClients",
      },
      {
        icon: ClipboardCheck,
        label: "Onboarding",
        to: "/onboarding-tracker",
        permission: "canViewAllClients",
      },
      {
        icon: Cpu,
        label: "System v4",
        to: "/system-v4",
        permission: "canViewAllClients",
      },
      {
        icon: Trophy,
        label: "Performance Clientes",
        to: "/performance",
        permission: "canViewAllClients",
      },
      {
        icon: DollarSign,
        label: "Custos por Cliente",
        to: "/custos",
        permission: "canViewAllClients",
      },
      {
        icon: Settings,
        label: "Configurações",
        to: "/configuracoes",
        permission: "canAccessConfiguracoes",
      },
      {
        icon: UsersRound,
        label: "Usuários",
        to: "/usuarios",
        permission: "canManageUsers",
      },
      {
        icon: Users,
        label: "Squads RPG",
        to: "/team-rpg",
        permission: "canManageAgents",
      },
    ],
  },
];

// ============================================
// DND WRAPPER
// ============================================

const DraggableWrapper = ({
  id,
  isCollapsed,
  children,
  onDoubleClick,
  onContextMenu,
}: {
  id: string;
  isCollapsed: boolean;
  children: React.ReactNode;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/drag relative cursor-grab active:cursor-grabbing"
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

// ============================================
// COMPONENTES
// ============================================

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  badge,
  onNavigate,
  isCollapsed = false,
}: {
  icon: LucideIcon;
  label: string;
  to: string;
  badge?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(to + "/");

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
          ${isActive ? "bg-bg-hover text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"}
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
        ${isActive ? "bg-bg-hover text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"}
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

// Brand icons para group headers
const groupBrandIcons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3 h-3 text-[#0A66C2]"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="url(#ig-gradient)" className="w-3 h-3">
      <defs>
        <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  Scrapers: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 text-orange-400"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  "Base de Leads": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 text-green-400"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
      <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
    </svg>
  ),
  Métricas: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 text-cyan-400"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  Geral: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 text-slate-400"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
};

// ============================================
// SUB-GROUP ACCORDION (nested collapsible groups)
// ============================================

interface SubGroupAccordionProps {
  groupName: string;
  items: SubItemConfig[];
  onNavigate?: () => void;
  defaultExpanded: boolean;
  dragHandleListeners?: Record<string, unknown>;
  dragHandleAttributes?: Record<string, unknown>;
  isDragging?: boolean;
}

const SubGroupAccordion = ({
  groupName,
  items,
  onNavigate,
  defaultExpanded,
  dragHandleListeners,
  dragHandleAttributes,
  isDragging,
}: SubGroupAccordionProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  // Auto-expand when a child route becomes active
  const hasActiveChild = items.some(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(item.to + "/"),
  );

  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveChild]); // eslint-disable-line react-hooks/exhaustive-deps

  const icon = groupBrandIcons[groupName];

  return (
    <div className={`mt-1 ${isDragging ? "opacity-50" : ""}`}>
      {/* Group header — clickable accordion toggle */}
      <div className="flex items-center group/subgroup">
        {/* Drag handle — visible on hover */}
        <button
          className="flex-shrink-0 w-4 ml-2 opacity-0 group-hover/subgroup:opacity-40 hover:!opacity-80 cursor-grab active:cursor-grabbing text-text-muted transition-opacity"
          {...(dragHandleListeners ?? {})}
          {...(dragHandleAttributes ?? {})}
          tabIndex={-1}
          aria-label={`Reordenar grupo ${groupName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </button>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors hover:bg-bg-hover/60 min-w-0"
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="font-semibold tracking-widest uppercase text-text-muted/60 truncate">
            {groupName}
          </span>
          <ChevronRight
            size={11}
            className={`ml-auto flex-shrink-0 text-text-muted/40 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* Collapsible items — indented inside group */}
      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
        style={{ maxHeight: isOpen ? `${items.length * 40}px` : "0px" }}
      >
        <div className="ml-6 pl-2 mt-0.5 space-y-0.5 border-l border-border-default/30">
          {items.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive =
              location.pathname === sub.to ||
              location.pathname.startsWith(sub.to + "/");
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                onClick={onNavigate}
                className={`
                  flex items-center gap-2 px-3 py-1.5 mr-2 rounded-md text-sm transition-colors
                  ${
                    isSubActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
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

// Sortable wrapper for SubGroupAccordion
const SortableSubGroup = ({
  id,
  groupName,
  items,
  onNavigate,
  defaultExpanded,
}: {
  id: string;
  groupName: string;
  items: SubItemConfig[];
  onNavigate?: () => void;
  defaultExpanded: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SubGroupAccordion
        groupName={groupName}
        items={items}
        onNavigate={onNavigate}
        defaultExpanded={defaultExpanded}
        dragHandleListeners={listeners as Record<string, unknown>}
        dragHandleAttributes={attributes as Record<string, unknown>}
        isDragging={isDragging}
      />
    </div>
  );
};

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
  const isAnyChildActive = subItems.some(
    (sub) =>
      location.pathname === sub.to ||
      location.pathname.startsWith(sub.to + "/"),
  );
  const [isExpanded, setIsExpanded] = useState(isAnyChildActive);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Separate ungrouped from grouped items
  const ungroupedItems = subItems.filter((sub) => !sub.group);
  const groupedItems = subItems.filter((sub) => !!sub.group);

  // Collect unique group names preserving insertion order
  const groupNames = Array.from(new Set(groupedItems.map((sub) => sub.group!)));

  // Map group name → its items
  const groupMap: Record<string, SubItemConfig[]> = {};
  groupedItems.forEach((sub) => {
    if (!groupMap[sub.group!]) groupMap[sub.group!] = [];
    groupMap[sub.group!].push(sub);
  });

  // Determine which groups have an active child (for defaultExpanded)
  const activeGroupNames = new Set(
    groupedItems
      .filter(
        (sub) =>
          location.pathname === sub.to ||
          location.pathname.startsWith(sub.to + "/"),
      )
      .map((sub) => sub.group!),
  );

  // localStorage key for group order persistence
  const storageKey = `sidebar-group-order-${label}`;

  const [groupOrder, setGroupOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        // Merge: keep saved order for known groups, append any new ones
        const merged = parsed.filter((g) => groupNames.includes(g));
        groupNames.forEach((g) => {
          if (!merged.includes(g)) merged.push(g);
        });
        return merged;
      }
    } catch {
      // ignore
    }
    return groupNames;
  });

  // Keep groupOrder in sync if groupNames change (new items added)
  useEffect(() => {
    setGroupOrder((prev) => {
      const merged = prev.filter((g) => groupNames.includes(g));
      groupNames.forEach((g) => {
        if (!merged.includes(g)) merged.push(g);
      });
      return merged;
    });
  }, [groupNames.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // DnD sensors for sub-group reordering
  const subGroupSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleSubGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groupOrder.indexOf(String(active.id));
    const newIndex = groupOrder.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(groupOrder, oldIndex, newIndex);
    setGroupOrder(newOrder);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  // Auto-expand when navigating into this section
  useEffect(() => {
    if (isAnyChildActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isAnyChildActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Measure content height with ResizeObserver — reacts to sub-group toggles in real time
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setContentHeight(el.scrollHeight);
    const observer = new ResizeObserver(() => {
      setContentHeight(el.scrollHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Collapsed state — show icon only with flyout on hover
  if (isCollapsed) {
    return (
      <div className="relative group mx-2">
        <div
          className={`
            flex items-center justify-center p-2 rounded-md text-sm transition-colors cursor-pointer
            ${isAnyChildActive ? "bg-bg-hover text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"}
          `}
          title={label}
        >
          <Icon size={18} />
        </div>
        {/* Flyout submenu — flat list with group headers (no sub-accordions needed here) */}
        <div className="absolute left-full top-0 ml-2 py-1 bg-bg-tertiary border border-border-default rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
          <div className="px-3 py-1.5 text-xs font-medium text-text-muted border-b border-border-default mb-1">
            {label}
          </div>
          {subItems.map((sub, idx) => {
            const SubIcon = sub.icon;
            const isSubActive = location.pathname === sub.to;
            const showGroupHeader =
              sub.group && (idx === 0 || subItems[idx - 1].group !== sub.group);
            return (
              <React.Fragment key={sub.to}>
                {showGroupHeader && (
                  <div
                    className={`
                      flex items-center gap-1.5 px-3 pt-2 pb-0.5 text-[9px] font-semibold tracking-widest uppercase text-text-muted/50
                      ${idx > 0 ? "border-t border-border-default/30 mt-1" : ""}
                    `}
                  >
                    {groupBrandIcons[sub.group!] && (
                      <span className="flex-shrink-0">
                        {groupBrandIcons[sub.group!]}
                      </span>
                    )}
                    {sub.group}
                  </div>
                )}
                <NavLink
                  to={sub.to}
                  onClick={onNavigate}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm transition-colors
                    ${isSubActive ? "text-accent-primary bg-accent-primary/10" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"}
                  `}
                >
                  <SubIcon size={14} />
                  <span>{sub.label}</span>
                </NavLink>
              </React.Fragment>
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
          ${isAnyChildActive ? "bg-bg-hover text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"}
        `}
        style={{ width: "calc(100% - 16px)" }}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`ml-auto flex-shrink-0 text-text-muted transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
        />
      </button>

      {/* Animated submenu — use 'none' when fully expanded to avoid flicker on route changes */}
      <div
        className={`overflow-hidden ${isExpanded ? "" : "transition-[max-height] duration-300 ease-in-out"}`}
        style={{ maxHeight: isExpanded ? "none" : "0px" }}
      >
        <div ref={contentRef} className="pl-4 mt-0.5 space-y-0.5">
          {/* 1. Ungrouped items first */}
          {ungroupedItems.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive =
              location.pathname === sub.to ||
              location.pathname.startsWith(sub.to + "/");
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                onClick={onNavigate}
                className={`
                  flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm transition-colors
                  ${
                    isSubActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                  }
                `}
              >
                <SubIcon size={14} className="flex-shrink-0" />
                <span className="truncate">{sub.label}</span>
              </NavLink>
            );
          })}

          {/* 2. Grouped items as collapsible sub-accordions with DnD reordering */}
          {groupOrder.length > 0 && (
            <DndContext
              sensors={subGroupSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubGroupDragEnd}
            >
              <SortableContext
                items={groupOrder}
                strategy={verticalListSortingStrategy}
              >
                {groupOrder.map((groupName) => {
                  const items = groupMap[groupName];
                  if (!items) return null;
                  return (
                    <SortableSubGroup
                      key={groupName}
                      id={groupName}
                      groupName={groupName}
                      items={items}
                      onNavigate={onNavigate}
                      defaultExpanded={activeGroupNames.has(groupName)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION TITLE STYLES
// ============================================

const sectionStyles: Record<
  string,
  { color: string; bgColor: string; borderColor: string; dotColor: string }
> = {
  RECEITA: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/40",
    dotColor: "bg-emerald-400",
  },
  AQUISIÇÃO: {
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/40",
    dotColor: "bg-blue-400",
  },
  ENTREGA: {
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/40",
    dotColor: "bg-amber-400",
  },
  INTELIGÊNCIA: {
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/40",
    dotColor: "bg-purple-400",
  },
  OPERAÇÕES: {
    color: "text-slate-300",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/40",
    dotColor: "bg-slate-400",
  },
  IMOBILIÁRIA: {
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/40",
    dotColor: "bg-cyan-400",
  },
  SISTEMA: {
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/40",
    dotColor: "bg-rose-400",
  },
};

const defaultSectionStyle = {
  color: "text-text-muted",
  bgColor: "bg-transparent",
  borderColor: "border-border-default",
  dotColor: "bg-text-muted",
};

const SectionTitle = ({
  title,
  isCollapsed,
  isSectionExpanded,
  onToggle,
}: {
  title: string;
  isCollapsed: boolean;
  isSectionExpanded?: boolean;
  onToggle?: () => void;
}) => {
  if (!title) return null;

  const style = sectionStyles[title] ?? defaultSectionStyle;

  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2 mt-1 mb-0.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${style.dotColor} opacity-70`}
          title={title}
        />
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={`
        w-full flex items-center justify-between
        mt-3 mb-0.5 mx-2 px-2 py-1
        rounded-md
        border-l-2 ${style.borderColor}
        ${style.bgColor}
        transition-colors group
      `}
      style={{ width: "calc(100% - 16px)" }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${style.dotColor} flex-shrink-0`}
        />
        <span
          className={`text-[11px] font-semibold tracking-widest uppercase ${style.color} group-hover:brightness-125 transition-all`}
        >
          {title}
        </span>
      </div>
      <ChevronDown
        size={11}
        className={`${style.color} opacity-60 transition-transform duration-200 flex-shrink-0 ${isSectionExpanded ? "" : "-rotate-90"}`}
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
  onToggleCollapse,
}: SidebarProps) => {
  const { user, signOut } = useAuth();
  const { hasPermission, role, isAdmin, isClient } = usePermissions();
  const {
    selectedAccount,
    selectSubconta,
    backToAdmin,
    loading: accountLoading,
  } = useAccount();
  const { brandName, logoUrl } = useTheme();
  const { locations, loading: locationsLoading } = useLocations();
  const { criticalCount } = useAiosContextHealth();
  const {
    loaded: orderLoaded,
    customItems,
    reorderItems,
    moveItemToSection,
    addCustomLink,
    removeCustomLink,
    applyItemOrder,
    renameItem,
    getCustomLabel,
    getItemSection,
  } = useSidebarOrder();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemKey: string;
    itemLabel: string;
    sectionKey: string;
    isCustomLink: boolean;
  } | null>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  // Build lookup of all hardcoded items for cross-section moves
  const allItemsMap = useMemo(() => {
    const map: Record<
      string,
      { item: NavItemConfig; originalSection: string }
    > = {};
    navSections.forEach((section, idx) => {
      const key = section.title || `_root_${idx}`;
      section.items.forEach((item) => {
        map[item.label] = { item, originalSection: key };
      });
    });
    return map;
  }, []);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
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
    if (!user?.email) return "U";
    const email = user.email;
    const name = user.user_metadata?.full_name || email.split("@")[0];
    const parts = name.split(" ");
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
      return user.email.split("@")[0];
    }
    return "Usuário";
  };

  // Get role label
  const getRoleLabel = () => {
    const labels = {
      admin: "Administrador",
      manager: "Gerente",
      client: "Cliente",
      recruiter: "Recrutador",
    };
    return labels[role] || "Usuário";
  };

  // Badge dinâmico do Synapse (alertas críticos)
  const synapseNavSections = navSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (criticalCount > 0) {
        // Badge no item direto
        if (item.to === "/aios/synapse") {
          return { ...item, badge: String(criticalCount) };
        }
        // Badge no pai se Synapse está nos subItems
        if (item.subItems?.some((sub) => sub.to === "/aios/synapse")) {
          return { ...item, badge: String(criticalCount) };
        }
      }
      return item;
    }),
  }));

  // Filtrar seções e itens baseado em permissões
  const filteredSections = synapseNavSections
    .filter((section) => {
      // Se a seção tem permissão requerida, verificar
      if (section.permission && !hasPermission(section.permission)) {
        return false;
      }
      // Verificar se pelo menos um item é visível
      return section.items.some(
        (item) => !item.permission || hasPermission(item.permission),
      );
    })
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(item.permission),
      ),
    }));

  // Classes condicionais para mobile/desktop/collapsed
  const sidebarClasses = isMobile
    ? `fixed left-0 top-0 h-screen w-[280px] bg-bg-secondary border-r border-border-default flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : `${isCollapsed ? "w-[68px]" : "w-[260px]"} h-screen bg-bg-secondary border-r border-border-default flex flex-col sticky top-0 transition-all duration-300 ease-in-out`;

  return (
    <aside className={sidebarClasses}>
      {/* Header */}
      <div
        className={`h-[52px] flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 border-b border-border-default`}
      >
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              className="w-5 h-5 rounded-sm object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 bg-text-primary rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-bg-primary text-xs font-bold">
                {brandName[0] ?? "M"}
              </span>
            </div>
          )}
          {!isCollapsed && <span>{brandName}</span>}
        </div>
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-hover rounded-md transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        ) : (
          !isCollapsed &&
          onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-bg-hover rounded-md transition-colors text-text-muted hover:text-text-primary"
              aria-label="Recolher sidebar"
              title="Recolher sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )
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
        <div
          className={`${isCollapsed ? "px-2" : "px-3"} py-2 border-b border-border-default`}
        >
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
          <span
            className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${
              isClient
                ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }
          `}
          >
            {getRoleLabel()}
          </span>
        </div>
      )}

      {/* Nav - Filtrado por permissões + DnD reordenável + cross-section moves */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {filteredSections.map((section, sectionIndex) => {
          const expanded = isSectionExpanded(section);
          const sectionKey = section.title || `_root_${sectionIndex}`;

          // Compute effective items: original + moved-in items, minus moved-out items
          const baseItems = section.items.filter((item) => {
            const movedTo = getItemSection(item.label);
            return !movedTo || movedTo === sectionKey;
          });

          // Find items moved INTO this section from other sections
          const movedInItems: NavItemConfig[] = [];
          Object.entries(allItemsMap).forEach(
            ([label, { item, originalSection }]) => {
              if (originalSection === sectionKey) return;
              const movedTo = getItemSection(label);
              if (movedTo === sectionKey) {
                movedInItems.push(item);
              }
            },
          );

          const allSectionItems = [...baseItems, ...movedInItems];

          // Apply saved item order
          const orderedItemLabels = applyItemOrder(
            sectionKey,
            allSectionItems.map((i) => i.label),
          );
          const orderedItems = orderedItemLabels
            .map((label) => allSectionItems.find((i) => i.label === label))
            .filter(Boolean) as NavItemConfig[];
          // Add any items not in saved order (new items)
          allSectionItems.forEach((item) => {
            if (!orderedItems.find((o) => o.label === item.label)) {
              orderedItems.push(item);
            }
          });
          const sortableIds = orderedItems.map(
            (i) => `${sectionKey}::${i.label}`,
          );

          const handleSectionDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveItemId(null);
            if (!over || active.id === over.id) return;
            const oldIndex = sortableIds.indexOf(String(active.id));
            const newIndex = sortableIds.indexOf(String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;
            const newOrder = arrayMove(
              orderedItems.map((i) => i.label),
              oldIndex,
              newIndex,
            );
            reorderItems(sectionKey, newOrder);
          };

          const startEditing = (itemKey: string, currentLabel: string) => {
            const customLabel = getCustomLabel(itemKey);
            setEditingId(itemKey);
            setEditValue(customLabel || currentLabel);
          };

          const finishEditing = () => {
            if (editingId && editValue.trim()) {
              const originalLabel = editingId.split("::")[1];
              if (editValue.trim() !== originalLabel) {
                renameItem(editingId, editValue.trim());
              } else {
                renameItem(editingId, "");
              }
            }
            setEditingId(null);
            setEditValue("");
          };

          const openContextMenu = (
            e: React.MouseEvent,
            itemKey: string,
            itemLabel: string,
            isCustom: boolean,
          ) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              itemKey,
              itemLabel,
              sectionKey,
              isCustomLink: isCustom,
            });
          };

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
                  expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <DndContext
                  sensors={dndSensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e: DragStartEvent) =>
                    setActiveItemId(String(e.active.id))
                  }
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={sortableIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedItems.map((item) => {
                      const itemId = `${sectionKey}::${item.label}`;
                      const displayLabel = getCustomLabel(itemId) || item.label;

                      // Inline editing mode
                      if (editingId === itemId && !isCollapsed) {
                        return (
                          <div key={itemId} className="mx-2 my-0.5">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={finishEditing}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") finishEditing();
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditValue("");
                                }
                              }}
                              className="w-full px-3 py-1.5 text-sm bg-bg-primary border border-accent-primary rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                              autoFocus
                            />
                          </div>
                        );
                      }

                      return (
                        <DraggableWrapper
                          key={itemId}
                          id={itemId}
                          isCollapsed={isCollapsed}
                          onDoubleClick={() =>
                            !isCollapsed && startEditing(itemId, item.label)
                          }
                          onContextMenu={(e) =>
                            openContextMenu(e, itemId, item.label, false)
                          }
                        >
                          {item.subItems && item.subItems.length > 0 ? (
                            <SidebarExpandableItem
                              icon={item.icon}
                              label={displayLabel}
                              to={item.to}
                              subItems={item.subItems}
                              onNavigate={handleNavigate}
                              isCollapsed={isCollapsed}
                            />
                          ) : (
                            <SidebarItem
                              icon={item.icon}
                              label={displayLabel}
                              to={item.to}
                              badge={item.badge}
                              onNavigate={handleNavigate}
                              isCollapsed={isCollapsed}
                            />
                          )}
                        </DraggableWrapper>
                      );
                    })}
                  </SortableContext>
                  <DragOverlay>
                    {activeItemId && (
                      <div className="bg-bg-secondary border border-border-default rounded-md px-3 py-1.5 text-sm shadow-lg text-text-primary opacity-90">
                        {getCustomLabel(activeItemId) ||
                          activeItemId.split("::")[1]}
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                {/* Custom links in this section */}
                {customItems
                  .filter((ci) => ci.section_title === sectionKey)
                  .map((ci) => (
                    <div
                      key={ci.id}
                      className="group/custom relative"
                      onContextMenu={(e) =>
                        openContextMenu(e, `custom::${ci.id}`, ci.label, true)
                      }
                    >
                      {isCollapsed ? (
                        <a
                          href={ci.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 mx-2 rounded-md text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors relative group"
                          title={ci.label}
                        >
                          <ExternalLink size={18} />
                          <div className="absolute left-full ml-2 px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                            {ci.label}
                          </div>
                        </a>
                      ) : (
                        <a
                          href={ci.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                        >
                          <ExternalLink size={16} />
                          <span className="truncate">{ci.label}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeCustomLink(ci.id);
                            }}
                            className="ml-auto opacity-0 group-hover/custom:opacity-100 p-0.5 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}

        {/* Link externo para documentação - só para admins/managers */}
        {hasPermission("canEditPrompts") &&
          (isCollapsed ? (
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
          ))}
      </nav>

      {/* Add custom link button */}
      {!isCollapsed && (
        <div className="px-3 pb-1">
          {showAddLink ? (
            <div className="space-y-2 p-2 bg-bg-tertiary rounded-lg border border-border-default">
              <input
                type="text"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Nome do link..."
                className="w-full px-2 py-1 text-xs bg-bg-primary border border-border-default rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                autoFocus
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2 py-1 text-xs bg-bg-primary border border-border-default rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (newLinkLabel.trim() && newLinkUrl.trim()) {
                      addCustomLink(
                        newLinkLabel.trim(),
                        newLinkUrl.trim(),
                        "_root_0",
                      );
                      setNewLinkLabel("");
                      setNewLinkUrl("");
                      setShowAddLink(false);
                    }
                  }}
                  disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                  className="flex-1 px-2 py-1 text-xs bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddLink(false);
                    setNewLinkLabel("");
                    setNewLinkUrl("");
                  }}
                  className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddLink(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
            >
              <Plus size={14} />
              <span>Adicionar link</span>
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className={`${isCollapsed ? "p-2" : "p-4"} border-t border-border-default`}
      >
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
              <span className="text-sm font-medium text-text-primary truncate">
                {getDisplayName()}
              </span>
              <span className="text-xs text-text-muted truncate">
                {getRoleLabel()}
              </span>
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-bg-secondary border border-border-default rounded-lg shadow-xl py-1 min-w-[180px] text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Renomear */}
          <button
            onClick={() => {
              const customLabel = getCustomLabel(contextMenu.itemKey);
              setEditingId(contextMenu.itemKey);
              setEditValue(customLabel || contextMenu.itemLabel);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-left"
          >
            <Pencil size={14} />
            <span>Renomear</span>
          </button>

          {/* Mover para... */}
          {!contextMenu.isCustomLink && (
            <>
              <div className="border-t border-border-default my-1" />
              <div className="px-3 py-1 text-xs text-text-muted font-medium">
                Mover para...
              </div>
              {filteredSections
                .filter((s) => {
                  const key = s.title || `_root_0`;
                  return key !== contextMenu.sectionKey;
                })
                .map((s, idx) => {
                  const targetKey = s.title || `_root_${idx}`;
                  return (
                    <button
                      key={targetKey}
                      onClick={() => {
                        moveItemToSection(contextMenu.itemLabel, targetKey);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors text-left"
                    >
                      <ArrowRight size={14} />
                      <span>{s.title || "Principal"}</span>
                    </button>
                  );
                })}
            </>
          )}

          {/* Deletar (apenas custom links) */}
          {contextMenu.isCustomLink && (
            <>
              <div className="border-t border-border-default my-1" />
              <button
                onClick={() => {
                  const customId = contextMenu.itemKey.replace("custom::", "");
                  removeCustomLink(customId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 size={14} />
                <span>Deletar</span>
              </button>
            </>
          )}

          {/* Resetar nome (se tem custom label) */}
          {getCustomLabel(contextMenu.itemKey) && (
            <>
              <div className="border-t border-border-default my-1" />
              <button
                onClick={() => {
                  renameItem(contextMenu.itemKey, "");
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors text-left"
              >
                <RefreshCw size={14} />
                <span>Restaurar nome original</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
