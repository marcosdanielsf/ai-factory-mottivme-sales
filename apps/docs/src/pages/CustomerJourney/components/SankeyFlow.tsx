"use client";
import { Sankey, Tooltip, Layer, Rectangle } from "recharts";
import { useCjmSankeyFlow } from "../../../hooks/useCjmSankeyFlow";

interface SankeyFlowProps {
  pipelineId?: string;
}

const NODE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#818cf8",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#f97316",
  "#facc15",
];

interface CustomNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name: string };
}

const CustomNode = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  payload,
}: CustomNodeProps) => {
  const color = NODE_COLORS[index % NODE_COLORS.length];
  const labelX = x + width + 6;
  const labelY = y + height / 2;

  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.9}
        radius={3}
      />
      <text
        x={labelX}
        y={labelY}
        dy="0.35em"
        fontSize={11}
        fill="var(--color-text-muted, #9ca3af)"
        textAnchor="start"
      >
        {payload?.name ?? ""}
      </text>
    </Layer>
  );
};

interface CustomLinkProps {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  index?: number;
  payload?: {
    source: { name: string };
    target: { name: string };
    value: number;
  };
}

const CustomLink = ({
  sourceX = 0,
  targetX = 0,
  sourceY = 0,
  targetY = 0,
  sourceControlX = 0,
  targetControlX = 0,
  linkWidth = 0,
  index = 0,
}: CustomLinkProps) => {
  const gradientId = `sankey-link-${index}`;
  const sourceColor = NODE_COLORS[index % NODE_COLORS.length];

  return (
    <Layer key={`link-${index}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={sourceColor} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY - linkWidth / 2}
          C${sourceControlX},${sourceY - linkWidth / 2}
            ${targetControlX},${targetY - linkWidth / 2}
            ${targetX},${targetY - linkWidth / 2}
          L${targetX},${targetY + linkWidth / 2}
          C${targetControlX},${targetY + linkWidth / 2}
            ${sourceControlX},${sourceY + linkWidth / 2}
            ${sourceX},${sourceY + linkWidth / 2}
          Z
        `}
        fill={`url(#${gradientId})`}
        stroke={sourceColor}
        strokeOpacity={0.2}
        strokeWidth={1}
      />
    </Layer>
  );
};

const SANKEY_WIDTH = 700;

const SankeyFlow = ({ pipelineId }: SankeyFlowProps) => {
  const { sankeyData, loading, error } = useCjmSankeyFlow(pipelineId);

  if (loading) {
    return (
      <div className="h-[400px] rounded-lg bg-bg-secondary animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="h-24 flex items-center justify-center rounded-lg bg-bg-secondary text-red-400 text-sm">
        Erro ao carregar fluxo: {error}
      </div>
    );
  }

  const totalFlow = sankeyData.links.reduce((sum, l) => sum + l.value, 0);

  if (totalFlow < 30) {
    return (
      <div className="h-24 flex items-center justify-center rounded-lg bg-bg-secondary text-text-muted text-sm">
        Coletando dados... (minimo 30 transicoes para gerar fluxo — atual:{" "}
        {totalFlow})
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-bg-secondary p-4">
      <Sankey
        width={SANKEY_WIDTH}
        height={400}
        data={sankeyData}
        nodePadding={24}
        nodeWidth={14}
        margin={{ top: 8, right: 140, bottom: 8, left: 8 }}
        node={<CustomNode />}
        link={<CustomLink />}
      >
        <Tooltip
          contentStyle={{
            background: "var(--color-bg-secondary, #1e1e2e)",
            border: "1px solid var(--color-border-default, #374151)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-text-primary, #f9fafb)",
          }}
          formatter={(
            value: number,
            _name: string,
            props: {
              payload?: {
                source?: { name: string };
                target?: { name: string };
              };
            },
          ) => {
            const source = props?.payload?.source?.name ?? "";
            const target = props?.payload?.target?.name ?? "";
            return [`${source} → ${target}: ${value} leads`, ""];
          }}
        />
      </Sankey>
    </div>
  );
};

export default SankeyFlow;
