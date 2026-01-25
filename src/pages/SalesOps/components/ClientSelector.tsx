import React from 'react';
import { ChevronDown } from 'lucide-react';
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
  return (
    <div className="relative">
      <select
        value={selectedId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={isLoading}
        className="appearance-none bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer min-w-[200px]"
      >
        <option value="">Todos os Clientes</option>
        {clients.map((client) => (
          <option key={client.location_id} value={client.location_id}>
            {client.location_name} ({client.leads_ativos.toLocaleString()})
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

export default ClientSelector;
