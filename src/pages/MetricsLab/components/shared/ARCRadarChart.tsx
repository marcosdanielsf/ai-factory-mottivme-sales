import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from 'recharts';

interface ARCRadarChartProps {
  hookRate: number;
  holdRate: number;
  bodyRate: number;
}

// Benchmarks: Hook >= 30%, Hold >= 2.5%, Body >= 2.5%
// Normalize to 0-100 scale for radar display
const normalize = (value: number, max: number): number =>
  Math.min((value / max) * 100, 100);

export const ARCRadarChart: React.FC<ARCRadarChartProps> = ({
  hookRate,
  holdRate,
  bodyRate,
}) => {
  const HOOK_MAX = 60;
  const HOLD_MAX = 6;
  const BODY_MAX = 6;

  const data = [
    {
      subject: 'Hook',
      value: normalize(hookRate, HOOK_MAX),
      benchmark: normalize(30, HOOK_MAX),
    },
    {
      subject: 'Hold',
      value: normalize(holdRate, HOLD_MAX),
      benchmark: normalize(2.5, HOLD_MAX),
    },
    {
      subject: 'Body',
      value: normalize(bodyRate, BODY_MAX),
      benchmark: normalize(2.5, BODY_MAX),
    },
  ];

  return (
    <RadarChart
      width={200}
      height={200}
      data={data}
      margin={{ top: 12, right: 24, bottom: 12, left: 24 }}
    >
      <PolarGrid stroke="rgba(255,255,255,0.08)" />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fontSize: 10, fill: '#888', fontWeight: 500 }}
        tickLine={false}
      />
      {/* Benchmark reference */}
      <Radar
        name="Benchmark"
        dataKey="benchmark"
        stroke="rgba(251,191,36,0.35)"
        fill="rgba(251,191,36,0.06)"
        strokeWidth={1}
        strokeDasharray="3 3"
        dot={false}
      />
      {/* Actual values */}
      <Radar
        name="ARC"
        dataKey="value"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.2}
        strokeWidth={2}
        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
      />
      <Tooltip
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const subject = payload[0]?.payload?.subject as string;
          const raw =
            subject === 'Hook'
              ? hookRate
              : subject === 'Hold'
              ? holdRate
              : bodyRate;
          const bench =
            subject === 'Hook' ? 30 : 2.5;
          return (
            <div className="bg-bg-secondary border border-border-default rounded px-2 py-1.5 shadow-lg text-xs">
              <p className="text-text-primary font-semibold mb-0.5">{subject} Rate</p>
              <p className="text-blue-400">
                Atual: <span className="font-medium">{raw.toFixed(1)}%</span>
              </p>
              <p className="text-amber-400/70">
                Meta: <span className="font-medium">{bench}%</span>
              </p>
            </div>
          );
        }}
      />
    </RadarChart>
  );
};
