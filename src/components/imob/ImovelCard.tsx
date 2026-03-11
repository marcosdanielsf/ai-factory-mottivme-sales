import React from 'react';
import { Bed, Maximize2, Car, Star, MapPin, Tag } from 'lucide-react';
import { Imovel } from '../../hooks/imob/useImobImoveis';

const formatCurrency = (value: number | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const STATUS_STYLES: Record<string, string> = {
  disponivel: 'bg-green-500/20 text-green-400 border-green-500/30',
  reservado: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  vendido: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  suspenso: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  suspenso: 'Suspenso',
};

const TIPO_LABELS: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
  rural: 'Rural',
};

interface ImovelCardProps {
  imovel: Imovel;
  onClick: (imovel: Imovel) => void;
  onToggleDestaque: (id: string, destaque: boolean) => void;
}

export const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onClick, onToggleDestaque }) => {
  const foto = imovel.fotos_urls?.[0];
  const valor = imovel.finalidade === 'venda' ? imovel.valor_venda : imovel.valor_aluguel;

  const handleDestaqueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleDestaque(imovel.id, !imovel.destaque);
  };

  return (
    <div
      onClick={() => onClick(imovel)}
      className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors group"
    >
      {/* Foto */}
      <div className="relative h-48 bg-zinc-700 flex items-center justify-center overflow-hidden">
        {foto ? (
          <img src={foto} alt={imovel.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <Tag size={32} />
            <span className="text-xs">Sem foto</span>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[imovel.status] ?? ''}`}>
          {STATUS_LABELS[imovel.status] ?? imovel.status}
        </div>

        {/* Destaque star */}
        <button
          onClick={handleDestaqueClick}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        >
          <Star
            size={16}
            className={imovel.destaque ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'}
          />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        {/* Tipo + título */}
        <div>
          <span className="text-xs text-zinc-400 uppercase tracking-wide">{TIPO_LABELS[imovel.tipo] ?? imovel.tipo}</span>
          <h3 className="text-sm font-semibold text-zinc-100 mt-0.5 line-clamp-2">{imovel.titulo}</h3>
        </div>

        {/* Localização */}
        {(imovel.bairro || imovel.cidade) && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <MapPin size={12} />
            <span className="truncate">
              {[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Atributos */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          {imovel.quartos != null && (
            <span className="flex items-center gap-1">
              <Bed size={12} />
              {imovel.quartos}
            </span>
          )}
          {imovel.area_total != null && (
            <span className="flex items-center gap-1">
              <Maximize2 size={12} />
              {imovel.area_total}m²
            </span>
          )}
          {imovel.vagas_garagem != null && imovel.vagas_garagem > 0 && (
            <span className="flex items-center gap-1">
              <Car size={12} />
              {imovel.vagas_garagem}
            </span>
          )}
        </div>

        {/* Valor */}
        <div className="pt-1 border-t border-zinc-700">
          <p className="text-base font-bold text-zinc-100">
            {formatCurrency(valor)}
            {imovel.finalidade === 'aluguel' && <span className="text-xs font-normal text-zinc-400">/mês</span>}
          </p>
          {imovel.finalidade === 'aluguel' && imovel.valor_condominio && (
            <p className="text-xs text-zinc-500">+ {formatCurrency(imovel.valor_condominio)} cond.</p>
          )}
        </div>
      </div>
    </div>
  );
};
