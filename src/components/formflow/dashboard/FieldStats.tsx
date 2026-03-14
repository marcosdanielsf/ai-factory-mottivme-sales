import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type {
  Field,
  Submission,
  FieldValue,
} from "../../../lib/formflow/types";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const PALETTE = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#f472b6",
  "#60a5fa",
];

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ---------------------------------------------------------------------------
// Value extraction helpers
// ---------------------------------------------------------------------------

function getAnswers(submissions: Submission[], fieldId: string): FieldValue[] {
  return submissions
    .map((s) => s.answers[fieldId])
    .filter((v) => v !== null && v !== undefined);
}

function getStrings(submissions: Submission[], fieldId: string): string[] {
  return getAnswers(submissions, fieldId).filter(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );
}

function getNumbers(submissions: Submission[], fieldId: string): number[] {
  return getAnswers(submissions, fieldId).filter(
    (v): v is number => typeof v === "number",
  );
}

// ---------------------------------------------------------------------------
// Sub-components per field type
// ---------------------------------------------------------------------------

interface TooltipEntry {
  name: string;
  value: number;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipEntry & { percent?: number } }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="bg-surface-primary border border-border-primary rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-text-primary mb-1">{name}</p>
      <p className="text-text-muted">
        {value} resposta{value !== 1 ? "s" : ""}{" "}
        {percent !== undefined && `(${(percent * 100).toFixed(1)}%)`}
      </p>
    </div>
  );
}

