import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Moon, Sun, Command, Bot, BookOpen, GitBranch, Plug, Workflow } from 'lucide-react';

interface DocsHeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  // ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Quick Start', href: '/docs/quick-start', icon: BookOpen },
    { label: 'Skills', href: '/docs/skills', icon: Bot },
    { label: 'Pipelines', href: '/docs/pipelines', icon: GitBranch },
    { label: 'GHL', href: '/docs/ghl-integration', icon: Plug },
    { label: 'n8n', href: '/docs/n8n-workflows', icon: Workflow },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-[var(--color-docs-border)] bg-[var(--color-docs-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-docs-bg)]/80">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Left: Logo + Mobile toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 -ml-2 hover:bg-[var(--color-docs-muted)] rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link to="/docs" className="flex items-center gap-2 font-semibold text-[var(--color-docs-fg)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-docs-primary)] flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <span className="hidden sm:inline">MOTTIVME AI Docs</span>
            </Link>
          </div>

          {/* Center: Nav links (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)] hover:bg-[var(--color-docs-muted)] rounded-lg transition-colors"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Search + Theme toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-docs-input)] border border-[var(--color-docs-border)] rounded-lg text-sm text-[var(--color-docs-muted-fg)] hover:border-[var(--color-docs-muted-fg)] transition-colors w-48 lg:w-64"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="hidden sm:inline text-[10px] border border-[var(--color-docs-border)] rounded px-1.5 py-0.5 bg-[var(--color-docs-muted)]">⌘K</kbd>
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 hover:bg-[var(--color-docs-muted)] rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsSearchOpen(false)} 
          />
          <div className="bg-[var(--color-docs-card)] border border-[var(--color-docs-border)] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden z-[101] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border-b border-[var(--color-docs-border)] flex items-center gap-3">
              <Search className="text-[var(--color-docs-muted-fg)]" size={20} />
              <input 
                autoFocus
                type="text" 
                placeholder="Buscar skills, pipelines, documentação..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[var(--color-docs-fg)] placeholder:text-[var(--color-docs-muted-fg)] text-lg"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 hover:bg-[var(--color-docs-muted)] rounded text-[var(--color-docs-muted-fg)]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {searchQuery.trim() === '' ? (
                <div className="text-center text-[var(--color-docs-muted-fg)] py-8">
                  <Command size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Busque por skills, pipelines ou documentação</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['n8n-workflow', 'gohighlevel', 'deep-research', 'agent-factory'].map(tag => (
                      <span 
                        key={tag} 
                        onClick={() => setSearchQuery(tag)}
                        className="px-2 py-1 bg-[var(--color-docs-muted)] rounded text-[10px] uppercase font-bold border border-[var(--color-docs-border)] cursor-pointer hover:border-[var(--color-docs-primary)] transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-[var(--color-docs-muted-fg)] py-8">
                  <p className="text-sm">Busca será implementada em breve...</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-[var(--color-docs-muted)] border-t border-[var(--color-docs-border)] flex items-center justify-between text-[10px] text-[var(--color-docs-muted-fg)] font-medium">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="border border-[var(--color-docs-border)] px-1 rounded bg-[var(--color-docs-card)]">↑↓</kbd> 
                  Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="border border-[var(--color-docs-border)] px-1 rounded bg-[var(--color-docs-card)]">Enter</kbd> 
                  Selecionar
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="border border-[var(--color-docs-border)] px-1 rounded bg-[var(--color-docs-card)]">Esc</kbd> 
                Fechar
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
