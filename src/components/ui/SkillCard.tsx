import React from 'react';
import { Badge, categoryToVariant } from './Badge';
import { LucideIcon, ExternalLink } from 'lucide-react';

interface SkillCardProps {
  name: string;
  description: string;
  category: string;
  icon?: LucideIcon;
  emoji?: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function SkillCard({ 
  name, 
  description, 
  category,
  icon: Icon,
  emoji,
  onClick,
  href,
  className = '' 
}: SkillCardProps) {
  const Component = href ? 'a' : 'div';
  const interactiveProps = href 
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : onClick 
    ? { onClick, role: 'button', tabIndex: 0 }
    : {};

  return (
    <Component
      {...interactiveProps}
      className={`
        group relative bg-white/5 border border-white/10 rounded-xl p-5
        hover:bg-white/[0.08] hover:border-purple-500/30
        transition-all duration-200 cursor-pointer
        flex flex-col gap-3
        ${className}
      `}
    >
      {/* Icon/Emoji + Title */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-white/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
          {Icon ? (
            <Icon className="w-5 h-5 text-gray-300 group-hover:text-purple-400 transition-colors" />
          ) : emoji ? (
            <span className="text-xl">{emoji}</span>
          ) : (
            <span className="text-xl">🧩</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
            {name}
          </h3>
          <Badge variant={categoryToVariant(category)} size="sm" className="mt-1.5">
            {category}
          </Badge>
        </div>
        {href && (
          <ExternalLink className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Hover effect line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-xl" />
    </Component>
  );
}
