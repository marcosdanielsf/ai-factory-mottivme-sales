import React from 'react';
import { MOCK_APPROVALS } from '../constants';
import { Check, X, GitCommit } from 'lucide-react';

export const Approvals = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⏳ Aprovações Pendentes</h1>
        <span className="text-sm text-text-muted">{MOCK_APPROVALS.length} itens aguardando</span>
      </div>

      <div className="space-y-4">
        {MOCK_APPROVALS.map(req => (
          <div key={req.id} className="bg-bg-secondary border border-border-default rounded-lg p-5 flex gap-4">
            <div className="mt-1">
              <div className="w-8 h-8 rounded-full bg-accent-warning/10 flex items-center justify-center text-accent-warning">
                <GitCommit size={16} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">{req.client_name} <span className="text-text-muted font-normal">• {req.version}</span></h3>
                  <p className="text-sm text-text-muted capitalize">Tipo: {req.type} • Solicitado em {new Date(req.requested_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                   <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-accent-error hover:bg-accent-error/10 rounded transition-colors">
                    <X size={16} />
                    Rejeitar
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-accent-primary text-white hover:bg-blue-600 rounded transition-colors shadow-sm">
                    <Check size={16} />
                    Aprovar
                  </button>
                </div>
              </div>
              
              <div className="bg-bg-tertiary rounded p-3 text-sm font-mono text-text-secondary border border-border-default">
                {req.changes_summary}
              </div>
              
              <button className="text-xs text-text-muted hover:text-text-primary underline">
                Ver diff completo do código
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};