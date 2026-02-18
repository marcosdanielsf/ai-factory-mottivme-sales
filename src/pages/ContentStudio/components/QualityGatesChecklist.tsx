import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import type { QualityGate, QualityGatesResult } from '../../../hooks/useQualityGates';

interface QualityGatesChecklistProps {
  result: QualityGatesResult;
  defaultExpanded?: boolean;
}

function GateRow({ gate }: { gate: QualityGate }) {
  const isPass = gate.status === 'pass';
  const isFail = gate.status === 'fail';
  const isWarn = gate.status === 'warn';

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border-default/50 last:border-0">
      <div className="mt-0.5 flex-shrink-0">
        {isPass && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        {isFail && <XCircle className="w-4 h-4 text-red-400" />}
        {isWarn && <AlertCircle className="w-4 h-4 text-yellow-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-medium ${isPass ? 'text-text-primary' : isFail ? 'text-red-400' : 'text-yellow-400'}`}>
            {gate.label}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            gate.level === 'required'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-bg-tertiary text-text-muted'
          }`}>
            {gate.level === 'required' ? 'obrigatorio' : 'recomendado'}
          </span>
        </div>
        {gate.detail && (
          <p className="text-[11px] text-text-muted mt-0.5 truncate">{gate.detail}</p>
        )}
      </div>
    </div>
  );
}

const OVERALL_CONFIG = {
  pass: {
    icon: ShieldCheck,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    label: 'Conteudo pronto para aprovacao',
  },
  warn: {
    icon: ShieldAlert,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Aprovacao permitida com avisos',
  },
  block: {
    icon: ShieldX,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Corrija os bloqueios antes de aprovar',
  },
} as const;

export function QualityGatesChecklist({ result, defaultExpanded = false }: QualityGatesChecklistProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = OVERALL_CONFIG[result.overallStatus];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.bg}`}>
      {/* Header clicavel */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            {result.blockers > 0 && (
              <span className="text-red-400">{result.blockers} bloqueio{result.blockers !== 1 ? 's' : ''}</span>
            )}
            {result.warnings > 0 && (
              <span className="text-yellow-400">{result.warnings} aviso{result.warnings !== 1 ? 's' : ''}</span>
            )}
            {result.blockers === 0 && result.warnings === 0 && (
              <span className="text-green-400">tudo certo</span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          )}
        </div>
      </button>

      {/* Lista expandida */}
      {expanded && (
        <div className="px-3 pb-2 border-t border-inherit">
          {result.gates.map(gate => (
            <GateRow key={gate.id} gate={gate} />
          ))}
        </div>
      )}
    </div>
  );
}
