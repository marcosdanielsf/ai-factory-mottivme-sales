import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Settings,
  Box,
  Phone,
  Users,
  Database,
  Bell,
  TestTube2,
  MessageSquare,
  ScrollText,
  RefreshCw,
  BookOpen,
  ExternalLink,
  LogOut,
  DollarSign,
  Trophy
} from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to, 
  hasSubmenu = false, 
  isOpen = false, 
  onToggle,
  badge,
  indent = 0
}: any) => {
  const location = useLocation();
  const isActive = to ? location.pathname === to || location.pathname.startsWith(to + '/') : false;
  
  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer text-sm transition-colors
          ${isActive && !hasSubmenu ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
        `}
        style={{ paddingLeft: `${indent * 12 + 12}px` }}
        onClick={hasSubmenu ? onToggle : undefined}
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

export const Sidebar = () => {
  const [clientsOpen, setClientsOpen] = useState(true);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
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

  return (
    <aside className="w-[260px] h-screen bg-bg-secondary border-r border-border-default flex flex-col sticky top-0">
      {/* Header */}
      <div className="h-[52px] flex items-center px-4 border-b border-border-default">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <div className="w-5 h-5 bg-text-primary rounded-sm flex items-center justify-center">
            <span className="text-bg-primary text-xs font-bold">M</span>
          </div>
          <span>MOTTIV.ME</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        <SidebarItem icon={Home} label="Control Tower" to="/" />
        <SidebarItem icon={Bell} label="Alertas & Monitor" to="/notificacoes" badge="2" />
        
        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          SALES OS
        </div>
        <SidebarItem icon={Users} label="Funil de Leads" to="/leads" badge="87" />
        <SidebarItem icon={Phone} label="Calls Realizadas" to="/calls" />

        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          AI FACTORY
        </div>
        <SidebarItem icon={Box} label="Prompt Studio" to="/prompt-studio" />
        <SidebarItem icon={TestTube2} label="Testes & Qualidade" to="/validacao" />
        <SidebarItem icon={RefreshCw} label="Reflection Loop" to="/reflection-loop" />
        <SidebarItem icon={ScrollText} label="Logs de Conversa" to="/logs" />
        <SidebarItem icon={Database} label="Artifacts & Docs" to="/knowledge-base" />
        
        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          GAMIFICATION
        </div>
        <SidebarItem icon={Users} label="Squads RPG" to="/team-rpg" />
        
        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          SISTEMA
        </div>
        <SidebarItem icon={Trophy} label="Performance Clientes" to="/performance" />
        <SidebarItem icon={DollarSign} label="Custos por Cliente" to="/custos" />
        <SidebarItem icon={Settings} label="Configurações" to="/configuracoes" />

        {/* Link externo para documentação */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md cursor-pointer text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <BookOpen size={16} />
          <span>Documentação</span>
          <ExternalLink size={12} className="ml-auto opacity-50" />
        </a>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-default">
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
      </div>
    </aside>
  );
};