// Choice / yes_no distribution
function ChoiceDistribution({
  submissions,
  field,
}: {
  submissions: Submission[];
  field: Field;
}) {
  const answers = getAnswers(submissions, field.id);
  if (answers.length === 0) {
    return <EmptyFieldState />;
  }

  // Build count map
  const counts: Record<string, number> = {};
  for (const val of answers) {
    if (Array.isArray(val)) {
      for (const v of val) counts[v] = (counts[v] ?? 0) + 1;
    } else if (typeof val === "boolean") {
      const key = val ? "Sim" : "Não";
      counts[key] = (counts[key] ?? 0) + 1;
    } else if (typeof val === "string") {
      counts[val] = (counts[val] ?? 0) + 1;
    }
  }

  // Map choice IDs to labels when choices available
  const choiceMap: Record<string, string> = {};
  for (const c of field.properties.choices ?? []) {
    choiceMap[c.value] = c.label;
    choiceMap[c.id] = c.label;
  }

  const data = Object.entries(counts)
    .map(([key, count]) => ({
      name: choiceMap[key] ?? key,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-1.5 w-full">
        {data.map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span
                  className="text-text-primary truncate max-w-[130px]"
                  title={item.name}
                >
                  {item.name}
                </span>
                <span className="text-text-muted ml-2 shrink-0">
                  {item.value} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Rating / scale distribution
function RatingDistribution({
  submissions,
  field,
}: {
  submissions: Submission[];
  field: Field;
}) {
  const nums = getNumbers(submissions, field.id);
  if (nums.length === 0) return <EmptyFieldState />;

  const min = field.properties.min ?? 1;
  const max = field.properties.max ?? 5;
  const counts: Record<number, number> = {};
  for (let i = min; i <= max; i++) counts[i] = 0;
  for (const n of nums) counts[n] = (counts[n] ?? 0) + 1;

  const data = Object.entries(counts).map(([k, v]) => ({
    label: String(k),
    count: v,
  }));

  const avg = average(nums);
  const med = median(nums);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
          <span className="text-text-muted">Média </span>
          <span className="font-semibold text-text-primary">
            {avg.toFixed(1)}
          </span>
        </div>
        <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
          <span className="text-text-muted">Mediana </span>
          <span className="font-semibold text-text-primary">{med}</span>
        </div>
        <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
          <span className="text-text-muted">Respostas </span>
          <span className="font-semibold text-text-primary">{nums.length}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-primary, #1a1a2e)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar
            dataKey="count"
            fill="#6366f1"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Text fields — unique count + sample values
function TextSummary({
  submissions,
  field,
}: {
  submissions: Submission[];
  field: Field;
}) {
  const strings = getStrings(submissions, field.id);
  if (strings.length === 0) return <EmptyFieldState />;

  const unique = new Set(strings.map((s) => s.toLowerCase().trim())).size;
  const sample = strings.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs">
        <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
          <span className="text-text-muted">Respostas </span>
          <span className="font-semibold text-text-primary">
            {strings.length}
          </span>
        </div>
        <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
          <span className="text-text-muted">Únicas </span>
          <span className="font-semibold text-text-primary">{unique}</span>
        </div>
      </div>
      <div className="space-y-1">
        {sample.map((s, i) => (
          <p
            key={i}
            className="text-xs text-text-muted bg-surface-secondary rounded px-2 py-1.5 truncate"
            title={s}
          >
            {s}
          </p>
        ))}
        {strings.length > 5 && (
          <p className="text-xs text-text-muted px-2">
            + {strings.length - 5} outras respostas
          </p>
        )}
      </div>
    </div>
  );
}

// Date range
function DateSummary({
  submissions,
  field,
}: {
  submissions: Submission[];
  field: Field;
}) {
  const dates = getStrings(submissions, field.id)
    .map((s) => new Date(s))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return <EmptyFieldState />;

  const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR").format(d);

  return (
    <div className="flex items-center gap-3 text-xs flex-wrap">
      <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
        <span className="text-text-muted">Mais antiga </span>
        <span className="font-semibold text-text-primary">{fmt(dates[0])}</span>
      </div>
      <div className="text-text-muted">→</div>
      <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
        <span className="text-text-muted">Mais recente </span>
        <span className="font-semibold text-text-primary">
          {fmt(dates[dates.length - 1])}
        </span>
      </div>
      <div className="bg-surface-secondary rounded-lg px-3 py-1.5">
        <span className="text-text-muted">Total </span>
        <span className="font-semibold text-text-primary">{dates.length}</span>
      </div>
    </div>
  );
}

// File upload count
function FileUploadSummary({
  submissions,
  field,
}: {
  submissions: Submission[];
  field: Field;
}) {
  const count = getAnswers(submissions, field.id).filter(
    (v) => v !== null && v !== undefined && v !== "",
  ).length;

  return (
    <div className="text-xs">
      <div className="bg-surface-secondary rounded-lg px-3 py-1.5 inline-flex gap-1">
        <span className="text-text-muted">Uploads realizados</span>
        <span className="font-semibold text-text-primary">{count}</span>
      </div>
    </div>
  );
}

function EmptyFieldState() {
  return (
    <p className="text-xs text-text-muted italic py-2">
      Nenhuma resposta para este campo ainda.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Field card
// ---------------------------------------------------------------------------

function FieldCard({
  field,
  submissions,
}: {
  field: Field;
  submissions: Submission[];
}) {
  const KIND_LABEL: Record<string, string> = {
    short_text: "Texto curto",
    long_text: "Texto longo",
    email: "Email",
    phone: "Telefone",
    single_choice: "Escolha única",
    multiple_choice: "Múltipla escolha",
    yes_no: "Sim/Não",
    rating: "Avaliação",
    scale: "Escala",
    date: "Data",
    file_upload: "Upload",
    statement: "Enunciado",
  };

  function renderContent() {
    switch (field.type) {
      case "single_choice":
      case "multiple_choice":
      case "yes_no":
        return <ChoiceDistribution submissions={submissions} field={field} />;

      case "rating":
      case "scale":
        return <RatingDistribution submissions={submissions} field={field} />;

      case "short_text":
      case "long_text":
      case "email":
      case "phone":
        return <TextSummary submissions={submissions} field={field} />;

      case "date":
        return <DateSummary submissions={submissions} field={field} />;

      case "file_upload":
        return <FileUploadSummary submissions={submissions} field={field} />;

      case "statement":
        return (
          <p className="text-xs text-text-muted italic">
            Enunciados não coletam dados.
          </p>
        );

      default:
        return <EmptyFieldState />;
    }
  }

  return (
    <div className="bg-surface-primary border border-border-primary rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug">
            {field.title}
          </p>
        </div>
        <span className="text-[10px] font-medium text-text-muted bg-surface-secondary border border-border-primary rounded px-1.5 py-0.5 shrink-0">
          {KIND_LABEL[field.type] ?? field.type}
        </span>
      </div>
      {renderContent()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface FieldStatsProps {
  fields: Field[];
  submissions: Submission[];
}

export function FieldStats({ fields, submissions }: FieldStatsProps) {
  const visibleFields = fields.filter((f) => f.type !== "statement");

  if (visibleFields.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted text-sm">
        Nenhum campo com dados para exibir.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visibleFields.map((field) => (
        <FieldCard key={field.id} field={field} submissions={submissions} />
      ))}
    </div>
  );
}
