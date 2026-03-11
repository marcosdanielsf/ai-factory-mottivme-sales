import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { TrendingUp, Zap, Brain, Users, BarChart3, RefreshCw } from 'lucide-react'

interface EvolutionData {
  date: string
  displayDate: string
  pnl: number
  neurovendas: number
  pessoas: number
  media: number
  versionBefore: string
  versionAfter: string
}

interface AgentEvolutionChartProps {
  locationId?: string
  limit?: number
}

const SCORE_COLORS = {
  pnl: '#3b82f6',
  neurovendas: '#10b981',
  pessoas: '#f97316',
  media: '#8b5cf6'
}

const SCORE_LABELS = {
  pnl: 'PNL',
  neurovendas: 'Neurovendas',
  pessoas: 'Pessoas',
  media: 'Media'
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 shadow-xl">
      <p className="text-text-secondary text-sm font-medium mb-3 border-b border-border-default pb-2">
        {data.displayDate}
      </p>

      <div className="space-y-2 mb-3">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-muted text-sm">
                {SCORE_LABELS[entry.dataKey as keyof typeof SCORE_LABELS]}
              </span>
            </div>
            <span className="text-text-primary font-bold tabular-nums">
              {entry.value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-border-default pt-3 mt-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Versao:</span>
          <span className="text-text-secondary font-mono">{data.versionBefore}</span>
          <span className="text-accent-primary">→</span>
          <span className="text-accent-primary font-mono font-semibold">{data.versionAfter}</span>
        </div>
      </div>
    </div>
  )
}

interface ScoreIndicatorProps {
  label: string
  value: number
  color: string
  icon: React.ReactNode
  trend?: number
}

function ScoreIndicator({ label, value, color, icon, trend }: ScoreIndicatorProps) {
  const trendColor = trend && trend > 0 ? 'text-accent-success' : trend && trend < 0 ? 'text-accent-error' : 'text-text-muted'

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 hover:border-border-hover transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-sm font-medium">{label}</span>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-text-primary tabular-nums">{value.toFixed(0)}</span>
        <span className="text-text-muted text-sm mb-1">/100</span>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
          <span className="text-text-muted ml-1">vs anterior</span>
        </div>
      )}
      <div className="mt-3 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}

