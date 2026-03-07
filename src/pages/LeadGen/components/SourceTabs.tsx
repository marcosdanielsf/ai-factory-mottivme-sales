import React from "react";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface SourceTabsProps {
  tabs: Tab[] | string[];
  activeTab?: string;
  active?: string;
  onTabChange?: (key: string) => void;
  onChange?: (key: string) => void;
}

export default function SourceTabs({
  tabs,
  activeTab,
  onTabChange,
}: SourceTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border-default">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? "border-accent-primary text-accent-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-accent-primary/20 text-accent-primary"
                    : "bg-bg-tertiary text-text-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
