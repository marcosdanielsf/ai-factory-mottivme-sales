import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Search, Bell, X, Command, MessageSquare, Bot, FileText, Settings, User, Phone, Menu } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_ALERTS } from '../constants';
import { useAgents } from '../hooks';
import AISupportWidget from './AISupportWidget';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Recuperar preferência do localStorage
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { agents } = useAgents();
  const isMobile = useIsMobile();

  // Persistir preferência de sidebar collapsed
  const handleToggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };

  // Fechar sidebar ao mudar de página no mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Listen for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    
    const query = searchQuery.toLowerCase();
    const results = [];

    // Static Pages
    const pages = [
      { title: 'Dashboard', icon: Command, path: '/', type: 'Página' },
      { title: 'Prompt Studio', icon: Bot, path: '/prompt-studio', type: 'Ferramenta' },
      { title: 'Logs de Conversa', icon: MessageSquare, path: '/logs', type: 'Logs' },
      { title: 'Base de Conhecimento', icon: FileText, path: '/knowledge-base', type: 'Docs' },
      { title: 'Funil de Leads', icon: User, path: '/leads', type: 'Vendas' },
      { title: 'Calls Realizadas', icon: Phone, path: '/calls', type: 'Vendas' },
      { title: 'Configurações', icon: Settings, path: '/configuracoes', type: 'Sistema' },
    ];

    pages.forEach(p => {
      if (p.title.toLowerCase().includes(query)) {
        results.push(p);
      }
    });

    // Agents
    agents.forEach(agent => {
      if (agent.name.toLowerCase().includes(query)) {
        results.push({
          title: agent.name,
          icon: Bot,
          path: `/prompt-studio?agent=${agent.id}`,
          type: 'Agente'
        });
      }
    });

    return results;
  }, [searchQuery, agents]);

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      {/* Backdrop overlay para mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar com props de mobile e collapsed */}
      <Sidebar 
        isMobile={isMobile} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={!isMobile && sidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Hover detection area - triggers header visibility */}
        <div
          className="fixed top-0 left-0 right-0 h-2 z-20"
          onMouseEnter={() => setHeaderVisible(true)}
        />

        {/* Auto-hide header */}
        <header
          className={`h-[44px] border-b border-border-default flex items-center justify-between px-4 md:px-6 bg-bg-primary/95 backdrop-blur fixed top-0 left-0 right-0 z-10 transition-transform duration-300 ${
            headerVisible || isMobile || isNotificationsOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{ left: isMobile ? 0 : (sidebarCollapsed ? '64px' : '240px') }}
          onMouseEnter={() => setHeaderVisible(true)}
          onMouseLeave={() => !isNotificationsOpen && setHeaderVisible(false)}
        >
          {/* Mobile menu button + Breadcrumb Area */}
          <div className="text-xs text-text-muted flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 -ml-1 mr-1 hover:bg-bg-secondary rounded-md transition-colors"
                aria-label="Abrir menu"
              >
                <Menu size={20} className="text-text-primary" />
              </button>
            )}
            <span className="hidden md:inline text-text-muted/70">Mottiv.me</span>
            <span className="hidden md:inline text-text-muted/30">/</span>
            <span className="text-text-primary font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-2 py-1 bg-bg-secondary border border-border-default rounded text-xs text-text-muted w-48 hover:border-text-muted transition-colors cursor-pointer group"
            >
              <Search size={12} className="group-hover:text-text-primary transition-colors" />
              <span>Buscar...</span>
              <kbd className="ml-auto text-[9px] border border-border-default rounded px-1 bg-bg-tertiary">⌘K</kbd>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`text-text-secondary hover:text-text-primary transition-colors relative p-1 rounded-md ${isNotificationsOpen ? 'bg-bg-tertiary text-text-primary' : ''}`}
              >
                <Bell size={16} />
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-accent-error rounded-full"></span>
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-80 bg-bg-secondary border border-border-default rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border-default flex items-center justify-between bg-bg-tertiary">
                      <span className="text-xs font-bold uppercase tracking-wider">Notificações</span>
                      <button onClick={() => navigate('/notifications')} className="text-[10px] text-accent-primary hover:underline">Ver todas</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {MOCK_ALERTS.slice(0, 5).map(alert => (
                        <div key={alert.id} className="p-3 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full ${
                              alert.severity === 'critical' ? 'bg-accent-error/10 text-accent-error' : 'bg-accent-warning/10 text-accent-warning'
                            }`}>
                              <Bell size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text-primary truncate">{alert.title}</p>
                              <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">{alert.message}</p>
                              <p className="text-[10px] text-text-muted mt-1">{alert.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-7 h-7 rounded-full bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center text-accent-primary text-[10px] font-bold cursor-pointer hover:bg-accent-primary/30 transition-colors">
              MD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}></div>
          <div className="bg-bg-secondary border border-border-default w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden z-[101] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border-b border-border-default flex items-center gap-3">
              <Search className="text-text-muted" size={20} />
              <input 
                autoFocus
                type="text" 
                placeholder="O que você está procurando?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted text-lg"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 hover:bg-bg-tertiary rounded text-text-muted"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="p-8 text-center text-text-muted">
                  <Command size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Busque por páginas, agentes, leads ou configurações.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Dashboard', 'Prompt Studio', 'Logs'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-bg-tertiary rounded text-[10px] uppercase font-bold border border-border-default cursor-pointer hover:border-accent-primary transition-colors" onClick={() => setSearchQuery(tag)}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Resultados</p>
                  {searchResults.map(result => (
                    <div 
                      key={result.path}
                      onClick={() => {
                        navigate(result.path);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors group"
                    >
                      <div className="p-2 bg-bg-primary border border-border-default rounded group-hover:border-accent-primary transition-colors">
                        <result.icon size={18} className="text-text-secondary group-hover:text-accent-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{result.title}</p>
                        <p className="text-[10px] text-text-muted">{result.type}</p>
                      </div>
                      <kbd className="ml-auto text-[10px] text-text-muted">Enter</kbd>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-text-muted">
                  <p className="text-sm">Nenhum resultado encontrado para "{searchQuery}"</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-bg-tertiary border-t border-border-default flex items-center justify-between text-[10px] text-text-muted font-medium">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="border border-border-default px-1 rounded bg-bg-secondary">↑↓</kbd> Navegar</span>
                <span className="flex items-center gap-1"><kbd className="border border-border-default px-1 rounded bg-bg-secondary">Enter</kbd> Selecionar</span>
              </div>
              <span className="flex items-center gap-1"><kbd className="border border-border-default px-1 rounded bg-bg-secondary">Esc</kbd> Fechar</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Support Widget (Chat + Voice) */}
      <AISupportWidget currentPage={location.pathname} />
    </div>
  );
};