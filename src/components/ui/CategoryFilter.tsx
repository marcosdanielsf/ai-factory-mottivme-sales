import React from 'react';
import { Badge, BadgeVariant, categoryToVariant } from './Badge';

interface Category {
  id: string;
  label: string;
  count?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onChange: (categoryId: string | null) => void;
  showCounts?: boolean;
  className?: string;
}

export function CategoryFilter({ 
  categories, 
  selected, 
  onChange,
  showCounts = true,
  className = '' 
}: CategoryFilterProps) {
  const allCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* All button */}
      <button
        onClick={() => onChange(null)}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200
          ${selected === null
            ? 'bg-white text-black'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
          }
        `}
      >
        All
        {showCounts && (
          <span className={`ml-1.5 ${selected === null ? 'text-black/60' : 'text-gray-500'}`}>
            {allCount}
          </span>
        )}
      </button>

      {/* Category buttons */}
      {categories.map((category) => {
        const isSelected = selected === category.id;
        const variant = categoryToVariant(category.id);

        return (
          <button
            key={category.id}
            onClick={() => onChange(isSelected ? null : category.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${isSelected
                ? getSelectedStyles(variant)
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }
            `}
          >
            {category.label}
            {showCounts && category.count !== undefined && (
              <span className={`ml-1.5 ${isSelected ? 'opacity-70' : 'text-gray-500'}`}>
                {category.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getSelectedStyles(variant: BadgeVariant): string {
  const styles: Record<BadgeVariant, string> = {
    automation: 'bg-orange-500 text-white',
    research: 'bg-blue-500 text-white',
    social: 'bg-pink-500 text-white',
    'ai-prompt': 'bg-purple-500 text-white',
    integration: 'bg-cyan-500 text-black',
    sales: 'bg-green-500 text-white',
    dev: 'bg-gray-500 text-white',
    default: 'bg-white text-black',
  };
  return styles[variant];
}
