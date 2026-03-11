import React, { useState, useCallback } from 'react';
import { UserCheck, X, Plus, AlertCircle } from 'lucide-react';
import { useAttendants, isAvailableNow } from '../../hooks/useAttendants';

export interface HandoffConfigData {
  enabled: boolean;
  trigger_keywords: string[];
  default_attendant_id: string | null;
}

interface HandoffConfigProps {
  value: HandoffConfigData;
  onChange: (data: HandoffConfigData) => void;
  locationId: string | null;
}

const DEFAULT_HANDOFF: HandoffConfigData = {
  enabled: false,
  trigger_keywords: [],
  default_attendant_id: null,
};

export function parseHandoffConfig(raw: unknown): HandoffConfigData {
  if (!raw || typeof raw !== 'object') return DEFAULT_HANDOFF;
  const obj = raw as Record<string, unknown>;
  return {
    enabled: Boolean(obj.enabled ?? false),
    trigger_keywords: Array.isArray(obj.trigger_keywords) ? (obj.trigger_keywords as string[]) : [],
    default_attendant_id: typeof obj.default_attendant_id === 'string' ? obj.default_attendant_id : null,
  };
}

export function HandoffConfig({ value, onChange, locationId }: HandoffConfigProps) {
  const { attendants, loading: attendantsLoading } = useAttendants(locationId);
  const [keywordInput, setKeywordInput] = useState('');

  const activeAttendants = attendants.filter(a => a.is_active);
  const selectedAttendant = activeAttendants.find(a => a.id === value.default_attendant_id) ?? null;

  const handleToggleEnabled = useCallback(() => {
    onChange({ ...value, enabled: !value.enabled });
  }, [value, onChange]);

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim().toLowerCase();
    if (!kw || value.trigger_keywords.includes(kw)) {
      setKeywordInput('');
      return;
    }
    onChange({ ...value, trigger_keywords: [...value.trigger_keywords, kw] });
    setKeywordInput('');
  }, [keywordInput, value, onChange]);

  const removeKeyword = useCallback(
    (kw: string) => {
      onChange({ ...value, trigger_keywords: value.trigger_keywords.filter(k => k !== kw) });
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleAttendantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, default_attendant_id: e.target.value || null });
  };

  return (
    <div className="space-y-5">
      {/* Toggle principal */}
      <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl border border-border-default">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${value.enabled ? 'bg-accent-primary/20' : 'bg-bg-hover'}`}>
            <UserCheck size={16} className={value.enabled ? 'text-accent-primary' : 'text-text-muted'} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Handoff Habilitado</p>
            <p className="text-xs text-text-muted mt-0.5">
              Permite que a IA transfira conversas para atendentes humanos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value.enabled ? 'bg-accent-primary' : 'bg-bg-hover border border-border-default'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              value.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {value.enabled && (
        <>
          {/* Trigger keywords */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Palavras-chave de Gatilho
            </label>
            <p className="text-xs text-text-muted mb-3">
              Quando o lead digitar uma dessas palavras, a IA ativa o handoff automaticamente
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: falar com humano, atendente..."
                className="flex-1 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-3 py-2 bg-accent-primary text-white text-sm rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>
            {value.trigger_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {value.trigger_keywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary/10 text-accent-primary text-xs rounded-full border border-accent-primary/20"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="hover:text-accent-error transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-bg-tertiary/50 rounded-lg border border-border-default/50">
                <AlertCircle size={13} className="text-text-muted shrink-0" />
                <p className="text-xs text-text-muted">
                  Nenhuma palavra-chave configurada — o handoff so sera ativado manualmente
                </p>
              </div>
            )}
          </div>

          {/* Atendente padrao */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Atendente Padrao
            </label>
            <p className="text-xs text-text-muted mb-3">
              Atendente que recebe o handoff quando nenhum outro esta especificado
            </p>
            {attendantsLoading ? (
              <div className="text-sm text-text-muted">Carregando atendentes...</div>
            ) : activeAttendants.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-400/5 rounded-lg border border-yellow-400/20">
                <AlertCircle size={13} className="text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-400">
                  Nenhum atendente ativo cadastrado. Crie atendentes na pagina de Atendentes.
                </p>
              </div>
            ) : (
              <select
                value={value.default_attendant_id ?? ''}
                onChange={handleAttendantChange}
                className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
              >
                <option value="">Sem atendente padrao</option>
                {activeAttendants.map(att => {
                  const available = isAvailableNow(att);
                  return (
                    <option key={att.id} value={att.id}>
                      {att.name} ({att.role}){available ? ' — Disponivel agora' : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Preview */}
          {(value.trigger_keywords.length > 0 || value.default_attendant_id) && (
            <div className="p-4 bg-bg-tertiary/50 rounded-xl border border-border-default/50">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Preview do Comportamento
              </p>
              <div className="space-y-1.5 text-xs text-text-secondary">
                {value.trigger_keywords.length > 0 && (
                  <p>
                    Quando o lead disser{' '}
                    <span className="text-accent-primary font-medium">
                      [{value.trigger_keywords.slice(0, 3).join(', ')}
                      {value.trigger_keywords.length > 3 ? '...' : ''}]
                    </span>
                    {', '}
                    {selectedAttendant ? (
                      <>
                        transferir para{' '}
                        <span className="text-text-primary font-medium">{selectedAttendant.name}</span>
                      </>
                    ) : (
                      'acionar handoff sem atendente especifico'
                    )}
                  </p>
                )}
                {!value.trigger_keywords.length && selectedAttendant && (
                  <p>
                    Handoff manual transfere para{' '}
                    <span className="text-text-primary font-medium">{selectedAttendant.name}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HandoffConfig;
