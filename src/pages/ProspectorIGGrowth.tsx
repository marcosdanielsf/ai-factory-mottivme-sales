/**
 * ProspectorIGGrowth.tsx
 * Painel de crescimento de seguidores das contas de disparo Instagram
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Instagram,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  UserPlus,
  RefreshCw,
  Loader2,
  Camera,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface AccountGrowth {
  username: string;
  followers: number;
  following: number;
  posts_count: number;
  last_snapshot_at: string | null;
  delta_7d: number | null;
  delta_30d: number | null;
  follower_ratio: number | null;
}

interface Snapshot {
  username: string;
  followers: number;
  following: number;
  posts_count: number;
  captured_at: string;
}

const PROSPECTOR_API =
  import.meta.env.VITE_PROSPECTOR_API_URL ||
  "https://instagram-prospector-production.up.railway.app";

const CHART_COLORS = [
  "#58a6ff",
  "#3fb950",
  "#a371f7",
  "#f97316",
  "#ec4899",
  "#14b8a6",
];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const fmtNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const DeltaBadge = ({ value }: { value: number | null }) => {
  if (value === null) return <span className="text-[#8b949e] text-xs">—</span>;
  if (value === 0)
    return (
      <span className="flex items-center gap-0.5 text-[#8b949e] text-xs">
        <Minus size={11} /> 0
      </span>
    );
  const positive = value > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-[#3fb950]" : "text-[#ef4444]"}`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? "+" : ""}
      {value}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ACCOUNT CARD
// ═══════════════════════════════════════════════════════════════════════

interface AccountCardProps {
  account: AccountGrowth;
  color: string;
  selected: boolean;
  onClick: () => void;
}

const AccountCard = ({
  account,
  color,
  selected,
  onClick,
}: AccountCardProps) => (
  <button
    onClick={onClick}
    className={`w-full text-left bg-[#161b22] rounded-lg p-4 border transition-all ${
      selected
        ? "border-[#58a6ff]/60 ring-1 ring-[#58a6ff]/30"
        : "border-[#30363d] hover:border-[#58a6ff]/30"
    }`}
  >
    {/* Header */}
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-center gap-1.5 min-w-0">
        <Instagram size={13} className="text-[#e1306c] flex-shrink-0" />
        <span className="text-sm font-semibold text-white truncate">
          @{account.username}
        </span>
      </div>
    </div>

    {/* Followers */}
    <div className="mb-2">
      <p className="text-2xl font-bold text-white">
        {fmtNumber(account.followers)}
      </p>
      <p className="text-[10px] text-[#8b949e]">seguidores</p>
    </div>

    {/* Deltas */}
    <div className="flex items-center gap-3 mb-2">
      <div>
        <p className="text-[9px] text-[#8b949e] uppercase tracking-wider mb-0.5">
          7 dias
        </p>
        <DeltaBadge value={account.delta_7d} />
      </div>
      <div>
        <p className="text-[9px] text-[#8b949e] uppercase tracking-wider mb-0.5">
          30 dias
        </p>
        <DeltaBadge value={account.delta_30d} />
      </div>
    </div>

    {/* Following + ratio */}
    <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
      <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
        <Users size={10} />
        Seguindo: {fmtNumber(account.following)}
      </span>
      {account.follower_ratio !== null && (
        <span className="text-[10px] text-[#58a6ff] font-medium">
          {account.follower_ratio}x ratio
        </span>
      )}
    </div>

    {/* Last snapshot */}
    {account.last_snapshot_at && (
      <p className="text-[9px] text-[#8b949e] mt-1.5">
        Atualizado{" "}
        {format(parseISO(account.last_snapshot_at), "dd/MM HH:mm", {
          locale: ptBR,
        })}
      </p>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════
// CHART TOOLTIP
// ═══════════════════════════════════════════════════════════════════════

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-xl">
      <p className="text-[10px] text-[#8b949e] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[#8b949e]">@{p.name}:</span>
          <span className="text-white font-semibold">{fmtNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ProspectorIGGrowth = () => {
  const [growth, setGrowth] = useState<AccountGrowth[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot[]>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set(),
  );
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);
  const [lastCaptured, setLastCaptured] = useState<string | null>(null);

  // ── Fetch growth summary ──────────────────────────────────────────
  const fetchGrowth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${PROSPECTOR_API}/api/accounts/growth`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const accounts: AccountGrowth[] = json.growth || [];
      setGrowth(accounts);
      setSelectedAccounts((prev) =>
        prev.size === 0 ? new Set(accounts.map((a) => a.username)) : prev,
      );
    } catch (err) {
      console.error("Erro ao buscar growth:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch snapshots histórico por conta selecionada ───────────────
  const fetchSnapshots = useCallback(
    async (usernames: string[], days: number) => {
      const entries = await Promise.all(
        usernames.map(async (username) => {
          try {
            const res = await fetch(
              `${PROSPECTOR_API}/api/accounts/${username}/snapshots?days=${days}`,
            );
            if (!res.ok) return [username, []] as [string, Snapshot[]];
            const json = await res.json();
            return [username, json.snapshots || []] as [string, Snapshot[]];
          } catch {
            return [username, []] as [string, Snapshot[]];
          }
        }),
      );
      setSnapshots(Object.fromEntries(entries));
    },
    [],
  );

  useEffect(() => {
    fetchGrowth();
  }, [fetchGrowth]);

  useEffect(() => {
    if (selectedAccounts.size > 0) {
      fetchSnapshots(Array.from(selectedAccounts), period);
    }
  }, [selectedAccounts, period, fetchSnapshots]);

  // ── Capturar snapshot agora ───────────────────────────────────────
  const handleSnapshotNow = async () => {
    try {
      setSnapshotting(true);
      await fetch(`${PROSPECTOR_API}/api/accounts/snapshot-all`, {
        method: "POST",
      });
      setLastCaptured(new Date().toLocaleTimeString("pt-BR"));
      await fetchGrowth();
      await fetchSnapshots(Array.from(selectedAccounts), period);
    } catch (err) {
      console.error("Erro ao capturar snapshot:", err);
    } finally {
      setSnapshotting(false);
    }
  };

  // ── Toggle conta selecionada ──────────────────────────────────────
  const toggleAccount = (username: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(username)) {
        if (next.size > 1) next.delete(username); // mínimo 1 conta
      } else {
        next.add(username);
      }
      return next;
    });
  };

  const activeUsernames = useMemo(
    () => Array.from(selectedAccounts),
    [selectedAccounts],
  );

  // ── Montar dados do gráfico ───────────────────────────────────────
  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    activeUsernames.forEach((username) => {
      (snapshots[username] || []).forEach((s) => {
        allDates.add(format(parseISO(s.captured_at), "dd/MM"));
      });
    });
    return Array.from(allDates)
      .sort()
      .map((date) => {
        const point: Record<string, string | number> = { date };
        activeUsernames.forEach((username) => {
          const snap = (snapshots[username] || []).find(
            (s) => format(parseISO(s.captured_at), "dd/MM") === date,
          );
          if (snap) point[username] = snap.followers;
        });
        return point;
      });
  }, [activeUsernames, snapshots]);

  // ── Summary totais ────────────────────────────────────────────────
  const totalFollowers = growth.reduce((s, a) => s + (a.followers || 0), 0);
  const totalDelta7d = growth.reduce((s, a) => s + (a.delta_7d ?? 0), 0);
  const totalDelta30d = growth.reduce((s, a) => s + (a.delta_30d ?? 0), 0);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e1306c]/10 border border-[#e1306c]/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-[#e1306c]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Crescimento Instagram
              </h1>
              <p className="text-sm text-[#8b949e] mt-0.5">
                Evolução de seguidores das contas de disparo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchGrowth}
              disabled={loading}
              className="p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition-colors disabled:opacity-50"
              title="Recarregar"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleSnapshotNow}
              disabled={snapshotting}
              className="flex items-center gap-2 px-4 py-2 bg-[#e1306c] hover:bg-[#e1306c]/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {snapshotting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Capturando...
                </>
              ) : (
                <>
                  <Camera size={15} /> Capturar Agora
                </>
              )}
            </button>
          </div>
        </div>

        {lastCaptured && (
          <p className="text-xs text-[#3fb950] flex items-center gap-1">
            ✓ Snapshot capturado às {lastCaptured}
          </p>
        )}

        {/* ── SUMMARY CARDS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Seguidores",
              value: fmtNumber(totalFollowers),
              icon: <Users size={16} />,
              color: "text-[#e1306c]",
            },
            {
              label: "Contas monitoradas",
              value: String(growth.length),
              icon: <Instagram size={16} />,
              color: "text-[#58a6ff]",
            },
            {
              label: "Delta 7 dias",
              value:
                totalDelta7d >= 0 ? `+${totalDelta7d}` : String(totalDelta7d),
              icon: <TrendingUp size={16} />,
              color: totalDelta7d >= 0 ? "text-[#3fb950]" : "text-[#ef4444]",
            },
            {
              label: "Delta 30 dias",
              value:
                totalDelta30d >= 0
                  ? `+${totalDelta30d}`
                  : String(totalDelta30d),
              icon: <BarChart2 size={16} />,
              color: totalDelta30d >= 0 ? "text-[#3fb950]" : "text-[#ef4444]",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            >
              <div className={`mb-2 ${s.color}`}>{s.icon}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#8b949e] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#58a6ff]" />
          </div>
        ) : growth.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
            <Camera size={40} className="text-[#30363d] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">
              Nenhum snapshot ainda
            </h3>
            <p className="text-sm text-[#8b949e] mb-4">
              Clique em <strong>"Capturar Agora"</strong> para registrar o
              primeiro snapshot de todas as contas ativas.
            </p>
          </div>
        ) : (
          <>
            {/* ── ACCOUNT CARDS ─────────────────────────────────── */}
            <section>
              <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserPlus size={14} />
                Contas ({growth.length}) — clique para filtrar no gráfico
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {growth.map((account, i) => (
                  <AccountCard
                    key={account.username}
                    account={account}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                    selected={selectedAccounts.has(account.username)}
                    onClick={() => toggleAccount(account.username)}
                  />
                ))}
              </div>
            </section>

            {/* ── GRÁFICO ───────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={14} />
                  Evolução de Seguidores
                </h2>
                {/* Period selector */}
                <div className="flex items-center gap-1">
                  {([7, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPeriod(d)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        period === d
                          ? "bg-[#58a6ff] text-white"
                          : "bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                {chartData.length < 2 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BarChart2 size={32} className="text-[#30363d] mb-3" />
                    <p className="text-sm text-[#8b949e]">
                      Dados insuficientes para o período selecionado.
                    </p>
                    <p className="text-xs text-[#8b949e] mt-1">
                      O gráfico aparece após 2 capturas. O job diário roda às
                      08:00 BRT.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                        axisLine={{ stroke: "#30363d" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={fmtNumber}
                        width={45}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-xs text-[#8b949e]">
                            @{value}
                          </span>
                        )}
                      />
                      {activeUsernames.map((username, i) => (
                        <Line
                          key={username}
                          type="monotone"
                          dataKey={username}
                          stroke={
                            CHART_COLORS[
                              growth.findIndex((a) => a.username === username) %
                                CHART_COLORS.length
                            ]
                          }
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* ── TABELA COMPARATIVA ────────────────────────────── */}
            <section>
              <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4">
                Comparativo entre contas
              </h2>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      {[
                        "Conta",
                        "Seguidores",
                        "Seguindo",
                        "Ratio",
                        "Δ 7 dias",
                        "Δ 30 dias",
                        "Posts",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {growth.map((a, i) => (
                      <tr
                        key={a.username}
                        className="border-b border-[#21262d] hover:bg-[#0d1117]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                            <span className="text-white font-medium">
                              @{a.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">
                          {fmtNumber(a.followers)}
                        </td>
                        <td className="px-4 py-3 text-[#8b949e]">
                          {fmtNumber(a.following)}
                        </td>
                        <td className="px-4 py-3 text-[#58a6ff]">
                          {a.follower_ratio !== null
                            ? `${a.follower_ratio}x`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <DeltaBadge value={a.delta_7d} />
                        </td>
                        <td className="px-4 py-3">
                          <DeltaBadge value={a.delta_30d} />
                        </td>
                        <td className="px-4 py-3 text-[#8b949e]">
                          {a.posts_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ProspectorIGGrowth;
