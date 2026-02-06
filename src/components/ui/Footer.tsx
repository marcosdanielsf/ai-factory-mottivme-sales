import React from 'react';
import { Github, ExternalLink } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  columns?: FooterColumn[];
  version?: string;
  copyright?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  className?: string;
}

export function Footer({
  columns = [],
  version,
  copyright = `© ${new Date().getFullYear()} MOTTIVME. All rights reserved.`,
  socialLinks,
  className = '',
}: FooterProps) {
  return (
    <footer
      className={`
        border-t border-white/10
        bg-[#0d0d0d]
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Main Footer Content */}
        {columns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                  {column.title}
                </h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="
                          text-gray-400 hover:text-white
                          transition-colors text-sm
                          inline-flex items-center gap-1
                        "
                      >
                        {link.label}
                        {link.external && <ExternalLink className="w-3 h-3" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          {/* Copyright */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{copyright}</span>
            {version && (
              <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                v{version}
              </span>
            )}
          </div>

          {/* Social Links */}
          {socialLinks && (
            <div className="flex items-center gap-4">
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
