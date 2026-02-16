import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function NumInput({ value, onChange, className, prefix, step, min, max, ...rest }: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  prefix?: string;
  step?: number;
  min?: number;
  max?: number;
  [key: string]: any;
}) {
  const [localValue, setLocalValue] = useState(String(value));
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!focused) setLocalValue(String(value));
  }, [value, focused]);

  return (
    <div className="relative">
      {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={focused ? localValue : String(value)}
        onFocus={e => { setFocused(true); setLocalValue(String(value)); e.target.select(); }}
        onChange={e => {
          const raw = e.target.value;
          setLocalValue(raw);
          const parsed = parseFloat(raw);
          if (!isNaN(parsed)) {
            const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
            onChange(clamped);
          }
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseFloat(localValue);
          if (isNaN(parsed)) {
            setLocalValue(String(value));
          } else {
            const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
            onChange(clamped);
            setLocalValue(String(clamped));
          }
        }}
        className={`${prefix ? 'pl-8' : ''} ${className || ''}`}
        {...rest}
      />
    </div>
  );
}

export function FieldHelp({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-text-muted/50 hover:text-blue-400 transition-colors"
      >
        <HelpCircle size={12} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-secondary border border-border-default rounded-lg shadow-xl text-[10px] text-text-secondary z-50 leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-bg-secondary border-r border-b border-border-default rotate-45" />
        </div>
      )}
    </span>
  );
}
