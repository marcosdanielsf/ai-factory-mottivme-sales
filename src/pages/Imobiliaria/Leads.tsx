import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useImobLeads, ImobLeadPerfil } from '../../hooks/imob/useImobLeads';
import { LeadMatchDrawer } from '../../components/imob/LeadMatchDrawer';

const URGENCIA_STYLES: Record<string, string> = {
  alta: 'bg-red-500/20 text-red-400 border-red-500/30',
  media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  baixa: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const formatCurrency = (value: number | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);
};

export const ImobLeads: React.FC = () => {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id;
  const { leads, loading } = useImobLeads(locationId);

  const [search, setSearch] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [selectedLead, setSelectedLead] = useState<ImobLeadPerfil | null>(null);

  const filtered = leads.filter(l => {
    if (filterUrgencia && l.urgencia !== filterUrgencia) return false;
    if (filterTipo && l.tipo_interesse !== filterTipo) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.lead_id?.toLowerCase().includes(s) ||
        l.contact_id?.toLowerCase().includes(s) ||
        l.tipo_interesse?.toLowerCase().includes(s) ||
        l.bairros_interesse?.some(b => b.toLowerCase().includes(s))
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Leads Imobiliários</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{leads.length} leads com perfil cadastrado</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-zinc-500" />
          <input
            className="bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none flex-1"
            placeholder="Buscar por lead, bairro, tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filterUrgencia}
          onChange={e => setFilterUrgencia(e.target.value)}
        >
          <option value="">Todas urgências</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
        >
          <option value="">Todos tipos</option>
          <option value="casa">Casa</option>
          <option value="apartamento">Apartamento</option>
          <option value="terreno">Terreno</option>
          <option value="comercial">Comercial</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Carregando leads...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Nenhum lead encontrado.</div>
      ) : (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Lead ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Tipo Interesse</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Bairros</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Faixa Valor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Score Match</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Urgência</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="border-b border-zinc-700/50 hover:bg-zinc-700/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                    {lead.lead_id?.slice(0, 8) || lead.contact_id?.slice(0, 8) || lead.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-zinc-300 capitalize">{lead.tipo_interesse || '-'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {lead.bairros_interesse?.slice(0, 2).join(', ') || '-'}
                    {(lead.bairros_interesse?.length ?? 0) > 2 && ` +${lead.bairros_interesse!.length - 2}`}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {lead.faixa_valor_min || lead.faixa_valor_max
                      ? `${formatCurrency(lead.faixa_valor_min)} – ${formatCurrency(lead.faixa_valor_max)}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.score_match != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-zinc-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{ width: `${lead.score_match}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400">{lead.score_match}%</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.urgencia ? (
                      <span className={`px-2 py-0.5 rounded text-xs border ${URGENCIA_STYLES[lead.urgencia] ?? ''}`}>
                        {lead.urgencia}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Match Drawer */}
      {selectedLead && locationId && (
        <LeadMatchDrawer
          lead={selectedLead}
          locationId={locationId}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default ImobLeads;
