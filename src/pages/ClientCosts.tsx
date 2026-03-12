import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  DollarSign,
  Users,
  Cpu,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Calendar,
  X,
  Clock,
  Zap,
  MessageSquare,
  BarChart3,
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Search,
  ExternalLink,
  GitBranch,
  Activity,
  Target,
  Layers,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  useClientCosts,
  useClientCostDetails,
  useGlobalCostSummary,
  ClientCostSummary,
} from "../hooks/useClientCosts";
import {
  useWorkflowCosts,
  useWorkflowClientBreakdown,
  WorkflowCostSummary,
} from "../hooks/useWorkflowCosts";
import { useCostAnalytics } from "../hooks/useCostAnalytics";
import {
  useLeadCostAnalysis,
  getLocationColor,
} from "../hooks/useLeadCostAnalysis";
import { useIsMobile } from "../hooks/useMediaQuery";
import { DateRangePicker, DateRange } from "../components/DateRangePicker";

// ===== CollapsibleSection Component =====
interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  badge,
  icon,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors bg-[#0d1117]"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-text-muted">{icon}</span>}
          <span className="text-sm font-bold text-text-primary">{title}</span>
          {badge && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className="text-gray-400 transition-transform duration-200 flex-shrink-0"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      {isOpen && <div className="border-t border-gray-800">{children}</div>}
    </div>
  );
};

