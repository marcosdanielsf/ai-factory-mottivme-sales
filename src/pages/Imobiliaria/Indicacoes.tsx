import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Gift, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ImobIndicacao {
  id: string;
  location_id: string;
  indicador_nome: string | null;
  indicador_telefone: string | null;
  indicado_nome: string | null;
  indicado_telefone: string | null;
  imovel_id: string | null;
  status: 'pendente' | 'qualificado' | 'convertido' | 'pago';
  comissao_valor: number | null;
  comissao_paga: boolean;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  qualificado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  convertido: 'bg-green-500/20 text-green-400 border-green-500/30',
  pago: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const formatCurrency = (v: number | null) =>
  v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '-';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR');

interface IndicacaoModalProps {
  locationId: string;
  onSave: (data: Partial<ImobIndicacao>) => Promise<void>;
  onClose: () => void;
}

const IndicacaoModal: React.FC<IndicacaoModalProps> = ({ locationId, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<ImobIndicacao>>({
    location_id: locationId,
    status: 'pendente',
    comissao_paga: false,
  });
  const [saving, setSaving] = useState(false);

  const INPUT = 'bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors w-full';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-100">Nova Indicação</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Indicador - Nome</label>
            <input className={INPUT} value={form.indicador_nome || ''} onChange={e => setForm(f => ({ ...f, indicador_nome: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Indicador - Telefone</label>
            <input className={INPUT} value={form.indicador_telefone || ''} onChange={e => setForm(f => ({ ...f, indicador_telefone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Indicado - Nome</label>
            <input className={INPUT} value={form.indicado_nome || ''} onChange={e => setForm(f => ({ ...f, indicado_nome: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Indicado - Telefone</label>
            <input className={INPUT} value={form.indicado_telefone || ''} onChange={e => setForm(f => ({ ...f, indicado_telefone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Comissão (R$)</label>
            <input type="number" className={INPUT} value={form.comissao_valor ?? ''} onChange={e => setForm(f => ({ ...f, comissao_valor: e.target.value ? Number(e.target.value) : null }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Status</label>
            <select className={INPUT} value={form.status || 'pendente'} onChange={e => setForm(f => ({ ...f, status: e.target.value as ImobIndicacao['status'] }))}>
              <option value="pendente">Pendente</option>
              <option value="qualificado">Qualificado</option>
              <option value="convertido">Convertido</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Indicacoes: React.FC = () => {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id;

  const [indicacoes, setIndicacoes] = useState<ImobIndicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchIndicacoes = useCallback(async () => {
    if (!isSupabaseConfigured() || !locationId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('imob_indicacoes')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
    setIndicacoes((data || []) as ImobIndicacao[]);
    setLoading(false);
  }, [locationId]);

  useEffect(() => { fetchIndicacoes(); }, [fetchIndicacoes]);

  const createIndicacao = async (data: Partial<ImobIndicacao>) => {
    if (!isSupabaseConfigured()) return;
    await supabase.from('imob_indicacoes').insert(data);
    await fetchIndicacoes();
  };

  const filtered = indicacoes.filter(i => !filterStatus || i.status === filterStatus);

  const stats = {
    total: indicacoes.length,
    qualificadas: indicacoes.filter(i => i.status === 'qualificado').length,
    convertidas: indicacoes.filter(i => i.status === 'convertido' || i.status === 'pago').length,
    pago: indicacoes.filter(i => i.comissao_paga).reduce((acc, i) => acc + (i.comissao_valor || 0), 0),
  };

  const kpis = [
    { icon: Gift, label: 'Total', value: stats.total, color: 'text-zinc-400' },
    { icon: TrendingUp, label: 'Qualificadas', value: stats.qualificadas, color: 'text-blue-400' },
    { icon: CheckCircle, label: 'Convertidas', value: stats.convertidas, color: 'text-green-400' },
    { icon: DollarSign, label: 'Comissões Pagas', value: formatCurrency(stats.pago), color: 'text-yellow-400' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Indicações</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Programa de indicações e controle de comissões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nova Indicação
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

      {/* Filtro */}
      <div>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="qualificado">Qualificado</option>
          <option value="convertido">Convertido</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Carregando indicações...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Nenhuma indicação encontrada.</div>
      ) : (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Indicador</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Indicado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Comissão</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Paga</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ind => (
                <tr key={ind.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-zinc-300 text-sm">{ind.indicador_nome || '-'}</p>
                    <p className="text-zinc-500 text-xs">{ind.indicador_telefone || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-300 text-sm">{ind.indicado_nome || '-'}</p>
                    <p className="text-zinc-500 text-xs">{ind.indicado_telefone || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_STYLES[ind.status] ?? ''}`}>
                      {ind.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{formatCurrency(ind.comissao_valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${ind.comissao_paga ? 'text-green-400' : 'text-zinc-500'}`}>
                      {ind.comissao_paga ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(ind.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && locationId && (
        <IndicacaoModal
          locationId={locationId}
          onSave={createIndicacao}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Indicacoes;
