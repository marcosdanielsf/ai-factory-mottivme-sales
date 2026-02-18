import React, { useState, useMemo } from 'react';
import { Users, Target, TrendingUp, Award, ArrowUpRight, ArrowDownRight, RefreshCw, Building2, ChevronDown, Megaphone, UserPlus, Eye, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { useAccount } from '../contexts/AccountContext';
import { useLocations } from '../hooks/useLocations';
import { useSocialSellingFunnel } from '../hooks/useSocialSellingFunnel';

// ============================================================================
// Social Selling Dashboard
// Funil comparativo: Social Selling vs Trafego
// Usa campos 3D: origem_lead, tipo_contato, tipo_servico
// ============================================================================

const COLORS = {
  socialSelling: '#ec4899', // pink-500
  trafego: '#f97316',      // orange-500
  whatsappDireto: '#22c55e', // green-500
  organico: '#22d3ee',     // cyan-400
  naoClassificado: '#6b7280', // gray-500
};

interface FunnelRow {
  etapa: string;
  socialSelling: number;
  socialSellingPct: string;
  trafego: number;
  trafegoPct: string;
  whatsappDireto: number;
  whatsappDiretoPct: string;
  organico: number;
  organicoPct: string;
}

function pct(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function SocialSellingDashboard() {
  const { selectedAccount, isClientUser } = useAccount();
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  // Location efetivo: filtro inline tem prioridade, senao usa account do sidebar
  const effectiveLocationId = selectedLocationId || selectedAccount?.location_id || null;
  const effectiveLocationName = useMemo(() => {
    if (selectedLocationId) {
      return locations.find(l => l.location_id === selectedLocationId)?.location_name || selectedLocationId;
    }
    if (selectedAccount?.location_id) return selectedAccount.location_name;
    return null;
  }, [selectedLocationId, selectedAccount, locations]);

  const data = useSocialSellingFunnel(dateRange, effectiveLocationId);

  // Funil comparativo (SS vs Trafego vs WhatsApp Direto vs Organico)
  const buildRow = (etapa: string, key: keyof typeof data.socialSelling): FunnelRow => ({
    etapa,
    socialSelling: data.socialSelling[key],
    socialSellingPct: key === 'leads' ? '100%' : pct(data.socialSelling[key], data.socialSelling.leads),
    trafego: data.trafego[key],
    trafegoPct: key === 'leads' ? '100%' : pct(data.trafego[key], data.trafego.leads),
    whatsappDireto: data.whatsappDireto[key],
    whatsappDiretoPct: key === 'leads' ? '100%' : pct(data.whatsappDireto[key], data.whatsappDireto.leads),
    organico: data.organico[key],
    organicoPct: key === 'leads' ? '100%' : pct(data.organico[key], data.organico.leads),
  });

  const funnelRows: FunnelRow[] = [
    buildRow('Leads', 'leads'),
    buildRow('Responderam', 'responderam'),
    buildRow('Agendaram', 'agendaram'),
    buildRow('Compareceram', 'compareceram'),
    buildRow('Fecharam', 'fecharam'),
  ];

  // KPIs
  const ssConv = data.socialSelling.leads > 0
    ? ((data.socialSelling.fecharam / data.socialSelling.leads) * 100).toFixed(1)
    : '0';
  const trConv = data.trafego.leads > 0
    ? ((data.trafego.fecharam / data.trafego.leads) * 100).toFixed(1)
    : '0';
  const orgConv = data.organico.leads > 0
    ? ((data.organico.fecharam / data.organico.leads) * 100).toFixed(1)
    : '0';
  const wdConv = data.whatsappDireto.leads > 0
    ? ((data.whatsappDireto.fecharam / data.whatsappDireto.leads) * 100).toFixed(1)
    : '0';
  const ssAgend = data.socialSelling.leads > 0
    ? ((data.socialSelling.agendaram / data.socialSelling.leads) * 100).toFixed(1)
    : '0';
  const trAgend = data.trafego.leads > 0
    ? ((data.trafego.agendaram / data.trafego.leads) * 100).toFixed(1)
    : '0';

  // Chart data para barras do funil
  const barChartData = funnelRows.map(row => ({
    name: row.etapa,
    'Social Selling': row.socialSelling,
    'Trafego': row.trafego,
    'WhatsApp Direto': row.whatsappDireto,
    'Organico': row.organico,
  }));

  if (data.loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-bg-hover rounded w-64 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-bg-secondary rounded-xl animate-pulse border border-border-default" />
          ))}
        </div>
        <div className="h-64 bg-bg-secondary rounded-xl animate-pulse border border-border-default" />
      </div>
    );
  }

  return (
    <div className="bg-bg-primary">
      {/* INLINE HEADER - Filtros sempre visiveis (igual Agendamentos) */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Megaphone size={20} className="text-pink-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Social Selling vs Trafego</h1>
                <p className="text-xs text-text-muted">
                  {data.totalLeads.toLocaleString()} leads no periodo
                  {effectiveLocationName && <span className="ml-1 text-pink-400 font-medium">| {effectiveLocationName}</span>}
                </p>
              </div>
            </div>

            {/* Filters - inline */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isClientUser && <LocationSelector
                locations={locations}
                selectedLocationId={selectedLocationId}
                onChange={setSelectedLocationId}
                isLoading={locationsLoading}
              />}
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <button
                onClick={() => data.refetch()}
                disabled={data.loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw size={16} className={`text-text-muted ${data.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Social Selling"
          value={data.socialSelling.leads}
          icon={<Target size={18} />}
          color="pink"
          subtitle={`${ssConv}% conv. | ${ssAgend}% agend.`}
        />
        <KpiCard
          label="Trafego Pago"
          value={data.trafego.leads}
          icon={<TrendingUp size={18} />}
          color="orange"
          subtitle={`${trConv}% conv. | ${trAgend}% agend.`}
        />
        <KpiCard
          label="WhatsApp Direto"
          value={data.whatsappDireto.leads}
          icon={<Users size={18} />}
          color="green"
          subtitle={`${wdConv}% conv.`}
        />
        <KpiCard
          label="Organico"
          value={data.organico.leads}
          icon={<Award size={18} />}
          color="blue"
          subtitle={`${orgConv}% conv.`}
        />
        <KpiCard
          label="Agendaram (SS)"
          value={data.socialSelling.agendaram}
          icon={<ArrowUpRight size={18} />}
          color="pink"
          subtitle={`${data.socialSelling.compareceram} comp. | ${data.socialSelling.fecharam} fecharam`}
        />
        <KpiCard
          label="Agendaram (Traf.)"
          value={data.trafego.agendaram}
          icon={<ArrowDownRight size={18} />}
          color="orange"
          subtitle={`${data.trafego.compareceram} comp. | ${data.trafego.fecharam} fecharam`}
        />
      </div>

      {/* Breakdown NS / VS / GS */}
      {data.socialSelling.leads > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Target size={16} className="text-pink-400" />
            Breakdown Social Selling
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SSBreakdownCard
              label="Novo Seguidor"
              shortLabel="NS"
              icon={<UserPlus size={16} />}
              segment={data.socialSellingBreakdown.ns}
              total={data.socialSelling.leads}
            />
            <SSBreakdownCard
              label="Visita Sincera"
              shortLabel="VS"
              icon={<Eye size={16} />}
              segment={data.socialSellingBreakdown.vs}
              total={data.socialSelling.leads}
            />
            <SSBreakdownCard
              label="Gatilho Social"
              shortLabel="GS"
              icon={<Zap size={16} />}
              segment={data.socialSellingBreakdown.gs}
              total={data.socialSelling.leads}
            />
            <SSBreakdownCard
              label="Sem subtipo"
              shortLabel="—"
              icon={<Megaphone size={16} />}
              segment={data.socialSellingBreakdown.generico}
              total={data.socialSelling.leads}
            />
          </div>
        </div>
      )}

      {/* Funil Comparativo (tabela) */}
      <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Funil Comparativo</h3>
          <p className="text-xs text-text-muted mt-1">Social Selling vs Trafego vs WhatsApp Direto vs Organico</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left px-6 py-3 text-text-muted font-medium">Etapa</th>
                <th className="text-center px-3 py-3 font-medium" style={{ color: COLORS.socialSelling }}>Social Selling</th>
                <th className="text-center px-2 py-3 text-text-muted font-medium">%</th>
                <th className="text-center px-3 py-3 font-medium" style={{ color: COLORS.trafego }}>Trafego</th>
                <th className="text-center px-2 py-3 text-text-muted font-medium">%</th>
                <th className="text-center px-3 py-3 font-medium" style={{ color: COLORS.whatsappDireto }}>WhatsApp</th>
                <th className="text-center px-2 py-3 text-text-muted font-medium">%</th>
                <th className="text-center px-3 py-3 font-medium" style={{ color: COLORS.organico }}>Organico</th>
                <th className="text-center px-2 py-3 text-text-muted font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {funnelRows.map((row, i) => (
                <tr key={row.etapa} className={`border-b border-border-default ${i === funnelRows.length - 1 ? 'bg-bg-hover/50' : ''}`}>
                  <td className="px-6 py-3 font-medium text-text-primary">{row.etapa}</td>
                  <td className="text-center px-3 py-3 font-bold" style={{ color: COLORS.socialSelling }}>
                    {row.socialSelling.toLocaleString()}
                  </td>
                  <td className="text-center px-2 py-3 text-text-muted text-xs">{row.socialSellingPct}</td>
                  <td className="text-center px-3 py-3 font-bold" style={{ color: COLORS.trafego }}>
                    {row.trafego.toLocaleString()}
                  </td>
                  <td className="text-center px-2 py-3 text-text-muted text-xs">{row.trafegoPct}</td>
                  <td className="text-center px-3 py-3 font-bold" style={{ color: COLORS.whatsappDireto }}>
                    {row.whatsappDireto.toLocaleString()}
                  </td>
                  <td className="text-center px-2 py-3 text-text-muted text-xs">{row.whatsappDiretoPct}</td>
                  <td className="text-center px-3 py-3 font-bold" style={{ color: COLORS.organico }}>
                    {row.organico.toLocaleString()}
                  </td>
                  <td className="text-center px-2 py-3 text-text-muted text-xs">{row.organicoPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart funil */}
        <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Funil por Origem</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="Social Selling" fill={COLORS.socialSelling} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Trafego" fill={COLORS.trafego} radius={[4, 4, 0, 0]} />
              <Bar dataKey="WhatsApp Direto" fill={COLORS.whatsappDireto} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Organico" fill={COLORS.organico} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart tendencia */}
        <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Tendencia Diaria</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v) => {
                  const d = new Date(v + 'T00:00:00');
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
                labelFormatter={(v) => {
                  const d = new Date(v + 'T00:00:00');
                  return d.toLocaleDateString('pt-BR');
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="socialSelling" name="Social Selling" stroke={COLORS.socialSelling} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="trafego" name="Trafego" stroke={COLORS.trafego} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="whatsappDireto" name="WhatsApp Direto" stroke={COLORS.whatsappDireto} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="organico" name="Organico" stroke={COLORS.organico} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="naoClassificado" name="Nao Classif." stroke={COLORS.naoClassificado} strokeWidth={1} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela por Agente */}
      {data.porAgente.length > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default">
            <h3 className="text-sm font-semibold text-text-primary">Performance por Cliente</h3>
            <p className="text-xs text-text-muted mt-1">Resultados por location/cliente em cada canal de origem</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-6 py-3 text-text-muted font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Origem</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Leads</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Responderam</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Agendaram</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Fecharam</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {data.porAgente.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-border-default hover:bg-bg-hover/50 transition-colors">
                    <td className="px-6 py-3 text-text-primary font-medium truncate max-w-[200px]">{row.agente}</td>
                    <td className="px-4 py-3">
                      <OrigemBadge origem={row.origem} />
                    </td>
                    <td className="text-center px-4 py-3 text-text-secondary">{row.leads}</td>
                    <td className="text-center px-4 py-3 text-text-secondary">{row.responderam}</td>
                    <td className="text-center px-4 py-3 text-text-secondary">{row.agendaram}</td>
                    <td className="text-center px-4 py-3 text-text-secondary font-semibold">{row.fecharam}</td>
                    <td className="text-center px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        row.taxaConversao >= 5 ? 'bg-green-500/20 text-green-400' :
                        row.taxaConversao >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {row.taxaConversao}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leads nao classificados */}
      {data.naoClassificado.leads > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
          <p className="text-xs text-text-muted">
            <span className="font-medium text-text-secondary">{data.naoClassificado.leads.toLocaleString()}</span> leads sem classificacao de origem
            ({pct(data.naoClassificado.leads, data.totalLeads)} do total).
            Esses leads serao classificados conforme passarem pelo workflow atualizado.
          </p>
        </div>
      )}

      </div>{/* /Content */}
    </div>
  );
}

// Componentes auxiliares

function KpiCard({ label, value, icon, color, subtitle }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'pink' | 'orange' | 'green' | 'blue';
  subtitle?: string;
}) {
  const colorMap = {
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function SSBreakdownCard({ label, shortLabel, icon, segment, total }: {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  segment: { leads: number; responderam: number; agendaram: number; fecharam: number };
  total: number;
}) {
  const share = total > 0 ? ((segment.leads / total) * 100).toFixed(0) : '0';
  const convRate = segment.leads > 0 ? ((segment.fecharam / segment.leads) * 100).toFixed(1) : '0';

  return (
    <div className="bg-bg-primary rounded-lg border border-border-default p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-pink-400">{icon}</span>
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        <span className="ml-auto text-[10px] text-text-muted bg-bg-hover px-1.5 py-0.5 rounded">{shortLabel}</span>
      </div>
      <div className="text-xl font-bold text-text-primary">{segment.leads.toLocaleString()}</div>
      <p className="text-[10px] text-text-muted mt-1">{share}% do SS</p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
        <div>
          <span className="text-text-muted">Resp.</span>
          <span className="block font-semibold text-text-secondary">{segment.responderam}</span>
        </div>
        <div>
          <span className="text-text-muted">Agend.</span>
          <span className="block font-semibold text-text-secondary">{segment.agendaram}</span>
        </div>
        <div>
          <span className="text-text-muted">Conv.</span>
          <span className="block font-semibold text-pink-400">{convRate}%</span>
        </div>
      </div>
    </div>
  );
}

function OrigemBadge({ origem }: { origem: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    social_selling: { label: 'Social Selling', bg: 'bg-pink-500/20', text: 'text-pink-400' },
    trafego: { label: 'Trafego', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    whatsapp_direto: { label: 'WhatsApp', bg: 'bg-green-500/20', text: 'text-green-400' },
    organico: { label: 'Organico', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    nao_classificado: { label: 'N/C', bg: 'bg-gray-500/20', text: 'text-gray-400' },
  };
  const c = config[origem] || config.nao_classificado;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function LocationSelector({ locations, selectedLocationId, onChange, isLoading }: {
  locations: { location_id: string; location_name: string }[];
  selectedLocationId: string | null;
  onChange: (id: string | null) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search.trim()
    ? locations.filter(l => l.location_name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  const selected = locations.find(l => l.location_id === selectedLocationId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg hover:border-pink-500/50 transition-colors disabled:opacity-50 min-w-[160px]"
      >
        <Building2 size={14} className={selected ? 'text-pink-400' : 'text-text-muted'} />
        <span className={`truncate ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected ? selected.location_name : 'Todos os Clientes'}
        </span>
        <ChevronDown size={14} className={`text-text-muted ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-bg-primary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
          {/* All option */}
          <button
            onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
              !selectedLocationId ? 'bg-pink-500/20 text-pink-400 font-medium' : 'text-text-primary hover:bg-bg-hover'
            }`}
          >
            Todos os Clientes
          </button>
          {/* List */}
          <div className="border-t border-border-default max-h-[280px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">Nenhum cliente encontrado</div>
            ) : (
              filtered.map(loc => (
                <button
                  key={loc.location_id}
                  onClick={() => { onChange(loc.location_id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedLocationId === loc.location_id
                      ? 'bg-pink-500/20 text-pink-400 font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {loc.location_name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialSellingDashboard;
