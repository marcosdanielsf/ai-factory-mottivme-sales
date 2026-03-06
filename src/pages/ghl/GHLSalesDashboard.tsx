import React, { useState } from "react";
import { useAccount } from "../../contexts/AccountContext";
import { useLocations } from "../../hooks/useLocations";
import { useGHLSalesDashboard } from "../../hooks/ghl/useGHLSalesDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  won: "bg-green-500/20 text-green-400",
  lost: "bg-red-500/20 text-red-400",
  abandoned: "bg-gray-500/20 text-gray-400",
};

const PIE_COLORS = ["#22c55e", "#ef4444", "#6b7280", "#3b82f6"];

function KPICard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="p-2 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

export default function GHLSalesDashboard() {
  const { selectedAccount } = useAccount();
  const { locations } = useLocations();
  const locationId =
    selectedAccount?.location_id || locations?.[0]?.location_id || "";
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");

  const {
    pipelines,
    stageMetrics,
    kpis,
    showRate,
    stagnatedOpps,
    recentOpps,
    loading,
    error,
    refetch,
  } = useGHLSalesDashboard({
    locationId,
    selectedPipelineId: selectedPipelineId || undefined,
  });

  if (!locationId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Selecione uma conta para visualizar o dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p>{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const pieData = [
    { name: "Compareceu", value: showRate.showed },
    { name: "No-Show", value: showRate.noShow },
    { name: "Cancelado", value: showRate.cancelled },
    { name: "Pendente", value: showRate.confirmed },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">
          Sales Dashboard (GHL Direct)
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedPipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os Pipelines</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={refetch}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition text-gray-400"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">{locationId}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          label="Total no Pipeline"
          value={BRL.format(kpis.totalValue)}
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
        />
        <KPICard
          label="Oportunidades Abertas"
          value={kpis.openCount.toString()}
          icon={<Users className="w-5 h-5 text-blue-500" />}
        />
        <KPICard
          label="Win Rate"
          value={`${kpis.winRate.toFixed(1)}%`}
          subtitle={`${kpis.wonCount}W / ${kpis.lostCount}L`}
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
        />
        <KPICard
          label="Ciclo Medio"
          value={
            kpis.avgCycleTimeDays > 0
              ? `${kpis.avgCycleTimeDays.toFixed(0)}d`
              : "--"
          }
          icon={<Clock className="w-5 h-5 text-orange-500" />}
        />
        <KPICard
          label="Estagnadas (>7d)"
          value={kpis.stagnatedCount.toString()}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        />
      </div>

      {/* Main Grid: Funnel + Show Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel by Stage */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            Funil por Stage
            {selectedPipelineId &&
            pipelines.find((p) => p.id === selectedPipelineId)
              ? ` - ${pipelines.find((p) => p.id === selectedPipelineId)!.name}`
              : ""}
          </h2>
          {stageMetrics.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(300, stageMetrics.length * 40)}
            >
              <BarChart
                data={stageMetrics}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="stageName"
                  width={140}
                  tick={{ fill: "#d1d5db", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#f3f4f6" }}
                  formatter={(value: number, name: string) => {
                    if (name === "count") return [value, "Oportunidades"];
                    return [BRL.format(value), "Valor"];
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              Nenhum dado disponivel
            </div>
          )}
        </div>

        {/* Show Rate */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-400" />
            Show Rate (30 dias)
          </h2>
          {showRate.total > 0 ? (
            <>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-white">
                  {showRate.rate.toFixed(0)}%
                </span>
                <p className="text-gray-400 text-sm mt-1">
                  Taxa de Comparecimento
                </p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-400">
                    Compareceu: {showRate.showed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-400">
                    No-Show: {showRate.noShow}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-gray-400">
                    Cancelado: {showRate.cancelled}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-400">
                    Pendente: {showRate.confirmed}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              Sem agendamentos no periodo
            </div>
          )}
        </div>
      </div>

      {/* Stagnated Opportunities */}
      {stagnatedOpps.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Oportunidades Estagnadas ({stagnatedOpps.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">Nome</th>
                  <th className="text-left py-2 px-3">Stage</th>
                  <th className="text-right py-2 px-3">Dias Parado</th>
                  <th className="text-right py-2 px-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {stagnatedOpps.slice(0, 15).map((opp) => (
                  <tr
                    key={opp.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td className="py-2 px-3 text-white">{opp.name}</td>
                    <td className="py-2 px-3 text-gray-300">{opp.stageName}</td>
                    <td
                      className={`py-2 px-3 text-right font-mono ${opp.daysSinceChange > 14 ? "text-red-400" : "text-yellow-400"}`}
                    >
                      {opp.daysSinceChange}d
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {BRL.format(opp.monetaryValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Opportunities */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Oportunidades Recentes
        </h2>
        {recentOpps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">Nome</th>
                  <th className="text-left py-2 px-3">Pipeline</th>
                  <th className="text-left py-2 px-3">Stage</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-right py-2 px-3">Valor</th>
                  <th className="text-right py-2 px-3">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {recentOpps.map((opp) => (
                  <tr
                    key={opp.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td className="py-2 px-3 text-white">{opp.name}</td>
                    <td className="py-2 px-3 text-gray-300 text-xs">
                      {opp.pipelineName}
                    </td>
                    <td className="py-2 px-3 text-gray-300">{opp.stageName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[opp.status] || STATUS_COLORS.open}`}
                      >
                        {opp.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {BRL.format(opp.monetaryValue || 0)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500 text-xs">
                      {opp.updatedAt
                        ? new Date(opp.updatedAt).toLocaleDateString("pt-BR")
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center text-gray-500">
            Nenhuma oportunidade encontrada
          </div>
        )}
      </div>
    </div>
  );
}
