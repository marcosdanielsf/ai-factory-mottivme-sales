import React from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDateShort,
} from "../helpers";

interface FunnelDay {
  dia: string;
  gasto: number;
  mensagens: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  impressoes: number;
  cliques: number;
}

interface ClientDailyTableProps {
  data: FunnelDay[];
  loading: boolean;
}

const SkeletonTable = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
    <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse mb-6" />
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-zinc-800/60 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

export const ClientDailyTable: React.FC<ClientDailyTableProps> = ({
  data,
  loading,
}) => {
  if (loading) return <SkeletonTable />;

  const sorted = [...data].sort((a, b) => b.dia.localeCompare(a.dia));

  const getCTR = (cliques: number, impressoes: number) => {
    if (!impressoes) return "-";
    return formatPercent((cliques / impressoes) * 100);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-base font-semibold text-white mb-4">Dados Diarios</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 px-2 text-zinc-400 font-medium">
                Data
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
                Comparecimentos
              </th>
              <th className="text-right py-3 px-2 text-zinc-400 font-medium">
                CTR
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const cpl = row.mensagens > 0 ? row.gasto / row.mensagens : 0;
              return (
                <tr
                  key={row.dia}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                    i % 2 === 0 ? "" : "bg-zinc-800/10"
                  }`}
                >
                  <td className="py-3 px-2 text-zinc-300">
                    {formatDateShort(row.dia)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatCurrency(row.gasto)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatNumber(row.mensagens)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {cpl > 0 ? formatCurrency(cpl) : "-"}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatNumber(row.agendaram)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatNumber(row.compareceram)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {getCTR(row.cliques, row.impressoes)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Nenhum dado disponivel para o periodo selecionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
