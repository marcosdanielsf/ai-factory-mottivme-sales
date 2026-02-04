import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Menu, Wifi, WifiOff, Activity } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../App';
import { getHealthStatusColor, getHealthStatusText, HealthStatus } from '../../hooks/useSystemHealth';

// Health Status Badge Component
const HealthBadge = ({ status, latency }: { status: HealthStatus; latency: number }) => {
  const colorClass = getHealthStatusColor(status);
  const statusText = getHealthStatusText(status);

  const Icon = status === 'healthy' ? Wifi : status === 'unhealthy' ? WifiOff : Activity;

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        <div className={`w-2 h-2 rounded-full ${colorClass} animate-pulse`} />
        <Icon size={14} className="text-slate-500 dark:text-slate-400" />
      </button>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${colorClass}`} />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{statusText}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Latência:</span>
            <span className="font-medium">{latency}ms</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>API:</span>
            <span className="font-medium">AgenticOS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { t } = useLanguage();
  const { systemHealth, agenticStats } = useData();

  return (
    <>
      <header className="flex justify-between items-center mb-6 md:mb-8 gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search - hidden on mobile, visible on tablet+ */}
        <div className="relative hidden md:block flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder={t('common.search_full')}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Mobile logo - shown only on mobile */}
        <div className="lg:hidden flex items-center gap-2 flex-1 justify-center md:hidden">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Socialfy</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* System Health Badge */}
          <div className="hidden md:block">
            <HealthBadge status={systemHealth.status} latency={systemHealth.latency} />
          </div>

          {/* AgenticOS Stats Quick View */}
          {agenticStats && agenticStats.dms_sent_today > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {agenticStats.dms_sent_today} DMs hoje
              </span>
            </div>
          )}

          <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors hidden md:block">
            <HelpCircle size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl dark:shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {t('common.notifications')}
                  </h3>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    {t('common.mark_all_read')}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[
                    { title: 'New response from Joao Silva', time: '2 min ago', type: 'message' },
                    { title: 'Meeting tomorrow at 10:00 AM', time: '1 hour ago', type: 'calendar' },
                    { title: 'Cadence "Tech CEOs" completed', time: '3 hours ago', type: 'alert' },
                  ].map((n, i) => (
                    <div
                      key={i}
                      className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex gap-3 last:border-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'message'
                            ? 'bg-blue-500'
                            : n.type === 'calendar'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search - visible only on mobile */}
      <div className="relative md:hidden mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
        <input
          type="text"
          placeholder={t('common.search')}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>
    </>
  );
};

export default Header;
