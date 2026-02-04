import React, { useState } from 'react';
import { Linkedin, Instagram, Briefcase, Target, Building2, Search, Filter, Heart, MapPin, Workflow, Loader2, CheckCircle, AlertCircle, Users, ExternalLink, BadgeCheck, Hash, UserPlus, List } from 'lucide-react';
import { Button, Card, Input } from '../UI';
import { useInstagramSearch, SearchResult } from '../../hooks/useInstagramSearch';

// LinkedInSearchView
export const LinkedInSearchView = () => {
  const [searchType, setSearchType] = useState('Sales Navigator');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">LinkedIn Lead Search</h1>
          <p className="text-slate-500 dark:text-slate-400">Find prospects on LinkedIn with advanced filters</p>
        </div>
        <Button variant="outline">Saved Searches</Button>
      </div>

      <Card className="p-8 max-w-5xl mx-auto border-slate-200 shadow-lg shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-900/20 dark:via-sky-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/50 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3">
              <Linkedin size={140} />
           </div>
           <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 z-10">
             <Linkedin className="w-8 h-8 text-[#0A66C2]" />
           </div>
           <div className="z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Professional Network Search</h3>
              <p className="text-slate-600 dark:text-slate-400">Search LinkedIn profiles with Sales Navigator filters.</p>
           </div>
        </div>

        <div className="mb-8">
           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide text-xs">Search Type</label>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sales Navigator', icon: Target, desc: 'Advanced filters' },
                { label: 'By Company', icon: Building2, desc: 'Find employees' },
                { label: 'By Title', icon: Briefcase, desc: 'Job role search' },
                { label: 'Boolean Search', icon: Search, desc: 'Custom query' },
              ].map((type) => (
                <button
                    key={type.label}
                    onClick={() => setSearchType(type.label)}
                    className={`group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${searchType === type.label ? 'bg-blue-50/50 dark:bg-blue-900/30 border-[#0A66C2] text-[#0A66C2]' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-700'}`}
                >
                   <type.icon size={24} className="mb-2" />
                   <span className="text-sm font-semibold">{type.label}</span>
                   <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{type.desc}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Job Title / Keywords</label>
              <Input placeholder="e.g. CEO, CTO, Head of Sales" className="h-12" />
           </div>
           <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Company</label>
              <Input placeholder="e.g. Google, Microsoft" className="h-12" />
           </div>
           <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Location</label>
              <select className="w-full h-12 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                <option>Brazil</option>
                <option>Sao Paulo, Brazil</option>
                <option>United States</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Industry</label>
              <select className="w-full h-12 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                <option>All Industries</option>
                <option>Technology</option>
                <option>Financial Services</option>
              </select>
           </div>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1">Start Search</Button>
          <Button variant="outline">Save Search</Button>
        </div>
      </Card>
    </div>
  );
};

