import { Zap } from 'lucide-react';

interface AgentCapabilitiesProps {
  capabilities: Record<string, unknown> | string[] | null;
}

function extractCapabilityLabel(cap: unknown): string {
  if (typeof cap === 'string') return cap;
  if (typeof cap === 'object' && cap !== null) {
    const obj = cap as Record<string, unknown>;
    return (obj.label as string) || (obj.name as string) || JSON.stringify(cap);
  }
  return String(cap);
}

function toCapabilitiesArray(capabilities: Record<string, unknown> | string[] | null): string[] {
  if (!capabilities) return [];
  if (Array.isArray(capabilities)) return capabilities.map(extractCapabilityLabel);
  return Object.values(capabilities).map(extractCapabilityLabel);
}

export function AgentCapabilities({ capabilities }: AgentCapabilitiesProps) {
  const items = toCapabilitiesArray(capabilities);

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted italic">Sem capacidades configuradas</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((cap, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
        >
          <Zap className="w-3 h-3" />
          {cap}
        </span>
      ))}
    </div>
  );
}
