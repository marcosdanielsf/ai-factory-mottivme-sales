'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Target, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import {
  fetchDashboardStats,
  fetchScoreHistory,
  fetchRecentAgents,
  fetchAllAgents,
  mapAgentToLegacyFormat,
  type DashboardStats,
  type ScoreHistory,
} from '@/lib/supabaseData'
import type { AgentPerformanceSummary } from '@/types/database'
import { ScoreAreaChart, ConversionBarChart } from '@/components/charts'

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([])
  const [recentAgents, setRecentAgents] = useState<AgentPerformanceSummary[]>([])
  const [allAgents, setAllAgents] = useState<AgentPerformanceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [statsData, historyData, agentsData, allAgentsData] = await Promise.all([
          fetchDashboardStats(),
          fetchScoreHistory(),
          fetchRecentAgents(5),
          fetchAllAgents(),
        ])

        setStats(statsData)
        setScoreHistory(historyData)
        setRecentAgents(agentsData)
        setAllAgents(allAgentsData)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Activity className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor your AI agents performance and testing metrics (Live Data from Supabase)
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                From tested agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Run</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.testsRun}</div>
              <p className="text-xs text-muted-foreground">
                Total test executions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate}%</div>
              <p className="text-xs text-muted-foreground">
                Agents scoring ≥8.0
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score History Chart - Recharts AreaChart */}
        {scoreHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Scores</CardTitle>
              <CardDescription>Média de scores dos agentes ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreAreaChart data={scoreHistory} />
            </CardContent>
          </Card>
        )}

        {/* Agent Performance Comparison - Recharts BarChart */}
        {allAgents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance por Agente</CardTitle>
              <CardDescription>Comparação de scores entre agentes</CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionBarChart
                data={allAgents.map(agent => ({
                  name: agent.agent_name.length > 15
                    ? agent.agent_name.substring(0, 15) + '...'
                    : agent.agent_name,
                  score: agent.last_test_score || 0,
                  testsRun: agent.total_test_runs || 0
                }))}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Agents */}
      {recentAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Agents Tested</CardTitle>
            <CardDescription>Latest evaluations across all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAgents.map((agent) => {
                const legacyAgent = mapAgentToLegacyFormat(agent)
                return (
                  <Link
                    key={agent.agent_version_id}
                    href={`/agents/${agent.agent_version_id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{agent.agent_name}</h3>
                        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                        {agent.framework_approved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Framework Approved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        v{agent.version} • Last tested {agent.last_test_at ? new Date(agent.last_test_at).toLocaleDateString() : 'Never'}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Conversations (7d): {agent.conversas_7d}</span>
                        <span>Resolved: {agent.resolvidas_7d}</span>
                        <span>Escalations: {agent.escalations_7d}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${
                        (agent.last_test_score || 0) >= 8 ? 'text-green-600' :
                        (agent.last_test_score || 0) >= 6 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {agent.last_test_score?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recentAgents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Start by creating and testing your first AI agent to see performance metrics here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
