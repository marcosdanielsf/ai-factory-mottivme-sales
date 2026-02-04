import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Settings,
  Box,
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
  X,
  PanelLeftClose,
  PanelLeft,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to, 
  hasSubmenu = false, 
  isOpen = false, 
  onToggle,
  badge,
  indent = 0,
  onNavigate,
  isCollapsed = false
}: any) => {
  const location = useLocation();
  const isActive = to ? location.pathname === to || location.pathname.startsWith(to + '/') : false;
  
  const handleClick = () => {
    if (!hasSubmenu && onNavigate) {
      onNavigate();
    }
  };
  
  // Collapsed state - show only icon with tooltip
  if (isCollapsed) {
    return (
      <div className="select-none">
        <div 
          className={`
            flex items-center justify-center p-2 mx-2 rounded-md cursor-pointer text-sm transition-colors relative group
            ${isActive && !hasSubmenu ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
          `}
          onClick={hasSubmenu ? onToggle : handleClick}
          title={label}
        >
          {to && !hasSubmenu ? (
            <NavLink to={to} className="flex items-center justify-center">
              {Icon && <Icon size={18} />}
            </NavLink>
          ) : (
            <div className="flex items-center justify-center">
              {Icon && <Icon size={18} />}
            </div>
          )}
          {badge && (
            <span className="absolute -top-1 -right-1 bg-accent-primary text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full">
              {badge}
            </span>
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
            {label}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer text-sm transition-colors
          ${isActive && !hasSubmenu ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
        `}
        style={{ paddingLeft: `${indent * 12 + 12}px` }}
        onClick={hasSubmenu ? onToggle : handleClick}
      >
        {to && !hasSubmenu ? (
          <NavLink to={to} className="flex items-center gap-2 flex-1 truncate">
            {Icon && <Icon size={16} />}
            <span className="truncate">{label}</span>
          </NavLink>
        ) : (
          <div className="flex items-center gap-2 flex-1 truncate">
             {hasSubmenu && (
              <span className="text-text-muted">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
            {Icon && <Icon size={16} />}
            <span className="truncate">{label}</span>
          </div>
        )}
        {badge && (
          <span className="ml-auto bg-accent-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

export const Sidebar = ({ isMobile = false, isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const [clientsOpen, setClientsOpen] = useState(true);
  const { user, signOut } = useAuth();

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

  // Classes condicionais para mobile/desktop/collapsed
  const sidebarClasses = isMobile
    ? `fixed left-0 top-0 h-screen w-[280px] bg-bg-secondary border-r border-border-default flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `${isCollapsed ? 'w-[68px]' : 'w-[260px]'} h-screen bg-bg-secondary border-r border-border-default flex flex-col sticky top-0 transition-all duration-300 ease-in-out`;

  return (
    <aside className={sidebarClasses}>
      {/* Header */}
      <div className={`h-[52px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 border-b border-border-default`}>
        <div className={`flex items-center gap-2 font-semibold text-text-primary ${isCollapsed ? '' : ''}`}>
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        <SidebarItem icon={Home} label="Control Tower" to="/" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        
        {!isCollapsed && (
          <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
            SALES OS
          </div>
        )}
        {isCollapsed && <div className="pt-2 border-t border-border-default mx-2 mt-2" />}
        <SidebarItem icon={BarChart3} label="Sales Ops" to="/sales-ops" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={Eye} label="Supervisao IA" to="/supervision" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={CalendarCheck} label="Agendamentos" to="/agendamentos" onNavigate={handleNavigate} isCollapsed={isCollapsed} />

        {!isCollapsed && (
          <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
            AI FACTORY
          </div>
        )}
        {isCollapsed && <div className="pt-2 border-t border-border-default mx-2 mt-2" />}
        <SidebarItem icon={Box} label="Prompt Studio" to="/prompt-studio" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={TestTube2} label="Testes & Qualidade" to="/validacao" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={RefreshCw} label="Reflection Loop" to="/reflection-loop" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={Sparkles} label="Evolucao Agente" to="/evolution" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={Database} label="Artifacts & Docs" to="/knowledge-base" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        
        {!isCollapsed && (
          <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
            GAMIFICATION
          </div>
        )}
        {isCollapsed && <div className="pt-2 border-t border-border-default mx-2 mt-2" />}
        <SidebarItem icon={Users} label="Squads RPG" to="/team-rpg" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        
        {!isCollapsed && (
          <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
            SISTEMA
          </div>
        )}
        {isCollapsed && <div className="pt-2 border-t border-border-default mx-2 mt-2" />}
        <SidebarItem icon={Trophy} label="Performance Clientes" to="/performance" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={DollarSign} label="Custos por Cliente" to="/custos" onNavigate={handleNavigate} isCollapsed={isCollapsed} />
        <SidebarItem icon={Settings} label="Configurações" to="/configuracoes" onNavigate={handleNavigate} isCollapsed={isCollapsed} />

        {/* Link externo para documentação */}
        {isCollapsed ? (
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
                {getDisplayName()}
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
              <span className="text-xs text-text-muted truncate">{user?.email || 'user@example.com'}</span>
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
