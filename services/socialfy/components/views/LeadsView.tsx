import React, { useState, useCallback } from 'react';
import {
  Users,
  Flame,
  Sun,
  Snowflake,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  Instagram
} from 'lucide-react';

// Hooks
import { useLeads, useLeadStats, Lead } from '../../hooks/useLeads';
import { useTenantDropdown } from '../../hooks/useTenants';

// Components
import { LeadCard, Lead as LeadCardType } from '../leads/LeadCard';
import { LeadFilters, FilterPriority } from '../leads/LeadFilters';
import { SkeletonCard, SkeletonText } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { Button, Card, Badge } from '../UI';

// ============================================================================
// Stats Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  colorClass,
  loading = false,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
          ) : (
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace(/600|500|400/, '100')} dark:bg-slate-700/50`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Lead Card Skeleton (for loading state)
// ============================================================================

const LeadCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Bio */}
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Error State Component
// ============================================================================

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Erro ao carregar leads
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// Main LeadsView Component
// ============================================================================

export const LeadsView: React.FC = () => {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<FilterPriority>('all');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fetch data using hooks
  const {
    leads,
    loading: leadsLoading,
    error: leadsError,
    totalCount,
    hasMore,
    refetch,
    loadMore,
  } = useLeads({
    tenantId: selectedTenant || undefined,
    priority: selectedPriority === 'all' ? undefined : selectedPriority,
    search: searchQuery,
    limit: 20,
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useLeadStats(selectedTenant || undefined);

  const {
    options: tenantOptions,
    loading: tenantsLoading,
  } = useTenantDropdown();

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  // Transform leads for LeadCard component
  const transformedLeads: LeadCardType[] = leads.map(lead => ({
    id: lead.id,
    username: lead.username,
    full_name: lead.full_name || null,
    bio: lead.bio || null,
    followers: lead.followers_count,
    following: lead.following_count,
    profile_pic_url: null, // API nao retorna isso ainda
    score: lead.icp_score,
    priority: lead.priority,
    tenant_id: lead.tenant_id,
    is_verified: false,
    is_business: lead.is_business,
  }));

  // Transform tenants for LeadFilters component
  const tenants = tenantOptions.map(t => ({
    id: t.value,
    name: t.label,
  }));

  // Handle lead click - useCallback para evitar race condition
  const handleLeadClick = useCallback((lead: LeadCardType) => {
    const originalLead = leads.find(l => l.id === lead.id);
    if (originalLead) {
      setSelectedLead(originalLead);
    }
  }, [leads]);

  // Handle view on Instagram - abre perfil do lead no Instagram
  const handleViewOnInstagram = (lead: LeadCardType) => {
    window.open(`https://instagram.com/${lead.username}`, '_blank');
  };

  // Render content based on state
  const renderContent = () => {
    // Error state
    if (leadsError) {
      return (
        <ErrorState
          message={leadsError}
          onRetry={handleRefresh}
        />
      );
    }

    // Loading state (initial load)
    if (leadsLoading && leads.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    // Empty state
    if (!leadsLoading && leads.length === 0) {
      const hasFilters = searchQuery || selectedPriority !== 'all' || selectedTenant;

      return (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
          description={
            hasFilters
              ? 'Tente ajustar os filtros para encontrar mais leads.'
              : 'Os leads capturados pelo AgenticOS aparecerao aqui.'
          }
          actionLabel={hasFilters ? 'Limpar filtros' : undefined}
          onAction={hasFilters ? () => {
            setSearchQuery('');
            setSelectedPriority('all');
            setSelectedTenant(null);
          } : undefined}
        />
      );
    }

    // Leads grid
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {transformedLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={handleLeadClick}
              onMessage={handleViewOnInstagram}
              selected={selectedLead?.id === lead.id}
            />
          ))}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={leadsLoading}
            >
              {leadsLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  Carregar mais ({totalCount - leads.length} restantes)
                </>
              )}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Instagram className="w-6 h-6 text-pink-500" />
            Leads Instagram
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Leads qualificados pelo AgenticOS com ICP Score
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={leadsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${leadsLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Leads"
          value={stats.total}
          icon={<Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
          colorClass="text-slate-900 dark:text-white"
          loading={statsLoading}
        />
        <StatCard
          title="Hot"
          value={stats.hot}
          icon={<Flame className="w-5 h-5 text-red-500" />}
          colorClass="text-red-500"
          loading={statsLoading}
        />
        <StatCard
          title="Warm"
          value={stats.warm}
          icon={<Sun className="w-5 h-5 text-yellow-500" />}
          colorClass="text-yellow-500"
          loading={statsLoading}
        />
        <StatCard
          title="Cold"
          value={stats.cold}
          icon={<Snowflake className="w-5 h-5 text-blue-500" />}
          colorClass="text-blue-500"
          loading={statsLoading}
        />
      </div>

      {/* Average Score and Today Stats */}
      {!statsLoading && (stats.avgScore > 0 || stats.scoredToday > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.avgScore > 0 && (
            <Badge color="blue">
              Score Medio: {stats.avgScore}
            </Badge>
          )}
          {stats.scoredToday > 0 && (
            <Badge color="green">
              Qualificados Hoje: {stats.scoredToday}
            </Badge>
          )}
          {stats.nurturing > 0 && (
            <Badge color="gray">
              Em Nurturing: {stats.nurturing}
            </Badge>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 dark:bg-slate-800/50">
        <LeadFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedTenant={selectedTenant}
          onTenantChange={setSelectedTenant}
          tenants={tenants}
          totalCount={totalCount}
          filteredCount={leads.length}
        />
      </Card>

      {/* Leads Grid / Loading / Empty / Error */}
      {renderContent()}

      {/* Lead Detail Drawer (TODO: expandir para mostrar mais detalhes) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />
          <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedLead.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedLead.full_name || selectedLead.username}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    @{selectedLead.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ICP Score */}
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  ICP Score
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`text-4xl font-bold ${
                    selectedLead.icp_score >= 80 ? 'text-emerald-600' :
                    selectedLead.icp_score >= 60 ? 'text-yellow-600' :
                    selectedLead.icp_score >= 40 ? 'text-orange-600' : 'text-slate-600'
                  }`}>
                    {selectedLead.icp_score}
                  </div>
                  <Badge color={
                    selectedLead.priority === 'hot' ? 'red' :
                    selectedLead.priority === 'warm' ? 'yellow' :
                    selectedLead.priority === 'cold' ? 'blue' : 'gray'
                  }>
                    {selectedLead.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Bio */}
              {selectedLead.bio && (
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bio
                  </label>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {selectedLead.bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Seguidores
                  </label>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedLead.followers_count.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Seguindo
                  </label>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedLead.following_count.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedLead.is_business && (
                  <Badge color="purple">Conta Business</Badge>
                )}
                {selectedLead.is_private && (
                  <Badge color="gray">Conta Privada</Badge>
                )}
                {!selectedLead.is_private && (
                  <Badge color="green">Conta Publica</Badge>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Button
                  className="w-full"
                  onClick={() => window.open(`https://instagram.com/${selectedLead.username}`, '_blank')}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Ver Perfil no Instagram
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full">
                    Iniciar Cadencia
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Adicionar a Lista
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                <p>Qualificado em: {new Date(selectedLead.scored_at).toLocaleDateString('pt-BR')}</p>
                <p>Capturado em: {new Date(selectedLead.created_at).toLocaleDateString('pt-BR')}</p>
                {selectedLead.tenant_id && (
                  <p>Tenant: {selectedLead.tenant_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsView;
