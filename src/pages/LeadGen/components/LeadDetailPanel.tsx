import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface DetailField {
  label: string;
  value: React.ReactNode;
  type?: 'text' | 'link' | 'badge' | 'json';
}

interface LeadDetailPanelProps {
  title: string;
  fields: DetailField[];
  actions?: React.ReactNode;
  onClose?: () => void;
}

function FieldValue({ field }: { field: DetailField }) {
  if (field.type === 'link' && typeof field.value === 'string') {
    return (
      <a
        href={field.value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-accent-primary hover:underline text-sm break-all"
      >
        {field.value}
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>
    );
  }

  if (field.type === 'badge' && typeof field.value === 'string') {
    return <StatusBadge status={field.value} size="sm" />;
  }

  if (field.type === 'json') {
    return (
      <pre className="text-xs text-text-secondary bg-bg-tertiary rounded p-2 overflow-x-auto max-h-40 font-mono">
        {typeof field.value === 'string'
          ? field.value
          : JSON.stringify(field.value, null, 2)}
      </pre>
    );
  }

  return (
    <span className="text-sm text-text-primary break-words">
      {field.value ?? <span className="text-text-muted italic">—</span>}
    </span>
  );
}

export default function LeadDetailPanel({
  title,
  fields,
  actions,
  onClose,
}: LeadDetailPanelProps) {
  return (
    <div className="w-[400px] flex flex-col bg-bg-secondary border-l border-border-default h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default flex-shrink-0">
        <h3 className="text-sm font-semibold text-text-primary truncate pr-2">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {fields.map((field, idx) => (
          <div key={idx} className="grid grid-cols-[120px_1fr] gap-2 items-start">
            <span className="text-xs text-text-muted font-medium pt-0.5 truncate">
              {field.label}
            </span>
            <div className="min-w-0">
              <FieldValue field={field} />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {actions && (
        <div className="px-4 py-3 border-t border-border-default flex-shrink-0 flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
