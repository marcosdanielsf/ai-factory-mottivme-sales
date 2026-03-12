import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getErrorMessage } from "../lib/getErrorMessage";

interface DateRange {
  start: string;
  end: string;
}

export interface LeadDistributionBucket {
  faixa: string;
  leads: number;
  avgCost: number;
  totalCost: number;
}

export interface LeadScatterPoint {
  contactId: string;
  contactName: string;
  locationName: string;
  chamadas: number;
  custoTotal: number;
}

export interface TopLead {
  contactId: string;
  contactName: string;
  locationName: string;
  chamadas: number;
  custoTotal: number;
  avgPerCall: number;
  diasAtivos: number;
  modos: string;
}

export interface LeadCostData {
  // KPIs
  avgCostPerLead: number;
  medianCalls: number;
  pctLeadsOver10: number;
  totalLeads: number;

  // Histograma
  distribution: LeadDistributionBucket[];

  // Scatter
  scatterData: LeadScatterPoint[];

  // Top leads
  topLeads: TopLead[];

  loading: boolean;
  error: string | null;
}

interface RawRow {
  contact_id: string | null;
  contact_name: string | null;
  location_name: string | null;
  custo_usd: string | number | null;
  agent_mode: string | null;
  created_at: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

const LOCATION_COLORS: Record<string, string> = {};
const PALETTE = [
  "#58a6ff",
  "#3fb950",
  "#f78166",
  "#d2a8ff",
  "#ffa657",
  "#79c0ff",
  "#56d364",
  "#ff7b72",
  "#e3b341",
  "#bc8cff",
  "#7ee787",
  "#ff9a1f",
];
let colorIndex = 0;
function getLocationColor(locationName: string): string {
  if (!LOCATION_COLORS[locationName]) {
    LOCATION_COLORS[locationName] = PALETTE[colorIndex % PALETTE.length];
    colorIndex++;
  }
  return LOCATION_COLORS[locationName];
}

export const useLeadCostAnalysis = (dateRange?: DateRange): LeadCostData => {
  const [data, setData] = useState<Omit<LeadCostData, "loading" | "error">>({
    avgCostPerLead: 0,
    medianCalls: 0,
    pctLeadsOver10: 0,
    totalLeads: 0,
    distribution: [],
    scatterData: [],
    topLeads: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase nao configurado");
      return;
    }
    if (!dateRange?.start || !dateRange?.end) return;

    setLoading(true);
    setError(null);

    try {
      // Paginar llm_costs em batches de 5000
      const BATCH = 5000;
      let allRows: RawRow[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: rows, error: qErr } = await supabase
          .from("llm_costs")
          .select(
            "contact_id, contact_name, location_name, custo_usd, agent_mode, created_at",
          )
          .gte("created_at", dateRange.start)
          .lte("created_at", dateRange.end)
          .not("contact_id", "is", null)
          .range(offset, offset + BATCH - 1);

        if (qErr) throw qErr;
        if (rows && rows.length > 0) {
          allRows = allRows.concat(rows as RawRow[]);
          offset += BATCH;
          hasMore = rows.length === BATCH;
        } else {
          hasMore = false;
        }
      }

      // Agregar por contact_id
      type LeadAgg = {
        contactId: string;
        contactName: string;
        locationName: string;
        chamadas: number;
        custoTotal: number;
        firstSeen: string;
        lastSeen: string;
        modos: Set<string>;
      };

      const leadMap = new Map<string, LeadAgg>();

      for (const row of allRows) {
        const cid = row.contact_id ?? "unknown";
        const prev = leadMap.get(cid);
        const cost = parseFloat(String(row.custo_usd)) || 0;
        const createdAt = row.created_at ?? "";

        if (!prev) {
          leadMap.set(cid, {
            contactId: cid,
            contactName: row.contact_name || "Desconhecido",
            locationName: row.location_name || "N/A",
            chamadas: 1,
            custoTotal: cost,
            firstSeen: createdAt,
            lastSeen: createdAt,
            modos: new Set(row.agent_mode ? [row.agent_mode] : []),
          });
        } else {
          prev.chamadas += 1;
          prev.custoTotal += cost;
          if (createdAt < prev.firstSeen) prev.firstSeen = createdAt;
          if (createdAt > prev.lastSeen) prev.lastSeen = createdAt;
          if (row.agent_mode) prev.modos.add(row.agent_mode);
        }
      }

      const leads = Array.from(leadMap.values());

      if (leads.length === 0) {
        setData({
          avgCostPerLead: 0,
          medianCalls: 0,
          pctLeadsOver10: 0,
          totalLeads: 0,
          distribution: [],
          scatterData: [],
          topLeads: [],
        });
        return;
      }

      // KPIs
      const totalCostAll = leads.reduce((s, l) => s + l.custoTotal, 0);
      const avgCostPerLead = totalCostAll / leads.length;
      const allChamadas = leads.map((l) => l.chamadas);
      const medianCalls = median(allChamadas);
      const over10 = leads.filter((l) => l.chamadas > 10).length;
      const pctLeadsOver10 = (over10 / leads.length) * 100;

      // Distribuicao por faixas
      const buckets: Record<string, { leads: LeadAgg[] }> = {
        "1-3": { leads: [] },
        "4-7": { leads: [] },
        "8-15": { leads: [] },
        "16+": { leads: [] },
      };

      for (const l of leads) {
        if (l.chamadas <= 3) buckets["1-3"].leads.push(l);
        else if (l.chamadas <= 7) buckets["4-7"].leads.push(l);
        else if (l.chamadas <= 15) buckets["8-15"].leads.push(l);
        else buckets["16+"].leads.push(l);
      }

      const distribution: LeadDistributionBucket[] = Object.entries(
        buckets,
      ).map(([faixa, { leads: bl }]) => {
        const totalCost = bl.reduce((s, l) => s + l.custoTotal, 0);
        const avgCost = bl.length > 0 ? totalCost / bl.length : 0;
        return {
          faixa,
          leads: bl.length,
          avgCost: Math.round(avgCost * 1e6) / 1e6,
          totalCost: Math.round(totalCost * 1e6) / 1e6,
        };
      });

      // Scatter data (limitar a 500 pontos para performance)
      const sortedForScatter = [...leads].sort(
        (a, b) => b.custoTotal - a.custoTotal,
      );
      const scatterSample =
        sortedForScatter.length > 500
          ? [
              ...sortedForScatter.slice(0, 200),
              ...sortedForScatter.slice(200).filter((_, i) => i % 3 === 0),
            ].slice(0, 500)
          : sortedForScatter;

      const scatterData: LeadScatterPoint[] = scatterSample.map((l) => ({
        contactId: l.contactId,
        contactName: l.contactName,
        locationName: l.locationName,
        chamadas: l.chamadas,
        custoTotal: Math.round(l.custoTotal * 1e6) / 1e6,
      }));

      // Top 15 leads mais caros
      const topLeads: TopLead[] = leads
        .sort((a, b) => b.custoTotal - a.custoTotal)
        .slice(0, 15)
        .map((l) => {
          const firstDate = new Date(l.firstSeen);
          const lastDate = new Date(l.lastSeen);
          const diasAtivos = Math.max(
            1,
            Math.ceil(
              (lastDate.getTime() - firstDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );
          return {
            contactId: l.contactId,
            contactName: l.contactName,
            locationName: l.locationName,
            chamadas: l.chamadas,
            custoTotal: Math.round(l.custoTotal * 1e6) / 1e6,
            avgPerCall:
              l.chamadas > 0
                ? Math.round((l.custoTotal / l.chamadas) * 1e6) / 1e6
                : 0,
            diasAtivos,
            modos: Array.from(l.modos).slice(0, 3).join(", ") || "N/A",
          };
        });

      setData({
        avgCostPerLead: Math.round(avgCostPerLead * 1e6) / 1e6,
        medianCalls: Math.round(medianCalls * 10) / 10,
        pctLeadsOver10: Math.round(pctLeadsOver10 * 10) / 10,
        totalLeads: leads.length,
        distribution,
        scatterData,
        topLeads,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateRange?.start, dateRange?.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, error };
};

export { getLocationColor };
