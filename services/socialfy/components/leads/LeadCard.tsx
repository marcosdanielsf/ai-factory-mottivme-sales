import React from 'react';
import { User, Users, ExternalLink, MessageCircle } from 'lucide-react';
import { PriorityBadge, Priority } from './PriorityBadge';

export interface Lead {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  followers: number;
  following?: number;
  profile_pic_url?: string | null;
  score: number;
  priority: Priority;
  tenant_id?: string;
  is_verified?: boolean;
  is_business?: boolean;
  last_interaction?: string | null;
}

interface LeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
  onMessage?: (lead: Lead) => void;
  selected?: boolean;
}

const formatFollowers = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const truncateBio = (bio: string | null, maxLength: number = 80): string => {
  if (!bio) return 'Sem bio disponivel';
  if (bio.length <= maxLength) return bio;
  return `${bio.slice(0, maxLength).trim()}...`;
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-slate-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-slate-500/20 border-slate-500/30';
};

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onClick,
  onMessage,
  selected = false,
}) => {
  return (
    <div
      onClick={() => onClick?.(lead)}
      className={`
        bg-white dark:bg-slate-800/50 border rounded-xl p-4
        transition-all duration-200 cursor-pointer
        hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/20
        ${selected
          ? 'border-blue-500/50 ring-1 ring-blue-500/30'
          : 'border-slate-200 dark:border-slate-700'
        }
      `}
    >
      {/* Header: Avatar + Name + Priority */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {lead.profile_pic_url ? (
            <img
              src={lead.profile_pic_url}
              alt={lead.full_name || lead.username}
              className="w-12 h-12 rounded-full object-cover border border-slate-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
          )}
          {lead.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Name + Username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-slate-900 dark:text-white font-semibold truncate">
              {lead.full_name || lead.username}
            </h3>
            {lead.is_business && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                BIZ
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">@{lead.username}</p>
        </div>

        {/* Score Badge */}
        <div className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg border ${getScoreBgColor(lead.score)}`}>
          <span className={`text-lg font-bold ${getScoreColor(lead.score)}`}>
            {lead.score}
          </span>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {truncateBio(lead.bio)}
      </p>

      {/* Footer: Stats + Actions */}
      <div className="mt-4 flex items-center justify-between">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{formatFollowers(lead.followers)}</span>
          </div>
          <PriorityBadge priority={lead.priority} size="sm" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.(lead);
            }}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Enviar mensagem"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <a
            href={`https://instagram.com/${lead.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Ver perfil no Instagram"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
