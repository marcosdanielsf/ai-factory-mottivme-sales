import React, { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { useAccount } from './AccountContext';
import { useBrandConfig } from '../hooks/useBrandConfig';
import type { ThemeVariableKey } from '../types/brand';

// CSS variable defaults (mirror of @theme {} in index.css)
const THEME_DEFAULTS: Record<ThemeVariableKey, string> = {
  'bg-primary': '#111318',
  'bg-secondary': '#1a1d24',
  'bg-tertiary': '#242830',
  'bg-hover': '#2d323c',
  'text-primary': '#f0f2f5',
  'text-secondary': '#9ca3af',
  'text-muted': '#6b7280',
  'border-default': '#2d323c',
  'border-hover': '#3d4451',
  'accent-primary': '#3b82f6',
  'accent-success': '#22c55e',
  'accent-warning': '#f59e0b',
  'accent-error': '#ef4444',
};

const THEME_VAR_KEYS = Object.keys(THEME_DEFAULTS) as ThemeVariableKey[];

const DEFAULT_TITLE = 'MOTTIV.ME - AI Factory';
const DEFAULT_BRAND_NAME = 'MOTTIV.ME';

// Sanitize font name to prevent injection in Google Fonts URL
const safeFontName = (name: string) =>
  name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '+');

// Validate URL for favicon (only https or relative paths)
const isSafeUrl = (url: string) =>
  url.startsWith('https://') || url.startsWith('/');

interface ThemeContextValue {
  brandName: string;
  logoUrl: string | null;
  tagline: string | null;
  isCustomTheme: boolean;
  isThemeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  brandName: DEFAULT_BRAND_NAME,
  logoUrl: null,
  tagline: null,
  isCustomTheme: false,
  isThemeLoading: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id ?? null;
  const { brandConfig, loading } = useBrandConfig(locationId);

  // Refs instead of module-level singletons (safe with Strict Mode + HMR)
  const fontLinkRef = useRef<HTMLLinkElement | null>(null);
  const originalFaviconRef = useRef<string | null>(null);

  // Apply / remove CSS variable overrides
  useEffect(() => {
    const root = document.documentElement;
    const overrides = brandConfig?.theme_overrides;

    if (!overrides || Object.keys(overrides).length === 0) {
      // Restore defaults — remove any inline overrides
      THEME_VAR_KEYS.forEach(key => {
        root.style.removeProperty(`--color-${key}`);
      });
      return;
    }

    THEME_VAR_KEYS.forEach(key => {
      const value = overrides[key];
      if (value) {
        root.style.setProperty(`--color-${key}`, value);
      } else {
        root.style.removeProperty(`--color-${key}`);
      }
    });

    // Cleanup on unmount or when overrides change
    return () => {
      THEME_VAR_KEYS.forEach(key => {
        root.style.removeProperty(`--color-${key}`);
      });
    };
  }, [brandConfig?.theme_overrides]);

  // Load custom Google Fonts
  useEffect(() => {
    // Remove previous font link
    if (fontLinkRef.current) {
      fontLinkRef.current.remove();
      fontLinkRef.current = null;
    }

    const fonts = brandConfig?.fonts;
    if (!fonts || fonts.length === 0) return;

    const fontNames = fonts
      .filter(f => f.name)
      .map(f => safeFontName(f.name))
      .filter(Boolean);

    if (fontNames.length === 0) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fontNames.map(n => `family=${n}:wght@400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
    fontLinkRef.current = link;

    // Apply font-family override for body font
    const bodyFont = fonts.find(f => f.role === 'body');
    if (bodyFont) {
      document.documentElement.style.setProperty('--font-sans', `'${bodyFont.name}', sans-serif`);
    }

    return () => {
      fontLinkRef.current?.remove();
      fontLinkRef.current = null;
      document.documentElement.style.removeProperty('--font-sans');
    };
  }, [brandConfig?.fonts]);

  // Update favicon — derived dependency to avoid re-runs on unrelated theme changes
  const faviconUrl = brandConfig?.theme_overrides?.['favicon-url'] ?? null;
  useEffect(() => {
    const linkEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!linkEl) return;

    // Save original on first override
    if (!originalFaviconRef.current) {
      originalFaviconRef.current = linkEl.href;
    }

    if (faviconUrl && isSafeUrl(faviconUrl)) {
      linkEl.href = faviconUrl;
    } else if (originalFaviconRef.current) {
      linkEl.href = originalFaviconRef.current;
    }

    return () => {
      if (originalFaviconRef.current && linkEl) {
        linkEl.href = originalFaviconRef.current;
      }
    };
  }, [faviconUrl]);

  // Update page title — derived dependency
  const pageTitle = brandConfig?.theme_overrides?.['page-title'] ?? null;
  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    } else {
      document.title = DEFAULT_TITLE;
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [pageTitle]);

  const value = useMemo<ThemeContextValue>(() => ({
    brandName: brandConfig?.client_name || DEFAULT_BRAND_NAME,
    logoUrl: brandConfig?.logo_url || null,
    tagline: brandConfig?.client_tagline || null,
    isCustomTheme: THEME_VAR_KEYS.some(k => !!brandConfig?.theme_overrides?.[k]),
    isThemeLoading: loading,
  }), [brandConfig, loading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
