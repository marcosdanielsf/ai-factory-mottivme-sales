// Views: vw_lead_funnel_e2e, vw_reply_rate_by_account, vw_cost_per_lead
import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAccountData } from "./useAccountData";
import { DateRange } from "../components/DateRangePicker";

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export interface IGFunnelStage {
  stage: string;
  count: number;
}

export interface IGReplyRateByAccount {
  approach_type: string;
  month: string;
  total_dms_sent: number;
  total_replied: number;
  total_scheduled: number;
  reply_rate_pct: number;
  schedule_rate_pct: number;
  avg_time_to_reply_hours: number;
  location_id?: string;
}

export interface IGCostPerLead {
  month: string;
  leads_contacted: number;
  leads_replied: number;
  leads_scheduled: number;
  total_ai_cost_usd: number;
  cost_per_lead_contacted_usd: number;
  cost_per_lead_replied_usd: number;
  cost_per_scheduled_usd: number;
  location_id?: string;
}

export interface IGLeadsByMonth {
  month: string; // "YYYY-MM"
  count: number;
}

export interface IGProspectorData {
  funnelStages: IGFunnelStage[];
  replyRates: IGReplyRateByAccount[];
  costPerLead: IGCostPerLead[];
  leadsByMonth: IGLeadsByMonth[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// Ordem canonica dos stages do funil
// ============================================================================
const STAGE_ORDER = [
  "prospected",
  "warming",
  "warm",
  "dm_ready",
  "first_contact",
  "replied",
  "won",
  "already_active",
  "lost",
];

// Helper: extrair "YYYY-MM-01" de uma Date (coluna month e tipo DATE, nao TEXT)
const toYearMonth = (d: Date): string => d.toISOString().slice(0, 7) + "-01";

// ============================================================================
// HOOK: useIGProspectorData
// Agrega dados das 3 views Supabase do Instagram Prospector para o dashboard.
// Filtra por activeLocationId quando disponivel (cliente ou admin vendo subconta).
// Usa Promise.allSettled para queries paralelas — falha parcial retorna dados parciais.
//
// IMPORTANTE: vw_lead_funnel_e2e retorna 1 linha por lead (nao agregada).
// O hook agrega em contagens por funnel_stage no frontend.
//
// Parametros opcionais (retroativamente compativel):
//   locationIdOverride — sobrescreve o activeLocationId do contexto
//   dateRange — filtra dados por periodo (FILT-02)
//   stageFilter — filtra funnelStages por stage especifico (FILT-03)
//   Polling automatico 30s sem interacao do usuario (DASH-03)
// ============================================================================

export function useIGProspectorData(
  locationIdOverride?: string | null,
  dateRange?: DateRange | null,
  stageFilter?: string | null,
): IGProspectorData {
  const { activeLocationId } = useAccountData();

  // Use override if explicitly provided (including null for "all"), otherwise fall back to context
  const effectiveLocationId =
    locationIdOverride !== undefined ? locationIdOverride : activeLocationId;

  const [funnelStages, setFunnelStages] = useState<IGFunnelStage[]>([]);
  const [replyRates, setReplyRates] = useState<IGReplyRateByAccount[]>([]);
  const [costPerLead, setCostPerLead] = useState<IGCostPerLead[]>([]);
  const [leadsByMonth, setLeadsByMonth] = useState<IGLeadsByMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Montar queries — adicionar filtro location_id quando effectiveLocationId estiver disponivel
    // NOTA: vw_lead_funnel_e2e retorna 1 row por lead (50k+).
    // Filtramos funnel_stage NOT NULL para pegar apenas leads no pipeline ativo.
    let funnelQuery = supabase
      .from("vw_lead_funnel_e2e")
      .select("funnel_stage, first_contact_at")
      .not("funnel_stage", "is", null);
    if (effectiveLocationId) {
      funnelQuery = funnelQuery.eq("location_id", effectiveLocationId);
    }
    // Aplicar filtro de data em vw_lead_funnel_e2e (coluna first_contact_at)
    if (dateRange?.startDate) {
      funnelQuery = funnelQuery.gte(
        "first_contact_at",
        dateRange.startDate.toISOString(),
      );
    }
    if (dateRange?.endDate) {
      funnelQuery = funnelQuery.lte(
        "first_contact_at",
        dateRange.endDate.toISOString(),
      );
    }

    // Montar replyRateQuery com suporte a filtro de data (coluna month)
    let replyRateQuery = effectiveLocationId
      ? supabase
          .from("vw_reply_rate_by_account")
          .select("*")
          .eq("location_id", effectiveLocationId)
      : supabase.from("vw_reply_rate_by_account").select("*");
    if (dateRange?.startDate) {
      replyRateQuery = replyRateQuery.gte(
        "month",
        toYearMonth(dateRange.startDate),
      );
    }
    if (dateRange?.endDate) {
      replyRateQuery = replyRateQuery.lte(
        "month",
        toYearMonth(dateRange.endDate),
      );
    }

    // Montar costQuery com suporte a filtro de data (coluna month)
    let costQuery = effectiveLocationId
      ? supabase
          .from("vw_cost_per_lead")
          .select("*")
          .eq("location_id", effectiveLocationId)
      : supabase.from("vw_cost_per_lead").select("*");
    if (dateRange?.startDate) {
      costQuery = costQuery.gte("month", toYearMonth(dateRange.startDate));
    }
    if (dateRange?.endDate) {
      costQuery = costQuery.lte("month", toYearMonth(dateRange.endDate));
    }

    // Executar 3 queries em paralelo — falha parcial nao bloqueia as demais
    const [funnelResult, replyRateResult, costResult] =
      await Promise.allSettled([funnelQuery, replyRateQuery, costQuery]);

    const errors: string[] = [];

    // Processar vw_lead_funnel_e2e — agregar por funnel_stage
    if (funnelResult.status === "fulfilled") {
      const { data, error: err } = funnelResult.value;
      if (err) {
        console.error("[useIGProspectorData] vw_lead_funnel_e2e error:", err);
        errors.push("vw_lead_funnel_e2e: " + err.message);
      } else {
        // Agregar: contar leads por funnel_stage
        const stageCounts: Record<string, number> = {};
        for (const row of data ?? []) {
          const stage = String(
            (row as Record<string, unknown>).funnel_stage ?? "unknown",
          );
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
        // Ordenar por STAGE_ORDER
        const mapped: IGFunnelStage[] = Object.entries(stageCounts)
          .sort(([a], [b]) => {
            const ia = STAGE_ORDER.indexOf(a);
            const ib = STAGE_ORDER.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          })
          .map(([stage, count]) => ({ stage, count }));
        // Aplicar stageFilter (FILT-03) — filtra stages exibidos no frontend
        const filtered = stageFilter
          ? mapped.filter((s) => s.stage === stageFilter)
          : mapped;
        setFunnelStages(filtered);

        // Agregar leadsByMonth — contar leads com first_contact_at por mes (YYYY-MM)
        const monthCounts: Record<string, number> = {};
        for (const row of data ?? []) {
          const rawDate = (row as Record<string, unknown>).first_contact_at;
          if (rawDate == null) continue;
          const month = String(rawDate).slice(0, 7); // "YYYY-MM"
          if (month.length !== 7) continue;
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        }
        const lbm: IGLeadsByMonth[] = Object.entries(monthCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }));
        setLeadsByMonth(lbm);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_lead_funnel_e2e fetch failed:",
        funnelResult.reason,
      );
      errors.push("vw_lead_funnel_e2e: fetch failed");
    }

    // Processar vw_reply_rate_by_account — campos reais da view
    if (replyRateResult.status === "fulfilled") {
      const { data, error: err } = replyRateResult.value;
      if (err) {
        console.error(
          "[useIGProspectorData] vw_reply_rate_by_account error:",
          err,
        );
        errors.push("vw_reply_rate_by_account: " + err.message);
      } else {
        const mapped: IGReplyRateByAccount[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            approach_type: String(row.approach_type ?? ""),
            month: String(row.month ?? ""),
            total_dms_sent: Number(row.total_dms_sent ?? 0),
            total_replied: Number(row.total_replied ?? 0),
            total_scheduled: Number(row.total_scheduled ?? 0),
            reply_rate_pct: Number(row.reply_rate_pct ?? 0),
            schedule_rate_pct: Number(row.schedule_rate_pct ?? 0),
            avg_time_to_reply_hours: Number(row.avg_time_to_reply_hours ?? 0),
            location_id:
              row.location_id != null ? String(row.location_id) : undefined,
          }),
        );
        setReplyRates(mapped);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_reply_rate_by_account fetch failed:",
        replyRateResult.reason,
      );
      errors.push("vw_reply_rate_by_account: fetch failed");
    }

    // Processar vw_cost_per_lead — campos reais da view
    if (costResult.status === "fulfilled") {
      const { data, error: err } = costResult.value;
      if (err) {
        console.error("[useIGProspectorData] vw_cost_per_lead error:", err);
        errors.push("vw_cost_per_lead: " + err.message);
      } else {
        const mapped: IGCostPerLead[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            month: String(row.month ?? ""),
            leads_contacted: Number(row.leads_contacted ?? 0),
            leads_replied: Number(row.leads_replied ?? 0),
            leads_scheduled: Number(row.leads_scheduled ?? 0),
            total_ai_cost_usd: Number(row.total_ai_cost_usd ?? 0),
            cost_per_lead_contacted_usd: Number(
              row.cost_per_lead_contacted_usd ?? 0,
            ),
            cost_per_lead_replied_usd: Number(
              row.cost_per_lead_replied_usd ?? 0,
            ),
            cost_per_scheduled_usd: Number(row.cost_per_scheduled_usd ?? 0),
            location_id:
              row.location_id != null ? String(row.location_id) : undefined,
          }),
        );
        setCostPerLead(mapped);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_cost_per_lead fetch failed:",
        costResult.reason,
      );
      errors.push("vw_cost_per_lead: fetch failed");
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
    }

    setLoading(false);
  }, [effectiveLocationId, dateRange, stageFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling automatico a cada 30s — DASH-03
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    funnelStages,
    replyRates,
    costPerLead,
    leadsByMonth,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// TIPOS — Lead List e Timeline (LEAD-01, LEAD-02, LEAD-03)
// ============================================================================

export interface IGLeadListItem {
  lead_id: string;
  instagram_username: string;
  location_id: string | null;
  funnel_stage: string;
  lead_score: number;
  first_contact_at: string | null;
  replied_at: string | null;
  scheduled_at: string | null;
  last_warmup_at: string | null;
  followup_count: number;
}

export interface IGTimelineEvent {
  id: string;
  event_type:
    | "like"
    | "comment"
    | "story_reply"
    | "story_view"
    | "dm"
    | "followup"
    | "reply"
    | "scheduled";
  timestamp: string; // ISO string
  notes: string | null;
  account_id: string | null;
}

// ============================================================================
// HOOK: useIGLeadList
// Lista paginada de leads da vw_lead_funnel_e2e — 20 por pagina.
// Filtros: locationId, stageFilter, dateRange (first_contact_at).
// Retorna: leads, total, loading, error, refetch.
// ============================================================================

export function useIGLeadList(
  locationId?: string | null,
  stageFilter?: string | null,
  dateRange?: DateRange | null,
  page?: number,
): {
  leads: IGLeadListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [leads, setLeads] = useState<IGLeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = page ?? 0;

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query principal — campos selecionados da view
    let dataQuery = supabase
      .from("vw_lead_funnel_e2e")
      .select(
        "lead_id, instagram_username, location_id, funnel_stage, lead_score, first_contact_at, replied_at, scheduled_at, last_warmup_at, followup_count",
      )
      .not("funnel_stage", "is", null)
      .order("first_contact_at", { ascending: false, nullsFirst: false })
      .range(currentPage * 20, currentPage * 20 + 19);

    // Query de contagem total — mesmos filtros, sem paginacao
    let countQuery = supabase
      .from("vw_lead_funnel_e2e")
      .select("*", { count: "exact", head: true })
      .not("funnel_stage", "is", null);

    // Aplicar filtros em ambas as queries
    if (locationId) {
      dataQuery = dataQuery.eq("location_id", locationId);
      countQuery = countQuery.eq("location_id", locationId);
    }
    if (stageFilter) {
      dataQuery = dataQuery.eq("funnel_stage", stageFilter);
      countQuery = countQuery.eq("funnel_stage", stageFilter);
    }
    if (dateRange?.startDate) {
      const iso = dateRange.startDate.toISOString();
      dataQuery = dataQuery.gte("first_contact_at", iso);
      countQuery = countQuery.gte("first_contact_at", iso);
    }
    if (dateRange?.endDate) {
      const iso = dateRange.endDate.toISOString();
      dataQuery = dataQuery.lte("first_contact_at", iso);
      countQuery = countQuery.lte("first_contact_at", iso);
    }

    const [dataResult, countResult] = await Promise.allSettled([
      dataQuery,
      countQuery,
    ]);

    const errors: string[] = [];

    if (dataResult.status === "fulfilled") {
      const { data, error: err } = dataResult.value;
      if (err) {
        console.error("[useIGLeadList] data query error:", err);
        errors.push("leads: " + err.message);
      } else {
        const mapped: IGLeadListItem[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            lead_id: String(row.lead_id ?? ""),
            instagram_username: String(row.instagram_username ?? ""),
            location_id:
              row.location_id != null ? String(row.location_id) : null,
            funnel_stage: String(row.funnel_stage ?? ""),
            lead_score: Number(row.lead_score ?? 0),
            first_contact_at:
              row.first_contact_at != null
                ? String(row.first_contact_at)
                : null,
            replied_at: row.replied_at != null ? String(row.replied_at) : null,
            scheduled_at:
              row.scheduled_at != null ? String(row.scheduled_at) : null,
            last_warmup_at:
              row.last_warmup_at != null ? String(row.last_warmup_at) : null,
            followup_count: Number(row.followup_count ?? 0),
          }),
        );
        setLeads(mapped);
      }
    } else {
      console.error("[useIGLeadList] data fetch failed:", dataResult.reason);
      errors.push("leads: fetch failed");
    }

    if (countResult.status === "fulfilled") {
      const { count, error: err } = countResult.value;
      if (err) {
        console.error("[useIGLeadList] count query error:", err);
      } else {
        setTotal(count ?? 0);
      }
    } else {
      console.error("[useIGLeadList] count fetch failed:", countResult.reason);
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
    }

    setLoading(false);
  }, [locationId, stageFilter, dateRange, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { leads, total, loading, error, refetch: fetchData };
}

