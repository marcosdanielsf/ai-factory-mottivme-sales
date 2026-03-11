import React from 'react';

interface SparklineCellProps {
  data: number[];
  color?: string;
}

export const SparklineCell: React.FC<SparklineCellProps> = ({
  data,
  color = '#3b82f6',
}) => {
  const WIDTH = 64;
  const HEIGHT = 28;

  if (!data || data.length < 2) {
    return <span className="text-text-muted text-xs">—</span>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const innerH = HEIGHT - padding * 2;
  const innerW = WIDTH - padding * 2;
  const step = innerW / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: padding + i * step,
    y: padding + innerH - ((v - min) / range) * innerH,
  }));

  const polylinePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Build area path: line down the points then back along the bottom
  const areaPath = [
    `M ${pts[0].x.toFixed(1)},${(padding + innerH).toFixed(1)}`,
    ...pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `L ${pts[pts.length - 1].x.toFixed(1)},${(padding + innerH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const isUp = last >= prev;
  const strokeColor = isUp ? color : '#f87171';

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Area fill */}
      <path d={areaPath} fill={strokeColor} fillOpacity={0.12} />
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={pts[pts.length - 1].x.toFixed(1)}
        cy={pts[pts.length - 1].y.toFixed(1)}
        r={2}
        fill={strokeColor}
      />
    </svg>
  );
};
