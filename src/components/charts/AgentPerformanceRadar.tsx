import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

interface DimensionScore {
  dimension: string
  score: number
  fullMark: number
}

interface AgentPerformanceRadarProps {
  data: DimensionScore[]
  agentName?: string
}

export function AgentPerformanceRadar({ data, agentName }: AgentPerformanceRadarProps) {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="dimension"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            stroke="#6b7280"
            fontSize={10}
          />
          <Radar
            name={agentName || 'Performance'}
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
