import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useImobImoveis, Imovel, ImoveisFilters } from '../../hooks/imob/useImobImoveis';
import { ImovelCard } from '../../components/imob/ImovelCard';
import { ImovelModal } from '../../components/imob/ImovelModal';

export const Catalogo: React.FC = () => {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id;
  const { imoveis, loading, stats, fetchImoveis, createImovel, updateImovel, deleteImovel } = useImobImoveis(locationId);

  const [selectedImovel, setSelectedImovel] = useState<Imovel | null | undefined>(undefined);
  const [filters, setFilters] = useState<ImoveisFilters>({});
  const [search, setSearch] = useState('');

  const applyFilters = (newFilters: ImoveisFilters) => {
    setFilters(newFilters);
    fetchImoveis(newFilters);
  };

  const handleFilterChange = (key: keyof ImoveisFilters, value: string) => {
    const updated = { ...filters, [key]: value || undefined };
    applyFilters(updated);
  };

  const filtered = imoveis.filter(i =>
    !search || i.titulo.toLowerCase().includes(search.toLowerCase()) ||
    i.bairro?.toLowerCase().includes(search.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: Partial<Imovel>) => {
    if (selectedImovel) {
      await updateImovel(selectedImovel.id, data);
    } else {
      await createImovel({ ...data, location_id: locationId! } as Parameters<typeof createImovel>[0]);
    }
  };

  const handleToggleDestaque = async (id: string, destaque: boolean) => {
    await updateImovel(id, { destaque });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Catálogo de Imóveis</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {stats.total} total · {stats.disponiveis} disponíveis · {stats.vendidos} vendidos
          </p>
        </div>
        <button
          onClick={() => setSelectedImovel(null)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Imóvel
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-zinc-500" />
          <input
            className="bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none flex-1"
            placeholder="Buscar por título, bairro, cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filters.tipo || ''}
          onChange={e => handleFilterChange('tipo', e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="casa">Casa</option>
          <option value="apartamento">Apartamento</option>
          <option value="terreno">Terreno</option>
          <option value="comercial">Comercial</option>
          <option value="rural">Rural</option>
        </select>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filters.finalidade || ''}
          onChange={e => handleFilterChange('finalidade', e.target.value)}
        >
          <option value="">Todas finalidades</option>
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
          <option value="temporada">Temporada</option>
        </select>
        <select
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none"
          value={filters.status || ''}
          onChange={e => handleFilterChange('status', e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-sm text-zinc-500 py-8 text-center">Carregando imóveis...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-zinc-500 py-8 text-center">
          Nenhum imóvel encontrado. <button onClick={() => setSelectedImovel(null)} className="text-blue-400 hover:underline">Cadastrar primeiro imóvel</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(imovel => (
            <ImovelCard
              key={imovel.id}
              imovel={imovel}
              onClick={setSelectedImovel}
              onToggleDestaque={handleToggleDestaque}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedImovel !== undefined && locationId && (
        <ImovelModal
          imovel={selectedImovel}
          locationId={locationId}
          onSave={handleSave}
          onDelete={deleteImovel}
          onClose={() => setSelectedImovel(undefined)}
        />
      )}
    </div>
  );
};

export default Catalogo;
