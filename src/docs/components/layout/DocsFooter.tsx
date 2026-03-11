import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, MessageSquare, ExternalLink } from 'lucide-react';

export const DocsFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    resources: [
      { label: 'Skills Catalog', href: '/docs/skills' },
      { label: 'Pipelines', href: '/docs/pipelines' },
      { label: 'API Reference', href: '/docs/reference/api' },
      { label: 'Changelog', href: '/docs/changelog' },
    ],
    integrations: [
      { label: 'GoHighLevel', href: '/docs/ghl-integration' },
      { label: 'n8n Workflows', href: '/docs/n8n-workflows' },
      { label: 'Supabase', href: '/docs/reference/database-schema' },
    ],
    company: [
      { label: 'MOTTIVME', href: 'https://mottiv.me', external: true },
      { label: 'Dashboard', href: '/' },
      { label: 'Contato', href: 'mailto:contato@mottiv.me', external: true },
    ],
  };

  return (
    <footer className="border-t border-[var(--color-docs-border)] bg-[var(--color-docs-card)]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-[var(--color-docs-fg)] mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-docs-primary)] flex items-center justify-center">
                <span className="text-white text-sm">M</span>
              </div>
              <span>MOTTIVME AI</span>
            </div>
            <p className="text-sm text-[var(--color-docs-muted-fg)] mb-4">
              AI Factory V3 - Sistema completo de agentes IA para automação comercial.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://github.com/mottivme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-[var(--color-docs-muted)] rounded-lg transition-colors text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)]"
              >
                <Github size={18} />
              </a>
              <a 
                href="https://twitter.com/mottivme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-[var(--color-docs-muted)] rounded-lg transition-colors text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)]"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="#" 
                className="p-2 hover:bg-[var(--color-docs-muted)] rounded-lg transition-colors text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)]"
              >
                <MessageSquare size={18} />
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-sm text-[var(--color-docs-fg)] mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="font-semibold text-sm text-[var(--color-docs-fg)] mb-4">Integrations</h4>
            <ul className="space-y-2">
              {footerLinks.integrations.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm text-[var(--color-docs-fg)] mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)] transition-colors"
                    >
                      {link.label}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <Link 
                      to={link.href}
                      className="text-sm text-[var(--color-docs-muted-fg)] hover:text-[var(--color-docs-fg)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--color-docs-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-docs-muted-fg)]">
          <p>© {currentYear} MOTTIVME. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--color-docs-fg)] transition-colors">Termos</a>
            <a href="#" className="hover:text-[var(--color-docs-fg)] transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