// ============================================================================
// HOOK: useIGLeadTimeline
// Timeline cronologica de acoes de um lead especifico.
// Combina ig_warmup_log (warmup actions) + prospector_dm_logs (DMs enviados).
// Faz fallback gracioso se prospector_dm_logs nao existir (PGRST error).
// ============================================================================

export function useIGLeadTimeline(
  leadId: string | null,
  scheduledAt?: string | null,
): {
  events: IGTimelineEvent[];
  loading: boolean;
  error: string | null;
} {
  const [events, setEvents] = useState<IGTimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);

      // Query 1: ig_warmup_log — acoes de warm-up
      const warmupQuery = supabase
        .from("ig_warmup_log")
        .select("id, action_type, created_at, notes, account_id")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });

      // Query 2: prospector_dm_logs — DMs enviados (pode nao existir)
      const dmQuery = supabase
        .from("prospector_dm_logs")
        .select("id, message_type, sent_at, content, account_id")
        .eq("lead_id", leadId)
        .order("sent_at", { ascending: true });

      const [warmupResult, dmResult] = await Promise.allSettled([
        warmupQuery,
        dmQuery,
      ]);

      const allEvents: IGTimelineEvent[] = [];

      // Processar warmup logs
      if (warmupResult.status === "fulfilled") {
        const { data, error: err } = warmupResult.value;
        if (err) {
          console.error("[useIGLeadTimeline] ig_warmup_log error:", err);
          setError("warmup: " + err.message);
        } else {
          for (const row of data ?? []) {
            const r = row as Record<string, unknown>;
            const actionType = String(r.action_type ?? "like");
            const validWarmupTypes = [
              "like",
              "comment",
              "story_reply",
              "story_view",
            ] as const;
            const eventType = validWarmupTypes.includes(
              actionType as (typeof validWarmupTypes)[number],
            )
              ? (actionType as IGTimelineEvent["event_type"])
              : "like";

            allEvents.push({
              id: String(r.id ?? ""),
              event_type: eventType,
              timestamp: String(r.created_at ?? ""),
              notes: r.notes != null ? String(r.notes) : null,
              account_id: r.account_id != null ? String(r.account_id) : null,
            });
          }
        }
      } else {
        console.error(
          "[useIGLeadTimeline] ig_warmup_log fetch failed:",
          warmupResult.reason,
        );
      }

      // Processar DM logs — fallback gracioso se tabela nao existir
      if (dmResult.status === "fulfilled") {
        const { data, error: err } = dmResult.value;
        if (err) {
          // PGRST errors (tabela inexistente) -> ignorar silenciosamente
          const code = (err as unknown as Record<string, unknown>).code;
          if (
            code !== "42P01" &&
            !String(err.message).includes("does not exist")
          ) {
            console.error("[useIGLeadTimeline] prospector_dm_logs error:", err);
          }
        } else {
          for (const row of data ?? []) {
            const r = row as Record<string, unknown>;
            const msgType = String(r.message_type ?? "dm");
            const validDmTypes = ["dm", "followup", "reply"] as const;
            const eventType = validDmTypes.includes(
              msgType as (typeof validDmTypes)[number],
            )
              ? (msgType as IGTimelineEvent["event_type"])
              : "dm";

            allEvents.push({
              id: String(r.id ?? ""),
              event_type: eventType,
              timestamp: String(r.sent_at ?? ""),
              notes: r.content != null ? String(r.content) : null,
              account_id: r.account_id != null ? String(r.account_id) : null,
            });
          }
        }
      } else {
        // Tabela pode nao existir — fallback silencioso
        console.warn(
          "[useIGLeadTimeline] prospector_dm_logs unavailable (table may not exist)",
        );
      }

      // Adicionar evento sintetico de agendamento se scheduled_at disponivel
      if (scheduledAt) {
        allEvents.push({
          id: `scheduled-${leadId}`,
          event_type: "scheduled",
          timestamp: scheduledAt,
          notes: "Agendamento confirmado",
          account_id: null,
        });
      }

      // Ordenar por timestamp ASC
      allEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      setEvents(allEvents);
      setLoading(false);
    };

    fetchTimeline();
  }, [leadId, scheduledAt]);

  return { events, loading, error };
}

export default useIGProspectorData;
