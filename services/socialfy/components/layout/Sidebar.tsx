import React from 'react';
import {
  LayoutDashboard, Megaphone, Users, Kanban, Inbox, FileText, Bot, Settings,
  Workflow, PlayCircle, Shield, Target, BarChart3, Plug, Link as LinkIcon,
  Instagram, Briefcase, X, ChevronDown, Moon, Sun, Globe, TrendingUp, UserPlus
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NavItem } from '../../types';

interface SidebarProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarSection = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
      {title}
    </h3>
    <div className="space-y-0.5">{children}</div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const NavButton = ({ id, icon, label }: { id: NavItem; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => {
        onNavigate(id);
        if (onClose) onClose();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active === id
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      >
        <div className="p-6 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight block leading-none">
                Socialfy
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Sales Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2">
          <SidebarSection title={t('section.prospecting')}>
            <NavButton id="dashboard" icon={<LayoutDashboard size={18} />} label={t('nav.dashboard')} />
            <NavButton id="growth-dashboard" icon={<TrendingUp size={18} />} label="Growth Dashboard" />
            <NavButton id="leads" icon={<Users size={18} />} label={t('nav.leads')} />
            <div className="pl-6 space-y-0.5">
              <NavButton
                id="linkedin-search"
                icon={<span className="text-[#0A66C2] font-bold">in</span>}
                label={t('nav.linkedin_search')}
              />
              <NavButton
                id="instagram-search"
                icon={<Instagram size={16} className="text-pink-500" />}
                label={t('nav.instagram_search')}
              />
              <NavButton
                id="cnpj-search"
                icon={<Briefcase size={16} className="text-amber-500" />}
                label={t('nav.cnpj_search')}
              />
              <NavButton
                id="new-followers"
                icon={<UserPlus size={16} className="text-emerald-500" />}
                label="Novos Seguidores"
              />
            </div>
            <NavButton id="campaigns" icon={<Megaphone size={18} />} label={t('nav.campaigns')} />
          </SidebarSection>

          <SidebarSection title={t('section.cadences')}>
            <NavButton id="cadence-builder" icon={<Workflow size={18} />} label={t('nav.cadence_builder')} />
            <NavButton id="active-cadences" icon={<PlayCircle size={18} />} label={t('nav.active_cadences')} />
            <NavButton id="show-rate" icon={<Shield size={18} />} label={t('nav.show_rate')} />
          </SidebarSection>

          <SidebarSection title={t('section.engagement')}>
            <NavButton id="pipeline" icon={<Kanban size={18} />} label={t('nav.pipeline')} />
            <NavButton id="inbox" icon={<Inbox size={18} />} label={t('nav.inbox')} />
            <NavButton id="content" icon={<FileText size={18} />} label={t('nav.content')} />
          </SidebarSection>

          <SidebarSection title={t('section.intelligence')}>
            <NavButton id="agents" icon={<Bot size={18} />} label={t('nav.agents')} />
            <NavButton id="icp" icon={<Target size={18} />} label={t('nav.icp')} />
            <NavButton id="analytics" icon={<BarChart3 size={18} />} label={t('nav.analytics')} />
          </SidebarSection>

          <SidebarSection title={t('section.configuration')}>
            <NavButton id="accounts" icon={<LinkIcon size={18} />} label={t('nav.accounts')} />
            <NavButton id="integrations" icon={<Plug size={18} />} label={t('nav.integrations')} />
            <NavButton id="settings" icon={<Settings size={18} />} label={t('nav.settings')} />
          </SidebarSection>
        </nav>

        {/* Theme & Language Toggles */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-yellow-500" />}
              <span className="text-xs">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
              title={language === 'pt' ? 'English' : 'Português'}
            >
              <Globe size={18} />
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
              MD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">Marcos Daniels</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Mottivme</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
