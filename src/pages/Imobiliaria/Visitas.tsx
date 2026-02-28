import React, { useState } from 'react';
import { Plus, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useImobVisitas, ImobVisita } from '../../hooks/imob/useImobVisitas';

const STATUS_STYLES: Record<string, string> = {
  agendada: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  realizada: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
  reagendada: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

interface VisitaModalProps {
  locationId: string;
  onSave: (data: Omit<ImobVisita, 'id' | 'created_at'>) => Promise<unknown>;
  onClose: () => void;
}

const VisitaModal: React.FC<VisitaModalProps> = ({ locationId, onSave, onClose }) => {
  const [form, setForm] = useState({
    location_id: locationId,
    imovel_id: '',
    lead_id: '',
    data_visita: '',
    status: 'agendada' as ImobVisita['status'],
    feedback: '',
    nota_visita: null as number | null,
    corretor: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.imovel_id || !form.data_visita) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const INPUT = 'bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors w-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-100">Nova Visita</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">ID do Imóvel *</label>
            <input className={INPUT} value={form.imovel_id} onChange={e => setForm(f => ({ ...f, imovel_id: e.target.value }))} placeholder="UUID do imóvel" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">ID do Lead</label>
            <input className={INPUT} value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))} placeholder="UUID do lead" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Data e Hora *</label>
            <input type="datetime-local" className={INPUT} value={form.data_visita} onChange={e => setForm(f => ({ ...f, data_visita: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Corretor</label>
            <input className={INPUT} value={form.corretor} onChange={e => setForm(f => ({ ...f, corretor: e.target.value }))} placeholder="Nome do corretor" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Status</label>
            <select className={INPUT} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ImobVisita['status'] }))}>
              <option value="agendada">Agendada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="reagendada">Reagendada</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.imovel_id || !form.data_visita}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Visitas: React.FC = () => {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id;
  const { visitas, loading, stats, fetchVisitas, createVisita, updateVisita } = useImobVisitas(locationId);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterInicio, setFilterInicio] = useState('');
  const [filterFim, setFilterFim] = useState('');
  const [showModal, setShowModal] = useState(false);

  const applyFilters = () => {
    fetchVisitas({
      status: filterStatus || undefined,
      data_inicio: filterInicio || undefined,
      data_fim: filterFim || undefined,
    });
  };

  const filtered = visitas.filter(v => !filterStatus || v.status === filterStatus);

  const kpis = [
    { icon: Calendar, label: 'Total', value: stats.total, color: 'text-zinc-400' },
    { icon: Clock, label: 'Agendadas', value: stats.agendadas, color: 'text-blue-400' },
    { icon: CheckCircle, label: 'Realizadas', value: stats.realizadas, color: 'text-green-400' },
    { icon: TrendingUp, label: 'Comparecimento', value: `${stats.taxa_comparecimento}%`, color: 'text-yellow-400' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Visitas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Controle de visitas agendadas e realizadas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nova Visita
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center gap-3">
              <Icon size={18} className={kpi.color} />
              <div>
                <p className="text-xs text-zinc-400">{kpi.label}</p>
                <p className="text-lg font-bold text-zinc-100">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); }}
        >
          <option value="">Todos os status</option>
          <option value="agendada">Agendada</option>
          <option value="realizada">Realizada</option>
          <option value="cancelada">Cancelada</option>
          <option value="reagendada">Reagendada</option>
        </select>
        <input
          type="date"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filterInicio}
          onChange={e => setFilterInicio(e.target.value)}
          placeholder="Data início"
        />
        <input
          type="date"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filterFim}
          onChange={e => setFilterFim(e.target.value)}
        />
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors"
        >
          Filtrar
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Carregando visitas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Nenhuma visita encontrada.</div>
      ) : (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Imóvel ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Lead ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Corretor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Nota</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(visita => (
                <tr key={visita.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-300 text-xs">{formatDate(visita.data_visita)}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{visita.imovel_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{visita.lead_id?.slice(0, 8) ?? '-'}...</td>
                  <td className="px-4 py-3 text-zinc-300">{visita.corretor || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_STYLES[visita.status] ?? ''}`}>
                      {STATUS_LABELS[visita.status] ?? visita.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {visita.nota_visita != null ? `${visita.nota_visita}/10` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && locationId && (
        <VisitaModal
          locationId={locationId}
          onSave={createVisita}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Visitas;