// InstagramSearchView - 4 search modes: username, followers, hashtag, batch
export const InstagramSearchView = () => {
  const [searchType, setSearchType] = useState<'username' | 'followers' | 'hashtag' | 'batch'>('username');
  const [username, setUsername] = useState('');
  const [targetProfile, setTargetProfile] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [batchUsernames, setBatchUsernames] = useState('');
  const [maxResults, setMaxResults] = useState(50);

  const {
    isLoading,
    error,
    results,
    totalFound,
    searchByUsername,
    searchByFollowers,
    searchByHashtag,
    searchBatch,
    clearResults,
    clearError,
  } = useInstagramSearch();

  const handleSearch = async () => {
    switch (searchType) {
      case 'username':
        if (username) await searchByUsername(username, true);
        break;
      case 'followers':
        if (targetProfile) await searchByFollowers(targetProfile, maxResults);
        break;
      case 'hashtag':
        if (hashtag) await searchByHashtag(hashtag, maxResults);
        break;
      case 'batch':
        if (batchUsernames) {
          const usernames = batchUsernames
            .split(/[\n,;]+/)
            .map(u => u.trim().replace('@', ''))
            .filter(u => u.length > 0);
          if (usernames.length > 0) await searchBatch(usernames);
        }
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchType !== 'batch') {
      handleSearch();
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'LEAD_HOT': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'LEAD_WARM': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'LEAD_HOT': return 'Hot';
      case 'LEAD_WARM': return 'Warm';
      default: return 'Cold';
    }
  };

  const isSearchDisabled = () => {
    if (isLoading) return true;
    switch (searchType) {
      case 'username': return !username.trim();
      case 'followers': return !targetProfile.trim();
      case 'hashtag': return !hashtag.trim();
      case 'batch': return !batchUsernames.trim();
      default: return true;
    }
  };

  const searchModes = [
    { id: 'username' as const, icon: Search, label: 'Por Username', desc: 'Perfil único' },
    { id: 'followers' as const, icon: UserPlus, label: 'Seguidores', desc: 'De um perfil' },
    { id: 'hashtag' as const, icon: Hash, label: 'Por Hashtag', desc: '#dentista, #advogado' },
    { id: 'batch' as const, icon: List, label: 'Em Lote', desc: 'Lista de usernames' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Instagram Lead Search</h1>
          <p className="text-slate-500 dark:text-slate-400">Busca em massa de prospects no Instagram</p>
        </div>
        {totalFound > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{totalFound} leads encontrados</span>
            <Button variant="outline" size="sm" onClick={clearResults}>Limpar</Button>
          </div>
        )}
      </div>

      {/* Search Card */}
      <Card className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-pink-50 via-purple-50 to-rose-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-rose-900/20 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3">
            <Instagram size={140} />
          </div>
          <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 z-10">
            <Instagram size={32} className="text-pink-500" />
          </div>
          <div className="z-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Busca Instagram em Massa</h3>
            <p className="text-slate-600 dark:text-slate-400">Scrape seguidores, hashtags ou lista de perfis</p>
          </div>
        </div>

        {/* Search Type Selection - 4 modes */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide text-xs">Tipo de Busca</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {searchModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSearchType(mode.id)}
                className={`group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  searchType === mode.id
                    ? 'bg-pink-50/50 dark:bg-pink-900/30 border-pink-500 text-pink-500'
                    : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-pink-200 dark:hover:border-pink-700'
                }`}
              >
                <mode.icon size={24} className="mb-2" />
                <span className="text-sm font-semibold">{mode.label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Input - changes based on mode */}
        <div className="space-y-6 mb-8">
          {searchType === 'username' && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Username / Handle</label>
              <Input
                placeholder="@username"
                className="h-12"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <p className="text-xs text-slate-500">Busca um perfil específico e classifica o lead</p>
            </div>
          )}

          {searchType === 'followers' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Perfil Concorrente / Alvo</label>
                <Input
                  placeholder="@concorrente ou @influenciador"
                  className="h-12"
                  value={targetProfile}
                  onChange={(e) => setTargetProfile(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <p className="text-xs text-slate-500">Vai buscar os seguidores deste perfil</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Máximo de Seguidores</label>
                <select
                  className="w-full h-12 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                >
                  <option value={25}>25 seguidores</option>
                  <option value={50}>50 seguidores</option>
                  <option value={100}>100 seguidores</option>
                  <option value={200}>200 seguidores</option>
                </select>
              </div>
            </>
          )}

          {searchType === 'hashtag' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Hashtag</label>
                <Input
                  placeholder="#dentista, #advogado, #clinicaestetica"
                  className="h-12"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <p className="text-xs text-slate-500">Busca quem postou com esta hashtag recentemente</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Máximo de Perfis</label>
                <select
                  className="w-full h-12 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                >
                  <option value={25}>25 perfis</option>
                  <option value={50}>50 perfis</option>
                  <option value={100}>100 perfis</option>
                </select>
              </div>
            </>
          )}

          {searchType === 'batch' && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Lista de Usernames</label>
              <textarea
                placeholder="@usuario1&#10;@usuario2&#10;@usuario3&#10;&#10;ou separados por vírgula: usuario1, usuario2, usuario3"
                className="w-full h-32 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 resize-none"
                value={batchUsernames}
                onChange={(e) => setBatchUsernames(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Cole uma lista de usernames (um por linha ou separados por vírgula).
                Máximo recomendado: 50 perfis por vez.
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button onClick={clearError} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Search Button */}
        <Button
          className="w-full"
          onClick={handleSearch}
          disabled={isSearchDisabled()}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              Buscando...
            </>
          ) : (
            <>
              <Search size={20} className="mr-2" />
              Iniciar Busca
            </>
          )}
        </Button>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resultados da Busca</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Card key={result.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <img
                    src={result.avatarUrl}
                    alt={result.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">
                        {result.name}
                      </h3>
                      {result.isVerified && (
                        <BadgeCheck size={16} className="text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <a
                      href={`https://instagram.com/${result.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
                    >
                      @{result.username}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getClassificationColor(result.classification)}`}>
                    {getClassificationLabel(result.classification)}
                  </span>
                </div>

                {result.bio && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {result.bio}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {result.followers.toLocaleString()}
                    </span>
                    <span>{result.posts} posts</span>
                  </div>
                  {result.score > 0 && (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Score: {result.score}
                    </span>
                  )}
                </div>

                {result.signals.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {result.signals.slice(0, 3).map((signal, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400">
                        {signal}
                      </span>
                    ))}
                  </div>
                )}

                {result.savedToDb && (
                  <div className="mt-3 flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                    <CheckCircle size={14} />
                    Salvo nos leads
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// CNPJSearchView
export const CNPJSearchView = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CNPJ Company Search</h1>
          <p className="text-slate-500 dark:text-slate-400">Search Brazilian companies by CNPJ</p>
        </div>
      </div>

      <Card className="p-8 max-w-5xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">CNPJ Number</label>
            <Input placeholder="00.000.000/0000-00" className="h-12" />
          </div>
          <Button className="w-full">Search Company</Button>
        </div>
      </Card>
    </div>
  );
};

// ActiveCadencesView, ShowRateGuardView, ContentStudioView, etc - Simple placeholders
export const ActiveCadencesView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Cadences</h1>
      <p className="text-slate-500 dark:text-slate-400">View and manage active outreach sequences</p>
    </div>
    <Card className="p-12 text-center">
      <Workflow size={48} className="mx-auto mb-4 text-slate-400" />
      <p className="text-slate-500">Active cadences view - Coming soon in Socialfy V2</p>
    </Card>
  </div>
);

export const ShowRateGuardView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Show-Rate Guard</h1>
      <p className="text-slate-500 dark:text-slate-400">Protect meeting show rates with automated confirmations</p>
    </div>
    <Card className="p-12 text-center">
      <p className="text-slate-500">Show-Rate Guard feature - Coming soon</p>
    </Card>
  </div>
);

export const ContentStudioView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Content Studio</h1>
      <p className="text-slate-500 dark:text-slate-400">Create and manage content for campaigns</p>
    </div>
    <Card className="p-12 text-center">
      <p className="text-slate-500">Content Studio - Coming soon</p>
    </Card>
  </div>
);

export const CadenceBuilderView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cadence Builder</h1>
      <p className="text-slate-500 dark:text-slate-400">Build multi-channel outreach sequences</p>
    </div>
    <Card className="p-12 text-center">
      <Workflow size={48} className="mx-auto mb-4 text-slate-400" />
      <p className="text-slate-500">Cadence Builder - Coming soon</p>
    </Card>
  </div>
);

export const ICPAnalyzerView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ICP Analyzer</h1>
      <p className="text-slate-500 dark:text-slate-400">Analyze and score leads against your ideal customer profile</p>
    </div>
    <Card className="p-12 text-center">
      <Target size={48} className="mx-auto mb-4 text-slate-400" />
      <p className="text-slate-500">ICP Analyzer - Coming soon</p>
    </Card>
  </div>
);

export const AnalyticsView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
      <p className="text-slate-500 dark:text-slate-400">Track performance metrics and insights</p>
    </div>
    <Card className="p-12 text-center">
      <p className="text-slate-500">Analytics Dashboard - Coming soon</p>
    </Card>
  </div>
);

export const IntegrationsView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
      <p className="text-slate-500 dark:text-slate-400">Connect third-party tools and services</p>
    </div>
    <Card className="p-12 text-center">
      <p className="text-slate-500">Integrations - Coming soon</p>
    </Card>
  </div>
);

// Export all views
export default {
  LinkedInSearchView,
  InstagramSearchView,
  CNPJSearchView,
  ActiveCadencesView,
  ShowRateGuardView,
  ContentStudioView,
  CadenceBuilderView,
  ICPAnalyzerView,
  AnalyticsView,
  IntegrationsView,
};