export const ClientCosts = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Date range state - null = usa view agregada (rapido), com datas = pagina llm_costs (lento)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  const [selectedClient, setSelectedClient] =
    useState<ClientCostSummary | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "clients" | "workflows" | "analytics"
  >("clients");

  // Workflow state
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowCostSummary | null>(null);

  // Analytics accordion state (default: all closed)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    byMode: false,
    byAgent: false,
    abTest: false,
    byFase: false,
    byLead: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Novos filtros
  const [clientFilter, setClientFilter] = useState<string>(""); // Filtro por cliente específico
  const [canalFilter, setCanalFilter] = useState<string>(""); // Filtro por canal
  const [workflowFilter, setWorkflowFilter] = useState<string>(""); // Filtro por workflow
  const [showInactive, setShowInactive] = useState<boolean>(false); // Mostrar inativos
  const [showFilters, setShowFilters] = useState<boolean>(false); // Toggle painel de filtros

  const N8N_BASE_URL = "https://cliente-a1.mentorfy.io/workflow";

  // Hooks de dados
  const {
    clients,
    allClients,
    allCanais,
    allWorkflows,
    totalCost,
    totalRequests,
    loading,
    error,
    refetch,
  } = useClientCosts({
    dateRange,
    clientName: clientFilter || undefined,
    canalFilter: canalFilter || undefined,
    workflowFilter: workflowFilter || undefined,
    showInactive,
    inactiveDays: 30,
  });
  // Converter dateRange (Date | null) para string range aceito pelos hooks de analytics
  const analyticsDateRange =
    dateRange.startDate && dateRange.endDate
      ? {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString(),
        }
      : undefined;

  const { summary, loading: loadingSummary } =
    useGlobalCostSummary(analyticsDateRange);
  const {
    costs: clientDetails,
    dailyCosts,
    loading: loadingDetails,
  } = useClientCostDetails(selectedClient?.location_name || null, {
    dateRange,
  });

  // Workflow hooks
  const {
    workflows,
    totalCost: wfTotalCost,
    totalRequests: wfTotalRequests,
    loading: loadingWorkflows,
    refetch: refetchWorkflows,
  } = useWorkflowCosts({ dateRange });
  const { clients: workflowClients, loading: loadingWfBreakdown } =
    useWorkflowClientBreakdown(
      selectedWorkflow?.workflow_name || null,
      dateRange,
    );

  // Analytics hooks
  const {
    byAgentMode,
    byAgent,
    abTest,
    byFase,
    daily,
    loading: loadingAnalytics,
    hasData: hasAnalyticsData,
  } = useCostAnalytics(analyticsDateRange);

  // Lead cost analysis — só busca quando dateRange estiver selecionado
  const leadAnalysis = useLeadCostAnalysis(analyticsDateRange);

  // Chart data: daily costs aggregated by date
  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();
    daily.forEach((d) => {
      map.set(d.dia, (map.get(d.dia) || 0) + d.total_usd);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dia, total]) => ({
        dia: new Date(dia).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        total,
      }));
  }, [daily]);

  // Chart data: treemap by agent (aggregate by agent_name)
  const agentTreemapData = useMemo(() => {
    const map = new Map<
      string,
      { cost: number; calls: number; client: string }
    >();
    byAgent.forEach((a) => {
      const key = a.agent_name || "N/A";
      const prev = map.get(key) || { cost: 0, calls: 0, client: "" };
      map.set(key, {
        cost: prev.cost + a.total_usd,
        calls: prev.calls + a.chamadas,
        client: a.location_name,
      });
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        size: d.cost,
        calls: d.calls,
        client: d.client,
      }))
      .sort((a, b) => b.size - a.size);
  }, [byAgent]);

  // Chart data: donut A/B (aggregate by variant)
  const abDonutData = useMemo(() => {
    const map = new Map<string, { cost: number; calls: number }>();
    abTest.forEach((a) => {
      const key = a.ab_variant || "N/A";
      const prev = map.get(key) || { cost: 0, calls: 0 };
      map.set(key, {
        cost: prev.cost + a.total_usd,
        calls: prev.calls + a.chamadas,
      });
    });
    return Array.from(map.entries()).map(([name, d]) => ({
      name,
      value: d.cost,
      calls: d.calls,
    }));
  }, [abTest]);

  const CHART_COLORS = [
    "#8b5cf6",
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
  ];

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchWorkflows()]);
    showToast("Dados de custos atualizados", "info");
  };

  // Formatar valor em USD
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Formatar numeros grandes
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular percentual do total
  const getPercentage = (value: number) => {
    if (totalCost === 0) return 0;
    return (value / totalCost) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-1">
            <DollarSign
              size={isMobile ? 24 : 28}
              className="text-accent-primary"
            />
            <h1 className="text-xl md:text-3xl font-semibold">Custos de IA</h1>
          </div>
          <p className="text-text-secondary text-sm md:text-base">
            Monitore o consumo de IA e custos por cliente.
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full md:w-auto">
          {/* Date Range Picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-all ${
                showFilters ||
                clientFilter ||
                canalFilter ||
                workflowFilter ||
                showInactive
                  ? "text-accent-primary bg-accent-primary/10 border-accent-primary/30"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-secondary border-border-default"
              }`}
              title="Filtros avançados"
            >
              <Filter size={18} />
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      {showFilters && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-4 space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase">
              Filtros:
            </span>
          </div>

          {/* Dropdown de Cliente */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted hidden md:inline">
              Cliente:
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              disabled={loading}
              className="flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-border-default bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 w-full md:min-w-[180px]"
            >
              <option value="">Todos os clientes</option>
              {allClients.map((client) => (
                <option key={client.location_name} value={client.location_name}>
                  {client.location_name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown de Canal */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted hidden md:inline">
              Canal:
            </label>
            <select
              value={canalFilter}
              onChange={(e) => setCanalFilter(e.target.value)}
              disabled={loading}
              className="flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-border-default bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 w-full md:min-w-[140px]"
            >
              <option value="">Todos os canais</option>
              {allCanais.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown de Workflow */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted hidden md:inline">
              Workflow:
            </label>
            <select
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value)}
              disabled={loading}
              className="flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-border-default bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 w-full md:min-w-[180px]"
            >
              <option value="">Todos os workflows</option>
              {allWorkflows.map((wf) => (
                <option key={wf} value={wf}>
                  {wf}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Mostrar Inativos */}
            <button
              onClick={() => setShowInactive(!showInactive)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                showInactive
                  ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary"
                  : "bg-bg-primary border-border-default text-text-muted hover:text-text-primary"
              }`}
            >
              {showInactive ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden md:inline">
                {showInactive ? "Mostrando inativos" : "Mostrar inativos"}
              </span>
              <span className="md:hidden">Inativos</span>
            </button>

            {/* Limpar Filtros */}
            {(clientFilter ||
              canalFilter ||
              workflowFilter ||
              showInactive) && (
              <button
                onClick={() => {
                  setClientFilter("");
                  setCanalFilter("");
                  setWorkflowFilter("");
                  setShowInactive(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Info de inativos - escondido no mobile */}
          <div className="hidden md:block md:ml-auto text-xs text-text-muted">
            {!showInactive && (
              <span>
                Mostrando apenas clientes com atividade nos últimos 30 dias
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-bg-secondary border border-border-default rounded-xl p-1">
        <button
          onClick={() => setActiveTab("clients")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all flex-1 justify-center ${
            activeTab === "clients"
              ? "bg-accent-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          }`}
        >
          <Users size={16} />
          Por Cliente
        </button>
        <button
          onClick={() => setActiveTab("workflows")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all flex-1 justify-center ${
            activeTab === "workflows"
              ? "bg-accent-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          }`}
        >
          <GitBranch size={16} />
          Por Workflow
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all flex-1 justify-center ${
            activeTab === "analytics"
              ? "bg-accent-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          }`}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <p className="text-red-500 font-medium">Erro ao carregar custos</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="ml-auto text-red-500 hover:underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {(() => {
        const isWf = activeTab === "workflows";
        const isAnalytics = activeTab === "analytics";
        const analyticsTotalCost = byAgentMode.reduce(
          (s, r) => s + r.total_usd,
          0,
        );
        const analyticsTotalCalls = byAgentMode.reduce(
          (s, r) => s + r.chamadas,
          0,
        );
        const currentLoading = isAnalytics
          ? loadingAnalytics
          : isWf
            ? loadingWorkflows
            : loading;
        const currentTotalCost = isAnalytics
          ? analyticsTotalCost
          : isWf
            ? wfTotalCost
            : totalCost;
        const currentTotalRequests = isAnalytics
          ? analyticsTotalCalls
          : isWf
            ? wfTotalRequests
            : totalRequests;
        const currentCount = isAnalytics
          ? byAgentMode.length
          : isWf
            ? workflows.length
            : clients.length;
        const countLabel = isAnalytics
          ? "Modos"
          : isWf
            ? "Workflows"
            : "Clientes";
        const countSublabel = isAnalytics
          ? "Agent modes rastreados"
          : isWf
            ? "Com consumo registrado"
            : "Locations com consumo";

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                  Custo Total
                </span>
                <div className="p-1.5 md:p-2 bg-accent-primary/10 rounded-lg">
                  <DollarSign size={14} className="text-accent-primary" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary truncate">
                {currentLoading ? "..." : formatUSD(currentTotalCost)}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Periodo:{" "}
                {dateRange.startDate && dateRange.endDate
                  ? `${dateRange.startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - ${dateRange.endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
                  : "Selecione um período"}
              </p>
            </div>

            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                  {countLabel}
                </span>
                <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
                  {isWf ? (
                    <GitBranch size={14} className="text-blue-500" />
                  ) : (
                    <Users size={14} className="text-blue-500" />
                  )}
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary">
                {currentLoading ? "..." : currentCount}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                {countSublabel}
              </p>
            </div>

            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                  Requests
                </span>
                <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                  <Zap size={14} className="text-green-500" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary">
                {currentLoading ? "..." : formatNumber(currentTotalRequests)}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Chamadas de IA
              </p>
            </div>

            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                  Custo Médio
                </span>
                <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp size={14} className="text-purple-500" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary truncate">
                {currentLoading || currentTotalRequests === 0
                  ? "..."
                  : formatUSD(currentTotalCost / currentTotalRequests)}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Por requisicao
              </p>
            </div>
          </div>
        );
      })()}

      {/* Global Summary */}
      {!loadingSummary && (
        <div className="bg-gradient-to-r from-accent-primary/5 to-blue-500/5 border border-accent-primary/20 rounded-xl p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <BarChart3 size={14} className="text-accent-primary" />
            <span className="text-[10px] md:text-xs font-bold text-accent-primary uppercase tracking-wider">
              Resumo Global
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">
                Total Gasto
              </p>
              <p className="text-sm md:text-lg font-bold text-text-primary truncate">
                {formatUSD(summary.total_cost_usd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">
                Total Tokens
              </p>
              <p className="text-sm md:text-lg font-bold text-text-primary">
                {formatNumber(summary.total_tokens)}
              </p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">
                Média/Cliente
              </p>
              <p className="text-sm md:text-lg font-bold text-text-primary truncate">
                {formatUSD(summary.avg_cost_per_client)}
              </p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">
                Top Model
              </p>
              <p className="text-sm md:text-lg font-bold text-text-primary truncate">
                {summary.top_model}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className={`bg-bg-secondary border border-border-default rounded-2xl w-full overflow-hidden shadow-2xl ${
              isMobile
                ? "h-full max-h-full rounded-none"
                : "max-w-4xl max-h-[90vh]"
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-border-default flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg md:text-xl font-bold text-text-primary truncate">
                  {selectedClient.location_name}
                </h2>
                <p className="text-[10px] md:text-xs text-text-muted font-mono mt-1 truncate">
                  {selectedClient.location_ids?.length > 1
                    ? `${selectedClient.location_ids.length} location IDs`
                    : selectedClient.location_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div
              className={`p-4 md:p-6 overflow-y-auto ${isMobile ? "h-[calc(100%-80px)]" : "max-h-[calc(90vh-120px)]"}`}
            >
              {/* Client Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Custo Total
                  </p>
                  <p className="text-base md:text-xl font-bold text-accent-primary truncate">
                    {formatUSD(selectedClient.total_cost_usd)}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Conversas
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary">
                    {formatNumber(selectedClient.total_conversations)}
                  </p>
                  <p className="text-[9px] text-text-muted mt-0.5">
                    contatos unicos
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Requisicoes
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary">
                    {formatNumber(selectedClient.total_requests)}
                  </p>
                  <p className="text-[9px] text-text-muted mt-0.5">
                    {selectedClient.total_conversations > 0
                      ? `~${(selectedClient.total_requests / selectedClient.total_conversations).toFixed(1)} req/conversa`
                      : ""}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Tokens
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary">
                    {formatNumber(
                      selectedClient.total_tokens_input +
                        selectedClient.total_tokens_output,
                    )}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Custo/Conversa
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary truncate">
                    {selectedClient.total_conversations > 0
                      ? formatUSD(
                          selectedClient.total_cost_usd /
                            selectedClient.total_conversations,
                        )
                      : "$0.00"}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Custo/Request
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary truncate">
                    {formatUSD(selectedClient.avg_cost_per_request)}
                  </p>
                </div>
              </div>

              {/* Daily Costs */}
              {dailyCosts.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <h3 className="text-sm font-bold text-text-primary mb-2 md:mb-3 flex items-center gap-2">
                    <Calendar size={14} />
                    Custos por Dia
                  </h3>
                  {isMobile ? (
                    /* VERSÃO MOBILE - Cards */
                    <div className="space-y-2">
                      {dailyCosts.slice(0, 5).map((day) => (
                        <div
                          key={day.date}
                          className="bg-bg-primary border border-border-default rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {day.date}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                              <span>
                                {formatNumber(day.tokens_input)} tokens
                              </span>
                              <span>{day.requests} req</span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(day.cost_usd)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* VERSÃO DESKTOP - Tabela */
                    <div className="bg-bg-primary border border-border-default rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary">
                          <tr>
                            <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                              Data
                            </th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                              Custo
                            </th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                              Tokens
                            </th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                              Requests
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {dailyCosts.slice(0, 7).map((day) => (
                            <tr key={day.date} className="hover:bg-bg-hover">
                              <td className="p-3 font-medium">{day.date}</td>
                              <td className="p-3 text-right text-accent-primary font-mono">
                                {formatUSD(day.cost_usd)}
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {formatNumber(day.tokens_input)}
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {day.requests}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-2 md:mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  Atividade Recente
                </h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw
                      className="animate-spin text-text-muted"
                      size={24}
                    />
                  </div>
                ) : clientDetails.length > 0 ? (
                  <div className="space-y-2">
                    {clientDetails.slice(0, isMobile ? 5 : 10).map((detail) => (
                      <div
                        key={detail.id}
                        className="bg-bg-primary border border-border-default rounded-lg p-3 flex items-center justify-between hover:border-accent-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="p-1.5 md:p-2 bg-bg-tertiary rounded-lg flex-shrink-0">
                            <MessageSquare
                              size={12}
                              className="text-text-muted"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-medium text-text-primary truncate">
                              {detail.contact_name}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] md:text-xs text-text-muted truncate">
                                {detail.tipo_acao} via {detail.canal}
                              </p>
                              {detail.workflow_id && (
                                <a
                                  href={`${N8N_BASE_URL}/${detail.workflow_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-accent-primary hover:text-accent-primary/80 flex-shrink-0"
                                  title="Abrir workflow no n8n"
                                >
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-xs md:text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(detail.custo_usd)}
                          </p>
                          <p className="text-[10px] md:text-xs text-text-muted">
                            {formatDate(detail.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-4 text-sm">
                    Nenhuma atividade encontrada
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: POR CLIENTE ===== */}
      {activeTab === "clients" && (
        <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
          <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Users size={16} />
              Custos por Cliente
            </h2>
          </div>

          <div className="divide-y divide-border-default">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 md:p-5 animate-pulse">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-bg-tertiary flex-shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-bg-tertiary rounded w-24 md:w-32"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-16 md:w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-bg-tertiary rounded w-16 md:w-20"></div>
                  </div>
                </div>
              ))
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <div
                  key={client.location_name}
                  onClick={() => setSelectedClient(client)}
                  className="p-4 md:p-5 hover:bg-bg-hover active:bg-bg-hover transition-all cursor-pointer group"
                >
                  {isMobile ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary/20 to-blue-500/20 border border-accent-primary/20 flex items-center justify-center text-sm font-bold text-accent-primary flex-shrink-0">
                            {client.location_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-text-primary text-sm truncate">
                              {client.location_name}
                            </h3>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {client.models_used[0] || "N/A"}
                              </span>
                              {client.canais_used?.map((canal) => (
                                <span
                                  key={canal}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase"
                                >
                                  {canal}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-accent-primary font-mono">
                            {formatUSD(client.total_cost_usd)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Zap size={10} />
                            {formatNumber(client.total_requests)} req
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu size={10} />
                            {formatNumber(client.total_tokens_input)} tokens
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted" />
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                        <div
                          className="bg-accent-primary h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(getPercentage(client.total_cost_usd), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-blue-500/20 border border-accent-primary/20 flex items-center justify-center text-lg font-bold text-accent-primary group-hover:border-accent-primary/40 transition-colors">
                          {client.location_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                              {client.location_name}
                            </h3>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                              {client.models_used[0] || "N/A"}
                            </span>
                            {client.canais_used?.map((canal) => (
                              <span
                                key={canal}
                                className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase"
                              >
                                {canal}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Zap size={10} />
                              {formatNumber(client.total_requests)} requests
                            </span>
                            <span className="flex items-center gap-1">
                              <Cpu size={10} />
                              {formatNumber(client.total_tokens_input)} tokens
                            </span>
                            {client.last_activity && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {formatDate(client.last_activity)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:block w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-text-muted">
                              {getPercentage(client.total_cost_usd).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                            <div
                              className="bg-accent-primary h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(getPercentage(client.total_cost_usd), 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-lg font-bold text-accent-primary font-mono">
                            {formatUSD(client.total_cost_usd)}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {formatUSD(client.avg_cost_per_request)}/req
                          </p>
                        </div>
                        <ChevronRight
                          size={20}
                          className="text-text-muted group-hover:text-accent-primary transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                  <DollarSign size={32} className="opacity-20" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-text-primary mb-1">
                  Nenhum custo registrado
                </h3>
                <p className="text-xs md:text-sm text-text-muted max-w-xs">
                  Os custos de IA aparecerão aqui conforme os agentes processam
                  conversas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: POR WORKFLOW ===== */}
      {activeTab === "workflows" && (
        <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
          <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <GitBranch size={16} />
              Custos por Workflow
            </h2>
          </div>

          <div className="divide-y divide-border-default">
            {loadingWorkflows ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 md:p-5 animate-pulse">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-bg-tertiary flex-shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-bg-tertiary rounded w-32 md:w-48"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-20 md:w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-bg-tertiary rounded w-16 md:w-20"></div>
                  </div>
                </div>
              ))
            ) : workflows.length > 0 ? (
              workflows.map((wf) => {
                const wfPercentage =
                  wfTotalCost > 0 ? (wf.total_cost_usd / wfTotalCost) * 100 : 0;
                return (
                  <div
                    key={`${wf.workflow_name}-${wf.workflow_id}`}
                    onClick={() => setSelectedWorkflow(wf)}
                    className="p-4 md:p-5 hover:bg-bg-hover active:bg-bg-hover transition-all cursor-pointer group"
                  >
                    {isMobile ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                              <GitBranch size={16} className="text-green-500" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-text-primary text-sm truncate">
                                {wf.workflow_name}
                              </h3>
                              <div className="flex items-center gap-1 flex-wrap">
                                {wf.models_used.slice(0, 2).map((model) => (
                                  <span
                                    key={model}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase"
                                  >
                                    {model}
                                  </span>
                                ))}
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                  {wf.total_clients} cliente
                                  {wf.total_clients !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-accent-primary font-mono">
                              {formatUSD(wf.total_cost_usd)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Zap size={10} />
                              {formatNumber(wf.total_requests)} req
                            </span>
                            <span className="flex items-center gap-1">
                              <Cpu size={10} />
                              {formatNumber(wf.total_tokens_input)} tokens
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-text-muted" />
                        </div>
                        <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(wfPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/20 flex items-center justify-center group-hover:border-green-500/40 transition-colors">
                            <GitBranch size={20} className="text-green-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                                {wf.workflow_name}
                              </h3>
                              {wf.models_used.slice(0, 2).map((model) => (
                                <span
                                  key={model}
                                  className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase"
                                >
                                  {model}
                                </span>
                              ))}
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                {wf.total_clients} cliente
                                {wf.total_clients !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Zap size={10} />
                                {formatNumber(wf.total_requests)} requests
                              </span>
                              <span className="flex items-center gap-1">
                                <Cpu size={10} />
                                {formatNumber(wf.total_tokens_input)} tokens
                              </span>
                              {wf.last_activity && (
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {formatDate(wf.last_activity)}
                                </span>
                              )}
                              {wf.workflow_id && (
                                <a
                                  href={`${N8N_BASE_URL}/${wf.workflow_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-accent-primary hover:text-accent-primary/80"
                                >
                                  <ExternalLink size={10} />
                                  n8n
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden md:block w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-text-muted">
                                {wfPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(wfPercentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="text-lg font-bold text-accent-primary font-mono">
                              {formatUSD(wf.total_cost_usd)}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {formatUSD(wf.avg_cost_per_request)}/req
                            </p>
                          </div>
                          <ChevronRight
                            size={20}
                            className="text-text-muted group-hover:text-accent-primary transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                  <GitBranch size={32} className="opacity-20" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-text-primary mb-1">
                  Nenhum workflow registrado
                </h3>
                <p className="text-xs md:text-sm text-text-muted max-w-xs">
                  Os custos por workflow aparecerão aqui após a view ser criada
                  no Supabase.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: ANALYTICS ===== */}
      {activeTab === "analytics" && (
        <div className="space-y-4 md:space-y-6">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-text-muted" size={24} />
            </div>
          ) : !hasAnalyticsData ? (
            <div className="border border-border-default rounded-lg bg-bg-secondary p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                <BarChart3 size={32} className="opacity-20" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-text-primary mb-1">
                Dados de analytics em coleta
              </h3>
              <p className="text-xs md:text-sm text-text-muted max-w-sm">
                Os campos agent_mode, agent_name, fase e ab_variant foram
                adicionados ao tracking. Os dados aparecerao conforme novas
                conversas forem processadas.
              </p>
            </div>
          ) : (
            <>
              {/* ===== ALWAYS VISIBLE: KPI + CHARTS OVERVIEW ===== */}

              {/* Daily Cost Trend — AreaChart (full width, always visible) */}
              {dailyChartData.length > 0 && (
                <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
                  <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <TrendingUp size={16} />
                      Custo Diario
                    </h2>
                    <p className="text-[10px] md:text-xs text-text-muted mt-0.5">
                      Tendencia de gasto por dia (ultimos 60 dias)
                    </p>
                  </div>
                  <div
                    className="p-3 md:p-4"
                    style={{ height: isMobile ? 200 : 260 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dailyChartData}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="costGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8b5cf6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8b5cf6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          dataKey="dia"
                          tick={{
                            fontSize: 10,
                            fill: "rgba(255,255,255,0.4)",
                          }}
                          tickLine={false}
                          axisLine={false}
                          interval={isMobile ? 6 : 3}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "rgba(255,255,255,0.4)",
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                          width={55}
                        />
                        <ReTooltip
                          contentStyle={{
                            backgroundColor: "rgba(20,20,30,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [
                            `$${value.toFixed(4)}`,
                            "Custo",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill="url(#costGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Treemap + Donut side by side (always visible) */}
              {(agentTreemapData.length > 0 || abDonutData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {agentTreemapData.length > 0 && (
                    <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
                      <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                          <Users size={16} />
                          Custo por Agente
                        </h2>
                        <p className="text-[10px] md:text-xs text-text-muted mt-0.5">
                          Tamanho proporcional ao custo total
                        </p>
                      </div>
                      <div
                        className="p-3 md:p-4"
                        style={{ height: isMobile ? 220 : 260 }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <Treemap
                            data={agentTreemapData}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="rgba(0,0,0,0.3)"
                            content={({
                              x,
                              y,
                              width,
                              height,
                              name,
                              index,
                            }: {
                              x: number;
                              y: number;
                              width: number;
                              height: number;
                              name?: string;
                              index?: number;
                            }) => {
                              const color =
                                CHART_COLORS[
                                  (index ?? 0) % CHART_COLORS.length
                                ];
                              const item = agentTreemapData.find(
                                (d) => d.name === name,
                              );
                              const showLabel = width > 50 && height > 35;
                              return (
                                <g>
                                  <rect
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    fill={color}
                                    fillOpacity={0.7}
                                    rx={4}
                                    stroke="rgba(0,0,0,0.4)"
                                    strokeWidth={1}
                                  />
                                  {showLabel && (
                                    <>
                                      <text
                                        x={x + width / 2}
                                        y={y + height / 2 - 6}
                                        textAnchor="middle"
                                        fill="#fff"
                                        fontSize={11}
                                        fontWeight="bold"
                                      >
                                        {name}
                                      </text>
                                      <text
                                        x={x + width / 2}
                                        y={y + height / 2 + 10}
                                        textAnchor="middle"
                                        fill="rgba(255,255,255,0.7)"
                                        fontSize={10}
                                      >
                                        ${item?.size.toFixed(2)}
                                      </text>
                                    </>
                                  )}
                                </g>
                              );
                            }}
                          />
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* A/B Test donut removido — sem dados reais de A/B */}
                </div>
              )}

              {/* ===== COLLAPSIBLE SECTIONS ===== */}

              {/* 1. Custo por Modo do Agente */}
              {byAgentMode.length > 0 && (
                <CollapsibleSection
                  title="Custo por Modo do Agente"
                  badge={`${byAgentMode.length} modos • ${formatUSD(byAgentMode.reduce((s, r) => s + r.total_usd, 0))}`}
                  icon={<MessageSquare size={15} />}
                  isOpen={openSections.byMode}
                  onToggle={() => toggleSection("byMode")}
                >
                  {isMobile ? (
                    <div className="divide-y divide-border-default">
                      {byAgentMode.map((item) => (
                        <div
                          key={`${item.agent_mode}-${item.modelo_ia}`}
                          className="p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {item.agent_mode || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {item.modelo_ia}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {formatNumber(item.chamadas)} chamadas
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(item.total_usd)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Modo
                          </th>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Modelo
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Chamadas
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Custo Total
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Avg/Chamada
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Tokens (I/O)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {byAgentMode.map((item) => {
                          const maxCost = Math.max(
                            ...byAgentMode.map((m) => m.total_usd),
                          );
                          const barWidth =
                            maxCost > 0 ? (item.total_usd / maxCost) * 100 : 0;
                          return (
                            <tr
                              key={`${item.agent_mode}-${item.modelo_ia}`}
                              className="hover:bg-bg-hover"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {item.agent_mode || "N/A"}
                                  </span>
                                  <div
                                    className="h-1.5 rounded-full bg-accent-primary/30"
                                    style={{
                                      width: `${Math.min(barWidth, 60)}px`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                  {item.modelo_ia}
                                </span>
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {formatNumber(item.chamadas)}
                              </td>
                              <td className="p-3 text-right text-accent-primary font-mono font-bold">
                                {formatUSD(item.total_usd)}
                              </td>
                              <td className="p-3 text-right text-text-muted font-mono">
                                {formatUSD(item.avg_usd_por_chamada)}
                              </td>
                              <td className="p-3 text-right text-text-muted text-xs">
                                {formatNumber(item.total_input)} /{" "}
                                {formatNumber(item.total_output)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CollapsibleSection>
              )}

              {/* 2. Custo por Agente */}
              {byAgent.length > 0 && (
                <CollapsibleSection
                  title="Custo por Agente"
                  badge={`${new Set(byAgent.map((a) => a.agent_name)).size} agentes • ${formatUSD(byAgent.reduce((s, r) => s + r.total_usd, 0))}`}
                  icon={<Users size={15} />}
                  isOpen={openSections.byAgent}
                  onToggle={() => toggleSection("byAgent")}
                >
                  {isMobile ? (
                    <div className="divide-y divide-border-default">
                      {byAgent.map((item) => (
                        <div
                          key={`${item.agent_name}-${item.location_name}`}
                          className="p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {item.agent_name || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-text-muted">
                                {item.location_name}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {formatNumber(item.chamadas)} chamadas
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(item.total_usd)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Agente
                          </th>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Cliente
                          </th>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Modelo
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Chamadas
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Custo Total
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Avg/Chamada
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {byAgent.map((item) => (
                          <tr
                            key={`${item.agent_name}-${item.location_name}`}
                            className="hover:bg-bg-hover"
                          >
                            <td className="p-3 font-medium">
                              {item.agent_name || "N/A"}
                            </td>
                            <td className="p-3 text-text-muted text-xs">
                              {item.location_name}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {item.modelo_ia}
                              </span>
                            </td>
                            <td className="p-3 text-right text-text-muted">
                              {formatNumber(item.chamadas)}
                            </td>
                            <td className="p-3 text-right text-accent-primary font-mono font-bold">
                              {formatUSD(item.total_usd)}
                            </td>
                            <td className="p-3 text-right text-text-muted font-mono">
                              {formatUSD(item.avg_usd)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CollapsibleSection>
              )}

              {/* A/B Test accordion removido — sem dados reais de A/B */}
              {false && abTest.length > 0 && (
                <CollapsibleSection
                  title="A/B Test — Pro vs Flash (detalhado)"
                  badge={`${new Set(abTest.map((a: { ab_variant: string }) => a.ab_variant)).size} variantes`}
                  icon={<TrendingUp size={15} />}
                  isOpen={openSections.abTest}
                  onToggle={() => toggleSection("abTest")}
                >
                  {isMobile ? (
                    <div className="divide-y divide-border-default">
                      {abTest.map((item) => (
                        <div
                          key={`${item.ab_variant}-${item.modelo_ia}`}
                          className="p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {item.ab_variant || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {item.modelo_ia}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {formatNumber(item.chamadas)} chamadas
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(item.total_usd)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Variante
                          </th>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Modelo
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Chamadas
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Custo Total
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Avg/Chamada
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Avg Tokens (I/O)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {abTest.map((item) => (
                          <tr
                            key={`${item.ab_variant}-${item.modelo_ia}`}
                            className="hover:bg-bg-hover"
                          >
                            <td className="p-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-lg font-bold ${
                                  item.ab_variant === "pro"
                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                                }`}
                              >
                                {item.ab_variant || "N/A"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {item.modelo_ia}
                              </span>
                            </td>
                            <td className="p-3 text-right text-text-muted">
                              {formatNumber(item.chamadas)}
                            </td>
                            <td className="p-3 text-right text-accent-primary font-mono font-bold">
                              {formatUSD(item.total_usd)}
                            </td>
                            <td className="p-3 text-right text-text-muted font-mono">
                              {formatUSD(item.avg_usd_por_chamada)}
                            </td>
                            <td className="p-3 text-right text-text-muted text-xs">
                              {formatNumber(item.avg_input_tokens)} /{" "}
                              {formatNumber(item.avg_output_tokens)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CollapsibleSection>
              )}

              {/* 4. Custo por Fase da Conversa */}
              {byFase.length > 0 && (
                <CollapsibleSection
                  title="Custo por Fase da Conversa"
                  badge={`${new Set(byFase.map((f) => f.fase_detectada)).size} fases`}
                  icon={<Zap size={15} />}
                  isOpen={openSections.byFase}
                  onToggle={() => toggleSection("byFase")}
                >
                  {isMobile ? (
                    <div className="divide-y divide-border-default">
                      {byFase.map((item) => (
                        <div
                          key={`${item.fase_detectada}-${item.modelo_ia}`}
                          className="p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {item.fase_detectada || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {item.modelo_ia}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {formatNumber(item.chamadas)} chamadas
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(item.total_usd)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Fase
                          </th>
                          <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                            Modelo
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Chamadas
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Custo Total
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Avg/Chamada
                          </th>
                          <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                            Avg Prompt Chars
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {byFase.map((item) => {
                          const maxCost = Math.max(
                            ...byFase.map((f) => f.total_usd),
                          );
                          const barWidth =
                            maxCost > 0 ? (item.total_usd / maxCost) * 100 : 0;
                          return (
                            <tr
                              key={`${item.fase_detectada}-${item.modelo_ia}`}
                              className="hover:bg-bg-hover"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {item.fase_detectada || "N/A"}
                                  </span>
                                  <div
                                    className="h-1.5 rounded-full bg-blue-500/30"
                                    style={{
                                      width: `${Math.min(barWidth, 60)}px`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                  {item.modelo_ia}
                                </span>
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {formatNumber(item.chamadas)}
                              </td>
                              <td className="p-3 text-right text-accent-primary font-mono font-bold">
                                {formatUSD(item.total_usd)}
                              </td>
                              <td className="p-3 text-right text-text-muted font-mono">
                                {formatUSD(item.avg_usd)}
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {formatNumber(item.avg_prompt_chars)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CollapsibleSection>
              )}

              {/* 5. Analise por Lead */}
              {analyticsDateRange ? (
                <CollapsibleSection
                  title="Analise por Lead"
                  badge={
                    leadAnalysis.loading
                      ? "carregando..."
                      : leadAnalysis.totalLeads > 0
                        ? `${formatNumber(leadAnalysis.totalLeads)} leads • ${formatUSD(leadAnalysis.avgCostPerLead)}/lead`
                        : "sem dados"
                  }
                  icon={<Activity size={15} />}
                  isOpen={openSections.byLead}
                  onToggle={() => toggleSection("byLead")}
                >
                  {leadAnalysis.loading ? (
                    <div className="flex items-center justify-center py-16">
                      <RefreshCw
                        className="animate-spin text-text-muted"
                        size={22}
                      />
                      <span className="ml-3 text-sm text-text-muted">
                        Carregando dados de leads...
                      </span>
                    </div>
                  ) : leadAnalysis.error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle
                        className="text-red-500 flex-shrink-0"
                        size={18}
                      />
                      <p className="text-red-400 text-sm">
                        {leadAnalysis.error}
                      </p>
                    </div>
                  ) : leadAnalysis.totalLeads === 0 ? (
                    <div className="border border-border-default rounded-lg bg-bg-secondary p-8 flex flex-col items-center text-center">
                      <Users
                        size={32}
                        className="text-text-muted opacity-30 mb-3"
                      />
                      <p className="text-sm text-text-muted">
                        Nenhum lead com contact_id encontrado no periodo
                        selecionado.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                              Custo Medio/Lead
                            </span>
                            <div className="p-1.5 md:p-2 bg-[#58a6ff]/10 rounded-lg">
                              <DollarSign
                                size={14}
                                className="text-[#58a6ff]"
                              />
                            </div>
                          </div>
                          <div className="text-lg md:text-2xl font-bold text-[#58a6ff] truncate font-mono">
                            {formatUSD(leadAnalysis.avgCostPerLead)}
                          </div>
                          <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                            Media de gasto por contato unico
                          </p>
                        </div>

                        <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                              Mediana Chamadas
                            </span>
                            <div className="p-1.5 md:p-2 bg-[#3fb950]/10 rounded-lg">
                              <Activity size={14} className="text-[#3fb950]" />
                            </div>
                          </div>
                          <div className="text-lg md:text-2xl font-bold text-[#3fb950]">
                            {leadAnalysis.medianCalls}
                          </div>
                          <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                            Chamadas por lead (mediana)
                          </p>
                        </div>

                        <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                              Leads &gt;10 Chamadas
                            </span>
                            <div className="p-1.5 md:p-2 bg-[#f78166]/10 rounded-lg">
                              <Target size={14} className="text-[#f78166]" />
                            </div>
                          </div>
                          <div className="text-lg md:text-2xl font-bold text-[#f78166]">
                            {leadAnalysis.pctLeadsOver10.toFixed(1)}%
                          </div>
                          <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                            Alta interacao (acima de 10 req)
                          </p>
                        </div>

                        <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">
                              Total Leads
                            </span>
                            <div className="p-1.5 md:p-2 bg-[#d2a8ff]/10 rounded-lg">
                              <Users size={14} className="text-[#d2a8ff]" />
                            </div>
                          </div>
                          <div className="text-lg md:text-2xl font-bold text-[#d2a8ff]">
                            {formatNumber(leadAnalysis.totalLeads)}
                          </div>
                          <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                            Contatos unicos com custo IA
                          </p>
                        </div>
                      </div>

                      {/* Histograma + Scatter em grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Histograma de Distribuicao */}
                        {leadAnalysis.distribution.length > 0 && (
                          <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
                            <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
                              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <Layers size={15} className="text-[#58a6ff]" />
                                Distribuicao por Faixa de Chamadas
                              </h2>
                              <p className="text-[10px] md:text-xs text-text-muted mt-0.5">
                                Quantidade de leads por volume de interacoes
                              </p>
                            </div>
                            <div
                              className="p-3 md:p-4"
                              style={{ height: isMobile ? 220 : 280 }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={leadAnalysis.distribution}
                                  margin={{
                                    top: 5,
                                    right: 10,
                                    left: 0,
                                    bottom: 5,
                                  }}
                                >
                                  <defs>
                                    <linearGradient
                                      id="barGrad1"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#58a6ff"
                                        stopOpacity={0.9}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#1f6feb"
                                        stopOpacity={0.6}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="barGrad2"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#3fb950"
                                        stopOpacity={0.9}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#238636"
                                        stopOpacity={0.6}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="barGrad3"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#e3b341"
                                        stopOpacity={0.9}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#9e6a03"
                                        stopOpacity={0.6}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="barGrad4"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#f78166"
                                        stopOpacity={0.9}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#b22f1f"
                                        stopOpacity={0.6}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.06)"
                                  />
                                  <XAxis
                                    dataKey="faixa"
                                    tick={{
                                      fontSize: 11,
                                      fill: "rgba(255,255,255,0.5)",
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis
                                    tick={{
                                      fontSize: 10,
                                      fill: "rgba(255,255,255,0.4)",
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={35}
                                  />
                                  <ReTooltip
                                    contentStyle={{
                                      backgroundColor: "#161b22",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                    }}
                                    formatter={(
                                      value: unknown,
                                      name: string,
                                    ) => {
                                      if (name === "leads")
                                        return [String(value), "Leads"];
                                      return [String(value), name];
                                    }}
                                    content={({ active, payload }) => {
                                      if (
                                        !active ||
                                        !payload ||
                                        payload.length === 0
                                      )
                                        return null;
                                      const d = payload[0]?.payload as
                                        | {
                                            faixa: string;
                                            leads: number;
                                            avgCost: number;
                                            totalCost: number;
                                          }
                                        | undefined;
                                      if (!d) return null;
                                      return (
                                        <div
                                          style={{
                                            backgroundColor: "#161b22",
                                            border:
                                              "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 8,
                                            padding: "10px 14px",
                                            fontSize: 12,
                                          }}
                                        >
                                          <p
                                            style={{
                                              color: "#e6edf3",
                                              fontWeight: 700,
                                              marginBottom: 6,
                                            }}
                                          >
                                            {d.faixa} chamadas
                                          </p>
                                          <p style={{ color: "#8b949e" }}>
                                            Leads:{" "}
                                            <span
                                              style={{
                                                color: "#58a6ff",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {d.leads}
                                            </span>
                                          </p>
                                          <p style={{ color: "#8b949e" }}>
                                            Custo total:{" "}
                                            <span
                                              style={{
                                                color: "#3fb950",
                                                fontWeight: 600,
                                              }}
                                            >
                                              ${d.totalCost.toFixed(4)}
                                            </span>
                                          </p>
                                          <p style={{ color: "#8b949e" }}>
                                            Avg/lead:{" "}
                                            <span
                                              style={{
                                                color: "#e3b341",
                                                fontWeight: 600,
                                              }}
                                            >
                                              ${d.avgCost.toFixed(4)}
                                            </span>
                                          </p>
                                        </div>
                                      );
                                    }}
                                  />
                                  <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                                    {leadAnalysis.distribution.map(
                                      (_, index) => {
                                        const grads = [
                                          "url(#barGrad1)",
                                          "url(#barGrad2)",
                                          "url(#barGrad3)",
                                          "url(#barGrad4)",
                                        ];
                                        return (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={grads[index % grads.length]}
                                          />
                                        );
                                      },
                                    )}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Scatter Plot: Chamadas x Custo */}
                        {leadAnalysis.scatterData.length > 0 && (
                          <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
                            <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
                              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <Activity
                                  size={15}
                                  className="text-[#3fb950]"
                                />
                                Chamadas x Custo por Lead
                              </h2>
                              <p className="text-[10px] md:text-xs text-text-muted mt-0.5">
                                Cada ponto = 1 lead. Cor por cliente.{" "}
                                {leadAnalysis.scatterData.length <
                                  leadAnalysis.totalLeads && (
                                  <span className="text-[#e3b341]">
                                    Amostra: {leadAnalysis.scatterData.length}/
                                    {leadAnalysis.totalLeads}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div
                              className="p-3 md:p-4"
                              style={{ height: isMobile ? 220 : 280 }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart
                                  margin={{
                                    top: 5,
                                    right: 10,
                                    left: 0,
                                    bottom: 5,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.06)"
                                  />
                                  <XAxis
                                    dataKey="chamadas"
                                    name="Chamadas"
                                    type="number"
                                    tick={{
                                      fontSize: 10,
                                      fill: "rgba(255,255,255,0.4)",
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                    label={{
                                      value: "Chamadas",
                                      position: "insideBottom",
                                      offset: -2,
                                      fontSize: 10,
                                      fill: "rgba(255,255,255,0.3)",
                                    }}
                                  />
                                  <YAxis
                                    dataKey="custoTotal"
                                    name="Custo USD"
                                    type="number"
                                    tick={{
                                      fontSize: 10,
                                      fill: "rgba(255,255,255,0.4)",
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={50}
                                    tickFormatter={(v: number) =>
                                      `$${v.toFixed(3)}`
                                    }
                                  />
                                  <ZAxis range={[30, 30]} />
                                  <ReTooltip
                                    cursor={{
                                      strokeDasharray: "3 3",
                                      stroke: "rgba(255,255,255,0.1)",
                                    }}
                                    content={({ active, payload }) => {
                                      if (
                                        !active ||
                                        !payload ||
                                        payload.length === 0
                                      )
                                        return null;
                                      const d = payload[0]?.payload as
                                        | {
                                            contactName: string;
                                            locationName: string;
                                            chamadas: number;
                                            custoTotal: number;
                                          }
                                        | undefined;
                                      if (!d) return null;
                                      return (
                                        <div
                                          style={{
                                            backgroundColor: "#161b22",
                                            border:
                                              "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 8,
                                            padding: "10px 14px",
                                            fontSize: 12,
                                            maxWidth: 220,
                                          }}
                                        >
                                          <p
                                            style={{
                                              color: "#e6edf3",
                                              fontWeight: 700,
                                              marginBottom: 6,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {d.contactName}
                                          </p>
                                          <p style={{ color: "#8b949e" }}>
                                            Cliente:{" "}
                                            <span
                                              style={{
                                                color: "#d2a8ff",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {d.locationName}
                                            </span>
                                          </p>
                                          <p style={{ color: "#8b949e" }}>
                                            Chamadas:{" "}
                                            <span
                                              style={{
                                                color: "#58a6ff",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {d.chamadas}
                                            </span>
                                          </p>
                                          <p style={{ color: "#8b949e" }}>
                                            Custo:{" "}
                                            <span
                                              style={{
                                                color: "#3fb950",
                                                fontWeight: 600,
                                              }}
                                            >
                                              ${d.custoTotal.toFixed(4)}
                                            </span>
                                          </p>
                                        </div>
                                      );
                                    }}
                                  />
                                  {/* Agrupar por location para colorir */}
                                  {Array.from(
                                    new Set(
                                      leadAnalysis.scatterData.map(
                                        (d) => d.locationName,
                                      ),
                                    ),
                                  ).map((loc) => (
                                    <Scatter
                                      key={loc}
                                      name={loc}
                                      data={leadAnalysis.scatterData.filter(
                                        (d) => d.locationName === loc,
                                      )}
                                      fill={getLocationColor(loc)}
                                      fillOpacity={0.7}
                                    />
                                  ))}
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                            {/* Legenda de cores */}
                            <div className="px-3 md:px-4 pb-3 flex flex-wrap gap-2">
                              {Array.from(
                                new Set(
                                  leadAnalysis.scatterData.map(
                                    (d) => d.locationName,
                                  ),
                                ),
                              ).map((loc) => (
                                <div
                                  key={loc}
                                  className="flex items-center gap-1.5"
                                >
                                  <span
                                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: getLocationColor(loc),
                                    }}
                                  />
                                  <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                                    {loc}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tabela Top 15 Leads Mais Caros */}
                      {leadAnalysis.topLeads.length > 0 && (
                        <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
                          <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary flex items-center justify-between">
                            <div>
                              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <Target size={15} className="text-[#f78166]" />
                                Top 15 Leads Mais Caros
                              </h2>
                              <p className="text-[10px] md:text-xs text-text-muted mt-0.5">
                                Leads com maior custo total de IA no periodo
                              </p>
                            </div>
                          </div>
                          {isMobile ? (
                            <div className="divide-y divide-border-default">
                              {leadAnalysis.topLeads.map((lead, idx) => (
                                <div
                                  key={lead.contactId}
                                  className="p-3 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[10px] font-bold text-text-muted w-5 flex-shrink-0">
                                        #{idx + 1}
                                      </span>
                                      <span className="text-sm font-medium text-text-primary truncate">
                                        {lead.contactName}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold text-[#58a6ff] font-mono flex-shrink-0 ml-2">
                                      {formatUSD(lead.custoTotal)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 pl-7">
                                    <span
                                      className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                                      style={{
                                        color: getLocationColor(
                                          lead.locationName,
                                        ),
                                        borderColor: `${getLocationColor(lead.locationName)}40`,
                                        backgroundColor: `${getLocationColor(lead.locationName)}15`,
                                      }}
                                    >
                                      {lead.locationName}
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                      {lead.chamadas} chamadas
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                      {lead.diasAtivos}d ativos
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border-default">
                                  <th className="p-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider w-8">
                                    #
                                  </th>
                                  <th className="p-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    Lead
                                  </th>
                                  <th className="p-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    Cliente
                                  </th>
                                  <th className="p-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    Chamadas
                                  </th>
                                  <th className="p-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    Custo Total
                                  </th>
                                  <th className="p-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">
                                    Avg/Chamada
                                  </th>
                                  <th className="p-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">
                                    Dias Ativos
                                  </th>
                                  <th className="p-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">
                                    Modos
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-default">
                                {leadAnalysis.topLeads.map((lead, idx) => {
                                  const maxCost =
                                    leadAnalysis.topLeads[0]?.custoTotal || 1;
                                  const barWidth = Math.max(
                                    4,
                                    (lead.custoTotal / maxCost) * 100,
                                  );
                                  return (
                                    <tr
                                      key={lead.contactId}
                                      className="hover:bg-bg-tertiary/50 transition-colors"
                                    >
                                      <td className="p-3 text-[10px] font-bold text-text-muted">
                                        {idx + 1}
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <div className="min-w-0">
                                            <p className="font-medium text-text-primary truncate max-w-[180px]">
                                              {lead.contactName}
                                            </p>
                                            <div className="mt-1 h-1 rounded-full bg-bg-tertiary w-32 overflow-hidden">
                                              <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#58a6ff] to-[#1f6feb] transition-all"
                                                style={{
                                                  width: `${barWidth}%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                                          style={{
                                            color: getLocationColor(
                                              lead.locationName,
                                            ),
                                            borderColor: `${getLocationColor(lead.locationName)}40`,
                                            backgroundColor: `${getLocationColor(lead.locationName)}15`,
                                          }}
                                        >
                                          {lead.locationName}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right text-text-muted font-mono">
                                        {lead.chamadas}
                                      </td>
                                      <td className="p-3 text-right text-[#58a6ff] font-mono font-bold">
                                        {formatUSD(lead.custoTotal)}
                                      </td>
                                      <td className="p-3 text-right text-text-muted font-mono hidden lg:table-cell">
                                        {formatUSD(lead.avgPerCall)}
                                      </td>
                                      <td className="p-3 text-right text-text-muted hidden lg:table-cell">
                                        {lead.diasAtivos}d
                                      </td>
                                      <td className="p-3 hidden xl:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                          {lead.modos.split(", ").map((m) => (
                                            <span
                                              key={m}
                                              className="text-[9px] px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-medium uppercase truncate max-w-[80px]"
                                            >
                                              {m}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CollapsibleSection>
              ) : (
                <div className="border border-gray-800 rounded-lg">
                  <button
                    disabled
                    className="w-full p-4 flex items-center justify-between bg-[#0d1117] rounded-lg opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">
                        <Activity size={15} />
                      </span>
                      <span className="text-sm font-bold text-text-primary">
                        Analise por Lead
                      </span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                        selecione um periodo
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className={`bg-bg-secondary border border-border-default rounded-2xl w-full overflow-hidden shadow-2xl ${
              isMobile
                ? "h-full max-h-full rounded-none"
                : "max-w-3xl max-h-[80vh]"
            }`}
          >
            <div className="p-4 md:p-6 border-b border-border-default flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg md:text-xl font-bold text-text-primary truncate">
                  {selectedWorkflow.workflow_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {selectedWorkflow.workflow_id && (
                    <a
                      href={`${N8N_BASE_URL}/${selectedWorkflow.workflow_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] md:text-xs text-accent-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={10} />
                      Abrir no n8n
                    </a>
                  )}
                  <span className="text-[10px] md:text-xs text-text-muted font-mono">
                    {selectedWorkflow.workflow_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`p-4 md:p-6 overflow-y-auto ${isMobile ? "h-[calc(100%-80px)]" : "max-h-[calc(80vh-120px)]"}`}
            >
              {/* Workflow Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Custo Total
                  </p>
                  <p className="text-base md:text-xl font-bold text-accent-primary truncate">
                    {formatUSD(selectedWorkflow.total_cost_usd)}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Requests
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary">
                    {formatNumber(selectedWorkflow.total_requests)}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Clientes
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary">
                    {selectedWorkflow.total_clients}
                  </p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">
                    Custo/Request
                  </p>
                  <p className="text-base md:text-xl font-bold text-text-primary truncate">
                    {formatUSD(selectedWorkflow.avg_cost_per_request)}
                  </p>
                </div>
              </div>

              {/* Models Used */}
              <div className="mb-4 md:mb-6">
                <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                  <Cpu size={14} />
                  Modelos Utilizados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkflow.models_used.map((model) => (
                    <span
                      key={model}
                      className="text-xs px-3 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-medium"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              {/* Client Breakdown */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-2 md:mb-3 flex items-center gap-2">
                  <Users size={14} />
                  Breakdown por Cliente
                </h3>
                {loadingWfBreakdown ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw
                      className="animate-spin text-text-muted"
                      size={24}
                    />
                  </div>
                ) : workflowClients.length > 0 ? (
                  isMobile ? (
                    <div className="space-y-2">
                      {workflowClients.map((client) => (
                        <div
                          key={client.location_name}
                          className="bg-bg-primary border border-border-default rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {client.location_name}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                              <span>
                                {formatNumber(client.total_requests)} req
                              </span>
                              <span>
                                {formatNumber(client.total_tokens_input)} tokens
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">
                            {formatUSD(client.total_cost_usd)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-bg-primary border border-border-default rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary">
                          <tr>
                            <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">
                              Cliente
                            </th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                              Custo
                            </th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                              Requests
                            </th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">
                              Tokens
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {workflowClients.map((client) => (
                            <tr
                              key={client.location_name}
                              className="hover:bg-bg-hover"
                            >
                              <td className="p-3 font-medium">
                                {client.location_name}
                              </td>
                              <td className="p-3 text-right text-accent-primary font-mono">
                                {formatUSD(client.total_cost_usd)}
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {formatNumber(client.total_requests)}
                              </td>
                              <td className="p-3 text-right text-text-muted">
                                {formatNumber(client.total_tokens_input)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <p className="text-center text-text-muted py-4 text-sm">
                    Nenhum dado de cliente encontrado
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
