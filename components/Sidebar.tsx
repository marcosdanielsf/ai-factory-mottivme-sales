import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Settings, 
  Clock, 
  Plus,
  Box,
  BarChart2,
  Phone,
  Users,
  Database,
  Search
} from 'lucide-react';
import { MOCK_CLIENTS } from '../constants';

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
  const [clientSubmenus, setClientSubmenus] = useState<Record<string, boolean>>({});

  const toggleClient = (clientId: string) => {
    setClientSubmenus(prev => ({...prev, [clientId]: !prev[clientId]}));
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
        <SidebarItem icon={Home} label="Dashboard" to="/" />
        <SidebarItem icon={Users} label="Leads Agendados" to="/leads" badge="85" />
        <SidebarItem icon={Database} label="Knowledge Base" to="/knowledge-base" />
        
        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          CLIENTES
        </div>

        <SidebarItem 
          icon={Folder} 
          label="Todos os Clientes" 
          hasSubmenu 
          isOpen={clientsOpen} 
          onToggle={() => setClientsOpen(!clientsOpen)} 
        />
        
        {clientsOpen && (
          <div className="space-y-0.5">
            {MOCK_CLIENTS.map(client => (
              <React.Fragment key={client.id}>
                <SidebarItem 
                  label={client.empresa} 
                  hasSubmenu 
                  isOpen={clientSubmenus[client.id]}
                  onToggle={() => toggleClient(client.id)}
                  indent={1}
                />
                {clientSubmenus[client.id] && (
                  <>
                     <SidebarItem 
                        icon={Box} 
                        label="Agente" 
                        to={`/clientes/${client.id}/agente`} 
                        indent={2} 
                      />
                      <SidebarItem 
                        icon={Phone} 
                        label="Calls" 
                        to={`/clientes/${client.id}/calls`} 
                        indent={2} 
                      />
                      <SidebarItem 
                        icon={BarChart2} 
                        label="Métricas" 
                        to={`/clientes/${client.id}/metricas`} 
                        indent={2} 
                      />
                  </>
                )}
              </React.Fragment>
            ))}
             <SidebarItem 
              icon={Plus} 
              label="Novo Cliente" 
              indent={1} 
              to="/clientes/new"
            />
          </div>
        )}

        <div className="pt-4 pb-1 px-4 text-xs font-medium text-text-muted">
          WORKSPACE
        </div>
        
        <SidebarItem icon={FileText} label="Templates" to="/templates" />
        <SidebarItem icon={Clock} label="Aprovações" to="/aprovacoes" badge={3} />
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