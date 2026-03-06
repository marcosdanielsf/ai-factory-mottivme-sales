import { useState, useEffect, useMemo, useCallback } from "react";
import { ghlClient } from "../../services/ghl/ghlClient";
import type {
  GHLPipeline,
  GHLOpportunity,
  GHLEvent,
} from "../../services/ghl/ghlTypes";
import { useAuth } from "../../contexts/AuthContext";

const STAGNATION_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface StageMetric {
  stageId: string;
  stageName: string;
  count: number;
  totalValue: number;
}

export interface SalesDashboardKPIs {
  totalValue: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
  avgCycleTimeDays: number;
  stagnatedCount: number;
}

export interface ShowRateData {
  total: number;
  showed: number;
  noShow: number;
  cancelled: number;
  confirmed: number;
  rate: number;
}

export interface StagnatedOpp {
  id: string;
  name: string;
  stageName: string;
  daysSinceChange: number;
  monetaryValue: number;
}

interface UseGHLSalesDashboardProps {
  locationId: string;
  selectedPipelineId?: string;
}

export function useGHLSalesDashboard({
  locationId,
  selectedPipelineId,
}: UseGHLSalesDashboardProps) {
  const { session } = useAuth();
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<GHLOpportunity[]>(
    [],
  );
  const [events, setEvents] = useState<GHLEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!session?.access_token || !locationId) return;

    const controller = new AbortController();
    const token = session.access_token;
    const signal = controller.signal;

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

      // Fetch pipelines primeiro — se falhar, nada funciona
      let pipelinesData: GHLPipeline[] = [];
      try {
        const pipelinesRes = await ghlClient.getPipelines(
          locationId,
          token,
          signal,
        );
        pipelinesData = pipelinesRes.pipelines || [];
      } catch (err) {
        console.warn("[GHL Dashboard] Pipelines fetch failed:", err);
      }

      // Fetch opportunities por status — cada um independente
      const fetchOpps = async (status: string) => {
        try {
          const res = await ghlClient.getOpportunities(
            { locationId, status, limit: 100 },
            token,
            signal,
          );
          return res.opportunities || [];
        } catch (err) {
          console.warn(
            `[GHL Dashboard] Opportunities (${status}) fetch failed:`,
            err,
          );
          return [];
        }
      };

      const [oppsOpen, oppsWon, oppsLost] = await Promise.all([
        fetchOpps("open"),
        fetchOpps("won"),
        fetchOpps("lost"),
      ]);

      setPipelines(pipelinesData);
      setAllOpportunities([...oppsOpen, ...oppsWon, ...oppsLost]);

      // Events fetch separado — GHL exige calendarId, pode falhar
      try {
        const eventsRes = await ghlClient.getEvents(
          {
            locationId,
            startTime: thirtyDaysAgo.getTime().toString(),
            endTime: now.getTime().toString(),
          },
          token,
          signal,
        );
        setEvents(eventsRes.events || []);
      } catch {
        setEvents([]);
      }

      // Se nenhum dado veio, avisar
      if (
        pipelinesData.length === 0 &&
        oppsOpen.length === 0 &&
        oppsWon.length === 0 &&
        oppsLost.length === 0
      ) {
        setError(
          "Nenhum dado retornado — verifique se o PIT desta location tem scope de pipelines/opportunities",
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Error fetching sales dashboard:", err);
      setError("Falha ao carregar dados do GHL");
    } finally {
      setLoading(false);
    }
  }, [locationId, session?.access_token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const opportunities = useMemo(() => {
    if (!selectedPipelineId) return allOpportunities;
    return allOpportunities.filter((o) => o.pipelineId === selectedPipelineId);
  }, [allOpportunities, selectedPipelineId]);

  const stageNameMap = useMemo(() => {
    const map = new Map<string, string>();
    pipelines.forEach((p) => p.stages.forEach((s) => map.set(s.id, s.name)));
    return map;
  }, [pipelines]);

  const stageMetrics = useMemo((): StageMetric[] => {
    const activePipeline = selectedPipelineId
      ? pipelines.find((p) => p.id === selectedPipelineId)
      : pipelines[0];

    if (!activePipeline) return [];

    return activePipeline.stages.map((stage) => {
      const stageOpps = opportunities.filter(
        (o) => o.pipelineStageId === stage.id,
      );
      return {
        stageId: stage.id,
        stageName: stage.name,
        count: stageOpps.length,
        totalValue: stageOpps.reduce(
          (sum, o) => sum + (o.monetaryValue || 0),
          0,
        ),
      };
    });
  }, [pipelines, opportunities, selectedPipelineId]);

  const kpis = useMemo((): SalesDashboardKPIs => {
    const openOpps = opportunities.filter((o) => o.status === "open");
    const wonOpps = opportunities.filter((o) => o.status === "won");
    const lostOpps = opportunities.filter((o) => o.status === "lost");

    const totalDecided = wonOpps.length + lostOpps.length;
    const winRate =
      totalDecided > 0 ? (wonOpps.length / totalDecided) * 100 : 0;

    const cycleTimes = wonOpps
      .filter((o) => o.createdAt && o.updatedAt)
      .map((o) => {
        const created = new Date(o.createdAt!).getTime();
        const updated = new Date(o.updatedAt!).getTime();
        return (updated - created) / MS_PER_DAY;
      })
      .filter((d) => d > 0);

    const avgCycleTimeDays =
      cycleTimes.length > 0
        ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
        : 0;

    const now = Date.now();
    const stagnatedCount = openOpps.filter((o) => {
      const lastChange = o.lastStatusChangeAt || o.updatedAt || o.createdAt;
      if (!lastChange) return false;
      return (
        (now - new Date(lastChange).getTime()) / MS_PER_DAY > STAGNATION_DAYS
      );
    }).length;

    return {
      totalValue: openOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0),
      openCount: openOpps.length,
      wonCount: wonOpps.length,
      lostCount: lostOpps.length,
      winRate,
      avgCycleTimeDays,
      stagnatedCount,
    };
  }, [opportunities]);

  const showRate = useMemo((): ShowRateData => {
    const total = events.length;
    const showed = events.filter(
      (e) => e.appointmentStatus === "showed",
    ).length;
    const noShow = events.filter(
      (e) => e.appointmentStatus === "noshow",
    ).length;
    const cancelled = events.filter(
      (e) => e.appointmentStatus === "cancelled",
    ).length;
    const confirmed = events.filter(
      (e) =>
        e.appointmentStatus === "confirmed" || e.appointmentStatus === "new",
    ).length;

    const validTotal = showed + noShow;
    const rate = validTotal > 0 ? (showed / validTotal) * 100 : 0;

    return { total, showed, noShow, cancelled, confirmed, rate };
  }, [events]);

  const stagnatedOpps = useMemo((): StagnatedOpp[] => {
    const now = Date.now();
    return opportunities
      .filter((o) => {
        if (o.status !== "open") return false;
        const lastChange = o.lastStatusChangeAt || o.updatedAt || o.createdAt;
        if (!lastChange) return false;
        return (
          (now - new Date(lastChange).getTime()) / MS_PER_DAY > STAGNATION_DAYS
        );
      })
      .map((o) => {
        const lastChange = o.lastStatusChangeAt || o.updatedAt || o.createdAt;
        const daysSinceChange = Math.floor(
          (now - new Date(lastChange!).getTime()) / MS_PER_DAY,
        );
        return {
          id: o.id,
          name: o.name,
          stageName: stageNameMap.get(o.pipelineStageId) || "Desconhecido",
          daysSinceChange,
          monetaryValue: o.monetaryValue || 0,
        };
      })
      .sort((a, b) => b.daysSinceChange - a.daysSinceChange);
  }, [opportunities, stageNameMap]);

  const recentOpps = useMemo(() => {
    return [...opportunities]
      .sort((a, b) => {
        const dateA = new Date(b.updatedAt || b.createdAt || 0).getTime();
        const dateB = new Date(a.updatedAt || a.createdAt || 0).getTime();
        return dateA - dateB;
      })
      .slice(0, 20)
      .map((o) => ({
        ...o,
        stageName: stageNameMap.get(o.pipelineStageId) || "Desconhecido",
        pipelineName:
          pipelines.find((p) => p.id === o.pipelineId)?.name || "Desconhecido",
      }));
  }, [opportunities, stageNameMap, pipelines]);

  return {
    pipelines,
    stageMetrics,
    kpis,
    showRate,
    stagnatedOpps,
    recentOpps,
    loading,
    error,
    refetch: fetchAll,
  };
}
