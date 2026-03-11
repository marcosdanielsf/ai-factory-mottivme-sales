import React from 'react';

export type BadgeVariant = 
  | 'automation'
  | 'research'
  | 'social'
  | 'ai-prompt'
  | 'integration'
  | 'sales'
  | 'dev'
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  automation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  research: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  social: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'ai-prompt': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  integration: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  sales: 'bg-green-500/20 text-green-400 border-green-500/30',
  dev: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  default: 'bg-white/10 text-gray-300 border-white/20',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function Badge({ 
  variant = 'default', 
  children, 
  size = 'sm',
  className = '' 
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        transition-colors duration-150
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Helper to get variant from category string
export function categoryToVariant(category: string): BadgeVariant {
  const normalized = category.toLowerCase().replace(/[^a-z-]/g, '');
  if (normalized in variantStyles) {
    return normalized as BadgeVariant;
  }
  return 'default';
}
