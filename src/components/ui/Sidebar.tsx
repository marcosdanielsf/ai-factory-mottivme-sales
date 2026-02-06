import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: string | number;
  children?: SidebarItem[];
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  activeItemId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onItemClick?: (item: SidebarItem) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  sections,
  activeItemId,
  collapsed = false,
  onCollapsedChange,
  onItemClick,
  header,
  footer,
  className = '',
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside
      className={`
        flex flex-col
        bg-[#0d0d0d] border-r border-white/10
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
    >
      {/* Header */}
      {header && !collapsed && (
        <div className="p-4 border-b border-white/10">
          {header}
        </div>
      )}

      {/* Collapse Button */}
      {onCollapsedChange && (
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="
            absolute -right-3 top-6
            p-1 bg-[#1a1a1a] border border-white/10 rounded-full
            text-gray-400 hover:text-white hover:bg-white/10
            transition-colors z-10
          "
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            {section.title && !collapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1 px-2">
              {section.items.map((item) => (
                <SidebarItemComponent
                  key={item.id}
                  item={item}
                  isActive={activeItemId === item.id}
                  isExpanded={expandedItems.has(item.id)}
                  collapsed={collapsed}
                  onToggleExpand={() => toggleExpanded(item.id)}
                  onClick={() => onItemClick?.(item)}
                  activeItemId={activeItemId}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && !collapsed && (
        <div className="p-4 border-t border-white/10">
          {footer}
        </div>
      )}
    </aside>
  );
}

interface SidebarItemComponentProps {
  item: SidebarItem;
  isActive: boolean;
  isExpanded: boolean;
  collapsed: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  activeItemId?: string;
  depth?: number;
  key?: string;
}

function SidebarItemComponent({
  item,
  isActive,
  isExpanded,
  collapsed,
  onToggleExpand,
  onClick,
  activeItemId,
  depth = 0,
}: SidebarItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children!.some(child => child.id === activeItemId);

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand();
    } else {
      onClick();
    }
  };

  const Component = item.href ? 'a' : 'button';
  const componentProps = item.href
    ? { href: item.href }
    : { type: 'button' as const };

  return (
    <li>
      <Component
        {...componentProps}
        onClick={handleClick}
        className={`
          w-full flex items-center gap-3 px-3 py-2 rounded-lg
          transition-all duration-150
          ${isActive || isChildActive
            ? 'bg-purple-500/20 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.label : undefined}
      >
        {item.icon && (
          <span className="flex-shrink-0">{item.icon}</span>
        )}

        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm font-medium truncate">
              {item.label}
            </span>

            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-white/10 rounded-full">
                {item.badge}
              </span>
            )}

            {hasChildren && (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            )}
          </>
        )}
      </Component>

      {/* Children */}
      {hasChildren && isExpanded && !collapsed && (
        <ul className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
          {item.children!.map((child) => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              isActive={activeItemId === child.id}
              isExpanded={false}
              collapsed={false}
              onToggleExpand={() => {}}
              onClick={onClick}
              activeItemId={activeItemId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