export function AgentEvolutionChart({ locationId, limit = 30 }: AgentEvolutionChartProps) {
  const [data, setData] = useState<EvolutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleLines, setVisibleLines] = useState({
    pnl: true,
    neurovendas: true,
    pessoas: true,
    media: true
  })

  const fetchEvolutionData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('agent_improvement_logs')
        .select('execution_date, score_pnl, score_neurovendas, score_pessoas, score_media, version_before, version_after')
        .order('execution_date', { ascending: true })
        .limit(limit)

      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data: logs, error: fetchError } = await query

      if (fetchError) throw fetchError

      const formattedData: EvolutionData[] = (logs || []).map((log) => ({
        date: log.execution_date,
        displayDate: new Date(log.execution_date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }),
        pnl: log.score_pnl || 0,
        neurovendas: log.score_neurovendas || 0,
        pessoas: log.score_pessoas || 0,
        media: log.score_media || 0,
        versionBefore: log.version_before || 'N/A',
        versionAfter: log.version_after || 'N/A'
      }))

      setData(formattedData)
    } catch (err) {
      console.error('Erro ao buscar dados de evolucao:', err)
      setError('Falha ao carregar dados de evolucao do agente')
    } finally {
      setLoading(false)
    }
  }, [locationId, limit])

  useEffect(() => {
    fetchEvolutionData()
  }, [fetchEvolutionData])

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const latestData = data[data.length - 1]
  const previousData = data[data.length - 2]

  const calculateTrend = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-8">
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
            <p className="text-text-muted text-sm">Carregando evolucao do agente...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-bg-secondary border border-accent-error/50 rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center h-[400px] text-center">
          <Zap className="w-12 h-12 text-accent-error mb-4" />
          <p className="text-accent-error font-medium mb-2">{error}</p>
          <button
            onClick={fetchEvolutionData}
            className="mt-4 px-4 py-2 bg-accent-error/10 hover:bg-accent-error/20 text-accent-error rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center h-[400px] text-center">
          <BarChart3 className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-secondary font-medium mb-2">Nenhum dado de evolucao encontrado</p>
          <p className="text-text-muted text-sm">Os dados aparecerao apos as primeiras execucoes do Improver.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-primary/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Evolucao do Agente SDR</h2>
              <p className="text-text-muted text-sm mt-0.5">
                Performance ao longo de {data.length} execucoes
              </p>
            </div>
          </div>
          <button
            onClick={fetchEvolutionData}
            className="p-2 bg-bg-hover hover:bg-bg-tertiary rounded-lg transition-colors text-text-muted hover:text-text-primary"
            title="Atualizar dados"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Score Indicators */}
      {latestData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-border-default">
          <ScoreIndicator
            label="PNL"
            value={latestData.pnl}
            color={SCORE_COLORS.pnl}
            icon={<Brain className="w-4 h-4" style={{ color: SCORE_COLORS.pnl }} />}
            trend={previousData ? calculateTrend(latestData.pnl, previousData.pnl) : undefined}
          />
          <ScoreIndicator
            label="Neurovendas"
            value={latestData.neurovendas}
            color={SCORE_COLORS.neurovendas}
            icon={<Zap className="w-4 h-4" style={{ color: SCORE_COLORS.neurovendas }} />}
            trend={previousData ? calculateTrend(latestData.neurovendas, previousData.neurovendas) : undefined}
          />
          <ScoreIndicator
            label="Pessoas"
            value={latestData.pessoas}
            color={SCORE_COLORS.pessoas}
            icon={<Users className="w-4 h-4" style={{ color: SCORE_COLORS.pessoas }} />}
            trend={previousData ? calculateTrend(latestData.pessoas, previousData.pessoas) : undefined}
          />
          <ScoreIndicator
            label="Media Geral"
            value={latestData.media}
            color={SCORE_COLORS.media}
            icon={<BarChart3 className="w-4 h-4" style={{ color: SCORE_COLORS.media }} />}
            trend={previousData ? calculateTrend(latestData.media, previousData.media) : undefined}
          />
        </div>
      )}

      {/* Chart */}
      <div className="p-6">
        {/* Legend Toggles */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {(Object.keys(SCORE_COLORS) as Array<keyof typeof SCORE_COLORS>).map((key) => (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                visibleLines[key]
                  ? 'bg-bg-hover text-text-primary'
                  : 'bg-bg-tertiary/30 text-text-muted'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full transition-opacity ${
                  visibleLines[key] ? 'opacity-100' : 'opacity-30'
                }`}
                style={{ backgroundColor: SCORE_COLORS[key] }}
              />
              <span className="text-sm font-medium">
                {SCORE_LABELS[key]}
              </span>
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border-default)' }}
              axisLine={{ stroke: 'var(--border-default)' }}
            />

            <YAxis
              domain={[0, 100]}
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border-default)' }}
              axisLine={{ stroke: 'var(--border-default)' }}
              ticks={[0, 25, 50, 75, 100]}
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" strokeOpacity={0.3} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.3} />

            {visibleLines.pnl && (
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={SCORE_COLORS.pnl}
                strokeWidth={2.5}
                dot={{ fill: SCORE_COLORS.pnl, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: SCORE_COLORS.pnl, strokeWidth: 2 }}
              />
            )}

            {visibleLines.neurovendas && (
              <Line
                type="monotone"
                dataKey="neurovendas"
                stroke={SCORE_COLORS.neurovendas}
                strokeWidth={2.5}
                dot={{ fill: SCORE_COLORS.neurovendas, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: SCORE_COLORS.neurovendas, strokeWidth: 2 }}
              />
            )}

            {visibleLines.pessoas && (
              <Line
                type="monotone"
                dataKey="pessoas"
                stroke={SCORE_COLORS.pessoas}
                strokeWidth={2.5}
                dot={{ fill: SCORE_COLORS.pessoas, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: SCORE_COLORS.pessoas, strokeWidth: 2 }}
              />
            )}

            {visibleLines.media && (
              <Line
                type="monotone"
                dataKey="media"
                stroke={SCORE_COLORS.media}
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ fill: SCORE_COLORS.media, strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7, stroke: SCORE_COLORS.media, strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Version History */}
        {latestData && (
          <div className="mt-6 pt-6 border-t border-border-default">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-muted">
                <span className="font-medium">Versao atual:</span>
                <code className="px-2 py-1 bg-accent-primary/10 text-accent-primary rounded font-mono">
                  {latestData.versionAfter}
                </code>
              </div>
              <div className="text-text-muted">
                Ultima execucao: {latestData.displayDate}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentEvolutionChart
