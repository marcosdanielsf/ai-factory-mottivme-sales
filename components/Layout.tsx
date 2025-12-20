import React from 'react';
import { Sidebar } from './Sidebar';
import { Search, Bell } from 'lucide-react';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-[52px] border-b border-border-default flex items-center justify-between px-6 bg-bg-primary/80 backdrop-blur sticky top-0 z-10">
          {/* Breadcrumb Area */}
          <div className="text-sm text-text-muted flex items-center gap-2">
            <span className="hidden md:inline">Mottiv.me</span>
            <span className="text-text-muted/50">/</span>
            <span className="text-text-primary font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-sm text-text-muted w-64 hover:border-text-muted transition-colors cursor-pointer group">
              <Search size={14} className="group-hover:text-text-primary transition-colors" />
              <span>Buscar...</span>
              <kbd className="ml-auto text-[10px] border border-border-default rounded px-1 bg-bg-tertiary">⌘K</kbd>
            </div>
            <button className="text-text-secondary hover:text-text-primary transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-error rounded-full"></span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};