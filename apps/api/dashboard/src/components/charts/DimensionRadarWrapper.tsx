'use client'

import { AgentPerformanceRadar } from './AgentPerformanceRadar'

interface DimensionRadarWrapperProps {
  dimensions: Record<string, number>
  agentName: string
}

export function DimensionRadarWrapper({ dimensions, agentName }: DimensionRadarWrapperProps) {
  const radarData = Object.entries(dimensions).map(([dimension, score]) => ({
    dimension: dimension.charAt(0).toUpperCase() + dimension.slice(1),
    score: score,
    fullMark: 10
  }))

  return <AgentPerformanceRadar data={radarData} agentName={agentName} />
}
