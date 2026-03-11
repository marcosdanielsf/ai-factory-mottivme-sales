import React from 'react';
import { X, MapPin, DollarSign, Bed, CheckCircle, Calendar } from 'lucide-react';
import { ImobLeadPerfil } from '../../hooks/imob/useImobLeads';
import { useImobImoveis } from '../../hooks/imob/useImobImoveis';
import { useImobMatch } from '../../hooks/imob/useImobMatch';

const formatCurrency = (value: number | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface LeadMatchDrawerProps {
  lead: ImobLeadPerfil;
  locationId: string;
  onClose: () => void;
  onAgendarVisita?: (imovelId: string, leadId: string) => void;
}

export const LeadMatchDrawer: React.FC<LeadMatchDrawerProps> = ({
  lead,
  locationId,
  onClose,
  onAgendarVisita,
}) => {
  const { imoveis } = useImobImoveis(locationId);
  const { matchImoveis } = useImobMatch(imoveis);
  const matches = matchImoveis(lead);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-700 h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Imóveis Compatíveis</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Top {matches.length} matches para o perfil</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Perfil do lead */}
        <div className="p-4 border-b border-zinc-700 bg-zinc-800/50">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Perfil do Lead</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
            {lead.tipo_interesse && (
              <div className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-zinc-500" />
                <span className="capitalize">{lead.tipo_interesse}</span>
              </div>
            )}
            {lead.quartos_min && (
              <div className="flex items-center gap-1.5">
                <Bed size={12} className="text-zinc-500" />
                <span>{lead.quartos_min}+ quartos</span>
              </div>
            )}
            {(lead.faixa_valor_min || lead.faixa_valor_max) && (
              <div className="flex items-center gap-1.5 col-span-2">
                <DollarSign size={12} className="text-zinc-500" />
                <span>
                  {lead.faixa_valor_min ? formatCurrency(lead.faixa_valor_min) : 'Sem min'}
                  {' – '}
                  {lead.faixa_valor_max ? formatCurrency(lead.faixa_valor_max) : 'Sem max'}
                </span>
              </div>
            )}
            {lead.bairros_interesse && lead.bairros_interesse.length > 0 && (
              <div className="flex items-start gap-1.5 col-span-2">
                <MapPin size={12} className="text-zinc-500 mt-0.5" />
                <span>{lead.bairros_interesse.join(', ')}</span>
              </div>
            )}
            {lead.urgencia && (
              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded text-xs border ${
                  lead.urgencia === 'alta'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : lead.urgencia === 'media'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                }`}>
                  Urgência: {lead.urgencia}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Matches */}
        <div className="flex-1 p-4 space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Nenhum imóvel compatível encontrado para este perfil.
            </div>
          ) : (
            matches.map((match, idx) => (
              <div key={match.imovel.id} className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                {/* Foto */}
                <div className="relative h-36 bg-zinc-700">
                  {match.imovel.fotos_urls?.[0] ? (
                    <img
                      src={match.imovel.fotos_urls[0]}
                      alt={match.imovel.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">Sem foto</div>
                  )}
                  {/* Score badge */}
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-bold text-green-400">
                    #{idx + 1} — {match.score}% match
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-100 line-clamp-1">{match.imovel.titulo}</h3>

                  {/* Score bar */}
                  <div className="w-full bg-zinc-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500 transition-all"
                      style={{ width: `${match.score}%` }}
                    />
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-1">
                    {match.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {/* Valor */}
                  <p className="text-sm font-bold text-zinc-100">
                    {formatCurrency(match.imovel.valor_venda || match.imovel.valor_aluguel)}
                  </p>

                  {/* Agendar visita */}
                  {onAgendarVisita && lead.lead_id && (
                    <button
                      onClick={() => onAgendarVisita(match.imovel.id, lead.lead_id!)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Calendar size={13} />
                      Agendar Visita
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
