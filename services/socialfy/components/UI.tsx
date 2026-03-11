import React from 'react';
import { Linkedin, Instagram, Phone, Mail, MessageCircle, Building2, Loader2 } from 'lucide-react';
import { Channel } from '../types';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  loading?: boolean;
}> = ({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:hover:bg-blue-600",
    secondary: "bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 disabled:hover:bg-slate-800 dark:disabled:hover:bg-slate-700",
    outline: "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:hover:bg-transparent",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:hover:bg-transparent",
    gradient: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'pink'; className?: string }> = ({ children, color = 'blue', className = '' }) => {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    green: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    yellow: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    red: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    gray: "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    pink: "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]} whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 ${className}`}
    {...props}
  />
);

export const ChannelBadge: React.FC<{ channel: Channel; size?: 'sm' | 'md' }> = ({ channel, size = 'md' }) => {
  const config = {
    linkedin: { icon: Linkedin, bg: 'bg-[#0A66C2]', text: 'text-white', label: 'LinkedIn' },
    instagram: { icon: Instagram, bg: 'bg-gradient-to-r from-[#E1306C] to-[#833AB4]', text: 'text-white', label: 'Instagram' },
    whatsapp: { icon: MessageCircle, bg: 'bg-[#25D366]', text: 'text-white', label: 'WhatsApp' },
    email: { icon: Mail, bg: 'bg-gray-500', text: 'text-white', label: 'Email' },
    phone: { icon: Phone, bg: 'bg-blue-500', text: 'text-white', label: 'Phone' },
    cnpj: { icon: Building2, bg: 'bg-amber-500', text: 'text-white', label: 'CNPJ' },
  };

  const { icon: Icon, bg, text } = config[channel];
  const sizeClasses = size === 'sm' ? 'w-5 h-5 p-1' : 'w-6 h-6 p-1.5';

  return (
    <div className={`${bg} ${text} rounded-md flex items-center justify-center shadow-sm ${sizeClasses}`} title={config[channel].label}>
      <Icon className="w-full h-full" />
    </div>
  );
};