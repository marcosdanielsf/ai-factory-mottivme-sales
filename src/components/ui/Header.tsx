import React from 'react';
import { Search, Menu, X, Bot, Command } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

interface HeaderProps {
  logo?: React.ReactNode;
  title?: string;
  navItems?: NavItem[];
  onSearchClick?: () => void;
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
  className?: string;
}

export function Header({
  logo,
  title = 'MOTTIVME AI',
  navItems = [],
  onSearchClick,
  onMenuClick,
  isMobileMenuOpen = false,
  className = '',
}: HeaderProps) {
  return (
    <header
      className={`
        sticky top-0 z-40
        bg-[#0d0d0d]/80 backdrop-blur-xl
        border-b border-white/10
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logo || (
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
            )}
            <span className="font-bold text-white text-lg tracking-tight">
              {title}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLinkItem key={item.href} item={item} />
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            {onSearchClick && (
              <button
                onClick={onSearchClick}
                className="
                  flex items-center gap-2 px-3 py-1.5
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-white/20
                  rounded-lg transition-all
                  text-gray-400 hover:text-white
                "
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Search</span>
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded text-xs border border-white/10">
                  <Command className="w-3 h-3" />K
                </kbd>
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0d0d0d]">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="
                  block px-3 py-2 rounded-lg
                  text-gray-300 hover:text-white hover:bg-white/10
                  transition-colors
                "
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLinkItem({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (item.children && item.children.length > 0) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className="
            px-3 py-2 rounded-lg
            text-gray-400 hover:text-white hover:bg-white/10
            transition-colors text-sm font-medium
            flex items-center gap-1
          "
        >
          {item.label}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl min-w-[180px]">
            {item.children.map((child) => (
              <a
                key={child.href}
                href={child.href}
                className="
                  block px-4 py-2
                  text-gray-400 hover:text-white hover:bg-white/10
                  transition-colors text-sm
                "
              >
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className="
        px-3 py-2 rounded-lg
        text-gray-400 hover:text-white hover:bg-white/10
        transition-colors text-sm font-medium
      "
    >
      {item.label}
    </a>
  );
}
