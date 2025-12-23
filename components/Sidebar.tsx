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
  ScrollText
} from 'lucide-react';

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
        <SidebarItem icon={Home} label="Cockpit" to="/" />
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
        <SidebarItem icon={ScrollText} label="Logs de Conversa" to="/logs" />
        <SidebarItem icon={Database} label="Artifacts & Docs" to="/knowledge-base" />
        
        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          SISTEMA
        </div>
        <SidebarItem icon={Settings} label="Configurações" to="/config" />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-xs">
            MS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">Marcos Silva</span>
            <span className="text-xs text-text-muted">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};