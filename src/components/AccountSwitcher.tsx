import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, X, Check, Building2, Crown, ArrowLeft } from 'lucide-react';

interface Location {
  location_id: string;
  location_name: string;
}

interface AccountSwitcherProps {
  locations: Location[];
  selectedAccount: Location | null;
  onSelectAccount: (location: Location) => void;
  onBackToAdmin: () => void;
  isCollapsed?: boolean;
  loading?: boolean;
}

const RECENT_ACCOUNTS_KEY = 'mottivme_recent_accounts';
const MAX_RECENT_ACCOUNTS = 3;

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  locations,
  selectedAccount,
  onSelectAccount,
  onBackToAdmin,
  isCollapsed = false,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gerenciar contas recentes no localStorage
  const [recentAccounts, setRecentAccounts] = useState<Location[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Atualizar recentes quando selecionar uma conta
  useEffect(() => {
    if (selectedAccount && selectedAccount.location_id !== 'admin') {
      setRecentAccounts((prev) => {
        // Remove duplicatas e adiciona no início
        const filtered = prev.filter(
          (acc) => acc.location_id !== selectedAccount.location_id
        );
        const updated = [selectedAccount, ...filtered].slice(0, MAX_RECENT_ACCOUNTS);

        try {
          localStorage.setItem(RECENT_ACCOUNTS_KEY, JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save recent accounts:', error);
        }

        return updated;
      });
    }
  }, [selectedAccount]);

  // Filtrar contas baseado no termo de busca
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return locations;
    const term = searchTerm.toLowerCase();
    return locations.filter((loc) =>
      loc.location_name.toLowerCase().includes(term)
    );
  }, [locations, searchTerm]);

  // Contas recentes que ainda existem na lista
  const validRecentAccounts = useMemo(() => {
    return recentAccounts.filter((recent) =>
      locations.some((loc) => loc.location_id === recent.location_id)
    );
  }, [recentAccounts, locations]);

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

  const handleSelect = (location: Location) => {
    onSelectAccount(location);
    setIsOpen(false);
    setSearchTerm('');
    // Navigate after state commits to ensure ConditionalLayout reads updated context
    requestAnimationFrame(() => navigate('/agendamentos'));
  };

  const handleBackToAdmin = () => {
    onBackToAdmin();
    setIsOpen(false);
    setSearchTerm('');
    // Navigate back to admin dashboard
    navigate('/');
  };

  const isAdminView = !selectedAccount || selectedAccount.location_id === 'admin';
  const displayName = isAdminView ? 'Admin' : selectedAccount.location_name;

  // Modo collapsed: apenas ícone com tooltip
  if (isCollapsed) {
    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !loading && setIsOpen(!isOpen)}
          disabled={loading}
          className="w-full flex items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer hover:border-[#444] transition-all group"
          title={displayName}
        >
          {isAdminView ? (
            <Crown size={18} className="text-amber-400" />
          ) : (
            <Building2 size={18} className="text-blue-400" />
          )}
        </button>

        {/* Dropdown para modo collapsed */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <AccountDropdown
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              inputRef={inputRef}
              isAdminView={isAdminView}
              handleBackToAdmin={handleBackToAdmin}
              validRecentAccounts={validRecentAccounts}
              selectedAccount={selectedAccount}
              handleSelect={handleSelect}
              filteredLocations={filteredLocations}
            />
          </div>
        )}
      </div>
    );
  }

  // Modo expanded: nome completo + chevron
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !loading && setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer hover:border-[#444] transition-all group"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isAdminView ? (
            <Crown size={16} className="text-amber-400 flex-shrink-0" />
          ) : (
            <Building2 size={16} className="text-blue-400 flex-shrink-0" />
          )}
          <span className="truncate text-sm font-medium">{displayName}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown para modo expanded */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <AccountDropdown
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            inputRef={inputRef}
            isAdminView={isAdminView}
            handleBackToAdmin={handleBackToAdmin}
            validRecentAccounts={validRecentAccounts}
            selectedAccount={selectedAccount}
            handleSelect={handleSelect}
            filteredLocations={filteredLocations}
          />
        </div>
      )}
    </div>
  );
};

// Componente interno para o dropdown (reutilizado em collapsed e expanded)
interface AccountDropdownProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isAdminView: boolean;
  handleBackToAdmin: () => void;
  validRecentAccounts: Location[];
  selectedAccount: Location | null;
  handleSelect: (location: Location) => void;
  filteredLocations: Location[];
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({
  searchTerm,
  setSearchTerm,
  inputRef,
  isAdminView,
  handleBackToAdmin,
  validRecentAccounts,
  selectedAccount,
  handleSelect,
  filteredLocations,
}) => {
  return (
    <>
      {/* Search Input */}
      <div className="p-3 border-b border-[#333] bg-[#0d0d0d]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Procurar por uma subconta..."
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-md pl-9 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
      <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
        {/* Botão "Voltar para Admin" (apenas quando em view cliente) */}
        {!isAdminView && (
          <>
            <button
              onClick={handleBackToAdmin}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all font-medium border-b border-[#333]"
            >
              <ArrowLeft size={14} />
              <Crown size={14} className="text-amber-400" />
              <span>Voltar para Admin</span>
            </button>
          </>
        )}

        {/* Seção "Recentes" */}
        {validRecentAccounts.length > 0 && !searchTerm && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#0d0d0d]">
              Recentes
            </div>
            {validRecentAccounts.map((account) => (
              <AccountOption
                key={`recent-${account.location_id}`}
                account={account}
                isSelected={selectedAccount?.location_id === account.location_id}
                onSelect={handleSelect}
              />
            ))}
            <div className="h-px bg-[#333] mx-2 my-1" />
          </>
        )}

        {/* Seção "Todas as Contas" */}
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#0d0d0d]">
          {searchTerm ? 'Resultados da busca' : 'Todas as Contas'}
        </div>

        {filteredLocations.length === 0 ? (
          <div className="px-3 py-6 text-center text-gray-500 text-sm">
            Nenhuma subconta encontrada
          </div>
        ) : (
          filteredLocations.map((location) => (
            <AccountOption
              key={location.location_id}
              account={location}
              isSelected={selectedAccount?.location_id === location.location_id}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </>
  );
};

// Componente de opção de conta
interface AccountOptionProps {
  account: Location;
  isSelected: boolean;
  onSelect: (location: Location) => void;
}

const AccountOption: React.FC<AccountOptionProps> = ({
  account,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={() => onSelect(account)}
      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all ${
        isSelected
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-white hover:bg-[#222]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Building2
          size={14}
          className={isSelected ? 'text-blue-400' : 'text-gray-500'}
        />
        <span className="truncate">{account.location_name}</span>
      </div>
      {isSelected && <Check size={14} className="text-blue-400 flex-shrink-0" />}
    </button>
  );
};

export default AccountSwitcher;
