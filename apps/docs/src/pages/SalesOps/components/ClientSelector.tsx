import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import type { ClientInfo } from '../../../lib/supabase-sales-ops';

interface ClientSelectorProps {
  clients: ClientInfo[];
  selectedId: string | null;
  onChange: (locationId: string | null) => void;
  isLoading?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedId,
  onChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar clientes baseado no termo de busca
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.location_name.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  // Cliente selecionado
  const selectedClient = clients.find(c => c.location_id === selectedId);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (locationId: string | null) => {
    onChange(locationId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative flex-1 md:flex-none md:min-w-[240px]">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer hover:border-[#444] transition-colors"
      >
        <span className="truncate">
          {selectedClient
            ? `${selectedClient.location_name} (${selectedClient.leads_ativos.toLocaleString()})`
            : 'Todos os Clientes'
          }
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-[#333]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full bg-[#0d0d0d] border border-[#333] rounded-md pl-9 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#333] rounded transition-colors"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[280px] overflow-y-auto">
            {/* Todos os Clientes option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                !selectedId
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-white hover:bg-[#222]'
              }`}
            >
              <span>Todos os Clientes</span>
              {!selectedId && <Check size={14} className="text-blue-400" />}
            </button>

            {/* Separator */}
            <div className="h-px bg-[#333] mx-2" />

            {/* Client options */}
            {filteredClients.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                Nenhum cliente encontrado
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.location_id}
                  onClick={() => handleSelect(client.location_id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    selectedId === client.location_id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-white hover:bg-[#222]'
                  }`}
                >
                  <span className="truncate mr-2">{client.location_name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      ({client.leads_ativos.toLocaleString()})
                    </span>
                    {selectedId === client.location_id && (
                      <Check size={14} className="text-blue-400" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
