import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft, X, FileText, Zap, Settings, Hash } from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  href?: string;
  action?: () => void;
}

interface SearchCommandProps {
  items: SearchItem[];
  placeholder?: string;
  onSelect?: (item: SearchItem) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Default icons by category
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'skill':
      return <Zap className="w-4 h-4" />;
    case 'pipeline':
      return <Hash className="w-4 h-4" />;
    case 'settings':
      return <Settings className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

export function SearchCommand({ 
  items, 
  placeholder = 'Search documentation...',
  onSelect,
  isOpen,
  onClose,
  className = '' 
}: SearchCommandProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items based on query
  const filteredItems = items.filter(item => {
    const searchText = `${item.title} ${item.description || ''} ${item.category || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredItems, selectedIndex, onClose]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Parent should handle opening
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (item: SearchItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      window.location.href = item.href;
    }
    onSelect?.(item);
    onClose();
  };

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`
          fixed top-[20%] left-1/2 -translate-x-1/2 
          w-full max-w-xl
          bg-[#1a1a1a] border border-white/10 rounded-xl
          shadow-2xl shadow-black/50
          overflow-hidden z-50
          ${className}
        `}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-xs text-gray-500 border border-white/10">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left
                  transition-colors
                  ${index === selectedIndex 
                    ? 'bg-purple-500/20 text-white' 
                    : 'text-gray-300 hover:bg-white/5'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded
                  ${index === selectedIndex ? 'bg-purple-500/30' : 'bg-white/10'}
                `}>
                  {item.icon || getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                  )}
                </div>
                {item.category && (
                  <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              select
            </span>
          </div>
          <button onClick={onClose} className="flex items-center gap-1 hover:text-white">
            <X className="w-3 h-3" />
            close
          </button>
        </div>
      </div>
    </>
  );
}

// Hook to manage search command state
export function useSearchCommand() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
