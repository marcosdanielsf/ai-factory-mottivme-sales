import React, { useState } from 'react';
import { useAccount } from '../../contexts/AccountContext';
import { useLocations } from '../../hooks/useLocations';
import { useGHLContacts } from '../../hooks/ghl/useGHLContacts';
import { useDebounce } from '../../hooks/ghl/useDebounce';
import { Search, Loader2, Users, Tag, Globe } from 'lucide-react';

export default function GHLLeads() {
    const { selectedAccount } = useAccount();
    const { locations } = useLocations();
    const locationId = selectedAccount?.location_id || locations?.[0]?.location_id || '';

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    const { contacts, loading, hasMore, loadMore } = useGHLContacts({
        locationId,
        limit: 50,
        query: debouncedSearchTerm
    });

    if (!locationId) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                Selecione uma conta para visualizar os leads.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads (GHL Direct)</h1>
                    <p className="text-gray-400 text-sm">Base de contatos e atribuição de origem</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar leads..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900/50 text-gray-400 uppercase">
                            <tr>
                                <th className="px-6 py-3">Contato</th>
                                <th className="px-6 py-3">Email/Phone</th>
                                <th className="px-6 py-3">Tags</th>
                                <th className="px-6 py-3">Origem (UTM)</th>
                                <th className="px-6 py-3">Criado em</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {contacts.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum contato encontrado.
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold">
                                                    {contact.firstName ? contact.firstName[0] : <Users className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {contact.firstName} {contact.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {contact.id.substring(0, 8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            <div className="flex flex-col">
                                                <span>{contact.email}</span>
                                                <span className="text-gray-500 text-xs">{contact.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {contact.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {tag}
                                                    </span>
                                                ))}
                                                {contact.tags?.length > 3 && (
                                                    <span className="text-xs text-gray-500">+{contact.tags.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {contact.attributionSource ? (
                                                <div className="flex flex-col text-xs">
                                                    {contact.attributionSource.utmSource && (
                                                        <span className="text-green-400">src: {contact.attributionSource.utmSource}</span>
                                                    )}
                                                    {contact.attributionSource.utmCampaign && (
                                                        <span className="text-blue-400">cmp: {contact.attributionSource.utmCampaign}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 italic">Direct/Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {new Date(contact.dateAdded).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Trigger */}
                {hasMore && (
                    <div className="p-4 flex justify-center border-t border-gray-700">
                        <button
                            onClick={() => loadMore()}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Carregar mais'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
