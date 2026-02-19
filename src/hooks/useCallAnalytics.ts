import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DateRange } from '../components/DateRangePicker';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface AnaliseGeral {
  score_total: number;
  probabilidade_fechamento: number;
  status: string;
  resumo_executivo: string;
}

interface ScoreDetalhado {
  score: number;
  observacoes?: string[];
  pontos_fortes?: string[];
  pontos_fracos?: string[];
}

interface ScoresDetalhados {
  qualificacao_bant: ScoreDetalhado;
  descoberta_spin: ScoreDetalhado;
  conducao: ScoreDetalhado;
  fechamento: ScoreDetalhado;
}

interface RedFlag {
  flag: string;
  evidencia?: string;
  gravidade?: string;
}

interface OportunidadePerdida {
  momento: string;
  citacao_contexto?: string;
  oportunidade: string;
  pergunta_sugerida?: string;
  impacto?: string;
}

interface Highlight {
  momento: string;
  citacao?: string;
  por_que_foi_bom?: string;
}

interface CitacaoCritica {
  quem: string;
  texto: string;
  tipo?: string;
  analise?: string;
}

interface VeredictoFinal {
  nota_geral: string;
  resumo_uma_frase: string;
  principal_acerto: string;
  principal_erro: string;
  proximos_passos: string[];
}

interface PlanoAcao {
  para_vendedor?: { imediato?: string[] };
  follow_up?: { quando?: string; canal?: string; mensagem_sugerida?: string };
}

interface AnaliseJSON {
  analise_geral?: AnaliseGeral;
  scores_detalhados?: ScoresDetalhados;
  red_flags?: { tem_red_flags?: boolean; flags_identificados?: RedFlag[]; recomendacao?: string };
  oportunidades_perdidas?: OportunidadePerdida[];
  highlights_positivos?: Highlight[];
  citacoes_criticas?: CitacaoCritica[];
  veredicto_final?: VeredictoFinal;
  plano_acao?: PlanoAcao;
}

export interface CallAnalysis {
  id: string;
  tipo: string;
  nome_lead: string | null;
  contact_name: string | null;
  status: string;
  created_at: string;
  analyzed_at: string | null;
  analise: AnaliseJSON;
}

export interface AggregatedStats {
  totalCalls: number;
  avgScore: number;
  avgNota: string;
  totalRedFlags: number;
  scores: {
    bant: number;
    spin: number;
    conducao: number;
    fechamento: number;
  };
  topRedFlags: { flag: string; count: number }[];
  topHighlights: { text: string; count: number }[];
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function safeParseJSON(val: unknown): AnaliseJSON | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.analise_geral || obj.scores_detalhados || obj.veredicto_final) return val as AnaliseJSON;
    return null;
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (parsed?.analise_geral || parsed?.scores_detalhados) return parsed;
    } catch { /* ignore */ }
  }
  return null;
}

function scoreToNota(score: number): string {
  if (score >= 81) return 'A';
  if (score >= 61) return 'B';
  if (score >= 41) return 'C';
  if (score >= 21) return 'D';
  return 'F';
}

function aggregateStats(calls: CallAnalysis[]): AggregatedStats {
  const analyzed = calls.filter((c) => c.analise?.analise_geral?.score_total != null);

  if (analyzed.length === 0) {
    return {
      totalCalls: 0,
      avgScore: 0,
      avgNota: '-',
      totalRedFlags: 0,
      scores: { bant: 0, spin: 0, conducao: 0, fechamento: 0 },
      topRedFlags: [],
      topHighlights: [],
    };
  }

  let totalScore = 0;
  let totalBant = 0, totalSpin = 0, totalConducao = 0, totalFechamento = 0;
  let scoreCount = 0;
  let totalRedFlags = 0;
  const flagCounts = new Map<string, number>();
  const highlightTexts = new Map<string, number>();

  for (const call of analyzed) {
    const a = call.analise;
    const score = a.analise_geral?.score_total ?? 0;
    totalScore += score;
    scoreCount++;

    const sd = a.scores_detalhados;
    if (sd) {
      totalBant += sd.qualificacao_bant?.score ?? 0;
      totalSpin += sd.descoberta_spin?.score ?? 0;
      totalConducao += sd.conducao?.score ?? 0;
      totalFechamento += sd.fechamento?.score ?? 0;
    }

    const flags = a.red_flags?.flags_identificados ?? [];
    totalRedFlags += flags.length;
    for (const f of flags) {
      flagCounts.set(f.flag, (flagCounts.get(f.flag) ?? 0) + 1);
    }

    for (const h of a.highlights_positivos ?? []) {
      const text = h.por_que_foi_bom || h.citacao || h.momento;
      if (text) highlightTexts.set(text, (highlightTexts.get(text) ?? 0) + 1);
    }
  }

  const n = scoreCount || 1;
  const avgScore = Math.round(totalScore / n);

  return {
    totalCalls: analyzed.length,
    avgScore,
    avgNota: scoreToNota(avgScore),
    totalRedFlags,
    scores: {
      bant: Math.round((totalBant / n) * 10) / 10,
      spin: Math.round((totalSpin / n) * 10) / 10,
      conducao: Math.round((totalConducao / n) * 10) / 10,
      fechamento: Math.round((totalFechamento / n) * 10) / 10,
    },
    topRedFlags: [...flagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flag, count]) => ({ flag, count })),
    topHighlights: [...highlightTexts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count })),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export function useCallAnalytics(dateRange: DateRange, locationId: string | null, enabled = true) {
  const [calls, setCalls] = useState<CallAnalysis[]>([]);
  const [stats, setStats] = useState<AggregatedStats>(() => aggregateStats([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('call_recordings')
        .select('id, tipo, nome_lead, contact_name, status, analise_status, analise_json, created_at, analyzed_at')
        .not('analise_json', 'eq', '{}')
        .not('analise_json', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      if (dateRange.startDate) {
        query = query.gte('created_at', dateRange.startDate.toISOString());
      }
      if (dateRange.endDate) {
        query = query.lte('created_at', dateRange.endDate.toISOString());
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        setError(dbError.message);
        return;
      }

      const parsed: CallAnalysis[] = (data ?? [])
        .map((row) => {
          const analise = safeParseJSON(row.analise_json);
          if (!analise) return null;
          return {
            id: row.id,
            tipo: row.tipo || 'diagnostico',
            nome_lead: row.nome_lead,
            contact_name: row.contact_name,
            status: row.status,
            created_at: row.created_at,
            analyzed_at: row.analyzed_at,
            analise,
          };
        })
        .filter((x): x is CallAnalysis => x !== null);

      setCalls(parsed);
      setStats(aggregateStats(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar analises');
    } finally {
      setLoading(false);
    }
  }, [dateRange, locationId]);

  useEffect(() => {
    if (enabled) fetchCalls();
  }, [fetchCalls, enabled]);

  return { calls, stats, loading, error, refetch: fetchCalls };
}
