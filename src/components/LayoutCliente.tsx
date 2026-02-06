import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAccount } from '../contexts/AccountContext';

interface LayoutClienteProps {
  children: React.ReactNode;
}

const CLIENT_NAV_ITEMS = [
  { path: '/sales-ops', label: 'Sales Ops', icon: BarChart3 },
  { path: '/agendamentos', label: 'Agendamentos', icon: Calendar },
  { path: '/status', label: 'Central de Status', icon: CheckCircle2 },
];

export const LayoutCliente: React.FC<LayoutClienteProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const isMobile = useIsMobile();
  const { selectedAccount, backToAdmin, isViewingSubconta } = useAccount();

  // Fechar sidebar ao mudar de página no mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (email: string) => {
    if (!email) return '??';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobile
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative'
        }
        w-64 bg-bg-secondary border-r border-border-default flex flex-col
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-lg">MOTTIV.ME</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-bg-tertiary rounded-md"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Sales OS
          </p>
          {CLIENT_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive || (item.path === '/sales-ops' && location.pathname === '/')
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          {/* Admin Access Button - Only show when admin is viewing subconta */}
          {isAdmin && isViewingSubconta && (
            <>
              <div className="my-4 border-t border-border-default" />
              <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Administrador
              </p>
              {selectedAccount && (
                <div className="mx-3 mb-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider">Visualizando</p>
                  <p className="text-sm font-medium text-text-primary truncate">{selectedAccount.location_name}</p>
                </div>
              )}
              <button
                onClick={() => {
                  backToAdmin();
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-purple-500/10 to-accent-primary/10 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 group"
              >
                <Shield size={18} />
                <span className="flex-1 text-left">Voltar para Admin</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border-default">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center text-accent-primary text-xs font-bold">
              {getInitials(user?.email || '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {isAdmin ? 'Administrador' : 'Cliente'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border-default flex items-center justify-between px-4 md:px-6 bg-bg-primary">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-bg-secondary rounded-md"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="text-sm">
              <span className="text-text-muted">Mottiv.me</span>
              <span className="text-text-muted/50 mx-2">/</span>
              <span className="text-text-primary font-medium">
                {CLIENT_NAV_ITEMS.find(item =>
                  item.path === location.pathname ||
                  (item.path === '/sales-ops' && location.pathname === '/')
                )?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Admin Quick Access (Desktop) - Only when viewing subconta */}
          {isAdmin && isViewingSubconta && !isMobile && (
            <button
              onClick={() => {
                backToAdmin();
                navigate('/');
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <Shield size={14} />
              Voltar Admin
            </button>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutCliente;
