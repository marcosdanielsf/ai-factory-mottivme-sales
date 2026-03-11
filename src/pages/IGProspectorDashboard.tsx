import React from "react";
import {
  RefreshCw,
  Filter,
  MessageCircle,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useIGProspectorData } from "../hooks/useIGProspectorData";

// ============================================================================
// IGProspectorDashboard
// Dashboard de prospecção Instagram — consome exclusivamente useIGProspectorData
// Exibe: funil de leads, reply rate por conta, custo por lead
// ============================================================================

export default function IGProspectorDashboard() {
  const { funnelStages, replyRates, costPerLead, loading, error, refetch } =
    useIGProspectorData();

  // --------------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#8b949e]">
          <Loader2 className="h-8 w-8 animate-spin text-[#58a6ff]" />
          <span className="text-sm">
            Carregando dados do Instagram Prospector...
          </span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">
            Instagram Prospector — Dashboard
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Visão consolidada de funil, replies e custo por lead
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs bg-[#161b22] border border-[#30363d] text-[#3fb950] px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            Dados em tempo real
          </span>
          <button
            onClick={refetch}
            className="flex items-center gap-2 text-sm bg-[#161b22] border border-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] hover:border-[#58a6ff] px-3 py-2 rounded-lg transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-[#161b22] border border-[#f85149] text-[#f85149] rounded-lg p-4 mb-6">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Erro ao carregar dados</p>
            <p className="text-xs mt-1 text-[#ffa198]">{error}</p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Seção 1: Funil de Leads */}
      {/* -------------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Funil de Leads
          </h2>
          {funnelStages.length > 0 && (
            <span className="text-xs text-[#8b949e] ml-1">
              ({funnelStages.length} estágios)
            </span>
          )}
        </div>

        {funnelStages.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <Filter className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Sem dados de funil</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Os dados aparecerão quando houver leads na view vw_lead_funnel_e2e
            </p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="text-left px-4 py-3 font-medium">Estágio</th>
                  <th className="text-right px-4 py-3 font-medium">Leads</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Conta IG
                  </th>
                </tr>
              </thead>
              <tbody>
                {funnelStages.map((stage, idx) => (
                  <tr
                    key={`${stage.stage}-${stage.ig_account ?? "all"}-${idx}`}
                    className="border-b border-[#21262d] last:border-0 hover:bg-[#21262d] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#c9d1d9]">{stage.stage}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-[#3fb950] font-semibold">
                        {stage.count.toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8b949e] text-xs hidden md:table-cell">
                      {stage.ig_account ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Seção 2: Reply Rate por Conta */}
      {/* -------------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Reply Rate por Conta
          </h2>
          {replyRates.length > 0 && (
            <span className="text-xs text-[#8b949e] ml-1">
              ({replyRates.length} conta{replyRates.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        {replyRates.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <MessageCircle className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Sem dados de reply rate</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Os dados aparecerão quando houver DMs enviados em
              vw_reply_rate_by_account
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {replyRates.map((account) => {
              // reply_rate pode ser decimal (0-1) ou percentual (0-100)
              // vw_reply_rate_by_account: se replies/dms_sent resulta em 0-1, multiplica por 100
              const rateDisplay =
                account.reply_rate <= 1
                  ? (account.reply_rate * 100).toFixed(1)
                  : account.reply_rate.toFixed(1);

              const rateNum = parseFloat(rateDisplay);
              const rateColor =
                rateNum >= 15
                  ? "#3fb950"
                  : rateNum >= 8
                    ? "#d29922"
                    : "#f85149";

              return (
                <div
                  key={account.ig_account}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-[#8b949e] mb-0.5">Conta</p>
                      <p className="text-sm font-medium text-[#58a6ff] truncate max-w-[180px]">
                        @{account.ig_account}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8b949e] mb-0.5">
                        Reply Rate
                      </p>
                      <p
                        className="text-xl font-bold"
                        style={{ color: rateColor }}
                      >
                        {rateDisplay}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-[#8b949e]">
                    <span>
                      DMs enviados:{" "}
                      <span className="text-[#c9d1d9] font-mono">
                        {account.dms_sent.toLocaleString("pt-BR")}
                      </span>
                    </span>
                    <span>
                      Respostas:{" "}
                      <span className="text-[#c9d1d9] font-mono">
                        {account.replies.toLocaleString("pt-BR")}
                      </span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(rateNum, 100)}%`,
                        backgroundColor: rateColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Seção 3: Custo por Lead */}
      {/* -------------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Custo por Lead
          </h2>
          {costPerLead.length > 0 && (
            <span className="text-xs text-[#8b949e] ml-1">
              ({costPerLead.length} conta{costPerLead.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        {costPerLead.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <DollarSign className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Sem dados de custo</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Os dados aparecerão quando houver custos registrados em
              vw_cost_per_lead
            </p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="text-left px-4 py-3 font-medium">Conta IG</th>
                  <th className="text-right px-4 py-3 font-medium">Leads</th>
                  <th className="text-right px-4 py-3 font-medium">
                    Custo por Lead
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
                    Custo Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {costPerLead.map((row) => (
                  <tr
                    key={row.ig_account}
                    className="border-b border-[#21262d] last:border-0 hover:bg-[#21262d] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#58a6ff]">
                      @{row.ig_account}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#c9d1d9]">
                      {row.leads_count.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-[#3fb950] font-semibold">
                        R$ {row.cost_per_lead.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#8b949e] hidden md:table-cell">
                      R$ {row.total_cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
