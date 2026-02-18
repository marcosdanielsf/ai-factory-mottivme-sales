export function KpiCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'green' | 'red';
}) {
  const accent = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] text-text-muted mt-1">{sub}</div>
    </div>
  );
}
