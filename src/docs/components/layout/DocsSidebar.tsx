import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Rocket, 
  Bot, 
  GitBranch, 
  Plug, 
  Brain, 
  Workflow,
  FileText,
  History,
  ChevronRight,
  Zap,
  Settings,
  Database,
  Globe
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const sidebarItems: SidebarItem[] = [
  { label: 'Overview', href: '/docs', icon: Home },
  { 
    label: 'Quick Start', 
    href: '/docs/quick-start', 
    icon: Rocket,
    children: [
      { label: 'Instalação', href: '/docs/quick-start/install' },
      { label: 'Primeiro Agente', href: '/docs/quick-start/first-agent' },
      { label: 'Configuração', href: '/docs/quick-start/configuration' },
    ]
  },
  { 
    label: 'Skills', 
    href: '/docs/skills', 
    icon: Bot,
    children: [
      { label: 'Automação', href: '/docs/skills/automation' },
      { label: 'Pesquisa', href: '/docs/skills/research' },
      { label: 'Social', href: '/docs/skills/social' },
      { label: 'AI/Prompt', href: '/docs/skills/ai-prompt' },
      { label: 'Integração', href: '/docs/skills/integration' },
      { label: 'Vendas', href: '/docs/skills/sales' },
    ]
  },
  { 
    label: 'Pipelines', 
    href: '/docs/pipelines', 
    icon: GitBranch,
    children: [
      { label: 'Agent Factory', href: '/docs/pipelines/agent-factory' },
      { label: 'Outbound', href: '/docs/pipelines/outbound' },
      { label: 'Self-Improvement', href: '/docs/pipelines/self-improvement' },
      { label: 'QA Analyst', href: '/docs/pipelines/qa-analyst' },
    ]
  },
  { 
    label: 'GHL Integration', 
    href: '/docs/ghl-integration', 
    icon: Plug,
    children: [
      { label: 'Overview', href: '/docs/ghl-integration/overview' },
      { label: 'MCP Tools', href: '/docs/ghl-integration/mcp-tools' },
      { label: 'Tokens', href: '/docs/ghl-integration/tokens' },
      { label: 'Subcontas', href: '/docs/ghl-integration/subcontas' },
      { label: 'Webhooks', href: '/docs/ghl-integration/webhooks' },
    ]
  },
  { 
    label: 'Mentes Sintéticas', 
    href: '/docs/mentes-sinteticas', 
    icon: Brain,
    children: [
      { label: 'Overview', href: '/docs/mentes-sinteticas/overview' },
      { label: 'Schema', href: '/docs/mentes-sinteticas/schema' },
      { label: 'Pipeline', href: '/docs/mentes-sinteticas/pipeline' },
      { label: 'Exemplos', href: '/docs/mentes-sinteticas/examples' },
    ]
  },
  { 
    label: 'n8n Workflows', 
    href: '/docs/n8n-workflows', 
    icon: Workflow,
    children: [
      { label: 'Catálogo', href: '/docs/n8n-workflows/catalog' },
      { label: 'Best Practices', href: '/docs/n8n-workflows/best-practices' },
    ]
  },
  { 
    label: 'Reference', 
    href: '/docs/reference', 
    icon: FileText,
    children: [
      { label: 'API', href: '/docs/reference/api' },
      { label: 'Database Schema', href: '/docs/reference/database-schema' },
      { label: 'Environment', href: '/docs/reference/environment' },
    ]
  },
  { label: 'Changelog', href: '/docs/changelog', icon: History },
];

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: SidebarItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(child => isActive(child.href)) ?? false;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-14 bottom-0 left-0 z-40 w-64 
          bg-[var(--color-docs-bg)] border-r border-[var(--color-docs-border)]
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
        `}
      >
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <div key={item.href}>
              <NavLink
                to={item.href}
                end={!item.children}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isParentActive(item) 
                    ? 'bg-[var(--color-docs-primary)]/10 text-[var(--color-docs-primary)]' 
                    : 'text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)] hover:bg-[var(--color-docs-muted)]'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
                {item.children && (
                  <ChevronRight 
                    size={14} 
                    className={`ml-auto transition-transform duration-200 ${isParentActive(item) ? 'rotate-90' : ''}`} 
                  />
                )}
              </NavLink>

              {/* Children (collapsed by default, expanded when parent is active) */}
              {item.children && isParentActive(item) && (
                <div className="ml-6 mt-1 space-y-1 border-l border-[var(--color-docs-border)] pl-3">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className={({ isActive }) => `
                        block px-3 py-1.5 rounded-lg text-sm
                        transition-colors duration-150
                        ${isActive 
                          ? 'text-[var(--color-docs-primary)] bg-[var(--color-docs-primary)]/5' 
                          : 'text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)]'
                        }
                      `}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Version footer */}
        <div className="p-4 mt-auto border-t border-[var(--color-docs-border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--color-docs-muted-fg)]">
            <Zap size={12} className="text-[var(--color-docs-primary)]" />
            <span>AI Factory V3</span>
            <span className="ml-auto px-1.5 py-0.5 bg-[var(--color-docs-muted)] rounded text-[10px]">
              beta
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
