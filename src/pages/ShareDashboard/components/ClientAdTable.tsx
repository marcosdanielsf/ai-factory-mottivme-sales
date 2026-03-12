import React from "react";
import { formatCurrency, formatNumber } from "../helpers";
import type { AdBreakdown } from "../../../hooks/useClientFunnel";

interface ClientAdTableProps {
  data: AdBreakdown[];
  loading: boolean;
}

const SkeletonAdTable = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
    <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse mb-6" />
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-zinc-800/60 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

export const ClientAdTable: React.FC<ClientAdTableProps> = ({
  data,
  loading,
}) => {
  if (loading) return <SkeletonAdTable />;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-base font-semibold text-white mb-4">
        Performance por Anuncio
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 px-2 text-zinc-400 font-medium">
                Criativo
              </th>
              <th className="text-left py-3 px-2 text-zinc-400 font-medium">
                Campanha
              </th>
              <th className="text-right py-3 px-2 text-zinc-400 font-medium">
                Gasto
              </th>
              <th className="text-right py-3 px-2 text-zinc-400 font-medium">
                Leads
              </th>
              <th className="text-right py-3 px-2 text-zinc-400 font-medium">
                CPL
              </th>
              <th className="text-right py-3 px-2 text-zinc-400 font-medium">
                Agendamentos
              </th>
              <th className="text-right py-3 px-2 text-zinc-400 font-medium">
                ROAS
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const roas = Number(row.roas) || 0;
              const roasColor = roas >= 1 ? "text-green-400" : "text-red-400";
              return (
                <tr
                  key={`${row.ad_id}-${i}`}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                    i % 2 === 0 ? "" : "bg-zinc-800/10"
                  }`}
                >
                  <td className="py-3 px-2 text-zinc-300">
                    <span
                      className="block max-w-[200px] truncate"
                      title={row.criativo}
                    >
                      {row.criativo || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-zinc-300">
                    <span
                      className="block max-w-[180px] truncate"
                      title={row.campanha}
                    >
                      {row.campanha || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatCurrency(Number(row.gasto) || 0)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatNumber(Number(row.leads_gerados) || 0)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {row.cpl != null && Number(row.cpl) > 0
                      ? formatCurrency(Number(row.cpl))
                      : "-"}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatNumber(Number(row.leads_agendaram) || 0)}
                  </td>
                  <td
                    className={`py-3 px-2 text-right font-medium ${roasColor}`}
                  >
                    {roas.toFixed(1)}x
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Nenhum dado de anuncio disponivel para o periodo selecionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
