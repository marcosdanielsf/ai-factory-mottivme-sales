import React from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';

interface SuccessCardProps {
  createdCredentials: { email: string; password: string };
  copiedItem: string | null;
  onCopyToClipboard: (text: string, label: string) => void;
  onClose: () => void;
}

export function SuccessCard({
  createdCredentials,
  copiedItem,
  onCopyToClipboard,
  onClose,
}: SuccessCardProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/20">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Usuário Criado com Sucesso!</h3>
              <p className="text-sm text-text-muted mt-0.5">Credenciais geradas</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-400 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="font-medium">
                Guarde estas credenciais em local seguro. Elas não serão mostradas novamente.
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-bg-tertiary border border-border-default rounded-xl p-4">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Email
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm text-text-primary font-mono bg-bg-secondary px-3 py-2 rounded-lg border border-border-default">
                  {createdCredentials.email}
                </code>
                <button
                  onClick={() => onCopyToClipboard(createdCredentials.email, 'email')}
                  className="p-2 hover:bg-bg-secondary rounded-lg transition-colors flex-shrink-0"
                  title="Copiar email"
                >
                  {copiedItem === 'email' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-bg-tertiary border border-border-default rounded-xl p-4">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Senha
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm text-text-primary font-mono bg-bg-secondary px-3 py-2 rounded-lg border border-border-default">
                  {createdCredentials.password}
                </code>
                <button
                  onClick={() => onCopyToClipboard(createdCredentials.password, 'password')}
                  className="p-2 hover:bg-bg-secondary rounded-lg transition-colors flex-shrink-0"
                  title="Copiar senha"
                >
                  {copiedItem === 'password' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const credentials = `Email: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
              onCopyToClipboard(credentials, 'all');
            }}
            className="w-full px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-blue-500/20"
          >
            {copiedItem === 'all' ? (
              <>
                <Check className="w-4 h-4" />
                Credenciais Copiadas!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Todas as Credenciais
              </>
            )}
          </button>
        </div>

        <div className="p-6 border-t border-border-default">
          <button
            onClick={onClose}
            className="w-full px-5 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
          >
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
